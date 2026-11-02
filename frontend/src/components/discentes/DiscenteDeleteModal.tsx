import { useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiRequest, ApiError } from "../../services/api";
import type { Discente } from "../../types/api";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FormError } from "../ui/FormError";
import styles from "../relatorios/Relatorios.module.css";

export function DiscenteDeleteModal({ discente, onClose, onDeleted, onReload }: {
  discente: Discente; onClose: () => void; onDeleted: () => void; onReload: () => void;
}) {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const locked = useRef(false);
  async function remove() {
    if (!session || locked.current || conflict) return;
    locked.current = true; setBusy(true); setError("");
    try {
      await apiRequest(`/v1/discentes/${discente.id}/exclusao`, session.access_token,
        { method: "POST", body: JSON.stringify({ expected_updated_at: discente.updated_at }) });
      onDeleted();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível excluir o discente.");
      if (reason instanceof ApiError && [404, 409].includes(reason.status)) setConflict(true);
    } finally { locked.current = false; setBusy(false); }
  }
  return <Modal title="Excluir discente?" compact busy={busy} onClose={onClose}>
    <div className={styles.cancelDescription}>
      <p>Deseja excluir o cadastro de {discente.social_name || discente.full_name}?</p>
      <p>O discente e seus relatórios deixarão de aparecer nas consultas. Os registros serão preservados no banco.</p>
    </div>
    {error && <FormError title="Não foi possível excluir">{error}</FormError>}
    <div className={styles.cancelActions}>
      <Button variant="text" disabled={busy} onClick={onClose}>Voltar</Button>
      {conflict ? <Button onClick={onReload}>Recarregar</Button>
        : <Button disabled={busy} onClick={() => void remove()}>{busy ? "Excluindo..." : "Excluir"}</Button>}
    </div>
  </Modal>;
}
