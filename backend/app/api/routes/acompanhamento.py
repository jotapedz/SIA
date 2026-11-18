import base64

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from fastapi.routing import APIRoute
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.profile import get_authorized_profile
from app.schemas.acompanhamento import RegistroCreate, RegistroList, RegistroResponse, TermoCreate, TermoList, TermoResponse
from app.schemas.profile import ProfileResponse
from app.services.historico import registrar
from app.services.profile import get_profile_id
from app.api.routes.relatorios import require_discente
from app.services.relatorios import get_relatorio_or_404


class SafeValidationRoute(APIRoute):
    def get_route_handler(self):
        handler = super().get_route_handler()

        async def safe_handler(request: Request):
            try:
                return await handler(request)
            except RequestValidationError as error:
                # Não devolver o PDF/base64 ou o conteúdo dos registros em erros.
                return JSONResponse(status_code=422, content={"detail": [
                    {"loc": item["loc"], "msg": item["msg"], "type": item["type"]}
                    for item in error.errors()
                ]})

        return safe_handler


router = APIRouter(prefix="/v1/discentes", tags=["acompanhamento"], route_class=SafeValidationRoute)
REGISTRO_COLUMNS = "a.id, a.tipo AS kind, a.data_atendimento AS occurred_on, a.descricao AS description, a.id_relatorio AS report_id, p.nome AS author_name, a.data_criacao AS created_at"
TERMO_COLUMNS = "a.id, a.data_ciencia AS acknowledged_on, a.nome_arquivo AS file_name, p.nome AS author_name, a.data_criacao AS created_at"


@router.get("/{discente_id}/atendimentos", response_model=RegistroList)
async def list_registros(
    discente_id: int = Path(ge=1, le=9223372036854775807),
    page: int = Query(default=1, ge=1), page_size: int = Query(default=10, ge=1, le=100),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> RegistroList:
    result = await session.execute(text(f'''
        WITH discente_ok AS (
            SELECT id_discente FROM public."Discente"
            WHERE id_discente = :id AND data_exclusao IS NULL
        ),
        filtered AS (
            SELECT {REGISTRO_COLUMNS}
            FROM public."RegistroAcompanhamento" a
            JOIN public."Perfil" p ON p.id_perfil = a.id_autor
            WHERE a.id_discente = :id AND EXISTS (SELECT 1 FROM discente_ok)
        ),
        counted AS (
            SELECT (SELECT count(*) FROM discente_ok) AS discente_exists,
                   (SELECT count(*) FROM filtered) AS total
        )
        SELECT counted.discente_exists, counted.total, f.*
        FROM counted
        LEFT JOIN LATERAL (
            SELECT * FROM filtered
            ORDER BY occurred_on DESC, id DESC
            LIMIT :limit OFFSET :offset
        ) f ON TRUE
    '''), {"id": discente_id, "limit": page_size, "offset": (page - 1) * page_size})
    rows = result.mappings().all()
    if not rows or rows[0]["discente_exists"] == 0:
        raise HTTPException(status_code=404, detail="Discente não encontrado.")
    total = rows[0]["total"]
    return RegistroList(
        items=[
            RegistroResponse(**{k: v for k, v in row.items() if k not in ("discente_exists", "total")})
            for row in rows
            if row["id"] is not None
        ],
        total=total, page=page, page_size=page_size,
    )


@router.post("/{discente_id}/atendimentos", response_model=RegistroResponse, status_code=201)
async def create_registro(
    data: RegistroCreate, discente_id: int = Path(ge=1, le=9223372036854775807),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> RegistroResponse:
    await require_discente(session, discente_id, lock=True)
    if data.report_id is not None:
        report = await get_relatorio_or_404(session, data.report_id, for_update=True)
        if report.discente_id != discente_id:
            raise HTTPException(status_code=422, detail="O relatório não pertence a este discente.")
        if report.status == "CANCELADO":
            raise HTTPException(status_code=409, detail="Não é possível contribuir em um relatório cancelado.")
    actor = await get_profile_id(session, profile)
    result = await session.execute(text('''INSERT INTO public."RegistroAcompanhamento"
        (id_discente, id_relatorio, id_autor, tipo, data_atendimento, descricao)
        VALUES (:discente, :report, :actor, :kind, :occurred, :description) RETURNING id'''),
        {"discente": discente_id, "report": data.report_id, "actor": actor, "kind": data.kind.value,
         "occurred": data.occurred_on, "description": data.description})
    registro_id = result.scalar_one()
    operation = {
        "ATENDIMENTO": "Registro de atendimento", "CONTRIBUICAO": "Registro de contribuição",
        "ENCAMINHAMENTO": "Registro de encaminhamento", "ACOMPANHAMENTO": "Registro de acompanhamento",
        "OBSERVACAO": "Registro de observação operacional",
    }[data.kind.value]
    # O vínculo no relatório permite histórico unificado sem duplicar eventos.
    await registrar(session, profile, "RELATORIO" if data.report_id else "DISCENTE", data.report_id or discente_id, operation)
    result = await session.execute(text(f'''SELECT {REGISTRO_COLUMNS} FROM public."RegistroAcompanhamento" a
        JOIN public."Perfil" p ON p.id_perfil = a.id_autor WHERE a.id = :id'''), {"id": registro_id})
    response = RegistroResponse(**result.mappings().one())
    await session.commit()
    return response


@router.get("/{discente_id}/termos", response_model=TermoList)
async def list_termos(
    discente_id: int = Path(ge=1, le=9223372036854775807),
    page: int = Query(default=1, ge=1), page_size: int = Query(default=10, ge=1, le=100),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> TermoList:
    result = await session.execute(text(f'''
        WITH discente_ok AS (
            SELECT id_discente FROM public."Discente"
            WHERE id_discente = :id AND data_exclusao IS NULL
        ),
        filtered AS (
            SELECT {TERMO_COLUMNS}
            FROM public."TermoCienciaRegistro" a
            JOIN public."Perfil" p ON p.id_perfil = a.id_autor
            WHERE a.id_discente = :id AND EXISTS (SELECT 1 FROM discente_ok)
        ),
        counted AS (
            SELECT (SELECT count(*) FROM discente_ok) AS discente_exists,
                   (SELECT count(*) FROM filtered) AS total
        )
        SELECT counted.discente_exists, counted.total, f.*
        FROM counted
        LEFT JOIN LATERAL (
            SELECT * FROM filtered
            ORDER BY created_at DESC, id DESC
            LIMIT :limit OFFSET :offset
        ) f ON TRUE
    '''), {"id": discente_id, "limit": page_size, "offset": (page - 1) * page_size})
    rows = result.mappings().all()
    if not rows or rows[0]["discente_exists"] == 0:
        raise HTTPException(status_code=404, detail="Discente não encontrado.")
    total = rows[0]["total"]
    return TermoList(
        items=[
            TermoResponse(**{k: v for k, v in row.items() if k not in ("discente_exists", "total")})
            for row in rows
            if row["id"] is not None
        ],
        total=total, page=page, page_size=page_size,
    )


@router.post("/{discente_id}/termos", response_model=TermoResponse, status_code=201)
async def create_termo(
    data: TermoCreate, discente_id: int = Path(ge=1, le=9223372036854775807),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> TermoResponse:
    await require_discente(session, discente_id, lock=True)
    actor = await get_profile_id(session, profile)
    result = await session.execute(text('''INSERT INTO public."TermoCienciaRegistro"
        (id_discente, id_autor, data_ciencia, nome_arquivo, documento)
        VALUES (:discente, :actor, :acknowledged, :name, :document) RETURNING id'''),
        {"discente": discente_id, "actor": actor, "acknowledged": data.acknowledged_on,
         "name": data.file_name, "document": base64.b64decode(data.document_base64, validate=True)})
    termo_id = result.scalar_one()
    await registrar(session, profile, "DISCENTE", discente_id, "Registro de Termo de Ciência")
    result = await session.execute(text(f'''SELECT {TERMO_COLUMNS} FROM public."TermoCienciaRegistro" a
        JOIN public."Perfil" p ON p.id_perfil = a.id_autor WHERE a.id = :id'''), {"id": termo_id})
    response = TermoResponse(**result.mappings().one())
    await session.commit()
    return response


@router.get("/{discente_id}/termos/{termo_id}/documento")
async def download_termo(
    discente_id: int = Path(ge=1, le=9223372036854775807),
    termo_id: int = Path(ge=1, le=9223372036854775807),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    await require_discente(session, discente_id)
    result = await session.execute(text('''SELECT documento FROM public."TermoCienciaRegistro"
        WHERE id = :id AND id_discente = :discente'''), {"id": termo_id, "discente": discente_id})
    document = result.scalar_one_or_none()
    if document is None:
        raise HTTPException(status_code=404, detail="Termo não encontrado.")
    await registrar(session, profile, "DISCENTE", discente_id, "Download de Termo de Ciência")
    await session.commit()
    return Response(content=bytes(document), media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="termo-ciencia-{termo_id}.pdf"',
        "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    })
