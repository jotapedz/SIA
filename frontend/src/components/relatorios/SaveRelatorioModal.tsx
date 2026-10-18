import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import styles from "./Relatorios.module.css";

export function SaveRelatorioModal({ busy, onBack, onConfirm }: {
  busy: boolean; onBack: () => void; onConfirm: () => void;
}) {
  return <Modal title="Salvar alterações?" compact busy={busy} onClose={onBack}>
    <div className={styles.cancelDescription}><p>Deseja salvar as alterações realizadas neste relatório?</p></div>
    <div className={styles.cancelActions}>
      <Button variant="text" disabled={busy} onClick={onBack}>Cancelar</Button>
      <Button disabled={busy} onClick={onConfirm}>{busy ? "Salvando..." : "Salvar"}</Button>
    </div>
  </Modal>;
}
