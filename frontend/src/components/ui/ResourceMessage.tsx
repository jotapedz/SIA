import { Link } from "react-router-dom";
import { Button } from "./Button";
import styles from "./Controls.module.css";

export function ResourceMessage({ loading, error, notFound = false, onRetry }: {
  loading?: boolean; error?: string; notFound?: boolean; onRetry?: () => void;
}) {
  if (loading) return <p className={styles.feedback} role="status">Carregando...</p>;
  return <section className={styles.feedback} role="alert">
    <p>{error || "Não foi possível carregar os dados."}</p>
    <div className={styles.feedbackActions}>
      <Link to="/discentes">Voltar aos discentes</Link>
      {!notFound && onRetry && <Button variant="text" onClick={onRetry}>Tentar novamente</Button>}
    </div>
  </section>;
}
