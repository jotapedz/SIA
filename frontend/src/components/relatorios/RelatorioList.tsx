import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApiResource } from "../../hooks/useApiResource";
import { listRelatorios } from "../../services/relatorios";
import { RelatorioCard } from "./RelatorioCard";
import { Pagination } from "../ui/Pagination";
import { ResourceMessage } from "../ui/ResourceMessage";
import styles from "./Relatorios.module.css";

export function RelatorioList({ discenteId }: { discenteId: number }) {
  const [page, setPage] = useState(1);
  const load = useCallback((token: string, signal: AbortSignal) => listRelatorios(token, discenteId, page, signal), [discenteId, page]);
  const { data, loading, error, status, reload } = useApiResource(load);
  useEffect(() => {
    if (data && page > Math.max(1, Math.ceil(data.total / data.page_size))) setPage(Math.max(1, Math.ceil(data.total / data.page_size)));
  }, [data, page]);
  return <section className={styles.listSection} aria-labelledby="reports-title">
    <h2 id="reports-title">Relatórios</h2>
    <div className={styles.actions}>
      <Link className={styles.primaryLink} to={`/discentes/${discenteId}/relatorios/novo`}>
        <img src="/assets/report-add.svg" alt="" /> Adicionar relatório
      </Link>
    </div>
    <div aria-busy={loading}>
      {loading || error ? <ResourceMessage loading={loading} error={error} notFound={status === 404} onRetry={reload} />
        : data && data.items.length > 0 ? <div className={styles.grid}>{data.items.map((item) => <RelatorioCard key={item.id} relatorio={item} />)}</div>
          : <p className={styles.empty}>Nenhum relatório cadastrado para este discente.</p>}
    </div>
    {data && <Pagination total={data.total} page={page} pageSize={data.page_size} onChange={setPage} label="relatórios" busy={loading} />}
  </section>;
}
