from datetime import date
import httpx

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.profile import get_authorized_profile
from app.schemas.discente import (
    DiscenteCreate,
    DiscenteListResponse,
    DiscenteResponse,
    DiscenteStatus,
    DiscenteSummary,
    DiscenteUpdate,
    validate_discente_dates,
)
from app.schemas.profile import ProfileResponse
from app.schemas.historico import DiscenteDelete, HistoricoResponse
from app.services.historico import registrar, consultar
from app.services.discente_fotos import PhotoStorage, prepare_photo, commit_photo_change
from app.services.discentes import (
    DETAIL_COLUMNS,
    SUMMARY_COLUMNS,
    discente_parameters,
    discente_response,
    get_discente_or_404,
    is_duplicate_registration,
    alteracoes_discente,
)


router = APIRouter(prefix="/v1/discentes", tags=["discentes"])


@router.get(
    "",
    response_model=DiscenteListResponse,
    summary="Listar discentes da tela inicial (RF03)",
    responses={
        401: {"description": "Token ausente ou inválido"},
        403: {"description": "Perfil sem acesso autorizado"},
    },
)
async def list_discentes(
    q: str | None = Query(default=None, min_length=1, max_length=150),
    student_status: DiscenteStatus | None = Query(default=None, alias="status"),
    course: str | None = Query(default=None, min_length=1, max_length=150),
    shift: str | None = Query(default=None, min_length=1, max_length=30),
    admission_from: date | None = None,
    admission_to: date | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> DiscenteListResponse:
    if admission_from and admission_to and admission_from > admission_to:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="O início do período de ingresso deve ser anterior ou igual ao fim.",
        )

    conditions = ["data_exclusao IS NULL"]
    parameters = {}
    if q is not None:
        conditions.append(
            """(strpos(lower(nome), lower(:q)) > 0
                OR strpos(lower(coalesce(nome_social, '')), lower(:q)) > 0
                OR strpos(lower(matricula), lower(:q)) > 0)"""
        )
        parameters["q"] = q.strip()
    if student_status is not None:
        conditions.append("upper(btrim(status)) = :status")
        parameters["status"] = student_status.value
    for column, key, value in (("curso", "course", course), ("turno", "shift", shift)):
        if value is not None:
            conditions.append(f"lower(btrim({column})) = lower(:{key})")
            parameters[key] = value.strip()
    if admission_from is not None:
        conditions.append("data_ingresso >= :admission_from")
        parameters["admission_from"] = admission_from
    if admission_to is not None:
        conditions.append("data_ingresso <= :admission_to")
        parameters["admission_to"] = admission_to

    where = " AND ".join(conditions)
    count = await session.execute(
        text(f'SELECT count(*) FROM public."Discente" WHERE {where}'), parameters
    )
    result = await session.execute(
        text(
            f"""
            SELECT {SUMMARY_COLUMNS}
            FROM public."Discente"
            WHERE {where}
            ORDER BY lower(nome), id_discente
            LIMIT :limit OFFSET :offset
            """
        ),
        {**parameters, "limit": page_size, "offset": (page - 1) * page_size},
    )
    return DiscenteListResponse(
        items=[DiscenteSummary(**row) for row in result.mappings().all()],
        total=count.scalar_one(),
        page=page,
        page_size=page_size,
    )


@router.post(
    "",
    response_model=DiscenteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar discente (RF04)",
    responses={
        401: {"description": "Token ausente ou inválido"},
        403: {"description": "Perfil sem acesso autorizado"},
        409: {"description": "Matrícula já cadastrada"},
    },
)
async def create_discente(
    data: DiscenteCreate,
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> DiscenteResponse:
    image = await prepare_photo(data.photo)
    parameters = discente_parameters(data.model_dump(exclude={"photo"}))
    parameters["status"] = data.status.value
    try:
        result = await session.execute(
            text(
                f"""
                INSERT INTO public."Discente"
                    (nome, nome_social, matricula, curso, turno, status, data_ingresso,
                     email_institucional, telefone, data_nascimento,
                     contato_familiar_nome, contato_familiar_parentesco,
                     contato_familiar_telefone, contato_familiar_email, contato_familiar_observacao,
                     data_criacao, data_atualizacao)
                VALUES
                    (:full_name, :social_name, :registration_number, :course, :shift, :status,
                     :admission_date, :email, :phone, :birth_date,
                     :family_name, :family_relationship, :family_phone, :family_email, :family_notes,
                     NOW(), NOW())
                RETURNING {DETAIL_COLUMNS}
                """
            ),
            parameters,
        )
        discente = discente_response(result.mappings().one())
        await registrar(session, profile, "DISCENTE", discente.id, "Cadastro de discente")
        if image is not None:
            discente = await commit_photo_change(session, profile, discente.id, None, image)
        else:
            await session.commit()
    except IntegrityError as error:
        await session.rollback()
        # A restrição UNIQUE também protege contra cadastros simultâneos.
        if is_duplicate_registration(error):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um discente cadastrado com esta matrícula.",
            ) from error
        raise
    return discente


@router.get(
    "/{discente_id}", response_model=DiscenteResponse,
    summary="Consultar cadastro do discente (RF05)",
    responses={404: {"description": "Discente não encontrado"}},
)
async def get_discente(
    discente_id: int = Path(ge=1, le=9223372036854775807),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> DiscenteResponse:
    return await get_discente_or_404(session, discente_id)


@router.patch(
    "/{discente_id}", response_model=DiscenteResponse,
    summary="Atualizar cadastro do discente (RF06)",
    responses={
        404: {"description": "Discente não encontrado"},
        409: {"description": "Matrícula duplicada ou cadastro alterado por outro usuário"},
    },
)
async def update_discente(
    data: DiscenteUpdate,
    discente_id: int = Path(ge=1, le=9223372036854775807),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> DiscenteResponse:
    current = await get_discente_or_404(session, discente_id, for_update=True)
    if data.expected_updated_at != current.updated_at:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "stale_record", "message": "Este cadastro foi alterado por outro usuário. Recarregue os dados antes de salvar."},
        )
    image = await prepare_photo(data.photo)
    changes = data.model_dump(exclude_unset=True, exclude={"expected_updated_at", "photo"})
    values = current.model_dump(exclude={"id", "created_at", "updated_at"})
    values.update(changes)
    try:
        validate_discente_dates(values["admission_date"], values["birth_date"])
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error

    parameters = discente_parameters(values)
    parameters["id"] = discente_id
    try:
        result = await session.execute(text(f"""
            UPDATE public."Discente"
            SET nome = :full_name, nome_social = :social_name, matricula = :registration_number,
                curso = :course, turno = :shift, status = :status, data_ingresso = :admission_date,
                data_nascimento = :birth_date, email_institucional = :email, telefone = :phone,
                contato_familiar_nome = :family_name, contato_familiar_parentesco = :family_relationship,
                contato_familiar_telefone = :family_phone, contato_familiar_email = :family_email,
                contato_familiar_observacao = :family_notes, data_atualizacao = clock_timestamp()
            WHERE id_discente = :id AND data_exclusao IS NULL
            RETURNING {DETAIL_COLUMNS}
        """), parameters)
        updated = discente_response(result.mappings().one())
        for campo, operacao in alteracoes_discente(current, updated):
            await registrar(session, profile, "DISCENTE", discente_id, operacao, campos=[campo])
        if "photo" in data.model_fields_set:
            updated = await commit_photo_change(session, profile, discente_id, current.photo_path, image)
        else:
            await session.commit()
    except IntegrityError as error:
        await session.rollback()
        if is_duplicate_registration(error):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Já existe um discente cadastrado com esta matrícula.") from error
        raise
    return updated


@router.get("/{discente_id}/foto")
async def foto_discente(
    discente_id: int = Path(ge=1, le=9223372036854775807),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    discente = await get_discente_or_404(session, discente_id)
    if not discente.photo_path:
        return {"url": None, "expires_in": 300}
    async with httpx.AsyncClient(timeout=20) as client:
        url = await PhotoStorage(client).signed_url(discente_id, discente.photo_path)
    return {"url": url, "expires_in": 300}


@router.get("/{discente_id}/historico", response_model=HistoricoResponse)
async def historico_discente(
    discente_id: int = Path(ge=1, le=9223372036854775807),
    page: int = Query(default=1, ge=1), page_size: int = Query(default=10, ge=1, le=100),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> HistoricoResponse:
    await get_discente_or_404(session, discente_id)
    return await consultar(session, "DISCENTE", discente_id, page, page_size)


@router.post("/{discente_id}/exclusao", summary="Excluir discente da listagem preservando os registros")
async def excluir_discente(
    data: DiscenteDelete,
    discente_id: int = Path(ge=1, le=9223372036854775807),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, bool]:
    current = await get_discente_or_404(session, discente_id, for_update=True)
    if current.updated_at != data.expected_updated_at:
        raise HTTPException(status_code=409, detail={"code": "stale_record", "message": "O cadastro foi alterado. Recarregue antes de excluir."})
    await session.execute(text('''UPDATE public."Discente"
        SET data_exclusao = clock_timestamp(), data_atualizacao = clock_timestamp()
        WHERE id_discente = :id'''), {"id": discente_id})
    await registrar(session, profile, "DISCENTE", discente_id, "Exclusão lógica de discente")
    await session.commit()
    return {"deleted": True}
