import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingPage } from "../components/ui/LoadingPage";
import { FormError } from "../components/ui/FormError";

export function ProtectedRoute() {
  const { status, error, retry, signOut } = useAuth();
  const [actionError, setActionError] = useState("");
  const [leaving, setLeaving] = useState(false);
  async function leave() {
    setLeaving(true);
    setActionError("");
    try { await signOut(); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : "Não foi possível sair."); }
    finally { setLeaving(false); }
  }
  if (status === "loading") return <LoadingPage message="Validando seu acesso..." />;
  if (status === "error") return <main id="main-content" className="page-main">
    <section className="dialog-card">
      <h1>Não foi possível validar seu acesso</h1>
      <FormError title="Acesso indisponível">{actionError || error}</FormError>
      <div className="dialog-actions">
        <button className="text-button" type="button" disabled={leaving} onClick={() => void leave()}>{leaving ? "Saindo..." : "Sair"}</button>
        <button className="primary-button" type="button" disabled={leaving} onClick={() => { setActionError(""); void retry(); }}>Tentar novamente</button>
      </div>
    </section>
  </main>;
  if (status !== "authenticated") return <Navigate to={status === "recovery" ? "/redefinir-senha" : "/"} replace />;
  return <Outlet />;
}
