import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { FormError } from "../../components/ui/FormError";
import { LoadingPage } from "../../components/ui/LoadingPage";

export function ResetPasswordPage() {
  const { session, status, signOut } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasMismatch = confirmation.length > 0 && password !== confirmation;
  const canSubmit = password.length >= 6 && confirmation.length > 0 && !hasMismatch && !isSubmitting && !!session;
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await signOut();
      navigate("/redefinir-senha/sucesso", { replace: true });
    } catch {
      setErrorMessage("Não foi possível concluir a redefinição. Verifique se o link ainda é válido e tente novamente.");
    } finally { setIsSubmitting(false); }
  }
  async function cancel() {
    try { if (session) await signOut(); navigate("/", { replace: true }); }
    catch { setErrorMessage("Não foi possível encerrar a sessão de recuperação. Tente novamente."); }
  }
  if (status === "loading") return <LoadingPage message="Validando link de recuperação..." />;
  return <main id="main-content" className="page-main">
    <section className="dialog-card recovery-card" aria-labelledby="reset-password-title">
      <h1 id="reset-password-title">Redefina sua senha</h1>
      {!session && <FormError title="Link inválido ou expirado">Solicite um novo e-mail para redefinir sua senha.</FormError>}
      {(hasMismatch || errorMessage) && <FormError title={hasMismatch ? "Senhas incompatíveis" : "Não foi possível redefinir a senha"}>
        {hasMismatch ? "Certifique-se de que as senhas estão iguais." : errorMessage}
      </FormError>}
      <form noValidate onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <label htmlFor="new-password">Nova senha</label>
        <input id="new-password" type="password" autoComplete="new-password" placeholder="Digite sua nova senha" value={password}
          disabled={isSubmitting || !session} className={hasMismatch ? "invalid" : undefined}
          onChange={(event) => { setPassword(event.target.value); setErrorMessage(""); }} />
        <label htmlFor="new-password-confirmation">Repita a nova senha</label>
        <input id="new-password-confirmation" type="password" autoComplete="new-password" placeholder="Repita a sua nova senha" value={confirmation}
          disabled={isSubmitting || !session} className={hasMismatch ? "invalid" : undefined}
          onChange={(event) => { setConfirmation(event.target.value); setErrorMessage(""); }} />
        <div className="dialog-actions">
          <button className="text-button" type="button" disabled={isSubmitting} onClick={() => void cancel()}>Cancelar</button>
          <button className="primary-button" type="submit" disabled={!canSubmit}>{isSubmitting ? "Redefinindo..." : "Redefinir"}</button>
        </div>
      </form>
      {!session && <p className="help-text"><Link to="/esqueci-senha">Solicitar novo link</Link></p>}
    </section>
  </main>;
}
