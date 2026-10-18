import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FormError } from "../ui/FormError";
import styles from "./Relatorios.module.css";

export function CancelSavedRelatorioModal({ busy, error, blocked = false, onBack, onConfirm }: {
  busy: boolean; error: string; blocked?: boolean; onBack: () => void; onConfirm: () => void;
}) {
  return <Modal title="Cancelar relatório?" compact busy={busy} onClose={onBack}>
    <div className={styles.cancelDescription}>
      <p>Deseja cancelar este relatório?</p>
      <p>O registro será mantido para consulta e não poderá ser editado.</p>
    </div>
    {error && <FormError title="Não foi possível cancelar">{error}</FormError>}
    <div className={styles.cancelActions}>
      <Button variant="text" disabled={busy} onClick={onBack}>Voltar</Button>
      <Button disabled={busy || blocked} onClick={onConfirm}>{busy ? "Cancelando..." : "Cancelar relatório"}</Button>
    </div>
  </Modal>;
}
