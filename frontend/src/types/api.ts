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
