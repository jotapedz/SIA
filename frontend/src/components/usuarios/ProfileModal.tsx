import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { usuarioRoleLabel } from "../../lib/usuarioForm";
import { Modal } from "../ui/Modal";
import { FormError } from "../ui/FormError";
import styles from "./ProfileModal.module.css";

export function ProfileModal({ onClose, onSignOut, busy, error, anchorRef }: {
  onClose: () => void; onSignOut: () => void; busy: boolean; error: string;
  anchorRef: RefObject<HTMLButtonElement | null>;
}) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [top, setTop] = useState(80);
  useLayoutEffect(() => {
    function position() {
      const header = anchorRef.current?.closest("header");
      if (header) setTop(Math.max(16, header.getBoundingClientRect().bottom + 16));
    }
    position();
    window.addEventListener("resize", position);
    return () => window.removeEventListener("resize", position);
  }, [anchorRef]);
  if (!profile) return null;
  function open(path: string) { onClose(); navigate(path); }
  return <Modal title={profile.full_name} narrow busy={busy} onClose={onClose} className={styles.dialog} style={{ top, maxHeight: `calc(100dvh - ${top + 16}px)` }}
    headerAction={<button className={styles.close} type="button" disabled={busy} onClick={onClose}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>Fechar
    </button>}>
    <span className={styles.role}>{usuarioRoleLabel(profile.role)}</span>
    <p className={styles.email}>{profile.email}</p>
    {error && <FormError title="Não foi possível sair">{error}</FormError>}
    <div className={styles.links}>
      <button type="button" disabled={busy} onClick={() => open("/perfil/redefinir-email")}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 6 9 7 9-7" /></svg>
        Redefinir e-mail
      </button>
      <button type="button" disabled={busy} onClick={() => open("/perfil/redefinir-senha")}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="1" /><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3" /></svg>
        Redefinir senha
      </button>
    </div>
    <div className={styles.actions}>
      <button type="button" disabled={busy} onClick={onSignOut}>{busy ? "Saindo..." : "Sair"}</button>
    </div>
  </Modal>;
}
import { useLayoutEffect, useState } from "react";
import type { RefObject } from "react";
