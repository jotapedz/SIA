import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import styles from "./Modal.module.css";

export function Modal({ title, busy = false, compact = false, narrow = false, onClose, children, className = "", style, headerAction }: {
  title: string; busy?: boolean; compact?: boolean; narrow?: boolean; onClose: () => void; children: ReactNode;
  className?: string; style?: CSSProperties; headerAction?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);
  return (
    <dialog ref={ref} className={`${styles.dialog} ${compact ? styles.compact : ""} ${narrow ? styles.narrow : ""} ${className}`} style={style} aria-labelledby="modal-title" aria-busy={busy}
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
      {headerAction ? <div className={styles.heading}><h2 id="modal-title" className={styles.title}>{title}</h2>{headerAction}</div>
        : <h2 id="modal-title" className={styles.title}>{title}</h2>}
      {children}
    </dialog>
  );
}
