import json

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.historico import HistoricoResponse, HistoricoItem
from app.schemas.profile import ProfileResponse
from app.services.profile import get_profile_id


async def registrar(session: AsyncSession, profile: ProfileResponse, entidade: str,
                    registro_id: int, operacao: str, *, campos: list[str] | None = None) -> None:
    actor = await get_profile_id(session, profile)
    entity_name = {"DISCENTE": "Discente", "RELATORIO": "Relatório", "USUARIO": "Perfil"}[entidade]
    await session.execute(text('''
        INSERT INTO public."HistoricoAcesso"
            (entidade, id_registro, acao, id_perfil, data_evento, campos_afetados)
        VALUES (:entidade, :registro, :operacao, :actor, clock_timestamp(), CAST(:campos AS json))
    '''), {"entidade": entity_name, "registro": registro_id,
           "operacao": operacao, "actor": actor, "campos": json.dumps(campos) if campos else None})


async def consultar(session: AsyncSession, entidade: str, registro_id: int,
                    page: int, page_size: int) -> HistoricoResponse:
    report_entity = "lower(h.entidade) IN ('relatorio', 'relatório')"
    where = "lower(h.entidade) = 'discente' AND h.id_registro = :id" if entidade == "DISCENTE" else f"{report_entity} AND h.id_registro = :id"
    where = f"({where}) AND lower(btrim(h.acao)) NOT IN ('consulta de discente', 'consulta de relatório', 'consulta de relatorio')"
    params = {"id": registro_id}
    count = await session.execute(text(f'SELECT count(*) FROM public."HistoricoAcesso" h WHERE {where}'), params)
    result = await session.execute(text(f'''
        SELECT h.id_historico AS id, h.data_evento AS occurred_at,
               CASE WHEN {report_entity} AND (lower(btrim(h.acao)) LIKE 'edição de %'
                    OR lower(btrim(h.acao)) LIKE 'alteração de %')
                    THEN 'Alteração de relatório' ELSE h.acao END AS operation,
               p.nome AS user_name, rel.id_relatorio AS report_id, rel.resumo_demanda AS report_title
        FROM public."HistoricoAcesso" h
        JOIN public."Perfil" p ON p.id_perfil = h.id_perfil
        LEFT JOIN public."Relatório" rel ON rel.id_relatorio = h.id_registro
            AND lower(h.entidade) IN ('relatorio', 'relatório')
        WHERE {where} ORDER BY h.data_evento DESC, h.id_historico DESC
        LIMIT :limit OFFSET :offset
    '''), {**params, "limit": page_size, "offset": (page - 1) * page_size})
    return HistoricoResponse(items=[HistoricoItem(**row) for row in result.mappings()],
                             total=count.scalar_one(), page=page, page_size=page_size)
