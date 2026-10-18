import type { UsuarioCreate, UsuarioRole, UsuarioStatus } from "../types/api";

export const usuarioRoleLabels: Record<UsuarioRole, string> = {
  AGENTE_ACESSIBILIDADE: "Agente de acessibilidade",
  COORDENACAO_ACESSIBILIDADE: "Coordenação de acessibilidade",
};
export const usuarioStatusLabels: Record<UsuarioStatus, string> = { ATIVO: "Ativo", INATIVO: "Inativo" };
export function usuarioRoleLabel(role: string): string {
  return Object.prototype.hasOwnProperty.call(usuarioRoleLabels, role) ? usuarioRoleLabels[role as UsuarioRole] : role;
}
export type UsuarioFormErrors = Partial<Record<keyof UsuarioCreate, string>>;
export const emptyUsuarioForm: UsuarioCreate = {
  full_name: "", email: "", password: "", role: "AGENTE_ACESSIBILIDADE", status: "ATIVO",
};

export function validateUsuario(values: UsuarioCreate): UsuarioFormErrors {
  const errors: UsuarioFormErrors = {};
  if (!values.full_name.trim()) errors.full_name = "Informe o nome.";
  else if (values.full_name.trim().length > 150) errors.full_name = "Use até 150 caracteres.";
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim()) || values.email.trim().length > 180) errors.email = "Informe um e-mail válido com até 180 caracteres.";
  if ([...values.password].length < 6) errors.password = "A senha deve ter ao menos 6 caracteres.";
  else if (new TextEncoder().encode(values.password).length > 72) errors.password = "A senha deve ter no máximo 72 bytes em UTF-8.";
  if (!Object.prototype.hasOwnProperty.call(usuarioRoleLabels, values.role)) errors.role = "Selecione um perfil válido.";
  if (!Object.prototype.hasOwnProperty.call(usuarioStatusLabels, values.status)) errors.status = "Selecione um status válido.";
  return errors;
}
