import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Field, TextareaField } from "../ui/Field";
import { Button } from "../ui/Button";
import { FormError } from "../ui/FormError";
import { useRelatorioSubmit } from "../../hooks/useRelatorioSubmit";
import { ApiError } from "../../services/api";
import { emptyRelatorioForm, reportDefinitions, reportLimits, toRelatorioPayload, validateRelatorio } from "../../lib/relatorioForm";
import type { RelatorioErrors, RelatorioFormValues } from "../../lib/relatorioForm";
import type { ReportType } from "../../types/api";
import { CancelRelatorioModal } from "./CancelRelatorioModal";
import styles from "./Relatorios.module.css";

export function RelatorioTextForm({ discenteId, type }: { discenteId: number; type: Exclude<ReportType, "CADASTRO"> }) {
  const navigate = useNavigate();
  const { submit: save, submitting, message, clearFailure } = useRelatorioSubmit(discenteId);
  const [values, setValues] = useState<RelatorioFormValues>({ ...emptyRelatorioForm });
  const [touched, setTouched] = useState<Partial<Record<keyof RelatorioFormValues, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<RelatorioErrors>({});
  const [confirmCancel, setConfirmCancel] = useState(false);
  const errors = validateRelatorio(values, type);
  const canSubmit = !submitting && !Object.keys(errors).length && !Object.values(serverErrors).some(Boolean);
  useEffect(() => {
    if (submitting) return;
    const first = Object.entries(serverErrors).find(([, error]) => !!error)?.[0];
    if (first) document.getElementById(`relatorio-${first}`)?.focus();
  }, [serverErrors, submitting]);
  function field(key: keyof RelatorioFormValues) {
    return {
      id: `relatorio-${key}`, value: values[key], maxLength: reportLimits[key],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        setValues((current) => ({ ...current, [key]: value }));
        setServerErrors((current) => ({ ...current, [key]: undefined }));
        clearFailure();
      },
      onBlur: () => setTouched((current) => ({ ...current, [key]: true })),
      error: serverErrors[key] || (touched[key] ? errors[key] : undefined),
    };
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !event.currentTarget.reportValidity()) return;
    setServerErrors({});
    const error = await save(toRelatorioPayload(values, type));
    const next: RelatorioErrors = {};
    if (error instanceof ApiError) for (const issue of error.issues) {
      const key = String(issue.loc.filter((part) => part !== "body")[0]) as keyof RelatorioFormValues;
      if (key in values) next[key] = "Verifique os dados deste campo.";
    }
    setServerErrors(next);
  }
  return <><form className={styles.form} onSubmit={submit} noValidate aria-busy={submitting}>
    {message && <FormError title="Não foi possível adicionar o relatório">{message}</FormError>}
    <fieldset disabled={submitting}>
      <legend className="sr-only">{reportDefinitions[type].label}</legend>
      <Field {...field("title")} label="Título" placeholder="Digite o título do relatório" required />
      {reportDefinitions[type].fields.map((item) => <TextareaField key={item.key} {...field(item.key)}
        label={item.label} placeholder={item.placeholder} rows={4} required={item.required} />)}
    </fieldset>
    <div className={styles.formActions}>
      <Button variant="text" disabled={submitting} onClick={() => setConfirmCancel(true)}>Cancelar</Button>
      <Button type="submit" disabled={!canSubmit}>{submitting ? "Adicionando..." : "Adicionar"}</Button>
    </div>
  </form>
    {confirmCancel && <CancelRelatorioModal onBack={() => setConfirmCancel(false)} onConfirm={() => navigate(`/discentes/${discenteId}`)} />}
  </>;
}
