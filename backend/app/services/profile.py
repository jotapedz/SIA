from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.profile import ProfileResponse


async def get_profile_id(session: AsyncSession, profile: ProfileResponse) -> int:
    result = await session.execute(text("""
        SELECT id_perfil FROM public."Perfil"
        WHERE auth_user_id = :auth_user_id AND is_active = TRUE AND data_exclusao IS NULL
    """), {"auth_user_id": profile.id})
    profile_id = result.scalar_one_or_none()
    if profile_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Perfil sem acesso autorizado.")
    return profile_id
