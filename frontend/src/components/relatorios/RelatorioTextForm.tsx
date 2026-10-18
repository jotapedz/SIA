import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Field, TextareaField } from "../ui/Field";
import { Button } from "../ui/Button";
import { FormError } from "../ui/FormError";
import { useRelatorioSubmit } from "../../hooks/useRelatorioSubmit";
import { ApiError } from "../../services/api";
import { emptyRelatorioForm, fromRelatorio, reportDefinitions, reportLimits, toRelatorioPayload, validateRelatorio } from "../../lib/relatorioForm";
import type { RelatorioErrors, RelatorioFormValues } from "../../lib/relatorioForm";
import type { Relatorio, ReportType } from "../../types/api";
import { CancelRelatorioModal } from "./CancelRelatorioModal";
import { SaveRelatorioModal } from "./SaveRelatorioModal";
import styles from "./Relatorios.module.css";

export function RelatorioTextForm({ discenteId, type, report, onReload }: {
  discenteId: number; type: Exclude<ReportType, "CADASTRO">; report?: Relatorio; onReload?: () => void;
}) {
  const navigate = useNavigate();
  const { submit: save, submitting, message, clearFailure, blocked } = useRelatorioSubmit(discenteId, report);
  const [values, setValues] = useState<RelatorioFormValues>(() => report ? fromRelatorio(report) : { ...emptyRelatorioForm });
  const initial = useRef(toRelatorioPayload(values, type)).current;
  const changed = JSON.stringify(initial) !== JSON.stringify(toRelatorioPayload(values, type));
  const [touched, setTouched] = useState<Partial<Record<keyof RelatorioFormValues, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<RelatorioErrors>({});
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const errors = validateRelatorio(values, type);
  const canSubmit = !submitting && !blocked && (!report || changed) && !Object.keys(errors).length && !Object.values(serverErrors).some(Boolean);
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
  async function persist() {
    if (!canSubmit) return;
    setServerErrors({});
    const error = await save(toRelatorioPayload(values, type));
    if (error) setConfirmSave(false);
    const next: RelatorioErrors = {};
    if (error instanceof ApiError) for (const issue of error.issues) {
      const key = String(issue.loc.filter((part) => part !== "body")[0]) as keyof RelatorioFormValues;
      if (key in values) next[key] = "Verifique os dados deste campo.";
    }
    setServerErrors(next);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !event.currentTarget.reportValidity()) return;
    if (report) setConfirmSave(true);
    else void persist();
  }
  return <><form className={styles.form} onSubmit={submit} noValidate aria-busy={submitting}>
    {message && <FormError title="Não foi possível salvar o relatório">{message}</FormError>}
    {blocked && onReload && <Button variant="text" onClick={onReload}>Recarregar relatório</Button>}
    <fieldset disabled={submitting}>
      <legend className="sr-only">{reportDefinitions[type].label}</legend>
      <Field {...field("title")} label="Título" placeholder="Digite o título do relatório" required />
      {reportDefinitions[type].fields.map((item) => <TextareaField key={item.key} {...field(item.key)}
        label={item.label} placeholder={item.placeholder} rows={4} required={item.required} />)}
    </fieldset>
    <div className={styles.formActions}>
      <Button variant="text" disabled={submitting} onClick={() => setConfirmCancel(true)}>Cancelar</Button>
      <Button type="submit" disabled={!canSubmit}>{submitting ? "Salvando..." : report ? "Salvar" : "Adicionar"}</Button>
    </div>
  </form>
    {confirmCancel && <CancelRelatorioModal onBack={() => setConfirmCancel(false)} onConfirm={() => navigate(report ? `/relatorios/${report.id}` : `/discentes/${discenteId}`)} />}
    {confirmSave && <SaveRelatorioModal busy={submitting} onBack={() => setConfirmSave(false)} onConfirm={() => void persist()} />}
  </>;
}
