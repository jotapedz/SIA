from datetime import datetime
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr, StringConstraints, field_validator


class UsuarioRole(str, Enum):
    AGENTE_ACESSIBILIDADE = "AGENTE_ACESSIBILIDADE"
    COORDENACAO_ACESSIBILIDADE = "COORDENACAO_ACESSIBILIDADE"


class UsuarioStatus(str, Enum):
    ATIVO = "ATIVO"
    INATIVO = "INATIVO"


class UsuarioCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    full_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
    email: EmailStr = Field(max_length=180)
    password: SecretStr = Field(min_length=6, max_length=72)
    role: UsuarioRole
    status: UsuarioStatus = UsuarioStatus.ATIVO

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("password")
    @classmethod
    def password_bytes_limit(cls, value: SecretStr) -> SecretStr:
        if len(value.get_secret_value().encode("utf-8")) > 72:
            raise ValueError("A senha deve ter no máximo 72 bytes em UTF-8.")
        return value


class UsuarioResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    status: UsuarioStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UsuarioListResponse(BaseModel):
    items: list[UsuarioResponse]
    total: int
    page: int
    page_size: int
