import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { emailUpdateErrorMessage, redefinePassword, PasswordUpdateError, validateNewPassword } from "../../services/profileSecurity";
import { Breadcrumb } from "../../components/layout/Breadcrumb";
import { Field } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { FormError } from "../../components/ui/FormError";
import styles from "./ProfileResetPage.module.css";

export function ProfileResetPage({ kind }: { kind: "email" | "password" }) {
  const { profile, retry } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [nonce, setNonce] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const locked = useRef(false);
  const isPassword = kind === "password";
  const mismatch = !!confirmation && password !== confirmation;
  const canSubmit = !busy && (isPassword
    ? !validateNewPassword(password, confirmation) && (!needsCode || !!nonce.trim())
    : !!email.trim() && email.trim().toLowerCase() !== profile?.email.toLowerCase());
  function clearFeedback() { setError(""); setNotice(""); }
  function backToProfile() { navigate("/discentes", { state: { openProfile: true } }); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || locked.current || !event.currentTarget.reportValidity()) return;
    locked.current = true; setBusy(true); clearFeedback();
    try {
      if (isPassword) {
        await redefinePassword(supabase.auth, password, confirmation, nonce);
        setPassword(""); setConfirmation(""); setNonce(""); setNeedsCode(false);
        setNotice("Senha redefinida com sucesso.");
      } else {
        const { error } = await supabase.auth.updateUser({ email: email.trim().toLowerCase() },
          { emailRedirectTo: `${window.location.origin}/perfil` });
        if (error) throw new Error(emailUpdateErrorMessage(error));
        setEmail("");
        setNotice("Solicitação enviada. Acesse seu novo e-mail e clique no link de confirmação para concluir a alteração. Até confirmar, continue entrando com o e-mail atual.");
      }
      await retry();
    } catch (reason) {
      if (reason instanceof PasswordUpdateError && ["reauthentication_needed", "reauthentication_not_valid"].includes(reason.code)) setNeedsCode(true);
      setError(reason instanceof Error ? reason.message : "Não foi possível concluir a alteração.");
    } finally { locked.current = false; setBusy(false); }
  }
  async function sendCode() {
    if (locked.current) return;
    locked.current = true; setBusy(true); clearFeedback();
    try {
      const { error } = await supabase.auth.reauthenticate();
      if (error) throw error;
      setNotice("Código de confirmação enviado. Confira seu e-mail.");
    } catch { setError("Não foi possível enviar o código. Tente novamente em instantes."); }
    finally { locked.current = false; setBusy(false); }
  }
  return <main id="main-content" className={styles.main}>
    <Breadcrumb items={[{ label: "Perfil", to: "/perfil" }, { label: isPassword ? "Redefinir senha" : "Redefinir e-mail" }]} />
    <div className={styles.stage}>
      <section className={styles.card} aria-labelledby="profile-reset-title">
        <h1 id="profile-reset-title">{isPassword ? "Redefina sua senha" : "Redefina seu e-mail"}</h1>
        {notice && <p className={styles.success} role="status">{notice}</p>}
        {error && <FormError title="Não foi possível redefinir">{error}</FormError>}
        <form onSubmit={(event) => void submit(event)} aria-busy={busy}>
          <fieldset disabled={busy}>
            {isPassword ? <>
              <Field id="profile-password" label="Nova senha" type="password" autoComplete="new-password" required minLength={6} maxLength={72}
                placeholder="Digite sua nova senha" value={password} onChange={(event) => { setPassword(event.target.value); clearFeedback(); }} />
              <Field id="profile-confirmation" label="Repita a nova senha" type="password" autoComplete="new-password" required maxLength={72}
                placeholder="Repita sua nova senha" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); clearFeedback(); }}
                error={mismatch ? "As senhas devem ser iguais." : undefined} />
              {needsCode && <><Button variant="outline" onClick={() => void sendCode()}>Enviar código por e-mail</Button>
                <Field id="profile-nonce" label="Código de confirmação" autoComplete="one-time-code" value={nonce} required onChange={(event) => setNonce(event.target.value)} /></>}
            </> : <Field id="profile-email" label="Novo e-mail" type="email" autoComplete="email" required maxLength={180}
              placeholder="Digite seu novo e-mail" value={email} onChange={(event) => { setEmail(event.target.value); clearFeedback(); }}
              hint="Você receberá um link de confirmação no novo e-mail para concluir a alteração." />}
          </fieldset>
          <div className={styles.actions}>
            <Button variant="text" disabled={busy} onClick={backToProfile}>Cancelar</Button>
            <Button type="submit" disabled={!canSubmit}>{busy ? "Redefinindo..." : "Redefinir"}</Button>
          </div>
        </form>
      </section>
    </div>
  </main>;
}
