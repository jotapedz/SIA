import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import styles from "./Controls.module.css";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };

export function Field({ label, error, hint, id, required, className = "", ...props }: Props) {
  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <input id={id} required={required} aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...props} />
      {error ? <span id={`${id}-error`} className={styles.error}>{error}</span>
        : hint && <span id={`${id}-hint`} className={styles.hint}>{hint}</span>}
    </div>
  );
}

export function SelectField({ id, label, children, value, onChange, disabled = false }: {
  id: string; label: string; children: ReactNode; value: string; onChange: (value: string) => void; disabled?: boolean;
}) {
  return <div className={styles.field}><label htmlFor={id}>{label}</label>
    <div className={styles.selectControl}>
      <select id={id} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>{children}</select>
      <img src="/assets/chevron.svg" width="24" height="24" alt="" />
    </div>
  </div>;
}

export function TextareaField({ label, error, hint, id, required, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string; error?: string; hint?: string;
}) {
  return <div className={styles.field}>
    <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    <textarea id={id} required={required} aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...props} />
    {error ? <span id={`${id}-error`} className={styles.error}>{error}</span>
      : hint && <span id={`${id}-hint`} className={styles.hint}>{hint}</span>}
  </div>;
}
