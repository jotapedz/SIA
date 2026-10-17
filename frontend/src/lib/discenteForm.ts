import type { Discente, DiscenteCreate, DiscenteStatus } from "../types/api";

export type DiscenteFormValues = {
  full_name: string; social_name: string; registration_number: string;
  course: string; shift: string; status: DiscenteStatus; admission_date: string;
  birth_date: string; email: string; phone: string; family_name: string;
  family_relationship: string; family_phone: string; family_email: string; family_notes: string;
};
export type FormErrors = Partial<Record<keyof DiscenteFormValues, string>>;

export const emptyDiscenteForm: DiscenteFormValues = {
  full_name: "", social_name: "", registration_number: "", course: "", shift: "", status: "ATIVO",
  admission_date: "", birth_date: "", email: "", phone: "", family_name: "",
  family_relationship: "", family_phone: "", family_email: "", family_notes: "",
};

export function fromDiscente(discente: Discente): DiscenteFormValues {
  return {
    full_name: discente.full_name, social_name: discente.social_name ?? "",
    registration_number: discente.registration_number, course: discente.course ?? "", shift: discente.shift ?? "",
    status: discente.status.trim().toUpperCase() as DiscenteStatus,
    admission_date: discente.admission_date, birth_date: discente.birth_date ?? "",
    email: discente.email ?? "", phone: discente.phone ?? "",
    family_name: discente.family_contact?.full_name ?? "", family_relationship: discente.family_contact?.relationship ?? "",
    family_phone: discente.family_contact?.phone ?? "", family_email: discente.family_contact?.email ?? "",
    family_notes: discente.family_contact?.notes ?? "",
  };
}

export function discenteChanges(initial: DiscenteCreate, current: DiscenteCreate): Partial<DiscenteCreate> {
  return Object.fromEntries(Object.entries(current).filter(([key, value]) =>
    JSON.stringify(value) !== JSON.stringify(initial[key as keyof DiscenteCreate]))) as Partial<DiscenteCreate>;
}

export function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function validateDiscenteForm(values: DiscenteFormValues, hasFamily: boolean): FormErrors {
  const errors: FormErrors = {};
  for (const [key, label, max] of [
    ["full_name", "o nome completo", 150], ["registration_number", "a matrícula", 50],
    ...(hasFamily ? [["family_name", "o nome do responsável", 150], ["family_relationship", "o parentesco", 60]] : []),
  ] as [keyof DiscenteFormValues, string, number][]) {
    if (!values[key].trim()) errors[key] = `Informe ${label}.`;
    else if (values[key].trim().length > max) errors[key] = `Use até ${max} caracteres.`;
  }
  for (const key of ["email", ...(hasFamily ? ["family_email"] : [])] as const) {
    const value = values[key as keyof DiscenteFormValues].trim();
    if (value && (value.length > 254 || !/^\S+@\S+\.\S+$/.test(value))) {
      errors[key as keyof DiscenteFormValues] = "Informe um e-mail válido.";
    }
  }
  for (const key of ["phone", ...(hasFamily ? ["family_phone"] : [])] as const) {
    const value = values[key as keyof DiscenteFormValues].trim();
    const digits = value.replace(/\D/g, "").length;
    if ((key === "family_phone" && !value) || (value &&
      (!/^\+?[0-9() .-]+$/.test(value) || digits < 8 || digits > 15 || value.length > 25))) {
      errors[key as keyof DiscenteFormValues] = "Informe um telefone com 8 a 15 dígitos.";
    }
  }
  if (!validDate(values.admission_date)) errors.admission_date = "Informe uma data de ingresso válida.";
  if (values.birth_date) {
    if (!validDate(values.birth_date) || values.birth_date > today()) errors.birth_date = "Informe uma data de nascimento válida, não futura.";
    else if (validDate(values.admission_date) && values.birth_date > values.admission_date) errors.birth_date = "O nascimento não pode ser posterior ao ingresso.";
  }
  if (values.social_name.trim().length > 150) errors.social_name = "Use até 150 caracteres.";
  if (values.course.trim().length > 150) errors.course = "Use até 150 caracteres.";
  if (values.shift.trim().length > 30) errors.shift = "Use até 30 caracteres.";
  if (hasFamily && values.family_notes.trim().length > 500) errors.family_notes = "Use até 500 caracteres.";
  return errors;
}

export function toDiscentePayload(values: DiscenteFormValues, hasFamily: boolean): DiscenteCreate {
  const optional = (value: string) => value.trim() || null;
  return {
    full_name: values.full_name.trim(), social_name: optional(values.social_name),
    registration_number: values.registration_number.trim(), course: optional(values.course),
    shift: optional(values.shift), status: values.status, admission_date: values.admission_date,
    birth_date: optional(values.birth_date), email: optional(values.email), phone: optional(values.phone),
    family_contact: hasFamily ? {
      full_name: values.family_name.trim(), relationship: values.family_relationship.trim(),
      phone: values.family_phone.trim(), email: optional(values.family_email), notes: optional(values.family_notes),
    } : null,
  };
}
