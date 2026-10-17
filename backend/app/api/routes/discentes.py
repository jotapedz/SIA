from datetime import date

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
from app.services.discentes import (
    DETAIL_COLUMNS,
    SUMMARY_COLUMNS,
    discente_parameters,
    discente_response,
    get_discente_or_404,
    is_duplicate_registration,
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
    parameters = discente_parameters(data.model_dump())
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
    changes = data.model_dump(exclude_unset=True, exclude={"expected_updated_at"})
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
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        if is_duplicate_registration(error):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Já existe um discente cadastrado com esta matrícula.") from error
        raise
    return updated
