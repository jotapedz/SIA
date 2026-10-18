import type { Relatorio, RelatorioCreate, ReportType } from "../types/api";

export type ReportFieldKey = "description" | "activity" | "ongoing_follow_up" | "notes" | "adopted_strategy" | "observed_result";
export type RelatorioFormValues = { title: string } & Record<ReportFieldKey, string>;
export type RelatorioErrors = Partial<Record<keyof RelatorioFormValues, string>>;
export const reportLimits: Record<keyof RelatorioFormValues, number> = {
  title: 200, description: 20000, activity: 5000, ongoing_follow_up: 20000, notes: 5000,
  adopted_strategy: 20000, observed_result: 20000,
};

type ReportField = { key: ReportFieldKey; label: string; placeholder: string; required?: boolean };
type ReportDefinition = { label: string; badge: string; slug: string; actionLabel: string; icon: string; fields: ReportField[] };

export const reportDefinitions: Record<ReportType, ReportDefinition> = {
  CADASTRO: { label: "Cadastro", badge: "Cadastro", slug: "cadastro", actionLabel: "Adicionar relatório de cadastro", icon: "/assets/add.svg", fields: [] },
  ACOMPANHAMENTO: { label: "Acompanhamento", badge: "Acompanhamento", slug: "acompanhamento", actionLabel: "Adicionar relatório de acompanhamento", icon: "/assets/report-acompanhamento.svg", fields: [
    { key: "activity", label: "Atividade/Disciplina", placeholder: "Digite a atividade ou disciplina" },
    { key: "description", label: "Descrição da demanda", placeholder: "Digite a descrição da demanda", required: true },
    { key: "ongoing_follow_up", label: "Acompanhamento continuado", placeholder: "Digite o acompanhamento continuado" },
    { key: "notes", label: "Observação", placeholder: "Digite uma observação" },
  ] },
  ACOES_SUCESSO: { label: "Ações de sucesso", badge: "Sucesso", slug: "acoes-de-sucesso", actionLabel: "Adicionar relatório de ações de sucesso", icon: "/assets/report-sucesso.svg", fields: [
    { key: "description", label: "Situação/ Demanda", placeholder: "Digite a situação/demanda", required: true },
    { key: "adopted_strategy", label: "Ação/ estratégia adotada", placeholder: "Digite a ação/estratégia adotada", required: true },
    { key: "observed_result", label: "Resultado observado", placeholder: "Digite o resultado observado", required: true },
    { key: "notes", label: "Observação", placeholder: "Digite uma observação" },
  ] },
  RECURSOS_ACESSIBILIDADE: { label: "Recursos de acessibilidade", badge: "Recursos de acessibilidade", slug: "recursos-de-acessibilidade", actionLabel: "Adicionar relatório de recursos de acessibilidade", icon: "/assets/report-recursos.svg", fields: [
    { key: "description", label: "Recurso de acessibilidade", placeholder: "Digite o recurso de acessibilidade", required: true },
    { key: "notes", label: "Observação", placeholder: "Digite a observação" },
  ] },
  BARREIRAS: { label: "Barreiras", badge: "Barreiras", slug: "barreiras", actionLabel: "Adicionar relatório de barreiras", icon: "/assets/report-barreiras.svg", fields: [
    { key: "description", label: "Dificuldade/Barreira", placeholder: "Digite a dificuldade/barreira", required: true },
    { key: "notes", label: "Observação", placeholder: "Digite a observação" },
  ] },
  OBSERVACOES: { label: "Observações", badge: "Observações", slug: "observacoes", actionLabel: "Adicionar relatório de observações", icon: "/assets/report-observacoes.svg", fields: [
    { key: "notes", label: "Observação", placeholder: "Digite a observação", required: true },
  ] },
};

export const reportTypes = Object.keys(reportDefinitions) as ReportType[];
export function reportTypeFromSlug(slug: string | undefined): ReportType | null {
  return reportTypes.find((type) => reportDefinitions[type].slug === slug) ?? null;
}
export function reportDefinition(type: string | null) {
  return type && Object.prototype.hasOwnProperty.call(reportDefinitions, type) ? reportDefinitions[type as ReportType] : null;
}

export const emptyRelatorioForm: RelatorioFormValues = {
  title: "", description: "", activity: "", ongoing_follow_up: "", notes: "", adopted_strategy: "", observed_result: "",
};

export function fromRelatorio(report: Relatorio): RelatorioFormValues {
  return {
    title: report.title, description: report.description, activity: report.activity ?? "",
    ongoing_follow_up: report.ongoing_follow_up ?? "",
    notes: report.notes ?? (report.report_type === "OBSERVACOES" ? report.description : ""),
    adopted_strategy: report.adopted_strategy ?? "", observed_result: report.observed_result ?? "",
  };
}

export function validateRelatorio(values: RelatorioFormValues, type: ReportType = "ACOMPANHAMENTO"): RelatorioErrors {
  const errors: RelatorioErrors = {};
  if (!values.title.trim()) errors.title = "Informe o título do relatório.";
  if (values.title.trim().length > reportLimits.title) errors.title = "Use até 200 caracteres.";
  for (const field of reportDefinitions[type].fields) {
    if (field.required && !values[field.key].trim()) errors[field.key] = "Preencha este campo.";
    else if (values[field.key].trim().length > reportLimits[field.key]) errors[field.key] = `Use até ${reportLimits[field.key]} caracteres.`;
  }
  return errors;
}

export function toRelatorioPayload(values: RelatorioFormValues, type: ReportType = "ACOMPANHAMENTO"): RelatorioCreate {
  const payload: RelatorioCreate = { title: values.title.trim(), report_type: type };
  for (const field of reportDefinitions[type].fields) payload[field.key] = values[field.key].trim() || null;
  return payload;
}
