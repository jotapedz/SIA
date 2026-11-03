import base64
import binascii
import logging
import re
import warnings
from io import BytesIO
from urllib.parse import quote
from uuid import uuid4

import httpx
from fastapi import HTTPException
from PIL import Image, ImageOps, UnidentifiedImageError
from starlette.concurrency import run_in_threadpool
from sqlalchemy import text

from app.core.config import get_settings
from app.services.historico import registrar
from app.services.discentes import get_discente_or_404


logger = logging.getLogger(__name__)
MAX_PHOTO_BYTES = 2 * 1024 * 1024


def normalize_photo(value: str) -> bytes:
    try:
        prefix, encoded = value.split(",", 1)
        if prefix not in ("data:image/jpeg;base64", "data:image/png;base64"):
            raise ValueError()
        if len(encoded) > ((MAX_PHOTO_BYTES + 2) // 3) * 4:
            raise ValueError()
        raw = base64.b64decode(encoded, validate=True)
        if len(raw) > MAX_PHOTO_BYTES:
            raise ValueError()
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(raw)) as image:
                if image.format not in ("JPEG", "PNG") or image.width * image.height > 16000000:
                    raise ValueError()
                image.load()
                oriented = ImageOps.exif_transpose(image)
                oriented.thumbnail((768, 768))
                rgba = oriented.convert("RGBA")
                clean = Image.new("RGB", rgba.size, "white")
                clean.paste(rgba, mask=rgba.getchannel("A"))
                output = BytesIO()
                clean.save(output, format="JPEG", quality=85)
                return output.getvalue()
    except (ValueError, binascii.Error, OSError, UnidentifiedImageError, Image.DecompressionBombError, Image.DecompressionBombWarning) as error:
        raise HTTPException(status_code=422, detail="Selecione uma imagem JPG ou PNG válida, de até 2 MB e 16 megapixels.") from error


def storage_error():
    return HTTPException(status_code=503, detail={"code": "photos_unavailable",
        "message": "Não foi possível acessar as fotos. Verifique o bucket privado e a configuração do serviço com a equipe responsável."})


class PhotoStorage:
    def __init__(self, client: httpx.AsyncClient):
        settings = get_settings()
        key = settings.supabase_secret_key.get_secret_value() if settings.supabase_secret_key else ""
        if not key:
            raise storage_error()
        self.client = client
        self.base = settings.supabase_url.rstrip("/") + "/storage/v1"
        self.bucket = quote(settings.supabase_student_photos_bucket, safe="")
        self.headers = {"apikey": key, "Authorization": f"Bearer {key}"}

    async def request(self, method, path, **kwargs):
        headers = {**self.headers, **kwargs.pop("headers", {})}
        try:
            response = await self.client.request(method, self.base + path, headers=headers, **kwargs)
        except httpx.HTTPError as error:
            raise storage_error() from error
        if not response.is_success:
            raise storage_error()
        return response

    async def require_private(self):
        response = await self.request("GET", f"/bucket/{self.bucket}")
        try:
            private = response.json().get("public") is False
        except (ValueError, AttributeError):
            private = False
        if not private:
            raise storage_error()

    async def upload(self, discente_id: int, image: bytes) -> str:
        await self.require_private()
        path = f"{discente_id}/{uuid4().hex}.jpg"
        await self.request("POST", f"/object/{self.bucket}/{path}", content=image,
            headers={"Content-Type": "image/jpeg", "x-upsert": "false", "cache-control": "private, max-age=0"})
        return path

    async def signed_url(self, discente_id: int, path: str) -> str:
        if not re.fullmatch(rf"{discente_id}/[a-f0-9]{{32}}\.jpg", path):
            raise storage_error()
        await self.require_private()
        response = await self.request("POST", f"/object/sign/{self.bucket}/{path}", json={"expiresIn": 300})
        try:
            signed = response.json()["signedURL"]
            if not isinstance(signed, str) or not signed.startswith("/object/sign/"):
                raise ValueError()
        except (KeyError, ValueError, TypeError) as error:
            raise storage_error() from error
        return self.base + signed

    async def remove_safely(self, path: str):
        try:
            await self.request("DELETE", f"/object/{self.bucket}", json={"prefixes": [path]})
        except HTTPException:
            # não desfaz um cadastro salvo por falha na limpeza do arquivo
            logger.warning("não foi possível limpar arquivo de foto substituída")


async def save_photo(session, storage, profile, discente_id, before, image):
    path = await storage.upload(discente_id, image) if image is not None else None
    try:
        await session.execute(text('''UPDATE public."Discente" SET foto_path = :path,
            data_atualizacao = clock_timestamp() WHERE id_discente = :id'''), {"path": path, "id": discente_id})
        if before != path:
            operation = "Remoção de foto" if path is None else "Alteração de foto" if before else "Adição de foto"
            await registrar(session, profile, "DISCENTE", discente_id, operation, campos=["foto_path"])
    except Exception:
        if path:
            await storage.remove_safely(path)
        raise
    return path


async def prepare_photo(value):
    return await run_in_threadpool(normalize_photo, value) if value is not None else None


async def commit_photo_change(session, profile, discente_id, before, image):
    async with httpx.AsyncClient(timeout=20) as client:
        storage = PhotoStorage(client)
        path = None
        committing = False
        try:
            path = await save_photo(session, storage, profile, discente_id, before, image)
            updated = await get_discente_or_404(session, discente_id)
            committing = True
            await session.commit()
        except Exception:
            await session.rollback()
            # se a confirmação do commit falhou, preserva a imagem por precaução
            if path and not committing:
                await storage.remove_safely(path)
            raise
        if before and before != path:
            await storage.remove_safely(before)
        return updated
