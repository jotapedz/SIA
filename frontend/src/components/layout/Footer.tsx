import styles from "./Layout.module.css";

export function Footer() {
  return (
    <footer className={`site-footer ${styles.footer}`}>
      <div className={styles.footerBrand}>
        <img className="footer-logo" src="/assets/sia-footer-logo.svg" alt="SIA" />
        <span>Sistema de Inclusão<br />e Acessibilidade</span>
      </div>
      <address>
        <p><img src="/assets/location.svg" alt="" /> Campus do Pici | Bloco 1430 | CEP 60.440-554 | Fortaleza - CE</p>
        <p><img src="/assets/call.svg" alt="" /> Telefone: +55 (85) 3366-9029</p>
      </address>
    </footer>
  );
}
