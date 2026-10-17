import { Button } from "./Button";
import styles from "./Controls.module.css";

export function Pagination({ total, page, pageSize, onChange, label, busy = false }: {
  total: number; page: number; pageSize: number; onChange: (page: number) => void; label: string; busy?: boolean;
}) {
  if (total === 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <nav className={styles.pagination} aria-label={`Paginação de ${label}`}>
    <span>{total} {label}</span>
    <div>
      <Button variant="text" disabled={busy || page <= 1} onClick={() => onChange(page - 1)}>Anterior</Button>
      <span aria-live="polite">Página {page} de {pages}</span>
      <Button variant="text" disabled={busy || page >= pages} onClick={() => onChange(page + 1)}>Próxima</Button>
    </div>
  </nav>;
}
