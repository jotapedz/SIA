import styles from "./Layout.module.css";

export function Footer({ authenticated = false }: { authenticated?: boolean }) {
  return (
    <footer className={`site-footer ${authenticated ? styles.footer : ""}`}>
      <div className={authenticated ? styles.footerBrand : undefined}>
        <img className="footer-logo" src={authenticated ? "/assets/sia-footer-logo.svg" : "/assets/sia-logo-figma.svg"} alt="Sistema de Inclusão e Acessibilidade" />
        {authenticated && <span>Sistema de Inclusão<br />e Acessibilidade</span>}
      </div>
      <address>
        <p><img src="/assets/location.svg" alt="" /> Campus do Pici | Bloco 1430 | CEP 60.440-554 | Fortaleza - CE</p>
        <p><img src="/assets/call.svg" alt="" /> Telefone: +55 (85) 3366-9029</p>
      </address>
    </footer>
  );
}
