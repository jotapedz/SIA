import { Link } from "react-router-dom";

export function PasswordUpdatedPage() {
  return <main id="main-content" className="page-main">
    <section className="dialog-card success-card" aria-labelledby="password-updated-title">
      <h1 id="password-updated-title">Senha alterada com sucesso</h1>
      <p className="dialog-description">Sua senha foi alterada com sucesso. Clique no botão abaixo para prosseguir com o login no sistema.</p>
      <div className="dialog-actions single-action"><Link className="primary-button auth-action-link" to="/">Login</Link></div>
    </section>
  </main>;
}
