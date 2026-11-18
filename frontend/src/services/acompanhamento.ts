import { apiDownload, apiRequest } from "./api";

export type Registro = { id: number; kind: "ATENDIMENTO" | "CONTRIBUICAO" | "ENCAMINHAMENTO" | "ACOMPANHAMENTO" | "OBSERVACAO"; occurred_on: string; description: string;
  report_id: number | null; author_name: string; created_at: string };
export type Termo = { id: number; acknowledged_on: string; file_name: string; author_name: string; created_at: string };
export type Page<T> = { items: T[]; total: number; page: number; page_size: number };
export const listRegistros = (token: string, id: number, page: number, signal: AbortSignal) =>
  apiRequest<Page<Registro>>(`/v1/discentes/${id}/atendimentos?page=${page}`, token, { signal });
export const createRegistro = (token: string, id: number, data: Pick<Registro, "kind" | "occurred_on" | "description" | "report_id">) =>
  apiRequest<Registro>(`/v1/discentes/${id}/atendimentos`, token, { method: "POST", body: JSON.stringify(data) });
export const listTermos = (token: string, id: number, page: number, signal: AbortSignal) =>
  apiRequest<Page<Termo>>(`/v1/discentes/${id}/termos?page=${page}`, token, { signal });
export const createTermo = (token: string, id: number, data: { acknowledged_on: string; file_name: string; document_base64: string }) =>
  apiRequest<Termo>(`/v1/discentes/${id}/termos`, token, { method: "POST", body: JSON.stringify(data) });
export const downloadTermo = (token: string, id: number, termoId: number) =>
  apiDownload(`/v1/discentes/${id}/termos/${termoId}/documento`, token);
