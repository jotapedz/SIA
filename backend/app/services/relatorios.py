from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.relatorio import CategorySelection, RelatorioCategoriaResponse, RelatorioCreate, RelatorioResponse, ReportType


SUMMARY_COLUMNS = """
    r.id_relatorio AS id, r.id_discente AS discente_id,
    d.nome AS discente_name, d.nome_social AS discente_social_name,
    r.resumo_demanda AS title, left(r.demanda_apresentada, 240) AS description_excerpt,
    r.tipo_relatorio AS report_type, r.status::text AS status,
    r.id_autor AS author_id, p.nome AS author_name,
    r.data_abertura AS opened_at, r.data_conclusao AS closed_at,
    r.data_atualizacao AS updated_at
"""
DETAIL_COLUMNS = SUMMARY_COLUMNS + """,
    r.demanda_apresentada AS description, r.atividade_disciplina AS activity,
    r.acompanhamento_continuado AS ongoing_follow_up, r.observacao AS notes,
    r.estrategia_adotada AS adopted_strategy, r.resultado_observado AS observed_result,
    r.data_cancelamento AS cancelled_at, r.id_cancelado_por AS cancelled_by
"""
REPORT_JOINS = """
    FROM public."Relatório" r
    JOIN public."Discente" d ON d.id_discente = r.id_discente
    JOIN public."Perfil" p ON p.id_perfil = r.id_autor
"""
VISIBLE_REPORT = "r.data_exclusao IS NULL AND d.data_exclusao IS NULL"
CADASTRO_SECTIONS = (
    "DEMANDAS_EDUCACIONAIS", "BARREIRAS_FISICAS", "BARREIRAS_COMUNICACIONAIS",
    "BARREIRAS_PEDAGOGICAS", "BARREIRAS_ATITUDINAIS", "ACOMODACOES_RECURSOS",
)
CATEGORY_COLUMNS = """
    c.id_categoria AS id, c.codigo AS code, c.nome AS name, c.grupo::text AS "group",
    c.subgrupo AS section, c.ordem AS "order", c.permite_detalhe AS requires_detail
"""


async def validate_categories(
    session: AsyncSession, selections: list[CategorySelection], *, existing_ids: set[int] | None = None,
) -> list[dict]:
    if not selections:
        return []
    query = text(f"""
        SELECT {CATEGORY_COLUMNS} FROM public."CategoriaAcessibilidade" c
        WHERE c.id_categoria IN :ids
          AND ((c.ativo = TRUE AND c.subgrupo IN :sections) OR c.id_categoria IN :existing_ids)
        ORDER BY c.ordem, c.id_categoria FOR SHARE
    """).bindparams(bindparam("ids", expanding=True), bindparam("sections", expanding=True), bindparam("existing_ids", expanding=True))
    result = await session.execute(query, {"ids": [item.category_id for item in selections],
        "sections": CADASTRO_SECTIONS, "existing_ids": sorted(existing_ids or set())})
    rows = [dict(row) for row in result.mappings().all()]
    if len(rows) != len(selections):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Uma das opções selecionadas não está disponível para o Cadastro. Recarregue as opções.")
    details = {item.category_id: item.detail for item in selections}
    for row in rows:
        row["detail"] = details[row["id"]]
        if row["requires_detail"] and not row["detail"]:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                                detail="Preencha o campo Outro para todas as opções correspondentes selecionadas.")
    return rows


def report_parameters(data: RelatorioCreate, categories: list[dict]) -> dict:
    description = data.description
    if data.report_type == ReportType.OBSERVACOES:
        description = data.notes
    elif data.report_type == ReportType.CADASTRO:
        description = "\n".join(f"{item['name']}: {item['detail']}" if item["detail"] else item["name"] for item in categories) or data.title
    parameters = data.model_dump(exclude={"categories", "report_type", "expected_updated_at"})
    return {**parameters, "description": description, "report_type": data.report_type.value}


def require_current_report(report: RelatorioResponse, expected_updated_at: datetime) -> None:
    if report.status == "CANCELADO":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
            detail={"code": "report_cancelled", "message": "Este relatório está cancelado e não pode ser alterado."})
    if report.updated_at != expected_updated_at:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
            detail={"code": "stale_record", "message": "Este relatório foi alterado por outro usuário. Recarregue os dados antes de continuar."})


async def get_relatorio_or_404(
    session: AsyncSession, relatorio_id: int, *, for_update: bool = False,
) -> RelatorioResponse:
    lock = "FOR UPDATE OF r FOR SHARE OF d" if for_update else ""
    result = await session.execute(text(f"""
        SELECT {DETAIL_COLUMNS} {REPORT_JOINS}
        WHERE r.id_relatorio = :id AND {VISIBLE_REPORT} {lock}
    """), {"id": relatorio_id})
    report = result.mappings().one_or_none()
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relatório não encontrado.")
    categories = await session.execute(text(f"""
        SELECT {CATEGORY_COLUMNS}, rc.detalhe_objetivo AS detail
        FROM public."RelatorioCategoria" rc
        JOIN public."CategoriaAcessibilidade" c ON c.id_categoria = rc.id_categoria
        WHERE rc.id_relatorio = :id
        ORDER BY c.ordem, c.id_categoria
    """), {"id": relatorio_id})
    return RelatorioResponse(**report, categories=[RelatorioCategoriaResponse(**row) for row in categories.mappings().all()])
