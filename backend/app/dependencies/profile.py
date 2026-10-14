from fastapi import Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import CurrentUser, get_current_user
from app.schemas.profile import ProfileResponse


AUTHORIZED_ROLES = {"AGENTE_ACESSIBILIDADE", "COORDENACAO_ACESSIBILIDADE"}


async def get_authorized_profile(
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ProfileResponse:
    result = await session.execute(
        text(
            """
            SELECT auth_user_id AS id, email, nome AS full_name,
                   telefone AS phone, tipo_perfil::text AS role, is_active
            FROM public."Perfil"
            WHERE auth_user_id = :user_id
              AND data_exclusao IS NULL
            """
        ),
        {"user_id": current_user.id},
    )
    profile = result.mappings().one_or_none()
    if (
        profile is None
        or not profile["is_active"]
        or profile["role"] not in AUTHORIZED_ROLES
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Perfil sem acesso autorizado.",
        )
    return ProfileResponse(**profile)
