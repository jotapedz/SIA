import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../services/api";
import { createUsuario } from "../../services/usuarios";
import type { Usuario, UsuarioCreate } from "../../types/api";
import { emptyUsuarioForm, usuarioRoleLabels, usuarioStatusLabels, validateUsuario } from "../../lib/usuarioForm";
import type { UsuarioFormErrors } from "../../lib/usuarioForm";
import { Modal } from "../ui/Modal";
import { Field, SelectField } from "../ui/Field";
import { Button } from "../ui/Button";
import { FormError } from "../ui/FormError";
import styles from "./Usuarios.module.css";

export function UsuarioCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (user: Usuario) => void }) {
  const { session } = useAuth();
  const [values, setValues] = useState<UsuarioCreate>({ ...emptyUsuarioForm });
  const [touched, setTouched] = useState<Partial<Record<keyof UsuarioCreate, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<UsuarioFormErrors>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const locked = useRef(false);
  const errors = validateUsuario(values);
  const canSubmit = !submitting && !unconfirmed && !Object.keys(errors).length && !Object.values(serverErrors).some(Boolean);
  useEffect(() => {
    if (submitting) return;
    const first = Object.entries(serverErrors).find(([, error]) => !!error)?.[0];
    if (first) document.getElementById(`usuario-${first}`)?.focus();
  }, [serverErrors, submitting]);

  function change<K extends keyof UsuarioCreate>(key: K, value: UsuarioCreate[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setServerErrors((current) => ({ ...current, [key]: undefined }));
    if (!unconfirmed) setMessage("");
  }
  function field(key: "full_name" | "email" | "password") {
    return { id: `usuario-${key}`, value: values[key],
      error: serverErrors[key] || (touched[key] ? errors[key] : undefined),
      onChange: (event: ChangeEvent<HTMLInputElement>) => change(key, event.target.value),
      onBlur: () => setTouched((current) => ({ ...current, [key]: true })) };
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || locked.current || !session || !event.currentTarget.reportValidity()) return;
    locked.current = true;
    setSubmitting(true);
    setServerErrors({});
    setMessage("");
    try {
      const user = await createUsuario(session.access_token, { ...values, full_name: values.full_name.trim(), email: values.email.trim().toLowerCase() });
      setValues({ ...emptyUsuarioForm });
      onCreated(user);
    } catch (error) {
      const next: UsuarioFormErrors = {};
      if (error instanceof ApiError) {
        if (error.code === "user_creation_unconfirmed" || error.status === 0) setUnconfirmed(true);
        if (error.status === 409) next.email = "Já existe um usuário com este e-mail.";
        for (const issue of error.issues) {
          const key = String(issue.loc.filter((part) => part !== "body")[0]) as keyof UsuarioCreate;
          if (key in values) next[key] = issue.msg || "Verifique este campo.";
        }
      }
      setServerErrors(next);
      setMessage(error instanceof ApiError && error.status === 0
        ? "Não foi possível confirmar o cadastro. Verifique a listagem antes de tentar novamente."
        : error instanceof Error ? error.message : "Não foi possível cadastrar o usuário.");
    } finally { locked.current = false; setSubmitting(false); }
  }

  return <Modal title="Cadastrar usuário" narrow busy={submitting} onClose={onClose}>
    <form className={styles.form} onSubmit={submit} noValidate aria-busy={submitting}>
      {message && <FormError title="Não foi possível cadastrar">{message}</FormError>}
      <fieldset disabled={submitting} className={styles.fields}>
        <legend className="sr-only">Dados do usuário</legend>
        <Field {...field("full_name")} label="Nome" autoComplete="name" maxLength={150} required />
        <Field {...field("email")} label="E-mail" type="email" autoComplete="email" maxLength={180} required />
        <Field {...field("password")} label="Senha" type="password" autoComplete="new-password" minLength={6} maxLength={72} required />
        <SelectField id="usuario-role" label="Perfil" value={values.role} onChange={(value) => change("role", value as UsuarioCreate["role"])}>
          {Object.entries(usuarioRoleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        <SelectField id="usuario-status" label="Status" value={values.status} onChange={(value) => change("status", value as UsuarioCreate["status"])}>
          {Object.entries(usuarioStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
      </fieldset>
      <div className={styles.modalActions}>
        <Button variant="text" disabled={submitting} onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={!canSubmit}>{submitting ? "Cadastrando..." : "Cadastrar"}</Button>
      </div>
    </form>
  </Modal>;
}
