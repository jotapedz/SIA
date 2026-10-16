import type { Discente, DiscenteCreate, DiscenteFilters, DiscenteList } from "../types/api";
import { apiRequest } from "./api";

export function listDiscentes(token: string, filters: DiscenteFilters, page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), page_size: "12" });
  for (const [key, value] of Object.entries(filters)) {
    if (value.trim()) params.set(key, value.trim());
  }
  return apiRequest<DiscenteList>(`/v1/discentes?${params}`, token, { signal });
}

export const createDiscente = (token: string, data: DiscenteCreate) =>
  apiRequest<Discente>("/v1/discentes", token, { method: "POST", body: JSON.stringify(data) });
