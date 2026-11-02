import { useCallback, useRef, useState } from "react";
import { useApiResource } from "../../hooks/useApiResource";
import { useAuth } from "../../hooks/useAuth";
import { getUsuario } from "../../services/usuarios";
import { apiRequest, ApiError } from "../../services/api";
import type { Usuario, UsuarioRole, UsuarioStatus } from "../../types/api";
import { usuarioRoleLabels, usuarioStatusLabels } from "../../lib/usuarioForm";
import { Modal } from "../ui/Modal";
import { Field, SelectField } from "../ui/Field";
import { Button } from "../ui/Button";
import { FormError } from "../ui/FormError";
import { ResourceMessage } from "../ui/ResourceMessage";
import styles from "./Usuarios.module.css";

function EditForm({ user, onClose, onUpdated, onReload }: {
  user: Usuario; onClose: () => void; onUpdated: () => void; onReload: () => void;
}) {
  const { session, retry } = useAuth();
  const [name, setName] = useState(user.full_name);
  const [role, setRole] = useState(user.role as UsuarioRole);
  const [status, setStatus] = useState(user.status);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const locked = useRef(false);
  const changed = name.trim() !== user.full_name || role !== user.role || status !== user.status;
  async function save() {
    if (!session || locked.current || conflict) return;
    locked.current = true; setBusy(true); setError("");
    try {
      await apiRequest(`/v1/usuarios/${user.id}`, session.access_token, { method: "PATCH", body: JSON.stringify({
        full_name: name.trim(), role, status, expected_updated_at: user.updated_at,
      }) });
      await retry(); onUpdated();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar.");
      setConflict(reason instanceof ApiError && [404, 409].includes(reason.status));
      setConfirm(false);
    } finally { locked.current = false; setBusy(false); }
  }
  return <Modal title={confirm ? "Salvar alterações?" : "Editar usuário"} narrow busy={busy} onClose={onClose}>
    {confirm ? <>
      <p>Deseja salvar as alterações realizadas neste usuário?</p>
      <div className={styles.modalActions}><Button variant="text" disabled={busy} onClick={() => setConfirm(false)}>Voltar</Button>
        <Button disabled={busy} onClick={() => void save()}>{busy ? "Salvando..." : "Salvar"}</Button></div>
    </> : <form className={styles.form} onSubmit={(event) => { event.preventDefault(); if (event.currentTarget.reportValidity()) setConfirm(true); }}>
      {error && <FormError title="Não foi possível salvar">{error}</FormError>}
      {conflict && <Button variant="text" onClick={onReload}>Recarregar usuário</Button>}
      <fieldset className={styles.fields} disabled={busy || conflict}>
        <Field id="edit-user-name" label="Nome" value={name} required maxLength={150} onChange={(e) => setName(e.target.value)} />
        <Field id="edit-user-email" label="E-mail" value={user.email} readOnly hint="O e-mail é alterado pelo titular a partir do modal Perfil." />
        <SelectField id="edit-user-role" label="Perfil" value={role} onChange={(value) => setRole(value as UsuarioRole)}>
          {Object.entries(usuarioRoleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </SelectField>
        <SelectField id="edit-user-status" label="Status" value={status} onChange={(value) => setStatus(value as UsuarioStatus)}>
          {Object.entries(usuarioStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </SelectField>
      </fieldset>
      <div className={styles.modalActions}><Button variant="text" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={busy || conflict || !changed || !name.trim()}>Salvar</Button></div>
    </form>}
  </Modal>;
}

export function UsuarioEditModal({ id, onClose, onUpdated }: { id: number; onClose: () => void; onUpdated: () => void }) {
  const load = useCallback((token: string, signal: AbortSignal) => getUsuario(token, id, signal), [id]);
  const { data, loading, error, status, reload } = useApiResource(load);
  if (loading || error || !data) return <Modal title="Editar usuário" narrow onClose={onClose}>
    <ResourceMessage loading={loading} error={error} notFound={status === 404} onRetry={reload} />
    <div className={styles.modalActions}><Button onClick={onClose}>Fechar</Button></div>
  </Modal>;
  return <EditForm key={`${data.id}-${data.updated_at}`} user={data} onClose={onClose} onUpdated={onUpdated} onReload={reload} />;
}
