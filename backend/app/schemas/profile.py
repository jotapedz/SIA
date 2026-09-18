from uuid import UUID

from pydantic import BaseModel, EmailStr


class ProfileResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    phone: str | None
    role: str
    is_active: bool
