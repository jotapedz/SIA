import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import styles from "./Layout.module.css";

export function Header({ authenticated = false }: { authenticated?: boolean }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);

  async function handleSignOut() {
    setLeaving(true);
    setError("");
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível sair.");
    } finally {
      setLeaving(false);
    }
  }

  return (
    <header className={`site-header ${authenticated ? styles.header : ""}`}>
      <Link to={authenticated ? "/discentes" : "/"} aria-label="SIA — início">
        <img src="/assets/sia-logo-figma.svg" alt="SIA" />
      </Link>
      {authenticated && profile && <nav className={styles.navigation} aria-label="Menu principal">
        <Link to="/discentes" aria-current={pathname === "/discentes" ? "page" : undefined}>Início</Link>
        <Link to="/usuarios" aria-current={pathname === "/usuarios" ? "page" : undefined}>Usuários</Link>
        <details className={styles.profile}>
          <summary><span className={styles.person}><img src="/assets/person.svg" alt="" /></span>
            <span>{profile.full_name.split(" ")[0]}</span>
          </summary>
          <div className={styles.profileMenu}>
            <strong>{profile.full_name}</strong>
            <span>{profile.email}</span>
            <button type="button" disabled={leaving} onClick={() => void handleSignOut()}>{leaving ? "Saindo..." : "Sair do sistema"}</button>
            {error && <p role="alert">{error}</p>}
          </div>
        </details>
      </nav>}
    </header>
  );
}
