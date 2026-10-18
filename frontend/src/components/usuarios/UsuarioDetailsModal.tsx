import { useCallback } from "react";
import { useApiResource } from "../../hooks/useApiResource";
import { getUsuario } from "../../services/usuarios";
import { usuarioRoleLabels, usuarioStatusLabels } from "../../lib/usuarioForm";
import { Modal } from "../ui/Modal";
import { Field, SelectField } from "../ui/Field";
import { Button } from "../ui/Button";
import { ResourceMessage } from "../ui/ResourceMessage";
import styles from "./Usuarios.module.css";

export function UsuarioDetailsModal({ id, onClose }: { id: number; onClose: () => void }) {
  const load = useCallback((token: string, signal: AbortSignal) => getUsuario(token, id, signal), [id]);
  const { data, loading, error, status, reload } = useApiResource(load);
  return <Modal title="Detalhes de usuário" narrow onClose={onClose}>
    {loading || error ? <ResourceMessage loading={loading} error={error} notFound={status === 404} onRetry={reload} />
      : data && <div className={styles.readOnly}>
        <div className={styles.fields}>
          <Field id="usuario-detail-name" label="Nome" value={data.full_name} readOnly />
          <Field id="usuario-detail-email" label="E-mail" value={data.email} readOnly />
          <SelectField id="usuario-detail-role" label="Perfil" value={data.role} disabled onChange={() => undefined}>
            {Object.entries(usuarioRoleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            {!Object.prototype.hasOwnProperty.call(usuarioRoleLabels, data.role) && <option value={data.role}>{data.role}</option>}
          </SelectField>
          <SelectField id="usuario-detail-status" label="Status" value={data.status} disabled onChange={() => undefined}>
            {Object.entries(usuarioStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
        </div>
      </div>}
    <div className={styles.modalActions}><Button onClick={onClose}>Fechar</Button></div>
  </Modal>;
}
