import { useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { deleteUsuario } from "../../services/usuarios";
import { ApiError } from "../../services/api";
import type { Usuario } from "../../types/api";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FormError } from "../ui/FormError";
import styles from "./Usuarios.module.css";

export function UsuarioDeleteModal({ user, onClose, onDeleted, onReload }: {
  user: Usuario; onClose: () => void; onDeleted: () => void; onReload: () => void;
}) {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const locked = useRef(false);
  async function remove() {
    if (!session || locked.current || blocked) return;
    locked.current = true; setBusy(true); setError("");
    try {
      await deleteUsuario(session.access_token, user);
      onDeleted();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível excluir o usuário.");
      setBlocked(reason instanceof ApiError && [404, 409].includes(reason.status));
    } finally { locked.current = false; setBusy(false); }
  }
  return <Modal title="Excluir usuário?" compact busy={busy} onClose={() => { if (!busy) onClose(); }}>
    <p>Deseja excluir o usuário <strong>{user.full_name}</strong>?</p>
    <p>Ele deixará de aparecer na listagem e perderá o acesso ao SIA. Os cadastros, relatórios e históricos feitos por ele serão preservados, com a identificação do autor.</p>
    {error && <FormError title="Não foi possível excluir">{error}</FormError>}
    <div className={styles.modalActions}>
      <Button variant="text" disabled={busy} onClick={onClose}>Cancelar</Button>
      {blocked ? <Button onClick={onReload}>Recarregar listagem</Button>
        : <Button disabled={busy} onClick={() => void remove()}>{busy ? "Excluindo..." : "Excluir"}</Button>}
    </div>
  </Modal>;
}
