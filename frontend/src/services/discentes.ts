import type { Discente, DiscenteCreate, DiscenteFilters, DiscenteList, DiscenteUpdate } from "../types/api";
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

export const getDiscente = (token: string, id: number, signal?: AbortSignal) =>
  apiRequest<Discente>(`/v1/discentes/${id}`, token, { signal });

export const updateDiscente = (token: string, id: number, data: DiscenteUpdate) =>
  apiRequest<Discente>(`/v1/discentes/${id}`, token, { method: "PATCH", body: JSON.stringify(data) });
