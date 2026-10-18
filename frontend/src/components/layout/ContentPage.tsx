import type { ReactNode } from "react";
import { Breadcrumb } from "./Breadcrumb";
import styles from "./ContentPage.module.css";

export function ContentPage({ title, breadcrumbs, children, compactTitle = false }: {
  title: string;
  breadcrumbs: { label: string; to?: string }[];
  children: ReactNode;
  compactTitle?: boolean;
}) {
  return <main id="main-content" className={styles.main}>
    <div className={styles.content}>
      <Breadcrumb items={breadcrumbs} />
      <h1 className={`${styles.title} ${compactTitle ? styles.compactTitle : ""}`}>{title}</h1>
      {children}
    </div>
  </main>;
}
