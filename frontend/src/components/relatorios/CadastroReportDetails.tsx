import type { RelatorioCategoria } from "../../types/api";
import { cadastroSections } from "../../lib/cadastroForm";
import type { CadastroSection } from "../../lib/cadastroForm";
import styles from "./CadastroReport.module.css";

function CategoryItems({ items }: { items: RelatorioCategoria[] }) {
  if (!items.length) return <p>Não informado</p>;
  return <ul>{items.map((item) => <li key={item.id}>{item.name}{item.detail ? `: ${item.detail}` : ""}</li>)}</ul>;
}

export function CadastroReportDetails({ categories }: { categories: RelatorioCategoria[] }) {
  const sectionItems = (section: CadastroSection) => categories.filter((item) => item.section === section);
  const barriers: CadastroSection[] = ["BARREIRAS_FISICAS", "BARREIRAS_COMUNICACIONAIS", "BARREIRAS_PEDAGOGICAS", "BARREIRAS_ATITUDINAIS"];
  const extra = categories.filter((item) => !item.section || !(item.section in cadastroSections));
  return <>
    <section className={styles.viewSection}><h3>Acomodações e recursos</h3><CategoryItems items={sectionItems("ACOMODACOES_RECURSOS")} /></section>
    <section className={styles.viewSection}><h3>Demandas educacionais</h3><CategoryItems items={sectionItems("DEMANDAS_EDUCACIONAIS")} /></section>
    <section className={styles.viewSection}><h3>Barreiras</h3>
      {barriers.map((section) => <div key={section}><h4>{cadastroSections[section]}</h4><CategoryItems items={sectionItems(section)} /></div>)}
    </section>
    {extra.length > 0 && <section className={styles.viewSection}><h3>Outras categorias</h3><CategoryItems items={extra} /></section>}
  </>;
}
