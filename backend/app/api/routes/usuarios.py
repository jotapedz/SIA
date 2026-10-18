import httpx
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.profile import get_authorized_profile
from app.schemas.profile import ProfileResponse
from app.schemas.usuario import UsuarioCreate, UsuarioListResponse, UsuarioResponse, UsuarioRole, UsuarioStatus
from app.services.supabase_admin import SupabaseAdmin, provisioning_error
from app.services.usuarios import USER_COLUMNS, get_usuario_or_404


router = APIRouter(prefix="/v1/usuarios", tags=["usuarios"])


@router.get("", response_model=UsuarioListResponse, summary="Listar usuários (RF11)")
async def list_usuarios(
    q: str | None = Query(default=None, min_length=1, max_length=180),
    role: UsuarioRole | None = None,
    user_status: UsuarioStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=9, ge=1, le=100),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> UsuarioListResponse:
    conditions = ["data_exclusao IS NULL"]
    parameters = {}
    if q is not None:
        conditions.append("(strpos(lower(nome), lower(:q)) > 0 OR strpos(lower(email), lower(:q)) > 0)")
        parameters["q"] = q.strip()
    if role is not None:
        conditions.append("tipo_perfil::text = :role")
        parameters["role"] = role.value
    if user_status is not None:
        conditions.append("is_active = :is_active")
        parameters["is_active"] = user_status == UsuarioStatus.ATIVO
    where = " AND ".join(conditions)
    count = await session.execute(text(f'SELECT count(*) FROM public."Perfil" WHERE {where}'), parameters)
    result = await session.execute(text(f"""
        SELECT {USER_COLUMNS} FROM public."Perfil" WHERE {where}
        ORDER BY lower(nome), id_perfil LIMIT :limit OFFSET :offset
    """), {**parameters, "limit": page_size, "offset": (page - 1) * page_size})
    return UsuarioListResponse(items=[UsuarioResponse(**row) for row in result.mappings().all()],
        total=count.scalar_one(), page=page, page_size=page_size)


@router.get("/{usuario_id}", response_model=UsuarioResponse, summary="Consultar usuário (RF11)")
async def get_usuario(
    usuario_id: int = Path(ge=1, le=9223372036854775807),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> UsuarioResponse:
    return await get_usuario_or_404(session, usuario_id)


@router.post("", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED,
    summary="Cadastrar usuário pelo agente autorizado (RF12)",
    responses={409: {"description": "E-mail já cadastrado"}, 503: {"description": "Autenticação administrativa indisponível"}})
async def create_usuario(
    data: UsuarioCreate,
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> UsuarioResponse:
    # RF12: ambos os perfis autorizados podem cadastrar; nao e restrito a coordenacao.
    email = str(data.email).lower()
    existing = await session.execute(text('SELECT 1 FROM public."Perfil" WHERE lower(btrim(email)) = :email LIMIT 1'), {"email": email})
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Já existe um usuário com este e-mail.")
    async with httpx.AsyncClient(timeout=20) as client:
        admin = SupabaseAdmin(client)
        user_id = await admin.create_user(email, data.password.get_secret_value(), data.full_name)
        try:
            result = await session.execute(text("""
                INSERT INTO public."Perfil"
                    (nome, tipo_perfil, email, telefone, senha_hash, status,
                     data_criacao, data_atualizacao, auth_user_id, is_active)
                VALUES (:full_name, :role, :email, NULL, 'SUPABASE_AUTH', :status,
                        NOW(), NOW(), :auth_user_id, :is_active)
                RETURNING id_perfil
            """), {"full_name": data.full_name, "role": data.role.value, "email": email,
                "status": data.status.value, "auth_user_id": user_id, "is_active": data.status == UsuarioStatus.ATIVO})
            created = await get_usuario_or_404(session, result.scalar_one())
        except Exception as error:
            try:
                await session.rollback()
            except SQLAlchemyError:
                # Ainda nao houve tentativa de commit: compensar a conta Auth
                # mesmo se a conexao do banco ja tiver sido perdida.
                pass
            removed = await admin.remove_created_user(user_id)
            if not removed:
                raise provisioning_error("O vínculo do perfil não foi concluído e a conta precisa de regularização no Supabase Auth. Não repita o cadastro antes de verificar.", unconfirmed=True) from error
            if isinstance(error, IntegrityError):
                cause = getattr(error.orig, "__cause__", None)
                constraint = getattr(cause, "constraint_name", None) or getattr(error.orig, "constraint_name", None)
                if constraint == "perfil_email_normalizado_key":
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Já existe um usuário com este e-mail.") from error
            raise provisioning_error("Não foi possível concluir o vínculo do perfil. A conta recém-criada foi removida; tente novamente após corrigir o banco.") from error
        try:
            await session.commit()
        except SQLAlchemyError as error:
            # Uma falha na confirmacao pode ocorrer depois do COMMIT no servidor.
            # Nao apagar a conta Auth quando o resultado do commit e incerto.
            try:
                await session.rollback()
            except SQLAlchemyError:
                pass
            raise provisioning_error("Não foi possível confirmar a finalização do cadastro. Verifique a conta e o perfil antes de tentar novamente.", unconfirmed=True) from error
        return created
