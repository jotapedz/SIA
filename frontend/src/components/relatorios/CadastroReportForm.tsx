import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useApiResource } from "../../hooks/useApiResource";
import { useRelatorioSubmit } from "../../hooks/useRelatorioSubmit";
import { listCategoriasCadastro } from "../../services/relatorios";
import { ApiError } from "../../services/api";
import { cadastroErrors, cadastroSections, cadastroSteps, fromReportCategories, selectedCategories } from "../../lib/cadastroForm";
import type { CadastroSection, CadastroSelections } from "../../lib/cadastroForm";
import type { CategoriaAcessibilidade, Relatorio, RelatorioCreate } from "../../types/api";
import { Field } from "../ui/Field";
import { Button } from "../ui/Button";
import { FormError } from "../ui/FormError";
import { ResourceMessage } from "../ui/ResourceMessage";
import { CancelRelatorioModal } from "./CancelRelatorioModal";
import { SaveRelatorioModal } from "./SaveRelatorioModal";
import styles from "./Relatorios.module.css";
import wizard from "./CadastroReport.module.css";

const loadCategories = (token: string, signal: AbortSignal) => listCategoriasCadastro(token, signal);

function CadastroWizard({ discenteId, catalog, report, onReload }: {
  discenteId: number; catalog: CategoriaAcessibilidade[]; report?: Relatorio; onReload?: () => void;
}) {
  const navigate = useNavigate();
  const { submit: save, submitting, message, clearFailure, blocked } = useRelatorioSubmit(discenteId, report);
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(report?.title ?? "");
  const [selections, setSelections] = useState<CadastroSelections>(() => report ? fromReportCategories(report.categories) : {});
  const initial = useRef({ title: title.trim(), report_type: "CADASTRO", categories: selectedCategories(selections, catalog) }).current;
  const payload: RelatorioCreate = { title: title.trim(), report_type: "CADASTRO", categories: selectedCategories(selections, catalog) };
  const changed = JSON.stringify(initial) !== JSON.stringify(payload);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const panel = useRef<HTMLFieldSetElement>(null);
  const previousStep = useRef(step);
  const activeIds = new Set(catalog.filter((item) => cadastroSteps[step].sections.includes(item.section as CadastroSection)).map((item) => String(item.id)));
  const activeServerErrors = Object.fromEntries(Object.entries(serverErrors).filter(([key, value]) =>
    !!value && (key === "title" ? step === 0 : activeIds.has(key))));
  const errors = { ...cadastroErrors(title, selections, catalog, step), ...activeServerErrors };
  const stepValid = !Object.values(errors).some(Boolean);
  const allValid = !Object.keys(cadastroErrors(title, selections, catalog)).length && !Object.values(serverErrors).some(Boolean);

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    panel.current?.focus();
    panel.current?.scrollIntoView({ block: "start" });
  }, [step]);
  useEffect(() => {
    if (submitting) return;
    const key = Object.entries(serverErrors).find(([key, error]) => !!error &&
      document.getElementById(key === "title" ? "cadastro-title" : `cadastro-other-${key}`))?.[0];
    if (key) document.getElementById(key === "title" ? "cadastro-title" : `cadastro-other-${key}`)?.focus();
  }, [serverErrors, submitting, step]);

  function updateSelection(id: number, change: Partial<CadastroSelections[number]>) {
    setSelections((current) => ({ ...current, [id]: { ...(current[id] ?? { checked: false, detail: "" }), ...change } }));
    setServerErrors((current) => ({ ...current, [String(id)]: "" }));
    clearFailure();
  }
  function categoryGroup(section: CadastroSection) {
    const items = catalog.filter((item) => item.section === section);
    const label = cadastroSections[section];
    return <fieldset className={`${wizard.choiceGroup} ${step === 2 ? wizard.smallChoices : ""}`} key={section}>
      <legend className={step === 2 ? "sr-only" : undefined}>{label}</legend>
      {items.map((item) => {
        const value = selections[item.id] ?? { checked: false, detail: "" };
        const key = String(item.id);
        const error = serverErrors[key] || (touched[key] ? errors[key] : undefined);
        return <div key={item.id} className={wizard.choice}>
          <div className={wizard.choiceRow}>
            <label htmlFor={`cadastro-option-${item.id}`}>
              <input id={`cadastro-option-${item.id}`} type="checkbox" checked={value.checked}
                onChange={(event) => updateSelection(item.id, { checked: event.target.checked })} />
              <span>{item.name}{item.requires_detail ? ":" : ""}</span>
            </label>
            {item.requires_detail && <input className={wizard.other} id={`cadastro-other-${item.id}`}
              aria-label={`Outro: ${label}`} aria-invalid={!!error} aria-describedby={error ? `cadastro-error-${item.id}` : undefined}
              disabled={!value.checked || submitting} required={value.checked} maxLength={255} value={value.detail}
              onChange={(event) => updateSelection(item.id, { detail: event.target.value })}
              onBlur={() => setTouched((current) => ({ ...current, [key]: true }))} />}
          </div>
          {error && <span className={wizard.error} id={`cadastro-error-${item.id}`}>{error}</span>}
        </div>;
      })}
    </fieldset>;
  }

  async function persist() {
    if (submitting || blocked || !allValid || (report && !changed)) return;
    setServerErrors({});
    const error = await save(payload);
    if (error) setConfirmSave(false);
    if (error instanceof ApiError) {
      const next: Record<string, string> = {};
      let targetStep = 2;
      for (const issue of error.issues) {
        const location = issue.loc.filter((part) => part !== "body");
        if (location[0] === "title") { next.title = "Verifique o título do relatório."; targetStep = 0; }
        if (location[0] === "categories" && typeof location[1] === "number") {
          const selected = payload.categories?.[location[1]];
          if (selected) {
            next[String(selected.category_id)] = "Verifique os dados desta opção.";
            const section = catalog.find((item) => item.id === selected.category_id)?.section;
            const index = cadastroSteps.findIndex((item) => item.sections.includes(section as CadastroSection));
            if (index >= 0) targetStep = Math.min(targetStep, index);
          }
        }
      }
      setServerErrors(next);
      if (Object.keys(next).length) setStep(targetStep);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || blocked || !stepValid) return;
    if (step < 2) { setStep(step + 1); return; }
    if (!allValid || (report && !changed) || !event.currentTarget.reportValidity()) return;
    if (report) setConfirmSave(true);
    else void persist();
  }

  return <><form className={`${styles.form} ${wizard.wizard}`} onSubmit={submit} noValidate aria-busy={submitting}>
    <ol className={wizard.steps} aria-label="Etapas do relatório de Cadastro">
      {cadastroSteps.map((item, index) => <li key={item.label} aria-current={index === step ? "step" : undefined}>
        {index < step ? <img src="/assets/step-complete.svg" alt="Concluída" />
          : <span className={`${wizard.number} ${index === step ? wizard.current : ""}`}>{index + 1}</span>}
        <span>{item.label}</span>
      </li>)}
    </ol>
    {message && <FormError title="Não foi possível salvar o relatório">{message}</FormError>}
    {blocked && onReload && <Button variant="text" onClick={onReload}>Recarregar relatório</Button>}
    <fieldset ref={panel} tabIndex={-1} className={wizard.stepPanel} data-step={step} disabled={submitting} aria-label={cadastroSteps[step].label}>
      {step === 0 && <div className={wizard.titleField}>
        <Field id="cadastro-title" label="Título" placeholder="Digite o título do relatório" required maxLength={200} value={title}
          error={serverErrors.title || (touched.title ? errors.title : undefined)}
          onChange={(event) => { setTitle(event.target.value); setServerErrors((current) => ({ ...current, title: "" })); clearFailure(); }}
          onBlur={() => setTouched((current) => ({ ...current, title: true }))} />
      </div>}
      {cadastroSteps[step].sections.map(categoryGroup)}
    </fieldset>
    <div className={styles.formActions}>
      <Button variant="text" disabled={submitting} onClick={() => setConfirmCancel(true)}>Cancelar</Button>
      {step > 0 && <Button variant="outline" disabled={submitting} onClick={() => setStep(step - 1)}>Voltar</Button>}
      {step < 2 ? <Button disabled={submitting || !stepValid} onClick={() => setStep(step + 1)}>Próximo</Button>
        : <Button type="submit" disabled={submitting || blocked || !allValid || (!!report && !changed)}>{submitting ? "Salvando..." : report ? "Salvar" : "Adicionar"}</Button>}
    </div>
  </form>
    {confirmCancel && <CancelRelatorioModal onBack={() => setConfirmCancel(false)} onConfirm={() => navigate(report ? `/relatorios/${report.id}` : `/discentes/${discenteId}`)} />}
    {confirmSave && <SaveRelatorioModal busy={submitting} onBack={() => setConfirmSave(false)} onConfirm={() => void persist()} />}
  </>;
}

export function CadastroReportForm({ discenteId, report, onReload }: { discenteId: number; report?: Relatorio; onReload?: () => void }) {
  const { data, loading, error, status, reload } = useApiResource(loadCategories);
  const catalog = useMemo(() => {
    const items = new Map((data ?? []).map((item) => [item.id, item]));
    for (const item of report?.categories ?? []) if (!items.has(item.id)) items.set(item.id, item);
    return [...items.values()].sort((a, b) => a.order - b.order || a.id - b.id);
  }, [data, report]);
  const complete = data && (!!report || Object.keys(cadastroSections).every((section) => catalog.some((item) => item.section === section)));
  if (loading || error || !complete) return <ResourceMessage loading={loading}
    error={error || "As opções do relatório de Cadastro ainda não estão disponíveis."} notFound={status === 404} onRetry={reload} />;
  return <CadastroWizard key={report?.id ?? "new"} discenteId={discenteId} catalog={catalog} report={report} onReload={onReload} />;
}
