import { useState } from "react";
import type { FormEvent } from "react";
import type { DiscenteFilters as Filters } from "../../types/api";
import { Button } from "../ui/Button";
import { Field, SelectField } from "../ui/Field";
import styles from "./Discentes.module.css";

export const defaultFilters: Omit<Filters, "q"> = { status: "", course: "", shift: "", admission_from: "", admission_to: "" };

export function DiscenteFilters({ applied, onApply }: {
  applied: Omit<Filters, "q">; onApply: (values: Omit<Filters, "q">) => void;
}) {
  const [draft, setDraft] = useState(applied);
  const invalidPeriod = !!draft.admission_from && !!draft.admission_to && draft.admission_from > draft.admission_to;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invalidPeriod) onApply(draft);
  }
  return <form id="discente-filters" className={styles.filters} onSubmit={submit} aria-label="Filtros de discentes">
    <SelectField id="filter-status" label="Status" value={draft.status} onChange={(value) => setDraft({ ...draft, status: value as Filters["status"] })}>
      <option value="">Todos</option><option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option>
    </SelectField>
    <Field id="filter-course" label="Curso" placeholder="Digite o curso" maxLength={150} value={draft.course} onChange={(event) => setDraft({ ...draft, course: event.target.value })} />
    <SelectField id="filter-shift" label="Turno" value={draft.shift} onChange={(value) => setDraft({ ...draft, shift: value })}>
      <option value="">Todos</option><option>Diurno</option><option>Noturno</option><option>Integral</option>
    </SelectField>
    <Field id="filter-from" label="Ingresso a partir de" type="date" value={draft.admission_from} onChange={(event) => setDraft({ ...draft, admission_from: event.target.value })} />
    <Field id="filter-to" label="Ingresso até" type="date" value={draft.admission_to} error={invalidPeriod ? "O fim deve ser igual ou posterior ao início." : undefined} onChange={(event) => setDraft({ ...draft, admission_to: event.target.value })} />
    <div className={styles.filterActions}>
      <Button variant="text" onClick={() => { setDraft(defaultFilters); onApply(defaultFilters); }}>Limpar filtros</Button>
      <Button type="submit" disabled={invalidPeriod}>Aplicar filtros</Button>
    </div>
  </form>;
}
