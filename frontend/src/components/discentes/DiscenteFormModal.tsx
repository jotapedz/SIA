import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { createDiscente, updateDiscente } from "../../services/discentes";
import { ApiError } from "../../services/api";
import type { Discente } from "../../types/api";
import { discenteChanges, emptyDiscenteForm, fromDiscente, today, toDiscentePayload, validateDiscenteForm } from "../../lib/discenteForm";
import type { DiscenteFormValues, FormErrors } from "../../lib/discenteForm";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field, SelectField } from "../ui/Field";
import { FormError } from "../ui/FormError";
import styles from "./Discentes.module.css";

export function DiscenteFormModal({ discente, onClose, onSaved, onReload }: {
  discente?: Discente; onClose: () => void; onSaved: (discente: Discente) => void; onReload?: () => void;
}) {
  const { session } = useAuth();
  const [values, setValues] = useState<DiscenteFormValues>(() => discente ? fromDiscente(discente) : { ...emptyDiscenteForm });
  const [hasFamily, setHasFamily] = useState(!!discente?.family_contact);
  const initial = useRef(toDiscentePayload(values, hasFamily)).current;
  const expectedUpdatedAt = useRef(discente?.updated_at ?? "").current;
  const payload = toDiscentePayload(values, hasFamily);
  const changes = discenteChanges(initial, payload);
  const [stale, setStale] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof DiscenteFormValues, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const locked = useRef(false);
  const errors = validateDiscenteForm(values, hasFamily);
  const canSubmit = Object.keys(errors).length === 0 && !Object.values(serverErrors).some(Boolean)
    && !submitting && !stale && (!discente || Object.keys(changes).length > 0);

  useEffect(() => {
    if (submitting) return;
    const first = Object.entries(serverErrors).find(([, error]) => !!error)?.[0];
    if (first) document.getElementById(`discente-${first}`)?.focus();
  }, [serverErrors, submitting]);

  function changeFamily(value: boolean) {
    setHasFamily(value);
    setServerErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => !key.startsWith("family_"))));
    if (!stale) setMessage("");
  }

  function change(key: keyof DiscenteFormValues, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setServerErrors((previous) => ({ ...previous, [key]: undefined }));
    if (!stale) setMessage("");
  }
  function field(key: keyof DiscenteFormValues) {
    return {
      id: `discente-${key}`, value: values[key],
      onChange: (event: ChangeEvent<HTMLInputElement>) => change(key, event.target.value),
      onBlur: () => setTouched((previous) => ({ ...previous, [key]: true })),
      error: serverErrors[key] || (touched[key] ? errors[key] : undefined),
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || locked.current || !session) return;
    if (!event.currentTarget.reportValidity()) return;
    locked.current = true;
    setSubmitting(true);
    setMessage("");
    setServerErrors({});
    try {
      const saved = discente
        ? await updateDiscente(session.access_token, discente.id, { ...changes, expected_updated_at: expectedUpdatedAt })
        : await createDiscente(session.access_token, payload);
      onSaved(saved);
    } catch (error) {
      const next: FormErrors = {};
      if (error instanceof ApiError) {
        if (error.code === "stale_record") setStale(true);
        else if (error.status === 409) next.registration_number = "Esta matrícula já está cadastrada.";
        for (const issue of error.issues) {
          const path = issue.loc.filter((part) => part !== "body");
          const familyMap: Record<string, keyof DiscenteFormValues> = {
            full_name: "family_name", relationship: "family_relationship", phone: "family_phone", email: "family_email", notes: "family_notes",
          };
          const key = path[0] === "family_contact" ? familyMap[String(path[1])] : String(path[0]) as keyof DiscenteFormValues;
          if (key && key in values) next[key] = "Verifique os dados deste campo.";
        }
      }
      setServerErrors(next);
      setMessage(error instanceof ApiError && error.status === 0
        ? "Não foi possível confirmar o salvamento. Confira o cadastro antes de tentar novamente."
        : error instanceof Error ? error.message : "Não foi possível salvar o discente.");
    } finally { locked.current = false; setSubmitting(false); }
  }

  return <Modal title={discente ? "Editar discente" : "Cadastrar discente"} busy={submitting} onClose={onClose}>
    <form onSubmit={submit} noValidate className={styles.createForm}>
      {message && <FormError title="Não foi possível salvar">{message}</FormError>}
      {stale && onReload && <Button variant="text" onClick={onReload}>Recarregar cadastro</Button>}
      <fieldset disabled={submitting} className={styles.formSection}>
        <legend>Informações gerais</legend>
        <div className={styles.formGrid}>
          <Field {...field("full_name")} label="Nome completo" placeholder="Digite o nome completo" autoComplete="name" maxLength={150} required />
          <Field {...field("social_name")} label="Nome social" placeholder="Digite o nome social" maxLength={150} />
          <Field {...field("registration_number")} label="Matrícula" placeholder="Digite a matrícula" maxLength={50} autoComplete="off" required />
          <Field {...field("course")} label="Curso" placeholder="Digite o curso" maxLength={150} />
          <Field {...field("email")} label="E-mail institucional" type="email" placeholder="Digite o e-mail institucional" maxLength={254} />
          <Field {...field("phone")} label="Telefone" type="tel" placeholder="Digite o telefone" maxLength={25} />
          <Field {...field("admission_date")} label="Data de ingresso" type="date" required />
          <Field {...field("birth_date")} label="Data de nascimento" type="date" max={today()} />
          <SelectField id="discente-shift" label="Turno" value={values.shift} onChange={(value) => change("shift", value)}>
            {values.shift && !["Diurno", "Noturno", "Integral"].includes(values.shift) && <option value={values.shift}>{values.shift} (atual)</option>}
            <option value="">Selecione o turno</option><option>Diurno</option><option>Noturno</option><option>Integral</option>
          </SelectField>
          <SelectField id="discente-status" label="Status" value={values.status} onChange={(value) => change("status", value)}>
            {!["ATIVO", "INATIVO"].includes(values.status) && <option value={values.status}>{values.status} (atual)</option>}
            <option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option>
          </SelectField>
        </div>
      </fieldset>
      <fieldset disabled={submitting} className={styles.formSection}>
        <legend>Contato familiar</legend>
        <fieldset className={styles.familyChoice}>
          <legend>Deseja adicionar contato familiar?</legend>
          <label><input type="radio" name="has-family" checked={hasFamily} onChange={() => changeFamily(true)} /> Sim</label>
          <label><input type="radio" name="has-family" checked={!hasFamily} onChange={() => changeFamily(false)} /> Não</label>
        </fieldset>
        {hasFamily && <div className={styles.formGrid}>
          <Field {...field("family_name")} label="Nome do responsável" placeholder="Digite o nome do responsável" maxLength={150} required />
          <Field {...field("family_relationship")} label="Grau de parentesco" placeholder="Digite o grau de parentesco" maxLength={60} required />
          <Field {...field("family_phone")} label="Telefone do familiar" type="tel" placeholder="Digite o telefone" maxLength={25} required />
          <Field {...field("family_email")} label="E-mail do familiar" type="email" placeholder="Digite o e-mail" maxLength={254} />
          <Field {...field("family_notes")} label="Observação" placeholder="Digite uma observação operacional" maxLength={500} />
        </div>}
      </fieldset>
      <div className={styles.modalActions}>
        <Button variant="text" disabled={submitting} onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={!canSubmit}>{submitting ? "Salvando..." : discente ? "Salvar" : "Cadastrar"}</Button>
      </div>
    </form>
  </Modal>;
}
