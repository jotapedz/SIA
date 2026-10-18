from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.profile import get_authorized_profile
from app.schemas.profile import ProfileResponse
from app.schemas.relatorio import CategoriaResponse, RelatorioCancel, RelatorioCreate, RelatorioListResponse, RelatorioResponse, RelatorioSummary, RelatorioUpdate
from app.services.profile import get_profile_id
from app.services.relatorios import (
    CADASTRO_SECTIONS, CATEGORY_COLUMNS, REPORT_JOINS, SUMMARY_COLUMNS, VISIBLE_REPORT,
    get_relatorio_or_404, report_parameters, require_current_report, validate_categories,
)


router = APIRouter(prefix="/v1", tags=["relatorios"])


async def require_discente(session: AsyncSession, discente_id: int, *, lock: bool = False) -> None:
    suffix = "FOR SHARE" if lock else ""
    result = await session.execute(text(f"""
        SELECT id_discente FROM public."Discente"
        WHERE id_discente = :id AND data_exclusao IS NULL {suffix}
    """), {"id": discente_id})
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discente não encontrado.")


@router.get(
    "/discentes/{discente_id}/relatorios", response_model=RelatorioListResponse,
    summary="Listar relatórios do discente (RF07)",
    responses={404: {"description": "Discente não encontrado"}},
)
async def list_relatorios(
    discente_id: int = Path(ge=1, le=9223372036854775807),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=6, ge=1, le=100),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> RelatorioListResponse:
    await require_discente(session, discente_id)
    parameters = {"discente_id": discente_id}
    where = f"r.id_discente = :discente_id AND {VISIBLE_REPORT}"
    count = await session.execute(text(f"SELECT count(*) {REPORT_JOINS} WHERE {where}"), parameters)
    result = await session.execute(text(f"""
        SELECT {SUMMARY_COLUMNS} {REPORT_JOINS} WHERE {where}
        ORDER BY r.data_abertura DESC, r.id_relatorio DESC
        LIMIT :limit OFFSET :offset
    """), {**parameters, "limit": page_size, "offset": (page - 1) * page_size})
    return RelatorioListResponse(
        items=[RelatorioSummary(**row) for row in result.mappings().all()],
        total=count.scalar_one(), page=page, page_size=page_size,
    )


@router.get("/relatorios/categorias", response_model=list[CategoriaResponse], summary="Consultar opções do relatório de Cadastro")
async def list_categorias(
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> list[CategoriaResponse]:
    query = text(f"""
        SELECT {CATEGORY_COLUMNS} FROM public."CategoriaAcessibilidade" c
        WHERE c.ativo = TRUE AND c.subgrupo IN :sections
        ORDER BY c.ordem, c.id_categoria
    """).bindparams(bindparam("sections", expanding=True))
    result = await session.execute(query, {"sections": CADASTRO_SECTIONS})
    return [CategoriaResponse(**row) for row in result.mappings().all()]


@router.get(
    "/relatorios/{relatorio_id}", response_model=RelatorioResponse,
    summary="Consultar relatório (RF07)",
    responses={404: {"description": "Relatório não encontrado"}},
)
async def get_relatorio(
    relatorio_id: int = Path(ge=1, le=9223372036854775807),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> RelatorioResponse:
    return await get_relatorio_or_404(session, relatorio_id)


@router.post(
    "/discentes/{discente_id}/relatorios", response_model=RelatorioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar relatório (RF08)",
    responses={404: {"description": "Discente não encontrado"}},
)
async def create_relatorio(
    data: RelatorioCreate,
    discente_id: int = Path(ge=1, le=9223372036854775807),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> RelatorioResponse:
    await require_discente(session, discente_id, lock=True)
    author_id = await get_profile_id(session, profile)
    categories = await validate_categories(session, data.categories)
    parameters = {**report_parameters(data, categories), "discente_id": discente_id, "author_id": author_id}
    result = await session.execute(text("""
        INSERT INTO public."Relatório"
            (id_discente, id_autor, resumo_demanda, demanda_apresentada, status,
             data_abertura, data_atualizacao, tipo_relatorio, atividade_disciplina,
             acompanhamento_continuado, observacao, estrategia_adotada, resultado_observado)
        VALUES
            (:discente_id, :author_id, :title, :description, 'ABERTO',
             NOW(), NOW(), :report_type, :activity, :ongoing_follow_up, :notes, :adopted_strategy, :observed_result)
        RETURNING id_relatorio
    """), parameters)
    report_id = result.scalar_one()
    if categories:
        await session.execute(text("""
            INSERT INTO public."RelatorioCategoria" (id_relatorio, id_categoria, detalhe_objetivo)
            VALUES (:report_id, :category_id, :detail)
        """), [{"report_id": report_id, "category_id": item["id"], "detail": item["detail"]} for item in categories])
    report = await get_relatorio_or_404(session, report_id)
    await session.commit()
    return report


@router.put(
    "/relatorios/{relatorio_id}", response_model=RelatorioResponse,
    summary="Editar relatório (RF09)",
    responses={404: {"description": "Relatório não encontrado"}, 409: {"description": "Conflito de versão, tipo ou cancelamento"}},
)
async def update_relatorio(
    data: RelatorioUpdate,
    relatorio_id: int = Path(ge=1, le=9223372036854775807),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> RelatorioResponse:
    current = await get_relatorio_or_404(session, relatorio_id, for_update=True)
    require_current_report(current, data.expected_updated_at)
    if current.report_type != data.report_type.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Não é permitido mudar o tipo de um relatório existente.")
    categories = await validate_categories(session, data.categories, existing_ids={item.id for item in current.categories})
    await session.execute(text("""
        UPDATE public."Relatório"
        SET resumo_demanda = :title, demanda_apresentada = :description,
            atividade_disciplina = :activity, acompanhamento_continuado = :ongoing_follow_up,
            observacao = :notes, estrategia_adotada = :adopted_strategy,
            resultado_observado = :observed_result, data_atualizacao = clock_timestamp()
        WHERE id_relatorio = :id
    """), {**report_parameters(data, categories), "id": relatorio_id})
    await session.execute(text('DELETE FROM public."RelatorioCategoria" WHERE id_relatorio = :id'), {"id": relatorio_id})
    if categories:
        await session.execute(text("""
            INSERT INTO public."RelatorioCategoria" (id_relatorio, id_categoria, detalhe_objetivo)
            VALUES (:report_id, :category_id, :detail)
        """), [{"report_id": relatorio_id, "category_id": item["id"], "detail": item["detail"]} for item in categories])
    updated = await get_relatorio_or_404(session, relatorio_id)
    await session.commit()
    return updated


@router.post(
    "/relatorios/{relatorio_id}/cancelamento", response_model=RelatorioResponse,
    summary="Cancelar relatório sem apagar o registro (RF10)",
    responses={404: {"description": "Relatório não encontrado"}, 409: {"description": "Relatório alterado ou já cancelado"}},
)
async def cancel_relatorio(
    data: RelatorioCancel,
    relatorio_id: int = Path(ge=1, le=9223372036854775807),
    profile: ProfileResponse = Depends(get_authorized_profile),
    session: AsyncSession = Depends(get_db_session),
) -> RelatorioResponse:
    current = await get_relatorio_or_404(session, relatorio_id, for_update=True)
    require_current_report(current, data.expected_updated_at)
    actor_id = await get_profile_id(session, profile)
    await session.execute(text("""
        WITH instante AS (SELECT clock_timestamp() AS agora)
        UPDATE public."Relatório" SET status = 'CANCELADO', data_cancelamento = instante.agora,
            id_cancelado_por = :actor_id, data_atualizacao = instante.agora
        FROM instante WHERE id_relatorio = :id
    """), {"id": relatorio_id, "actor_id": actor_id})
    cancelled = await get_relatorio_or_404(session, relatorio_id)
    await session.commit()
    return cancelled
