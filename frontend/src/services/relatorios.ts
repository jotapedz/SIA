import type { CategoriaAcessibilidade, Relatorio, RelatorioCreate, RelatorioList } from "../types/api";
import { apiRequest } from "./api";

export const listRelatorios = (token: string, discenteId: number, page: number, signal?: AbortSignal) =>
  apiRequest<RelatorioList>(`/v1/discentes/${discenteId}/relatorios?page=${page}&page_size=6`, token, { signal });

export const getRelatorio = (token: string, id: number, signal?: AbortSignal) =>
  apiRequest<Relatorio>(`/v1/relatorios/${id}`, token, { signal });

export const createRelatorio = (token: string, discenteId: number, data: RelatorioCreate) =>
  apiRequest<Relatorio>(`/v1/discentes/${discenteId}/relatorios`, token, { method: "POST", body: JSON.stringify(data) });

export const listCategoriasCadastro = (token: string, signal?: AbortSignal) =>
  apiRequest<CategoriaAcessibilidade[]>("/v1/relatorios/categorias", token, { signal });
