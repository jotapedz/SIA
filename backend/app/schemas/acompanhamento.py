import base64
import binascii
from datetime import date, datetime
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator


class RegistroTipo(str, Enum):
    ATENDIMENTO = "ATENDIMENTO"
    CONTRIBUICAO = "CONTRIBUICAO"
    ENCAMINHAMENTO = "ENCAMINHAMENTO"
    ACOMPANHAMENTO = "ACOMPANHAMENTO"
    OBSERVACAO = "OBSERVACAO"


class RegistroCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    kind: RegistroTipo
    occurred_on: date
    description: Annotated[str, StringConstraints(min_length=1, max_length=20000)]
    report_id: int | None = Field(default=None, ge=1, le=9223372036854775807)

    @field_validator("occurred_on")
    @classmethod
    def not_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("A data não pode estar no futuro.")
        return value


class RegistroResponse(BaseModel):
    id: int
    kind: RegistroTipo
    occurred_on: date
    description: str
    report_id: int | None
    author_name: str
    created_at: datetime


class RegistroList(BaseModel):
    items: list[RegistroResponse]
    total: int
    page: int
    page_size: int


class TermoCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, hide_input_in_errors=True)
    acknowledged_on: date
    file_name: Annotated[str, StringConstraints(min_length=5, max_length=200)]
    document_base64: str = Field(min_length=8, max_length=6990508, repr=False)

    @field_validator("acknowledged_on")
    @classmethod
    def not_future(cls, value: date) -> date:
        return RegistroCreate.not_future(value)

    @field_validator("file_name")
    @classmethod
    def pdf_name(cls, value: str) -> str:
        if not value.lower().endswith(".pdf") or any(c in value for c in '/\\\r\n\x00'):
            raise ValueError("Informe um nome de arquivo PDF válido.")
        return value

    @field_validator("document_base64")
    @classmethod
    def valid_pdf(cls, value: str) -> str:
        try:
            raw = base64.b64decode(value, validate=True)
        except (ValueError, binascii.Error) as error:
            raise ValueError("Documento inválido.") from error
        if not 5 <= len(raw) <= 5 * 1024 * 1024 or not raw.startswith(b"%PDF-"):
            raise ValueError("Anexe um PDF de até 5 MB.")
        return value


class TermoResponse(BaseModel):
    id: int
    acknowledged_on: date
    file_name: str
    author_name: str
    created_at: datetime


class TermoList(BaseModel):
    items: list[TermoResponse]
    total: int
    page: int
    page_size: int
