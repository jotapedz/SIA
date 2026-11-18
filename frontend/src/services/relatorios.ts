import type { CategoriaAcessibilidade, Relatorio, RelatorioCreate, RelatorioList, RelatorioUpdate } from "../types/api";
import { apiRequest } from "./api";

export type RelatorioFilters = { q: string; report_type: string; status: string; opened_from: string; opened_to: string };

export const listRelatorios = (token: string, discenteId: number, page: number, signal?: AbortSignal, filters?: RelatorioFilters) => {
  const params = new URLSearchParams({ page: String(page), page_size: "6" });
  if (filters) Object.entries(filters).forEach(([key, value]) => { if (value.trim()) params.set(key, value.trim()); });
  return apiRequest<RelatorioList>(`/v1/discentes/${discenteId}/relatorios?${params}`, token, { signal });
};

export const getRelatorio = (token: string, id: number, signal?: AbortSignal) =>
  apiRequest<Relatorio>(`/v1/relatorios/${id}`, token, { signal });

export const createRelatorio = (token: string, discenteId: number, data: RelatorioCreate) =>
  apiRequest<Relatorio>(`/v1/discentes/${discenteId}/relatorios`, token, { method: "POST", body: JSON.stringify(data) });

export const listCategoriasCadastro = (token: string, signal?: AbortSignal) =>
  apiRequest<CategoriaAcessibilidade[]>("/v1/relatorios/categorias", token, { signal });

export const updateRelatorio = (token: string, id: number, data: RelatorioUpdate) =>
  apiRequest<Relatorio>(`/v1/relatorios/${id}`, token, { method: "PUT", body: JSON.stringify(data) });

export const cancelRelatorio = (token: string, id: number, expectedUpdatedAt: string) =>
  apiRequest<Relatorio>(`/v1/relatorios/${id}/cancelamento`, token, {
    method: "POST", body: JSON.stringify({ expected_updated_at: expectedUpdatedAt }),
  });
