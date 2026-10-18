from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.usuario import UsuarioResponse


USER_COLUMNS = """
    id_perfil AS id, nome AS full_name, email, tipo_perfil::text AS role,
    CASE WHEN is_active THEN 'ATIVO' ELSE 'INATIVO' END AS status,
    is_active, data_criacao AS created_at, data_atualizacao AS updated_at
"""


async def get_usuario_or_404(session: AsyncSession, usuario_id: int) -> UsuarioResponse:
    result = await session.execute(text(f"""
        SELECT {USER_COLUMNS} FROM public."Perfil"
        WHERE id_perfil = :id AND data_exclusao IS NULL
    """), {"id": usuario_id})
    row = result.mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    return UsuarioResponse(**row)
