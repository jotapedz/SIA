import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApiResource } from "../../hooks/useApiResource";
import { listRelatorios } from "../../services/relatorios";
import { RelatorioCard } from "./RelatorioCard";
import { Pagination } from "../ui/Pagination";
import { ResourceMessage } from "../ui/ResourceMessage";
import { Field, SelectField } from "../ui/Field";
import { Button } from "../ui/Button";
import type { RelatorioFilters } from "../../services/relatorios";
import styles from "./Relatorios.module.css";

export function RelatorioList({ discenteId }: { discenteId: number }) {
  const [page, setPage] = useState(1);
  const emptyFilters: RelatorioFilters = { q: "", report_type: "", status: "", opened_from: "", opened_to: "" };
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const load = useCallback((token: string, signal: AbortSignal) => listRelatorios(token, discenteId, page, signal, filters), [discenteId, page, filters]);
  const { data, loading, error, status, reload } = useApiResource(load);
  useEffect(() => {
    if (data && page > Math.max(1, Math.ceil(data.total / data.page_size))) setPage(Math.max(1, Math.ceil(data.total / data.page_size)));
  }, [data, page]);
  return <section className={styles.listSection} aria-labelledby="reports-title">
    <h2 id="reports-title">Relatórios</h2>
    <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); setPage(1); setFilters({ ...draft }); }}>
      <Field id="report-search" label="Buscar relatório" maxLength={200} value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
      <SelectField id="report-type-filter" label="Tipo" value={draft.report_type} onChange={(value) => setDraft({ ...draft, report_type: value })}>
        <option value="">Todos os tipos</option><option value="CADASTRO">Cadastro</option><option value="ACOMPANHAMENTO">Acompanhamento</option>
        <option value="ACOES_SUCESSO">Ações de sucesso</option><option value="RECURSOS_ACESSIBILIDADE">Recursos de acessibilidade</option>
        <option value="BARREIRAS">Barreiras</option><option value="OBSERVACOES">Observações</option>
      </SelectField>
      <SelectField id="report-status-filter" label="Status" value={draft.status} onChange={(value) => setDraft({ ...draft, status: value })}>
        <option value="">Todos</option><option value="ABERTO">Aberto</option><option value="EM_ATENDIMENTO">Em atendimento</option>
        <option value="ENCAMINHADO">Encaminhado</option><option value="CONCLUIDO">Concluído</option><option value="CANCELADO">Cancelado</option>
      </SelectField>
      <Field id="report-from" label="Abertura a partir de" type="date" value={draft.opened_from} max={draft.opened_to || undefined} onChange={(e) => setDraft({ ...draft, opened_from: e.target.value })} />
      <Field id="report-to" label="Abertura até" type="date" value={draft.opened_to} min={draft.opened_from || undefined} onChange={(e) => setDraft({ ...draft, opened_to: e.target.value })} />
      <Button type="submit" disabled={loading}>Filtrar</Button>
      <Button variant="outline" onClick={() => { setDraft(emptyFilters); setFilters(emptyFilters); setPage(1); }}>Limpar</Button>
    </form>
    <div className={styles.actions}>
      <Link className={styles.primaryLink} to={`/discentes/${discenteId}/relatorios/novo`}>
        <img src="/assets/report-add.svg" alt="" /> Adicionar relatório
      </Link>
    </div>
    <div aria-busy={loading}>
      {loading || error ? <ResourceMessage loading={loading} error={error} notFound={status === 404} onRetry={reload} />
        : data && data.items.length > 0 ? <div className={styles.grid}>{data.items.map((item) => <RelatorioCard key={item.id} relatorio={item} />)}</div>
          : <p className={styles.empty}>Nenhum relatório encontrado para os critérios informados.</p>}
    </div>
    {data && <Pagination total={data.total} page={page} pageSize={data.page_size} onChange={setPage} label="relatórios" singularLabel="relatório" busy={loading} />}
  </section>;
}
