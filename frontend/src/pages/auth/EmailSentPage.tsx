import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { FormError } from "../../components/ui/FormError";

export function EmailSentPage() {
  const { state } = useLocation();
  const email = typeof state?.email === "string" ? state.email : "";
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  async function handleResend() {
    if (!email || isResending) return;
    setIsResending(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/redefinir-senha` });
      if (error) throw error;
    } catch { setErrorMessage("Não foi possível reenviar o e-mail agora. Tente novamente."); }
    finally { setIsResending(false); }
  }
  return <main id="main-content" className="page-main">
    <section className="dialog-card success-card" aria-labelledby="email-sent-title">
      <h1 id="email-sent-title">E-mail enviado com sucesso</h1>
      <p className="dialog-description">Cheque a sua caixa de e-mail para redefinir sua senha de acesso. Caso o e-mail não tenha sido enviado, clique em reenviar.</p>
      {errorMessage && <FormError title="Não foi possível reenviar o e-mail">{errorMessage}</FormError>}
      {!email && <p className="help-text">Para reenviar, <Link to="/esqueci-senha">informe novamente seu e-mail</Link>.</p>}
      <div className="dialog-actions">
        <Link className="text-button auth-action-link" to="/">Cancelar</Link>
        <button className="primary-button" type="button" onClick={() => void handleResend()} disabled={isResending || !email}>{isResending ? "Enviando..." : "Reenviar"}</button>
      </div>
    </section>
  </main>;
}
