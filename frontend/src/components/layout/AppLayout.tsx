import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Breadcrumb } from "./Breadcrumb";

export function AppLayout({ authenticated = false }: { authenticated?: boolean }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const title = pathname.includes("/relatorios/novo") ? "Adicionar relatório"
      : pathname.startsWith("/relatorios/") ? "Relatório"
      : pathname.startsWith("/discentes/") ? "Discente"
      : pathname === "/discentes" ? "Discentes"
      : pathname.startsWith("/esqueci-senha") ? "Recuperar senha"
        : pathname.startsWith("/redefinir-senha") ? "Redefinir senha" : "Login";
    document.title = `${title} — SIA`;
  }, [pathname]);
  const breadcrumbs = pathname.startsWith("/esqueci-senha")
    ? ["Login", "Esqueci minha senha"]
    : pathname.startsWith("/redefinir-senha")
      ? ["Login", "Redefinir senha", ...(pathname.endsWith("/sucesso") ? ["Senha redefinida"] : [])]
      : [];
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Ir para o conteúdo</a>
    <Header authenticated={authenticated} />
    {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}
    <Outlet />
    <Footer authenticated={authenticated} />
  </div>;
}
