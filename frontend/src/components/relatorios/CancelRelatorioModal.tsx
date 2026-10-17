import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import styles from "./Relatorios.module.css";

export function CancelRelatorioModal({ onBack, onConfirm }: { onBack: () => void; onConfirm: () => void }) {
  return <Modal title="Cancelar operação?" compact onClose={onBack}>
    <div className={styles.cancelDescription}>
      <p>Deseja cancelar a operação realizada?</p>
      <p>Esta ação não poderá ser desfeita e todas as informações associadas serão removidas permanentemente.</p>
    </div>
    <div className={styles.cancelActions}>
      <Button variant="text" onClick={onBack}>Voltar</Button>
      <Button onClick={onConfirm}>Cancelar</Button>
    </div>
  </Modal>;
}
