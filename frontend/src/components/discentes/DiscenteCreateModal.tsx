import type { Discente } from "../../types/api";
import { DiscenteFormModal } from "./DiscenteFormModal";

export function DiscenteCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (discente: Discente) => void }) {
  return <DiscenteFormModal onClose={onClose} onSaved={onCreated} />;
}
