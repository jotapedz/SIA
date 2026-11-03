import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { AuthContext } from "../src/contexts/AuthContext";
import { AppRoutes } from "../src/routes/AppRoutes";
import { cadastroSections } from "../src/lib/cadastroForm";
import "../src/styles/global.css";

// prévia local com dados fictícios
const timestamp = "2026-11-01T12:00:00Z";
const profile = { id: "preview", full_name: "Agente de teste", email: "agente@example.org", phone: null, role: "AGENTE_ACESSIBILIDADE", is_active: true };
const student = { id: 1, full_name: "Maria de teste", social_name: null, registration_number: "123456", course: "Sistemas e Mídias Digitais", shift: "Diurno", status: "ATIVO", admission_date: "2024-02-01", birth_date: "2001-09-14", email: "discente@example.org", phone: null, family_contact: null, created_at: timestamp, updated_at: timestamp, photo_path: "1/preview.jpg" };
const photo = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#e7edff"/><circle cx="150" cy="112" r="55" fill="#879bd3"/><ellipse cx="150" cy="270" rx="105" ry="100" fill="#879bd3"/></svg>');
const categories = Object.entries(cadastroSections).flatMap(([section, label], index) => [
  { id: index * 2 + 1, name: label, section, group: "NECESSIDADE", code: null, order: index, requires_detail: false },
  { id: index * 2 + 2, name: "Outro", section, group: "NECESSIDADE", code: null, order: index, requires_detail: true },
]);
const report = { id: 1, discente_id: 1, discente_name: student.full_name, discente_social_name: null,
  title: "Relatório de acompanhamento acadêmico", description: "Organização das atividades e adaptação dos materiais da disciplina.",
  description_excerpt: "Organização das atividades e adaptação dos materiais.", report_type: "ACOMPANHAMENTO", status: "ABERTO", author_id: 1,
  author_name: profile.full_name, opened_at: timestamp, updated_at: timestamp, closed_at: null, cancelled_at: null, cancelled_by: null,
  activity: "Projeto integrado", ongoing_follow_up: "Encontro semanal para acompanhar as atividades.", notes: "Revisar os materiais na próxima reunião.",
  adopted_strategy: null, observed_result: null, categories: [{ ...categories[0], detail: null }] };
const user = { id: 1, full_name: profile.full_name, email: profile.email, role: profile.role, status: "ATIVO", is_active: true, created_at: timestamp, updated_at: timestamp };
function list(items: unknown[], pageSize = 10) { return { items, total: items.length, page: 1, page_size: pageSize }; }
window.fetch = async (input, options) => {
  const url = new URL(String(input), location.origin);
  if (!url.pathname.startsWith("/v1/")) return new Response(JSON.stringify({ message: "Prévia local: autenticação externa desabilitada." }), { status: 503, headers: { "Content-Type": "application/json" } });
  let data: unknown;
  if (options?.method && options.method !== "GET") return new Response(JSON.stringify({ detail: "Prévia local: nenhuma alteração é salva." }), { status: 409 });
  if (url.pathname.endsWith("/historico")) data = list([{ id: 1, occurred_at: timestamp, operation: url.pathname.includes("/discentes/") ? "Edição de status" : "Alteração de relatório", user_name: profile.full_name, report_title: url.pathname.includes("/relatorios/") ? report.title : null }]);
  else if (url.pathname === "/v1/discentes/1/foto") data = { url: photo, expires_in: 300 };
  else if (url.pathname === "/v1/relatorios/categorias") data = categories;
  else if (url.pathname === "/v1/discentes/1/relatorios") data = list([report], 6);
  else if (url.pathname === "/v1/discentes/1") data = student;
  else if (url.pathname === "/v1/relatorios/1") data = report;
  else if (url.pathname === "/v1/usuarios/1") data = user;
  else if (url.pathname === "/v1/usuarios") data = list([user, { ...user, id: 2, full_name: "Segundo agente de teste", email: "segundo@example.org" }], 9);
  else if (url.pathname === "/v1/discentes") data = list([student], 12);
  else if (url.pathname === "/v1/home") data = { user: profile, features: [{ method: "POST", endpoint: "/v1/discentes", code: "create", title: "Cadastrar discente" }] };
  else return new Response(JSON.stringify({ detail: "Registro não encontrado na prévia." }), { status: 404 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};
const path = new URLSearchParams(location.search).get("path") || "/discentes/1";
window.history.replaceState({}, "", path);
const noop = async () => {};
createRoot(document.getElementById("root")!).render(<BrowserRouter><AuthContext.Provider value={{
  session: { access_token: "preview" } as Session, profile, status: "authenticated", error: "", retry: noop, signIn: noop, signOut: noop,
}}><AppRoutes /></AuthContext.Provider></BrowserRouter>);
