import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { ContentPage } from "../../components/layout/ContentPage";
import { ResourceMessage } from "../../components/ui/ResourceMessage";
import { useApiResource } from "../../hooks/useApiResource";
import { getDiscente } from "../../services/discentes";
import { resourceId } from "../../lib/format";
import { reportDefinitions, reportTypes } from "../../lib/relatorioForm";
import styles from "../../components/relatorios/Relatorios.module.css";

export function RelatorioSelectPage() {
  const { discenteId } = useParams();
  const id = resourceId(discenteId);
  const load = useCallback((token: string, signal: AbortSignal) => getDiscente(token, id!, signal), [id]);
  const { data, loading, error, status, reload } = useApiResource(id ? load : null);
  return <ContentPage title="Adicionar relatório" breadcrumbs={[
    { label: "Início", to: "/discentes" }, { label: "Discente", to: id ? `/discentes/${id}` : undefined }, { label: "Adicionar relatório" },
  ]}>
    {!id || loading || error ? <ResourceMessage loading={loading} error={!id ? "Discente não encontrado." : error} notFound={!id || status === 404} onRetry={reload} />
      : data && <div className={styles.selectionPanel}>
        <div className={styles.typeGrid}>{reportTypes.map((type) => {
          const definition = reportDefinitions[type];
          return <Link key={type} className={styles.typeOption} to={`/discentes/${data.id}/relatorios/novo/${definition.slug}`}>
            <img src={definition.icon} alt="" /><span>{definition.actionLabel}</span>
          </Link>;
        })}</div>
      </div>}
  </ContentPage>;
}
