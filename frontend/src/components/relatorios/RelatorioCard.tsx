import { Link } from "react-router-dom";
import type { RelatorioSummary } from "../../types/api";
import { formatDate, reportStatusLabels } from "../../lib/format";
import { reportDefinition } from "../../lib/relatorioForm";
import styles from "./Relatorios.module.css";

export function RelatorioCard({ relatorio }: { relatorio: RelatorioSummary }) {
  return <article className={styles.card}>
    <time dateTime={relatorio.opened_at}>{formatDate(relatorio.opened_at)}</time>
    <h3><Link to={`/relatorios/${relatorio.id}`} aria-label={`Abrir relatório ${relatorio.title}`}>{relatorio.title}</Link></h3>
    <div className={styles.badges}>
      <span className={styles.typeBadge}>{reportDefinition(relatorio.report_type)?.badge || "Relatório"}</span>
      <span className={styles.statusBadge}>{reportStatusLabels[relatorio.status] || relatorio.status}</span>
    </div>
    <p className={styles.excerpt}><strong>Descrição: </strong>{relatorio.description_excerpt}</p>
    <p className={styles.author}>Por {relatorio.author_name}</p>
  </article>;
}
