import { useState } from "react";
import type { FormEvent } from "react";
import type { UsuarioFilters as Filters } from "../../types/api";
import { usuarioRoleLabels, usuarioStatusLabels } from "../../lib/usuarioForm";
import { SelectField } from "../ui/Field";
import { Button } from "../ui/Button";
import styles from "./Usuarios.module.css";

export type UsuarioFilterValues = Omit<Filters, "q">;
export const defaultUsuarioFilters: UsuarioFilterValues = { role: "", status: "" };

export function UsuarioFilters({ applied, onApply }: { applied: UsuarioFilterValues; onApply: (value: UsuarioFilterValues) => void }) {
  const [draft, setDraft] = useState(applied);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onApply(draft); }
  return <form id="usuario-filters" className={styles.filters} onSubmit={submit} aria-label="Filtros de usuários">
    <SelectField id="usuario-filter-role" label="Perfil" value={draft.role} onChange={(value) => setDraft({ ...draft, role: value as Filters["role"] })}>
      <option value="">Todos</option>{Object.entries(usuarioRoleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </SelectField>
    <SelectField id="usuario-filter-status" label="Status" value={draft.status} onChange={(value) => setDraft({ ...draft, status: value as Filters["status"] })}>
      <option value="">Todos</option>{Object.entries(usuarioStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </SelectField>
    <div className={styles.filterActions}>
      <Button variant="text" onClick={() => { setDraft(defaultUsuarioFilters); onApply(defaultUsuarioFilters); }}>Limpar filtros</Button>
      <Button type="submit">Aplicar filtros</Button>
    </div>
  </form>;
}
