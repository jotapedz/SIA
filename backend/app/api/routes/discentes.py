from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
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
)
from app.schemas.profile import ProfileResponse


router = APIRouter(prefix="/v1/discentes", tags=["discentes"])


SUMMARY_COLUMNS = """
    id_discente AS id, nome AS full_name, nome_social AS social_name,
    matricula AS registration_number, curso AS course, turno AS shift,
    status, data_ingresso AS admission_date
"""


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
    parameters = data.model_dump(exclude={"family_contact"})
    parameters["status"] = data.status.value
    contact = data.family_contact
    parameters.update(
        family_name=contact.full_name if contact else None,
        family_relationship=contact.relationship if contact else None,
        family_phone=contact.phone if contact else None,
        family_email=str(contact.email) if contact and contact.email else None,
        family_notes=contact.notes if contact else None,
    )
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
                RETURNING {SUMMARY_COLUMNS}, email_institucional AS email, telefone AS phone,
                          data_nascimento AS birth_date, data_criacao AS created_at,
                          data_atualizacao AS updated_at
                """
            ),
            parameters,
        )
        discente = DiscenteResponse(**result.mappings().one(), family_contact=contact)
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        # A restrição UNIQUE também protege contra cadastros simultâneos.
        cause = getattr(error.orig, "__cause__", None)
        constraint = getattr(cause, "constraint_name", None) or getattr(
            error.orig, "constraint_name", None
        )
        if constraint == "discente_matricula_key":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um discente cadastrado com esta matrícula.",
            ) from error
        raise
    return discente
