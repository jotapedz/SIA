import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { ContentPage } from "../../components/layout/ContentPage";
import { DiscenteDetails } from "../../components/discentes/DiscenteDetails";
import { DiscenteEditModal } from "../../components/discentes/DiscenteEditModal";
import { RelatorioList } from "../../components/relatorios/RelatorioList";
import { Button } from "../../components/ui/Button";
import { ResourceMessage } from "../../components/ui/ResourceMessage";
import { useApiResource } from "../../hooks/useApiResource";
import { getDiscente } from "../../services/discentes";
import { resourceId } from "../../lib/format";
import styles from "../../components/relatorios/Relatorios.module.css";

export function DiscenteDetailsPage() {
  const { discenteId } = useParams();
  const id = resourceId(discenteId);
  const load = useCallback((token: string, signal: AbortSignal) => getDiscente(token, id!, signal), [id]);
  const { data, loading, error, status, reload } = useApiResource(id ? load : null);
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState("");
  function closeAndReload() { setEditing(false); reload(); }
  return <ContentPage title="Discente" breadcrumbs={[{ label: "Início", to: "/discentes" }, { label: "Discente" }]}>
    {!id || loading || error ? <ResourceMessage loading={loading} error={!id ? "Discente não encontrado." : error}
      notFound={!id || status === 404} onRetry={reload} />
      : data && <>
        <div className={styles.actions}><Button onClick={() => { setEditing(true); setSuccess(""); }}>
          <img src="/assets/edit.svg" alt="" /> Editar discente
        </Button></div>
        {success && <div className={styles.success} role="status">{success}</div>}
        <DiscenteDetails key={data.id} discente={data} />
        <RelatorioList key={data.id} discenteId={data.id} />
        {editing && <DiscenteEditModal discente={data} onClose={() => setEditing(false)} onReload={closeAndReload}
          onUpdated={() => { setSuccess("Cadastro atualizado com sucesso."); closeAndReload(); }} />}
      </>}
  </ContentPage>;
}
