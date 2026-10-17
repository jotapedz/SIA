import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../pages/auth/LoginPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { EmailSentPage } from "../pages/auth/EmailSentPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { PasswordUpdatedPage } from "../pages/auth/PasswordUpdatedPage";
import { DiscentesPage } from "../pages/discentes/DiscentesPage";
import { DiscenteDetailsPage } from "../pages/discentes/DiscenteDetailsPage";
import { RelatorioCreatePage } from "../pages/relatorios/RelatorioCreatePage";
import { RelatorioSelectPage } from "../pages/relatorios/RelatorioSelectPage";
import { RelatorioDetailsPage } from "../pages/relatorios/RelatorioDetailsPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRoutes() {
  return <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/esqueci-senha/enviado" element={<EmailSentPage />} />
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      <Route path="/redefinir-senha/sucesso" element={<PasswordUpdatedPage />} />
      <Route path="*" element={<main id="main-content" className="page-main"><section className="dialog-card">
        <h1>Página não encontrada</h1><p>O endereço informado não está disponível.</p><Link to="/">Voltar ao início</Link>
      </section></main>} />
    </Route>
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout authenticated />}>
        <Route path="/discentes" element={<DiscentesPage />} />
        <Route path="/discentes/:discenteId" element={<DiscenteDetailsPage />} />
        <Route path="/discentes/:discenteId/relatorios/novo" element={<RelatorioSelectPage />} />
        <Route path="/discentes/:discenteId/relatorios/novo/:reportType" element={<RelatorioCreatePage />} />
        <Route path="/relatorios/:relatorioId" element={<RelatorioDetailsPage />} />
        <Route path="/in-progress" element={<Navigate to="/discentes" replace />} />
      </Route>
    </Route>
  </Routes>;
}
