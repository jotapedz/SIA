import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ProfileModal } from "../usuarios/ProfileModal";
import styles from "./Layout.module.css";

export function Header({ authenticated = false }: { authenticated?: boolean }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const profileTrigger = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (state?.openProfile) {
      setShowProfile(true);
      navigate(pathname, { replace: true, state: { ...state, openProfile: false } });
    }
  }, [pathname, state, navigate]);

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
    <><header className={`site-header ${authenticated ? styles.header : ""}`}>
      <Link to={authenticated ? "/discentes" : "/"} aria-label="SIA — início">
        <img src="/assets/sia-logo-figma.svg" alt="SIA" />
      </Link>
      {authenticated && profile && <nav className={styles.navigation} aria-label="Menu principal">
        <Link to="/discentes" aria-current={pathname === "/discentes" ? "page" : undefined}>Início</Link>
        <Link to="/usuarios" aria-current={pathname === "/usuarios" ? "page" : undefined}>Usuários</Link>
        <button ref={profileTrigger} type="button" className={styles.profileTrigger} aria-label={`Abrir perfil de ${profile.full_name}`}
          aria-haspopup="dialog" onClick={() => { setError(""); setShowProfile(true); }}>
          <span className={styles.person}><img src="/assets/person.svg" alt="" /></span>
            <span>{profile.full_name.split(" ")[0]}</span>
        </button>
      </nav>}
    </header>
      {authenticated && showProfile && <ProfileModal anchorRef={profileTrigger} busy={leaving} error={error}
        onClose={() => { if (!leaving) setShowProfile(false); }} onSignOut={() => void handleSignOut()} />}
    </>
  );
}
