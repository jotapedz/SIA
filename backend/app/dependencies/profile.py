import time
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import CurrentUser, get_current_user
from app.schemas.profile import ProfileResponse


AUTHORIZED_ROLES = {"AGENTE_ACESSIBILIDADE", "COORDENACAO_ACESSIBILIDADE"}
_PROFILE_CACHE_TTL_SECONDS = 20.0
_profile_cache: dict[UUID, tuple[ProfileResponse, float]] = {}


def invalidate_profile_cache() -> None:
    _profile_cache.clear()


async def get_authorized_profile(
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ProfileResponse:
    use_cache = type(session) is AsyncSession and isinstance(current_user.id, UUID)
    if use_cache:
        cached = _profile_cache.get(current_user.id)
        if cached is not None:
            cached_profile, expires_at = cached
            if time.monotonic() < expires_at:
                return cached_profile
            _profile_cache.pop(current_user.id, None)

    result = await session.execute(
        text(
            """
            SELECT id_perfil AS profile_id, auth_user_id AS id, email, nome AS full_name,
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
        if isinstance(current_user.id, UUID):
            _profile_cache.pop(current_user.id, None)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Perfil sem acesso autorizado.",
        )
    response = ProfileResponse(**profile)
    if use_cache:
        _profile_cache[current_user.id] = (response, time.monotonic() + _PROFILE_CACHE_TTL_SECONDS)
    return response
