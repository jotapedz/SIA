import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ContentPage } from "../../components/layout/ContentPage";
import { DiscenteDetails } from "../../components/discentes/DiscenteDetails";
import { AcompanhamentoPanel } from "../../components/discentes/AcompanhamentoPanel";
import { DiscenteEditModal } from "../../components/discentes/DiscenteEditModal";
import { DiscenteDeleteModal } from "../../components/discentes/DiscenteDeleteModal";
import { RelatorioList } from "../../components/relatorios/RelatorioList";
import { Button } from "../../components/ui/Button";
import { ResourceMessage } from "../../components/ui/ResourceMessage";
import { useApiResource } from "../../hooks/useApiResource";
import { useAuth } from "../../hooks/useAuth";
import { prefetchApiRequest } from "../../services/api";
import { getDiscente } from "../../services/discentes";
import { resourceId } from "../../lib/format";
import styles from "../../components/relatorios/Relatorios.module.css";

export function DiscenteDetailsPage() {
  const { discenteId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const id = resourceId(discenteId);
  const load = useCallback((tokenValue: string, signal: AbortSignal) => getDiscente(tokenValue, id!, signal), [id]);
  const { data, loading, error, status, reload } = useApiResource(id ? load : null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!id || !token) return;
    prefetchApiRequest(`/v1/discentes/${id}/relatorios?page=1&page_size=6`, token);
    prefetchApiRequest(`/v1/discentes/${id}/atendimentos?page=1`, token);
    prefetchApiRequest(`/v1/discentes/${id}/termos?page=1`, token);
  }, [id, token]);

  function closeAndReload() {
    setEditing(false);
    reload();
    if (id && token) {
      prefetchApiRequest(`/v1/discentes/${id}/relatorios?page=1&page_size=6`, token);
      prefetchApiRequest(`/v1/discentes/${id}/atendimentos?page=1`, token);
      prefetchApiRequest(`/v1/discentes/${id}/termos?page=1`, token);
    }
  }
  return <ContentPage title="Discente" breadcrumbs={[{ label: "Início", to: "/discentes" }, { label: "Discente" }]}>
    {!id || loading || error ? <ResourceMessage loading={loading} error={!id ? "Discente não encontrado." : error}
      notFound={!id || status === 404} onRetry={reload} />
      : data && <>
        <div className={styles.actions}><Button onClick={() => { setEditing(true); setSuccess(""); }}>
          <img src="/assets/edit.svg" alt="" /> Editar discente
        </Button><Button onClick={() => setDeleting(true)}><img src="/assets/delete-white.svg" alt="" /> Excluir discente</Button></div>
        {success && <div className={styles.success} role="status">{success}</div>}
        <DiscenteDetails key={`discente-${data.id}`} discente={data} />
        <RelatorioList key={`relatorios-${data.id}`} discenteId={data.id} />
        <AcompanhamentoPanel key={`acompanhamento-${data.id}`} discenteId={data.id} />
        {deleting && <DiscenteDeleteModal discente={data} onClose={() => setDeleting(false)}
          onReload={() => { setDeleting(false); reload(); }} onDeleted={() => navigate("/discentes", { replace: true, state: { deleted: true } })} />}
        {editing && <DiscenteEditModal discente={data} onClose={() => setEditing(false)} onReload={closeAndReload}
          onUpdated={() => { setSuccess("Cadastro atualizado com sucesso."); closeAndReload(); }} />}
      </>}
  </ContentPage>;
}
