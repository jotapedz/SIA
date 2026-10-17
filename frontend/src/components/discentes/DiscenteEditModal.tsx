import type { Discente } from "../../types/api";
import { DiscenteFormModal } from "./DiscenteFormModal";

export function DiscenteEditModal({ discente, onClose, onUpdated, onReload }: {
  discente: Discente; onClose: () => void; onUpdated: (discente: Discente) => void; onReload: () => void;
}) {
  return <DiscenteFormModal key={discente.id} discente={discente} onClose={onClose} onSaved={onUpdated} onReload={onReload} />;
}
