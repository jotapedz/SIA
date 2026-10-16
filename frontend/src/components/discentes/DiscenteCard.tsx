import type { DiscenteSummary } from "../../types/api";
import styles from "./Discentes.module.css";

export function DiscenteCard({ discente }: { discente: DiscenteSummary }) {
  const title = discente.social_name || discente.full_name;
  return <article className={styles.card} aria-label={title}>
    <h2>{title}</h2>
    <p><strong>Matrícula: </strong>{discente.registration_number}</p>
    <p>{[discente.course, discente.shift].filter(Boolean).join(" · ") || "Curso e turno não informados"}</p>
    {discente.status.trim().toUpperCase() !== "ATIVO" && <span className={styles.status}>{discente.status}</span>}
  </article>;
}
