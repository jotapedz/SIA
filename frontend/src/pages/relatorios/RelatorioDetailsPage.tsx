import { useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ContentPage } from "../../components/layout/ContentPage";
import { Button } from "../../components/ui/Button";
import { ResourceMessage } from "../../components/ui/ResourceMessage";
import { CadastroReportDetails } from "../../components/relatorios/CadastroReportDetails";
import { useApiResource } from "../../hooks/useApiResource";
import { getRelatorio } from "../../services/relatorios";
import { formatDate, reportStatusLabels, resourceId } from "../../lib/format";
import { reportDefinition } from "../../lib/relatorioForm";
import styles from "../../components/relatorios/Relatorios.module.css";

export function RelatorioDetailsPage() {
  const { relatorioId } = useParams();
  const { state } = useLocation();
  const id = resourceId(relatorioId);
  const load = useCallback((token: string, signal: AbortSignal) => getRelatorio(token, id!, signal), [id]);
  const { data, loading, error, status, reload } = useApiResource(id ? load : null);
  const definition = reportDefinition(data?.report_type ?? null);
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
        {state?.created === true && <p className={styles.success} role="status">Relatório adicionado com sucesso.</p>}
        {definition && data.report_type !== "CADASTRO" && <h2 className={styles.subtitle}>{definition.label}</h2>}
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
      </>}
  </ContentPage>;
}
