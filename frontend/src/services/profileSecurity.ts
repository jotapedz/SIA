type PasswordAuth = {
  updateUser: (attributes: { password: string; nonce?: string }) => Promise<{ error: { code?: string } | null }>;
};

export function emailUpdateErrorMessage(error: { code?: string }): string {
  switch (error.code) {
    case "email_exists":
    case "user_already_exists":
      return "Este e-mail já está em uso.";
    case "email_address_invalid":
      return "O serviço recusou um dos endereços de e-mail. Confira o endereço atual e o novo endereço.";
    case "email_address_not_authorized":
      return "O envio de confirmação não está autorizado para um dos endereços. Entre em contato com a equipe responsável pelo sistema.";
    case "over_email_send_rate_limit":
      return "O limite de envio de e-mails foi atingido. Aguarde antes de tentar novamente.";
    case "over_request_rate_limit":
      return "Muitas solicitações foram realizadas. Aguarde alguns minutos antes de tentar novamente.";
    case "session_expired":
    case "session_not_found":
    case "bad_jwt":
      return "Sua sessão não é mais válida. Entre novamente no sistema para alterar seu e-mail.";
    case "request_timeout":
      return "O serviço demorou para responder. Confira se recebeu as mensagens de confirmação antes de repetir a solicitação.";
    default:
      return "Não foi possível solicitar a troca de e-mail. Entre em contato com a equipe responsável pelo sistema para verificar a falha.";
  }
}

export class PasswordUpdateError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = "PasswordUpdateError"; }
}

export function validateNewPassword(password: string, confirmation: string): string {
  if ([...password].length < 6) return "A senha deve ter ao menos 6 caracteres.";
  if (new TextEncoder().encode(password).length > 72) return "A senha deve ter no máximo 72 bytes em UTF-8.";
  if (password !== confirmation) return "As senhas devem ser iguais.";
  return "";
}

export async function redefinePassword(auth: PasswordAuth, password: string, confirmation: string, nonce = "") {
  const validation = validateNewPassword(password, confirmation);
  if (validation) throw new PasswordUpdateError("validation", validation);
  const { error } = await auth.updateUser({ password, ...(nonce.trim() ? { nonce: nonce.trim() } : {}) });
  if (!error) return;
  if (error.code === "same_password") throw new PasswordUpdateError(error.code, "A nova senha deve ser diferente da senha atual.");
  if (error.code === "reauthentication_needed" || error.code === "reauthentication_not_valid") {
    throw new PasswordUpdateError(error.code, "Confirme sua identidade: solicite um código e informe o código recebido por e-mail.");
  }
  throw new PasswordUpdateError(error.code || "unknown", "Não foi possível redefinir a senha. Verifique a política de senha e tente novamente.");
}
