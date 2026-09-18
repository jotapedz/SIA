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

function Breadcrumb({ items }: { items: string[] }) {
  return (
    <nav className="breadcrumb" aria-label="Navegação estrutural">
      {items.map((item, index) => (
        <span className="breadcrumb-item" key={item}>
          {index > 0 && <span className="breadcrumb-separator" aria-hidden="true">›</span>}
          {index === 0 ? <button type="button" onClick={() => navigate("/")}>{item}</button> : <span>{item}</span>}
        </span>
      ))}
    </nav>
  );
}

function FormError({ title, children }: { title: string; children: string }) {
  return (
    <div className="form-error" role="alert">
      <strong>{title}</strong>
      <span>{children}</span>
    </div>
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
    <main className="page-main">
      <section className="dialog-card login-card" aria-labelledby="login-title">
        <h1 id="login-title">Bem-vindo(a)</h1>
        <h2>Login</h2>
        {hasCredentialError && (
          <FormError title="Dados incorretos">
            Certifique-se de que não há espaços extras no início ou no fim do e-mail e que as letras maiúsculas/minúsculas estão corretas.
          </FormError>
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
          <button className="forgot-password" type="button" onClick={() => navigate("/esqueci-senha")}>Esqueci minha senha</button>
          <button className="submit-button" type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="help-text">Não tem uma conta? Entre em contato com a secretaria</p>
      </section>
    </main>
  );
}

function ForgotPasswordPage({ onSent }: { onSent: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = /^\S+@\S+\.\S+$/.test(email) && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage("");
    const normalizedEmail = email.trim();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    if (error) {
      setErrorMessage("Não foi possível enviar o e-mail agora. Tente novamente.");
      setIsSubmitting(false);
      return;
    }

    onSent(normalizedEmail);
    navigate("/esqueci-senha/enviado");
  }

  return (
    <main className="page-main">
      <section className="dialog-card recovery-card" aria-labelledby="forgot-password-title">
        <h1 id="forgot-password-title">Esqueceu a senha?</h1>
        <p className="dialog-description">Informe seu e-mail cadastrado no sistema para enviarmos as instruções de redefinição de senha.</p>
        {errorMessage && <FormError title="Não foi possível enviar o e-mail">{errorMessage}</FormError>}
        <form noValidate onSubmit={handleSubmit}>
          <label htmlFor="recovery-email">E-mail</label>
          <input
            id="recovery-email"
            type="email"
            autoComplete="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrorMessage("");
            }}
          />
          <div className="dialog-actions">
            <button className="text-button" type="button" onClick={() => navigate("/")}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={!canSubmit}>{isSubmitting ? "Enviando..." : "Enviar"}</button>
          </div>
        </form>
        <p className="help-text">Não tem uma conta? Entre em contato com a secretaria</p>
      </section>
    </main>
  );
}

function EmailSentPage({ email, onResend }: { email: string; onResend: () => Promise<void> }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  async function handleResend() {
    setIsResending(true);
    setErrorMessage("");
    try {
      await onResend();
    } catch {
      setErrorMessage("Não foi possível reenviar o e-mail agora. Tente novamente.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className="page-main">
      <section className="dialog-card success-card" aria-labelledby="email-sent-title">
        <h1 id="email-sent-title">E-mail enviado com sucesso</h1>
        <p className="dialog-description">Cheque a sua caixa de e-mail para redefinir sua senha de acesso. Caso o e-mail não tenha sido enviado, clique em reenviar.</p>
        {errorMessage && <FormError title="Não foi possível reenviar o e-mail">{errorMessage}</FormError>}
        <div className="dialog-actions">
          <button className="text-button" type="button" onClick={() => navigate("/")}>Cancelar</button>
          <button className="primary-button" type="button" onClick={() => void handleResend()} disabled={isResending || !email}>
            {isResending ? "Enviando..." : "Reenviar"}
          </button>
        </div>
      </section>
    </main>
  );
}

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordsMatch = password === passwordConfirmation;
  const canSubmit = password.length >= 6 && passwordConfirmation.length > 0 && passwordsMatch && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordsMatch) {
      setErrorMessage("Certifique-se de que as senhas estão iguais.");
      return;
    }
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage("");
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage("O link de recuperação expirou ou não é mais válido. Solicite um novo e-mail.");
      setIsSubmitting(false);
      return;
    }

    await supabase.auth.signOut();
    navigate("/redefinir-senha/sucesso");
  }

  const hasMismatch = passwordConfirmation.length > 0 && !passwordsMatch;

  return (
    <main className="page-main">
      <section className="dialog-card recovery-card" aria-labelledby="reset-password-title">
        <h1 id="reset-password-title">Redefina sua senha</h1>
        {(hasMismatch || errorMessage) && (
          <FormError title={hasMismatch ? "Senhas incompatíveis" : "Não foi possível redefinir a senha"}>
            {hasMismatch ? "Certifique-se de que as senhas estão iguais." : errorMessage}
          </FormError>
        )}
        <form noValidate onSubmit={handleSubmit}>
          <label htmlFor="new-password">Nova senha</label>
          <input
            className={hasMismatch ? "invalid" : undefined}
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="Digite sua nova senha"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrorMessage("");
            }}
          />
          <label htmlFor="new-password-confirmation">Repita a nova senha</label>
          <input
            className={hasMismatch ? "invalid" : undefined}
            id="new-password-confirmation"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a sua nova senha"
            value={passwordConfirmation}
            onChange={(event) => {
              setPasswordConfirmation(event.target.value);
              setErrorMessage("");
            }}
          />
          <div className="dialog-actions">
            <button className="text-button" type="button" onClick={() => navigate("/")}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={!canSubmit}>{isSubmitting ? "Redefinindo..." : "Redefinir"}</button>
          </div>
        </form>
      </section>
    </main>
  );
}

function PasswordUpdatedPage() {
  return (
    <main className="page-main">
      <section className="dialog-card success-card" aria-labelledby="password-updated-title">
        <h1 id="password-updated-title">Senha alterada com sucesso</h1>
        <p className="dialog-description">Sua senha foi alterada com sucesso. Clique no botão abaixo para prosseguir com o login no sistema.</p>
        <div className="dialog-actions single-action">
          <button className="primary-button" type="button" onClick={() => navigate("/")}>Login</button>
        </div>
      </section>
    </main>
  );
}

function InProgressPage() {
  return (
    <main className="page-main">
      <section className="dialog-card in-progress-card" aria-labelledby="in-progress-title">
        <h1 id="in-progress-title">IN PROGRESS</h1>
      </section>
    </main>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");

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

  async function resendRecoveryEmail() {
    if (!recoveryEmail) throw new Error("Recovery email is unavailable.");
    const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) throw error;
  }

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (window.location.pathname === "/redefinir-senha") {
        setSession(data.session);
        return;
      }
      void checkSession(data.session);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setSession(nextSession);
        return;
      }
      void checkSession(nextSession);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const isAuthenticated = session !== null && isAuthorized;
  const breadcrumbs = path === "/esqueci-senha" || path === "/esqueci-senha/enviado"
    ? ["Login", "Esqueci minha senha"]
    : path === "/redefinir-senha" || path === "/redefinir-senha/sucesso"
      ? ["Login", "Redefinir senha", ...(path.endsWith("/sucesso") ? ["Senha redefinida"] : [])]
      : [];

  let content = <LoginPage onAuthenticated={checkSession} />;
  if (path === "/esqueci-senha") content = <ForgotPasswordPage onSent={setRecoveryEmail} />;
  if (path === "/esqueci-senha/enviado") content = <EmailSentPage email={recoveryEmail} onResend={resendRecoveryEmail} />;
  if (path === "/redefinir-senha") content = <ResetPasswordPage />;
  if (path === "/redefinir-senha/sucesso") content = <PasswordUpdatedPage />;
  if (path === "/in-progress") content = isAuthenticated ? <InProgressPage /> : <LoginPage onAuthenticated={checkSession} />;

  return (
    <div className="app-shell">
      <Header />
      {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}
      {content}
      <Footer />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
