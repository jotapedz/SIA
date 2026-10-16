import { Link } from "react-router-dom";

export function Breadcrumb({ items }: { items: string[] }) {
  return <nav className="breadcrumb" aria-label="Navegação estrutural">
    {items.map((item, index) => <span className="breadcrumb-item" key={`${index}-${item}`}>
      {index > 0 && <span className="breadcrumb-separator" aria-hidden="true">›</span>}
      {index === 0 ? <Link to="/">{item}</Link> : <span aria-current={index === items.length - 1 ? "page" : undefined}>{item}</span>}
    </span>)}
  </nav>;
}
