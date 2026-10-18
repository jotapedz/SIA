import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ContentPage } from "../../components/layout/ContentPage";
import { Button } from "../../components/ui/Button";
import { ResourceMessage } from "../../components/ui/ResourceMessage";
import { CadastroReportDetails } from "../../components/relatorios/CadastroReportDetails";
import { CancelSavedRelatorioModal } from "../../components/relatorios/CancelSavedRelatorioModal";
import { useApiResource } from "../../hooks/useApiResource";
import { useAuth } from "../../hooks/useAuth";
import { cancelRelatorio, getRelatorio } from "../../services/relatorios";
import { ApiError } from "../../services/api";
import { formatDate, reportStatusLabels, resourceId } from "../../lib/format";
import { reportDefinition } from "../../lib/relatorioForm";
import type { Relatorio } from "../../types/api";
import styles from "../../components/relatorios/Relatorios.module.css";

export function RelatorioDetailsPage() {
  const { relatorioId } = useParams();
  const { state } = useLocation();
  const { session } = useAuth();
  const id = resourceId(relatorioId);
  const load = useCallback((token: string, signal: AbortSignal) => getRelatorio(token, id!, signal), [id]);
  const { data, loading, error, status, reload } = useApiResource(id ? load : null);
  const definition = reportDefinition(data?.report_type ?? null);
  const [target, setTarget] = useState<Relatorio | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelConflict, setCancelConflict] = useState(false);
  const [notice, setNotice] = useState("");
  const locked = useRef(false);
  useEffect(() => { setTarget(null); setCancelError(""); setCancelConflict(false); setNotice(""); }, [id]);
  async function confirmCancellation() {
    if (!target || !session || locked.current) return;
    locked.current = true;
    setCancelling(true);
    setCancelError("");
    try {
      await cancelRelatorio(session.access_token, target.id, target.updated_at);
      setTarget(null);
      setNotice("Relatório cancelado com sucesso.");
      reload();
    } catch (reason) {
      setCancelError(reason instanceof Error ? reason.message : "Não foi possível cancelar o relatório.");
      if (reason instanceof ApiError && ["stale_record", "report_cancelled"].includes(reason.code)) setCancelConflict(true);
    } finally { locked.current = false; setCancelling(false); }
  }
  const sections: [string, string | null | undefined][] = data && definition ? definition.fields.map((field) => [field.label, data[field.key]]) : data ? [
    ["Atividade/Disciplina", data.activity], ["Descrição da demanda", data.description],
    ["Acompanhamento continuado", data.ongoing_follow_up], ["Observação", data.notes],
  ] : [];
  return <ContentPage title="Relatório" breadcrumbs={[
    { label: "Início", to: "/discentes" },
    { label: "Discente", to: data ? `/discentes/${data.discente_id}` : undefined }, { label: "Relatório" },
  ]}>
    {!id || loading || error ? <ResourceMessage loading={loading} error={!id ? "Relatório não encontrado." : error} notFound={!id || status === 404} onRetry={reload} />
      : data && <>
        {(notice || state?.created === true || state?.updated === true) && <p className={styles.success} role="status">
          {notice || (state?.updated === true ? "Relatório atualizado com sucesso." : "Relatório adicionado com sucesso.")}
        </p>}
        {definition && data.report_type !== "CADASTRO" && <h2 className={`${styles.subtitle} ${data.status !== "CANCELADO" ? styles.detailSubtitle : ""}`}>{definition.label}</h2>}
        {data.status !== "CANCELADO" && <div className={styles.actions}>
          <Button onClick={() => { setTarget(data); setCancelError(""); setCancelConflict(false); }}><img src="/assets/delete-white.svg" alt="" /> Excluir relatório</Button>
          {definition && <Link className={styles.primaryLink} to={`/relatorios/${data.id}/editar`}><img src="/assets/edit.svg" alt="" /> Editar relatório</Link>}
        </div>}
        <article className={styles.report} aria-labelledby="report-title">
          <div className={styles.reportHeader}>
            <div>
              <time dateTime={data.opened_at}>{formatDate(data.opened_at)}</time>
              <h2 id="report-title">{data.title}</h2>
              <div className={styles.badges}>
                <span className={styles.typeBadge}>{definition?.badge || "Relatório"}</span>
                <span className={styles.statusBadge}>{reportStatusLabels[data.status] || data.status}</span>
              </div>
              <p className={styles.author}>Por {data.author_name}</p>
              {data.closed_at && <p>Conclusão: {formatDate(data.closed_at)}</p>}
            </div>
            <Button variant="outline" disabled title="Histórico previsto para uma próxima etapa">
              <img src="/assets/visibility.svg" alt="" /> Visualizar histórico
            </Button>
          </div>
          <div className={styles.reportBody}>
            {data.report_type === "CADASTRO" ? <CadastroReportDetails categories={data.categories} /> : sections.map(([label, value]) => <section key={label}>
              <h3>{label}</h3><p>{value || "Não informado"}</p>
            </section>)}
          </div>
        </article>
        {target?.id === data.id && <CancelSavedRelatorioModal busy={cancelling} error={cancelError} blocked={cancelConflict}
          onBack={() => { if (!cancelling) { setTarget(null); if (cancelConflict) reload(); } }} onConfirm={() => void confirmCancellation()} />}
      </>}
  </ContentPage>;
}
