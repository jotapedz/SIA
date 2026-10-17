from collections.abc import Mapping
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.discente import DiscenteResponse


SUMMARY_COLUMNS = """
    id_discente AS id, nome AS full_name, nome_social AS social_name,
    matricula AS registration_number, curso AS course, turno AS shift,
    status, data_ingresso AS admission_date
"""
DETAIL_COLUMNS = SUMMARY_COLUMNS + """,
    email_institucional AS email, telefone AS phone, data_nascimento AS birth_date,
    data_criacao AS created_at, data_atualizacao AS updated_at,
    contato_familiar_nome AS family_name, contato_familiar_parentesco AS family_relationship,
    contato_familiar_telefone AS family_phone, contato_familiar_email AS family_email,
    contato_familiar_observacao AS family_notes
"""


def discente_response(row: Mapping[str, Any]) -> DiscenteResponse:
    values = dict(row)
    contact = {
        "full_name": values.pop("family_name"),
        "relationship": values.pop("family_relationship"),
        "phone": values.pop("family_phone"),
        "email": values.pop("family_email"),
        "notes": values.pop("family_notes"),
    }
    return DiscenteResponse(**values, family_contact=contact if contact["full_name"] else None)


def discente_parameters(values: dict[str, Any]) -> dict[str, Any]:
    parameters = dict(values)
    parameters["status"] = getattr(parameters["status"], "value", parameters["status"])
    contact = parameters.pop("family_contact")
    parameters.update(
        family_name=contact["full_name"] if contact else None,
        family_relationship=contact["relationship"] if contact else None,
        family_phone=contact["phone"] if contact else None,
        family_email=contact.get("email") if contact else None,
        family_notes=contact.get("notes") if contact else None,
    )
    return parameters


async def get_discente_or_404(
    session: AsyncSession, discente_id: int, *, for_update: bool = False,
) -> DiscenteResponse:
    lock = "FOR UPDATE" if for_update else ""
    result = await session.execute(
        text(f"""
            SELECT {DETAIL_COLUMNS} FROM public."Discente"
            WHERE id_discente = :id AND data_exclusao IS NULL {lock}
        """),
        {"id": discente_id},
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discente não encontrado.")
    return discente_response(row)


def is_duplicate_registration(error: IntegrityError) -> bool:
    cause = getattr(error.orig, "__cause__", None)
    constraint = getattr(cause, "constraint_name", None) or getattr(error.orig, "constraint_name", None)
    return constraint == "discente_matricula_key"
