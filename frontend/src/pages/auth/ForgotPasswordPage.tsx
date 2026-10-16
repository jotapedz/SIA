import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { FormError } from "../../components/ui/FormError";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = /^\S+@\S+\.\S+$/.test(email.trim()) && !isSubmitting;
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) throw error;
      navigate("/esqueci-senha/enviado", { state: { email: email.trim() } });
    } catch {
      setErrorMessage("Não foi possível enviar o e-mail agora. Tente novamente.");
    } finally { setIsSubmitting(false); }
  }
  return <main id="main-content" className="page-main">
    <section className="dialog-card recovery-card" aria-labelledby="forgot-password-title">
      <h1 id="forgot-password-title">Esqueceu a senha?</h1>
      <p className="dialog-description">Informe seu e-mail cadastrado no sistema para enviarmos as instruções de redefinição de senha.</p>
      {errorMessage && <FormError title="Não foi possível enviar o e-mail">{errorMessage}</FormError>}
      <form noValidate onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <label htmlFor="recovery-email">E-mail</label>
        <input id="recovery-email" type="email" autoComplete="email" placeholder="Digite seu e-mail" value={email}
          disabled={isSubmitting} onChange={(event) => { setEmail(event.target.value); setErrorMessage(""); }} />
        <div className="dialog-actions">
          <button className="text-button" type="button" disabled={isSubmitting} onClick={() => navigate("/")}>Cancelar</button>
          <button className="primary-button" type="submit" disabled={!canSubmit}>{isSubmitting ? "Enviando..." : "Enviar"}</button>
        </div>
      </form>
      <p className="help-text">Não tem uma conta? Entre em contato com a secretaria</p>
    </section>
  </main>;
}
