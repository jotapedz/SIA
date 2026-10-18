export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
};

export type Home = {
  user: Profile;
  features: { code: string; title: string; method: "GET" | "POST"; endpoint: string }[];
};

export type DiscenteStatus = "ATIVO" | "INATIVO";

export type DiscenteSummary = {
  id: number;
  full_name: string;
  social_name: string | null;
  registration_number: string;
  course: string | null;
  shift: string | null;
  status: string;
  admission_date: string;
};

export type FamilyContact = {
  full_name: string;
  relationship: string;
  phone: string;
  email: string | null;
  notes: string | null;
};

export type DiscenteCreate = {
  full_name: string;
  social_name: string | null;
  registration_number: string;
  course: string | null;
  shift: string | null;
  status: DiscenteStatus;
  admission_date: string;
  birth_date: string | null;
  email: string | null;
  phone: string | null;
  family_contact: FamilyContact | null;
};

export type Discente = DiscenteSummary & {
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  family_contact: FamilyContact | null;
  created_at: string;
  updated_at: string;
};

export type DiscenteUpdate = Partial<DiscenteCreate> & { expected_updated_at: string };

export type ReportType = "CADASTRO" | "ACOMPANHAMENTO" | "ACOES_SUCESSO" | "RECURSOS_ACESSIBILIDADE" | "BARREIRAS" | "OBSERVACOES";

export type CategoriaAcessibilidade = {
  id: number;
  code: string | null;
  name: string;
  group: string;
  section: string | null;
  order: number;
  requires_detail: boolean;
};

export type CategorySelection = { category_id: number; detail: string | null };
export type RelatorioCategoria = CategoriaAcessibilidade & { detail: string | null };

export type RelatorioSummary = {
  id: number;
  discente_id: number;
  discente_name: string;
  discente_social_name: string | null;
  title: string;
  description_excerpt: string;
  report_type: string | null;
  status: string;
  author_id: number;
  author_name: string;
  opened_at: string;
  closed_at: string | null;
  updated_at: string;
};

export type Relatorio = RelatorioSummary & {
  description: string;
  activity: string | null;
  ongoing_follow_up: string | null;
  notes: string | null;
  adopted_strategy: string | null;
  observed_result: string | null;
  categories: RelatorioCategoria[];
  cancelled_at: string | null;
  cancelled_by: number | null;
};

export type RelatorioCreate = {
  title: string;
  report_type: ReportType;
  description?: string | null;
  activity?: string | null;
  ongoing_follow_up?: string | null;
  notes?: string | null;
  adopted_strategy?: string | null;
  observed_result?: string | null;
  categories?: CategorySelection[];
};

export type RelatorioUpdate = RelatorioCreate & { expected_updated_at: string };

export type UsuarioRole = "AGENTE_ACESSIBILIDADE" | "COORDENACAO_ACESSIBILIDADE";
export type UsuarioStatus = "ATIVO" | "INATIVO";
export type Usuario = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  status: UsuarioStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
export type UsuarioCreate = {
  full_name: string;
  email: string;
  password: string;
  role: UsuarioRole;
  status: UsuarioStatus;
};
export type UsuarioList = { items: Usuario[]; total: number; page: number; page_size: number };
export type UsuarioFilters = { q: string; role: UsuarioRole | ""; status: UsuarioStatus | "" };

export type RelatorioList = {
  items: RelatorioSummary[];
  total: number;
  page: number;
  page_size: number;
};

export type DiscenteList = {
  items: DiscenteSummary[];
  total: number;
  page: number;
  page_size: number;
};

export type DiscenteFilters = {
  q: string;
  status: DiscenteStatus | "";
  course: string;
  shift: string;
  admission_from: string;
  admission_to: string;
};
