import { useState } from "react";
import type { Discente } from "../../types/api";
import { formatDate } from "../../lib/format";
import { Button } from "../ui/Button";
import styles from "./DiscenteDetails.module.css";

function Info({ items }: { items: [string, string | null | undefined][] }) {
  return <dl className={styles.infoGrid}>{items.map(([label, value]) => <div key={label}>
    <dt>{label}</dt><dd>{value || "Não informado"}</dd>
  </div>)}</dl>;
}

export function DiscenteDetails({ discente }: { discente: Discente }) {
  const [expanded, setExpanded] = useState(true);
  const status = discente.status.trim().toUpperCase();
  const contact = discente.family_contact;
  return <section className={styles.panel} aria-labelledby="discente-name">
    <div className={styles.summary}>
      <div>
        <h2 id="discente-name">{discente.social_name || discente.full_name}</h2>
        <span className={`${styles.status} ${status === "ATIVO" ? styles.active : ""}`}>
          {status === "ATIVO" && <img src="/assets/status-active.svg" alt="" />}
          {status === "ATIVO" ? "Ativo" : status === "INATIVO" ? "Inativo" : discente.status}
        </span>
      </div>
      <Button variant="outline" disabled title="Histórico previsto no RF18">
        <img src="/assets/visibility.svg" alt="" /> Visualizar histórico
      </Button>
    </div>
    <div id="discente-details" className={styles.details} hidden={!expanded}>
      <section aria-labelledby="general-info-title">
        <h3 id="general-info-title">Informações gerais</h3>
        <Info items={[
          ["Nome completo", discente.full_name], ["Nome social", discente.social_name],
          ["Matrícula", discente.registration_number], ["Curso", discente.course],
          ["E-mail institucional", discente.email], ["Telefone", discente.phone],
          ["Data de nascimento", formatDate(discente.birth_date)], ["Data de ingresso", formatDate(discente.admission_date)],
          ["Turno", discente.shift],
        ]} />
      </section>
      <img className={styles.divider} src="/assets/details-divider.svg" alt="" />
      <section aria-labelledby="family-info-title">
        <h3 id="family-info-title">Contato familiar</h3>
        {contact ? <Info items={[
          ["Nome do responsável", contact.full_name], ["Grau de parentesco", contact.relationship],
          ["Telefone", contact.phone], ["E-mail", contact.email], ["Observação", contact.notes],
        ]} /> : <p className={styles.empty}>Nenhum contato familiar informado.</p>}
      </section>
    </div>
    <button className={styles.toggle} type="button" aria-expanded={expanded} aria-controls="discente-details" onClick={() => setExpanded(!expanded)}>
      <img className={expanded ? styles.expanded : styles.collapsed} src="/assets/details-chevron.svg" alt="" />
      {expanded ? "Ocultar detalhes" : "Exibir detalhes"}
    </button>
  </section>;
}
