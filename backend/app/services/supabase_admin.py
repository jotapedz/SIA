from uuid import UUID

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings


def provisioning_error(message: str, *, unconfirmed: bool = False) -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={"code": "user_creation_unconfirmed" if unconfirmed else "users_unavailable", "message": message})


class SupabaseAdmin:
    def __init__(self, client: httpx.AsyncClient):
        settings = get_settings()
        key = settings.supabase_secret_key.get_secret_value() if settings.supabase_secret_key else ""
        if not key:
            raise provisioning_error("O cadastro de usuários exige a chave administrativa configurada no backend.")
        self.client = client
        self.url = settings.supabase_url.rstrip("/") + "/auth/v1/admin/users"
        self.headers = {"apikey": key, "Authorization": f"Bearer {key}"}

    async def create_user(self, email: str, password: str, full_name: str) -> UUID:
        try:
            response = await self.client.post(self.url, headers=self.headers, json={
                "email": email, "password": password, "email_confirm": True,
                "user_metadata": {"full_name": full_name},
            })
        except httpx.HTTPError as error:
            raise provisioning_error("Não foi possível confirmar o cadastro no serviço de autenticação. Verifique a situação da conta antes de tentar novamente.", unconfirmed=True) from error
        if response.status_code not in (200, 201):
            try:
                body = response.json()
                code = str(body.get("code", body.get("error_code", ""))) if isinstance(body, dict) else ""
                provider_message = str(body.get("msg", body.get("message", ""))).lower() if isinstance(body, dict) else ""
            except ValueError:
                code = ""
                provider_message = ""
            if code in {"email_exists", "user_already_exists", "identity_already_exists"} or (
                response.status_code in (400, 422) and "already" in provider_message and "registered" in provider_message
            ):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Já existe um usuário com este e-mail.")
            if response.status_code in (400, 422) and code in {"weak_password", "email_address_invalid", "validation_failed"}:
                field = "password" if code == "weak_password" else "email"
                message = "A senha não atende à política de segurança do projeto." if field == "password" else "Verifique o e-mail informado."
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=[{"loc": ["body", field], "msg": message, "type": "value_error"}])
            raise provisioning_error("Não foi possível cadastrar a conta no Supabase Auth. Verifique a configuração administrativa do backend.")
        try:
            return UUID(response.json()["id"])
        except (ValueError, KeyError, TypeError) as error:
            raise provisioning_error("O serviço de autenticação retornou uma resposta inesperada. Verifique o cadastro antes de tentar novamente.", unconfirmed=True) from error

    async def remove_created_user(self, user_id: UUID) -> bool:
        try:
            response = await self.client.delete(f"{self.url}/{user_id}", headers=self.headers)
            return response.status_code in (200, 204, 404)
        except httpx.HTTPError:
            return False
