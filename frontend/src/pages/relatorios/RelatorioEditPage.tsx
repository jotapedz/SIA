import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { ContentPage } from "../../components/layout/ContentPage";
import { CadastroReportForm } from "../../components/relatorios/CadastroReportForm";
import { RelatorioTextForm } from "../../components/relatorios/RelatorioTextForm";
import { ResourceMessage } from "../../components/ui/ResourceMessage";
import { useApiResource } from "../../hooks/useApiResource";
import { getRelatorio } from "../../services/relatorios";
import { resourceId } from "../../lib/format";
import { reportDefinition } from "../../lib/relatorioForm";
import type { ReportType } from "../../types/api";
import styles from "../../components/relatorios/Relatorios.module.css";

export function RelatorioEditPage() {
  const { relatorioId } = useParams();
  const id = resourceId(relatorioId);
  const load = useCallback((token: string, signal: AbortSignal) => getRelatorio(token, id!, signal), [id]);
  const { data, loading, error, status, reload } = useApiResource(id ? load : null);
  const definition = reportDefinition(data?.report_type ?? null);
  const type = definition ? data!.report_type as ReportType : null;
  const stateError = data?.status === "CANCELADO" ? "Este relatório está cancelado e não pode ser editado."
    : data && !definition ? "O tipo deste relatório não permite edição por este formulário." : "";
  return <ContentPage title="Editar relatório" breadcrumbs={[
    { label: "Início", to: "/discentes" }, { label: "Discente", to: data ? `/discentes/${data.discente_id}` : undefined },
    { label: "Relatório", to: id ? `/relatorios/${id}` : undefined }, { label: "Editar relatório" },
  ]}>
    {definition && type !== "CADASTRO" && <h2 className={styles.subtitle}>{definition.label}</h2>}
    {!id || loading || error || stateError ? <ResourceMessage loading={loading}
      error={!id ? "Relatório não encontrado." : error || stateError} notFound={!id || status === 404 || !!stateError} onRetry={reload} />
      : data && type && (type === "CADASTRO"
        ? <CadastroReportForm key={`${data.id}-${data.updated_at}`} discenteId={data.discente_id} report={data} onReload={reload} />
        : <RelatorioTextForm key={`${data.id}-${data.updated_at}`} discenteId={data.discente_id} type={type} report={data} onReload={reload} />)}
  </ContentPage>;
}
