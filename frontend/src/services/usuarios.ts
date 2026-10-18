import type { Usuario, UsuarioCreate, UsuarioFilters, UsuarioList } from "../types/api";
import { apiRequest } from "./api";

export function listUsuarios(token: string, filters: UsuarioFilters, page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), page_size: "9" });
  for (const [key, value] of Object.entries(filters)) if (value.trim()) params.set(key, value.trim());
  return apiRequest<UsuarioList>(`/v1/usuarios?${params}`, token, { signal });
}
export const getUsuario = (token: string, id: number, signal?: AbortSignal) =>
  apiRequest<Usuario>(`/v1/usuarios/${id}`, token, { signal });

export const createUsuario = (token: string, data: UsuarioCreate) =>
  apiRequest<Usuario>("/v1/usuarios", token, { method: "POST", body: JSON.stringify(data) });
