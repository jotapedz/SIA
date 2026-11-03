import { useCallback, useState } from "react";
import { useApiResource } from "../../hooks/useApiResource";
import { apiRequest } from "../../services/api";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Pagination } from "./Pagination";
import { ResourceMessage } from "./ResourceMessage";
import styles from "./HistoryModal.module.css";

type History = { items: { id: number; occurred_at: string; operation: string; user_name: string;
  report_id?: number | null; report_title?: string | null }[];
  total: number; page: number; page_size: number };

export function HistoryModal({ kind, id, onClose }: { kind: "discentes" | "relatorios"; id: number; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const load = useCallback((token: string, signal: AbortSignal) =>
    apiRequest<History>(`/v1/${kind}/${id}/historico?page=${page}`, token, { signal }), [kind, id, page]);
  const { data, loading, error, status, reload } = useApiResource(load);
  return <Modal title={`Visualizar histórico ${kind === "discentes" ? "do discente" : "de relatório"}`} onClose={onClose}>
    {loading || error ? <ResourceMessage loading={loading} error={error} notFound={status === 404} onRetry={reload} />
      : data && <>
        <div className={styles.scroll}><table className={styles.table}>
          <caption className="sr-only">Operações registradas, das mais recentes para as mais antigas</caption>
          <thead><tr><th scope="col">Data</th><th scope="col">Operação</th><th scope="col">Usuário</th></tr></thead>
          <tbody>{data.items.map((item) => <tr key={item.id}>
            <td><time dateTime={item.occurred_at}>{new Date(item.occurred_at).toLocaleString("pt-BR")}</time></td>
            <td>{item.operation}{kind === "relatorios" && item.report_title && <div>{item.report_title}</div>}</td><td>{item.user_name}</td>
          </tr>)}</tbody>
        </table></div>
        {!data.items.length && <p role="status">Nenhuma operação registrada. O histórico começa após a ativação desta funcionalidade.</p>}
        {data.total > data.page_size && <Pagination total={data.total} page={page} pageSize={data.page_size} onChange={setPage} label="operações" busy={loading} />}
      </>}
    <div className={styles.actions}><Button onClick={onClose}>Fechar</Button></div>
  </Modal>;
}
