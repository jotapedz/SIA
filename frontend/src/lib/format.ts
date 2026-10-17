export function resourceId(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "Não informado";
  // Datas academicas nao devem mudar de dia ao aplicar o fuso horario local.
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? "Não informado" : date.toLocaleDateString("pt-BR");
}

export const reportStatusLabels: Record<string, string> = {
  ABERTO: "Aberto", EM_ATENDIMENTO: "Em atendimento", ENCAMINHADO: "Encaminhado",
  CONCLUIDO: "Concluído", CANCELADO: "Cancelado",
};
