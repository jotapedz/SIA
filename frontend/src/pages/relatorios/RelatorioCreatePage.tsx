import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { ContentPage } from "../../components/layout/ContentPage";
import { CadastroReportForm } from "../../components/relatorios/CadastroReportForm";
import { RelatorioTextForm } from "../../components/relatorios/RelatorioTextForm";
import { ResourceMessage } from "../../components/ui/ResourceMessage";
import { useApiResource } from "../../hooks/useApiResource";
import { getDiscente } from "../../services/discentes";
import { resourceId } from "../../lib/format";
import { reportDefinitions, reportTypeFromSlug } from "../../lib/relatorioForm";
import styles from "../../components/relatorios/Relatorios.module.css";

export function RelatorioCreatePage() {
  const { discenteId, reportType: slug } = useParams();
  const id = resourceId(discenteId);
  const type = reportTypeFromSlug(slug);
  const load = useCallback((token: string, signal: AbortSignal) => getDiscente(token, id!, signal), [id]);
  const { data, loading, error, status, reload } = useApiResource(id && type ? load : null);
  return <ContentPage title="Adicionar relatório" breadcrumbs={[
    { label: "Início", to: "/discentes" }, { label: "Discente", to: id ? `/discentes/${id}` : undefined },
    { label: "Adicionar relatório", to: id ? `/discentes/${id}/relatorios/novo` : undefined },
    { label: type ? reportDefinitions[type].actionLabel : "Tipo de relatório" },
  ]}>
    {type && <h2 className={styles.subtitle}>{reportDefinitions[type].label}</h2>}
    {!id || !type || loading || error ? <ResourceMessage loading={loading}
      error={!id ? "Discente não encontrado." : !type ? "Tipo de relatório não encontrado." : error}
      notFound={!id || !type || status === 404} onRetry={reload} />
      : data && (type === "CADASTRO" ? <CadastroReportForm key={data.id} discenteId={data.id} />
        : <RelatorioTextForm key={`${data.id}-${type}`} discenteId={data.id} type={type} />)}
  </ContentPage>;
}
