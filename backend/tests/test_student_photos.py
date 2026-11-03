import base64
import os
import unittest
from io import BytesIO
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

os.environ.setdefault("SUPABASE_URL", "https://example.invalid")
os.environ.setdefault("SUPABASE_PUBLISHABLE_KEY", "test")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")

import httpx
from fastapi import HTTPException
from fastapi.testclient import TestClient
from PIL import Image
from pydantic import SecretStr

from app.main import app
from app.api.routes import discentes
from app.schemas.discente import DiscenteUpdate
from app.services import discente_fotos as photos


def picture(size=(10, 20), image_format="PNG"):
    output = BytesIO()
    image = Image.new("RGB", size, "blue")
    image.save(output, format=image_format)
    return output.getvalue()


def encoded(raw):
    return "data:image/png;base64," + base64.b64encode(raw).decode()


SETTINGS = SimpleNamespace(supabase_url="https://example.invalid", supabase_secret_key=SecretStr("fake-test-key"),
                           supabase_student_photos_bucket="Fotos Discentes")


class Images(unittest.TestCase):
    def test_normalizes_and_reduces_image_without_metadata(self):
        clean = photos.normalize_photo(encoded(picture((1800, 1200))))
        with Image.open(BytesIO(clean)) as image:
            self.assertEqual(image.format, "JPEG")
            self.assertLessEqual(max(image.size), 768)
            self.assertFalse(image.getexif())

    def test_rejects_fake_images_unsupported_formats_and_oversize(self):
        for value in (encoded(b"not an image"), "data:image/png;base64,not-base64!",
                      "data:image/svg+xml;base64,PHN2Zy8+", encoded(picture(image_format="GIF")),
                      encoded(b"x" * (photos.MAX_PHOTO_BYTES + 1))):
            with self.subTest(value=value[:40]), self.assertRaises(HTTPException) as caught:
                photos.normalize_photo(value)
            self.assertEqual(caught.exception.status_code, 422)

    def test_photo_only_update_and_removal_are_valid(self):
        for value in (None, encoded(picture())):
            data = DiscenteUpdate(expected_updated_at="2026-11-01T12:00:00Z", photo=value)
            self.assertIn("photo", data.model_fields_set)

    def test_photo_endpoint_requires_authentication(self):
        self.assertEqual(TestClient(app).get("/v1/discentes/1/foto").status_code, 401)


class Storage(unittest.IsolatedAsyncioTestCase):
    async def test_private_bucket_upload_uses_generated_path_and_normalized_jpeg(self):
        calls = []
        def handler(request):
            calls.append(request)
            return httpx.Response(200, json={"public": False} if request.method == "GET" else {"Key": "ok"})
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with patch.object(photos, "get_settings", return_value=SETTINGS):
                path = await photos.PhotoStorage(client).upload(7, b"jpeg")
        self.assertRegex(path, r"^7/[a-f0-9]{32}\.jpg$")
        self.assertIn("Fotos%20Discentes", str(calls[0].url))
        self.assertEqual(calls[1].content, b"jpeg")
        self.assertEqual(calls[1].headers["content-type"], "image/jpeg")

    async def test_public_bucket_never_uploads_or_signs(self):
        calls = []
        def handler(request):
            calls.append(request.method)
            return httpx.Response(200, json={"public": True})
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with patch.object(photos, "get_settings", return_value=SETTINGS):
                storage = photos.PhotoStorage(client)
                for action in (lambda: storage.upload(7, b"jpeg"), lambda: storage.signed_url(7, "7/" + "a" * 32 + ".jpg")):
                    with self.assertRaises(HTTPException):
                        await action()
        self.assertEqual(calls, ["GET", "GET"])

    async def test_signed_url_expires_and_rejects_another_students_path(self):
        calls = []
        def handler(request):
            calls.append(request)
            return httpx.Response(200, json={"public": False} if request.method == "GET" else {"signedURL": "/object/sign/private?token=fake"})
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with patch.object(photos, "get_settings", return_value=SETTINGS):
                storage = photos.PhotoStorage(client)
                with self.assertRaises(HTTPException):
                    await storage.signed_url(7, "8/" + "a" * 32 + ".jpg")
                self.assertEqual(calls, [])
                url = await storage.signed_url(7, "7/" + "a" * 32 + ".jpg")
        self.assertTrue(url.startswith("https://example.invalid/storage/v1/object/sign/"))
        self.assertIn(b'"expiresIn":300', calls[-1].content)

    async def test_storage_failure_uses_safe_error(self):
        async with httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(403, text="private details"))) as client:
            with patch.object(photos, "get_settings", return_value=SETTINGS):
                with self.assertRaises(HTTPException) as caught:
                    await photos.PhotoStorage(client).upload(7, b"jpeg")
        self.assertEqual(caught.exception.detail["code"], "photos_unavailable")
        self.assertNotIn("private details", str(caught.exception.detail))

    async def test_no_photo_does_not_contact_storage(self):
        with patch.object(discentes, "get_discente_or_404", AsyncMock(return_value=SimpleNamespace(photo_path=None))), \
             patch.object(discentes, "PhotoStorage") as storage:
            self.assertIsNone((await discentes.foto_discente(7, SimpleNamespace(), AsyncMock()))["url"])
        storage.assert_not_called()

    async def test_missing_or_deleted_student_never_contacts_storage(self):
        with patch.object(discentes, "get_discente_or_404", AsyncMock(side_effect=HTTPException(status_code=404))), \
             patch.object(discentes, "PhotoStorage") as storage:
            with self.assertRaises(HTTPException):
                await discentes.foto_discente(7, SimpleNamespace(), AsyncMock())
        storage.assert_not_called()


class Persistence(unittest.IsolatedAsyncioTestCase):
    async def test_replacement_commits_before_removing_previous_file(self):
        events = []
        storage = SimpleNamespace(remove_safely=AsyncMock(side_effect=lambda path: events.append(("delete", path))))
        session = AsyncMock()
        session.commit.side_effect = lambda: events.append("commit")
        updated = SimpleNamespace(photo_path="new")
        with patch.object(photos, "PhotoStorage", return_value=storage), \
             patch.object(photos, "save_photo", AsyncMock(return_value="new")), \
             patch.object(photos, "get_discente_or_404", AsyncMock(return_value=updated)):
            self.assertIs(await photos.commit_photo_change(session, None, 7, "old", b"jpeg"), updated)
        self.assertEqual(events, ["commit", ("delete", "old")])

    async def test_failure_before_commit_keeps_old_photo_and_cleans_new(self):
        storage = SimpleNamespace(remove_safely=AsyncMock())
        session = AsyncMock()
        with patch.object(photos, "PhotoStorage", return_value=storage), \
             patch.object(photos, "save_photo", AsyncMock(return_value="new")), \
             patch.object(photos, "get_discente_or_404", AsyncMock(side_effect=RuntimeError("read failed"))):
            with self.assertRaises(RuntimeError):
                await photos.commit_photo_change(session, None, 7, "old", b"jpeg")
        storage.remove_safely.assert_awaited_once_with("new")
        session.commit.assert_not_awaited()
        session.rollback.assert_awaited_once()

    async def test_uncertain_commit_preserves_both_files(self):
        storage = SimpleNamespace(remove_safely=AsyncMock())
        session = AsyncMock()
        session.commit.side_effect = RuntimeError("connection lost")
        with patch.object(photos, "PhotoStorage", return_value=storage), \
             patch.object(photos, "save_photo", AsyncMock(return_value="new")), \
             patch.object(photos, "get_discente_or_404", AsyncMock()):
            with self.assertRaises(RuntimeError):
                await photos.commit_photo_change(session, None, 7, "old", b"jpeg")
        storage.remove_safely.assert_not_awaited()

    async def test_add_replace_remove_are_audited_without_image_contents(self):
        for before, image, operation in [(None, b"jpeg", "Adição de foto"), ("old", b"jpeg", "Alteração de foto"), ("old", None, "Remoção de foto")]:
            storage = SimpleNamespace(upload=AsyncMock(return_value="new"), remove_safely=AsyncMock())
            session = AsyncMock()
            with patch.object(photos, "registrar", AsyncMock()) as audit:
                await photos.save_photo(session, storage, "profile", 7, before, image)
            audit.assert_awaited_once_with(session, "profile", "DISCENTE", 7, operation, campos=["foto_path"])
            if image is None:
                storage.upload.assert_not_awaited()

    async def test_audit_failure_cleans_new_file_before_rollback(self):
        storage = SimpleNamespace(upload=AsyncMock(return_value="new"), remove_safely=AsyncMock())
        session = AsyncMock()
        with patch.object(photos, "registrar", AsyncMock(side_effect=RuntimeError("audit unavailable"))):
            with self.assertRaises(RuntimeError):
                await photos.save_photo(session, storage, None, 7, "old", b"jpeg")
        storage.remove_safely.assert_awaited_once_with("new")
        session.commit.assert_not_awaited()
