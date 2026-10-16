import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { FormError } from "../../components/ui/FormError";
import { LoadingPage } from "../../components/ui/LoadingPage";

export function LoginPage() {
  const { signIn, status, error: sessionError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = /^\S+@\S+\.\S+$/.test(email.trim()) && password.length > 0 && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await signIn(email, password);
      navigate("/discentes", { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "authenticated") return <Navigate to="/discentes" replace />;
  if (status === "loading" && !isSubmitting) return <LoadingPage />;
  return <main id="main-content" className="page-main">
    <section className="dialog-card login-card" aria-labelledby="login-title">
      <h1 id="login-title">Bem-vindo(a)</h1><h2>Login</h2>
      {(errorMessage || sessionError) && <FormError title="Não foi possível entrar">{errorMessage || sessionError}</FormError>}
      <form noValidate onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" autoComplete="email" placeholder="Digite seu e-mail" value={email}
          disabled={isSubmitting} onChange={(event) => { setEmail(event.target.value); setErrorMessage(""); }} />
        <label htmlFor="password">Senha</label>
        <input id="password" type="password" autoComplete="current-password" placeholder="Digite sua senha" value={password}
          disabled={isSubmitting} onChange={(event) => { setPassword(event.target.value); setErrorMessage(""); }} />
        <Link className="forgot-password" to="/esqueci-senha">Esqueci minha senha</Link>
        <button className="submit-button" type="submit" disabled={!canSubmit}>{isSubmitting ? "Entrando..." : "Entrar"}</button>
      </form>
      <p className="help-text">Não tem uma conta? Entre em contato com a secretaria</p>
    </section>
  </main>;
}
