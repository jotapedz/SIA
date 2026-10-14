from datetime import date, datetime
from enum import Enum
from typing import Annotated

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)


Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
RegistrationNumber = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)
]
Course = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
Shift = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=30)]
Phone = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, min_length=8, max_length=25, pattern=r"^\+?[0-9() .-]+$"
    ),
]


class DiscenteStatus(str, Enum):
    ATIVO = "ATIVO"
    INATIVO = "INATIVO"


class ContactFields(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    email: EmailStr | None = Field(default=None, max_length=254)
    phone: Phone | None = None

    @field_validator("email", "phone", mode="before")
    @classmethod
    def empty_contact_as_none(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator("phone")
    @classmethod
    def validate_phone_digits(cls, value: str | None) -> str | None:
        if value is not None and not 8 <= sum(char.isdigit() for char in value) <= 15:
            raise ValueError("O telefone deve conter entre 8 e 15 dígitos.")
        return value


class FamilyContact(ContactFields):
    full_name: Name
    relationship: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)
    ]
    phone: Phone
    notes: Annotated[
        str, StringConstraints(strip_whitespace=True, max_length=500)
    ] | None = None


class DiscenteCreate(ContactFields):
    full_name: Name
    social_name: Name | None = None
    registration_number: RegistrationNumber
    course: Course | None = None
    shift: Shift | None = None
    status: DiscenteStatus = DiscenteStatus.ATIVO
    admission_date: date
    birth_date: date | None = None
    family_contact: FamilyContact | None = None

    @field_validator("social_name", "course", "shift", mode="before")
    @classmethod
    def empty_optional_text_as_none(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value: object) -> object:
        return value.strip().upper() if isinstance(value, str) else value

    @model_validator(mode="after")
    def validate_dates(self) -> "DiscenteCreate":
        if self.birth_date is not None:
            if self.birth_date > date.today():
                raise ValueError("A data de nascimento não pode estar no futuro.")
            if self.birth_date > self.admission_date:
                raise ValueError("A data de nascimento não pode ser posterior ao ingresso.")
        return self


class DiscenteSummary(BaseModel):
    id: int
    full_name: str
    social_name: str | None
    registration_number: str
    course: str | None
    shift: str | None
    # Mantém compatibilidade com os status já armazenados na tabela legada.
    status: str
    admission_date: date


class DiscenteResponse(DiscenteSummary):
    email: EmailStr | None
    phone: str | None
    birth_date: date | None
    family_contact: FamilyContact | None
    created_at: datetime
    updated_at: datetime


class DiscenteListResponse(BaseModel):
    items: list[DiscenteSummary]
    total: int
    page: int
    page_size: int
