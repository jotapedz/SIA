from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.profile import get_authorized_profile
from app.schemas.profile import ProfileResponse
from app.schemas.relatorio import CategoriaResponse, RelatorioCreate, RelatorioListResponse, RelatorioResponse, RelatorioSummary, ReportType
from app.services.relatorios import (
    CADASTRO_SECTIONS, CATEGORY_COLUMNS, REPORT_JOINS, SUMMARY_COLUMNS, VISIBLE_REPORT,
    get_relatorio_or_404, validate_categories,
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
    author = await session.execute(text("""
        SELECT id_perfil FROM public."Perfil"
        WHERE auth_user_id = :auth_user_id AND is_active = TRUE AND data_exclusao IS NULL
    """), {"auth_user_id": profile.id})
    author_id = author.scalar_one_or_none()
    if author_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Perfil sem acesso autorizado.")
    categories = await validate_categories(session, data.categories)
    description = data.description
    if data.report_type == ReportType.OBSERVACOES:
        description = data.notes
    elif data.report_type == ReportType.CADASTRO:
        description = "\n".join(f"{item['name']}: {item['detail']}" if item["detail"] else item["name"] for item in categories) or data.title
    parameters = data.model_dump(exclude={"categories", "report_type"})
    parameters.update(discente_id=discente_id, author_id=author_id, report_type=data.report_type.value, description=description)
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
