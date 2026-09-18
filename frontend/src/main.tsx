import { FormEvent, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import "./styles.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function Header() {
  return (
    <header className="site-header">
      <img src="/assets/sia-logo-figma.svg" alt="SIA" />
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <img className="footer-logo" src="/assets/sia-logo-figma.svg" alt="Sistema de Inclusao e Acessibilidade" />
      <address>
        <p><img src="/assets/location.svg" alt="" /> Campus do Pici | Bloco 1430 | CEP 60.440-554 | Fortaleza - CE</p>
        <p><img src="/assets/call.svg" alt="" /> Telefone: +55 (85) 3366-9029</p>
      </address>
    </footer>
  );
}

type LoginPageProps = {
  onAuthenticated: (session: Session) => Promise<boolean>;
};

function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hasCredentialError, setHasCredentialError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEmailValid = /^\S+@\S+\.\S+$/.test(email);
  const canSubmit = isEmailValid && password.length > 0 && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setHasCredentialError(false);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session && await onAuthenticated(data.session)) {
      navigate("/in-progress");
      return;
    }

    await supabase.auth.signOut();
    setIsSubmitting(false);
    setHasCredentialError(true);
  }

  return (
    <main className="login-main">
      <section className="login-card" aria-labelledby="login-title">
        <h1 id="login-title">Bem-vindo(a)</h1>
        <h2>Login</h2>
        {hasCredentialError && (
          <div className="login-error" role="alert">
            <strong>Dados incorretos</strong>
            <span>Certifique-se de que não há espaços extras no início ou no fim do e-mail e que as letras maiúsculas/minúsculas estão corretas.</span>
          </div>
        )}
        <form noValidate onSubmit={handleSubmit}>
          <label htmlFor="email">E-mail</label>
          <input
            className={hasCredentialError ? "invalid" : undefined}
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setHasCredentialError(false);
            }}
          />
          <label htmlFor="password">Senha</label>
          <input
            className={hasCredentialError ? "invalid" : undefined}
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setHasCredentialError(false);
            }}
          />
          <button className="forgot-password" type="button" disabled>Esqueci minha senha</button>
          <button className="submit-button" type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="help-text">Não tem uma conta? Entre em contato com a secretaria</p>
      </section>
    </main>
  );
}

function InProgressPage() {
  return (
    <main className="in-progress-main">
      <section className="in-progress-card" aria-labelledby="in-progress-title">
        <h1 id="in-progress-title">IN PROGRESS</h1>
      </section>
    </main>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  async function checkSession(nextSession: Session | null): Promise<boolean> {
    setSession(nextSession);
    if (!nextSession) {
      setIsAuthorized(false);
      return false;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/v1/me`, {
        headers: { Authorization: `Bearer ${nextSession.access_token}` },
      });
      const authorized = response.ok;
      setIsAuthorized(authorized);
      return authorized;
    } catch {
      setIsAuthorized(false);
      return false;
    }
  }

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => checkSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void checkSession(nextSession);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const isAuthenticated = session !== null && isAuthorized;
  const isInProgress = path === "/in-progress";

  useEffect(() => {
    if (isInProgress && !isAuthenticated) navigate("/");
  }, [isAuthenticated, isInProgress]);

  return (
    <div className="app-shell">
      <Header />
      {isInProgress && isAuthenticated ? <InProgressPage /> : <LoginPage onAuthenticated={checkSession} />}
      <Footer />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
