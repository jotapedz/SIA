import { Link } from "react-router-dom";

type BreadcrumbItem = string | { label: string; to?: string };

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return <nav className="breadcrumb" aria-label="Navegação estrutural">
    {items.map((item, index) => {
      const label = typeof item === "string" ? item : item.label;
      const to = typeof item === "string" ? index === 0 ? "/" : undefined : item.to;
      return <span className="breadcrumb-item" key={`${index}-${label}`}>
        {index > 0 && <span className="breadcrumb-separator" aria-hidden="true">›</span>}
        {to ? <Link to={to}>{label}</Link> : <span aria-current={index === items.length - 1 ? "page" : undefined}>{label}</span>}
      </span>;
    })}
  </nav>;
}
