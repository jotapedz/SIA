import type { CategoriaAcessibilidade, CategorySelection } from "../types/api";

export const cadastroSections = {
  DEMANDAS_EDUCACIONAIS: "Demandas educacionais",
  BARREIRAS_FISICAS: "Barreiras físicas",
  BARREIRAS_COMUNICACIONAIS: "Barreiras comunicacionais",
  BARREIRAS_PEDAGOGICAS: "Barreiras pedagógicas",
  BARREIRAS_ATITUDINAIS: "Barreiras atitudinais",
  ACOMODACOES_RECURSOS: "Acomodações e recursos",
};
export type CadastroSection = keyof typeof cadastroSections;
export const cadastroSteps: { label: string; sections: CadastroSection[] }[] = [
  { label: "Demandas educacionais", sections: ["DEMANDAS_EDUCACIONAIS"] },
  { label: "Barreiras", sections: ["BARREIRAS_FISICAS", "BARREIRAS_COMUNICACIONAIS", "BARREIRAS_PEDAGOGICAS", "BARREIRAS_ATITUDINAIS"] },
  { label: "Acomodações e recursos", sections: ["ACOMODACOES_RECURSOS"] },
];
export type CadastroSelections = Record<number, { checked: boolean; detail: string }>;

export function cadastroErrors(title: string, selections: CadastroSelections, catalog: CategoriaAcessibilidade[], step?: number) {
  const errors: Record<string, string> = {};
  if ((step === undefined || step === 0) && !title.trim()) errors.title = "Informe o título do relatório.";
  if (title.trim().length > 200) errors.title = "Use até 200 caracteres.";
  for (const item of catalog) {
    if (step !== undefined && !cadastroSteps[step].sections.includes(item.section as CadastroSection)) continue;
    const value = selections[item.id];
    if (!value?.checked || !item.requires_detail) continue;
    if (!value.detail.trim()) errors[String(item.id)] = "Preencha o campo Outro.";
    else if (value.detail.trim().length > 255) errors[String(item.id)] = "Use até 255 caracteres.";
  }
  return errors;
}

export function selectedCategories(selections: CadastroSelections, catalog: CategoriaAcessibilidade[]): CategorySelection[] {
  return catalog.filter((item) => selections[item.id]?.checked).map((item) => ({
    category_id: item.id, detail: item.requires_detail ? selections[item.id].detail.trim() || null : null,
  }));
}
