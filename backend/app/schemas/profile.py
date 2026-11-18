from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class ProfileResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    phone: str | None
    role: str
    is_active: bool
    profile_id: int | None = Field(default=None, exclude=True)
