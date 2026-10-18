import type { Usuario } from "../../types/api";
import { usuarioRoleLabel } from "../../lib/usuarioForm";
import { Button } from "../ui/Button";
import styles from "./Usuarios.module.css";

export function UsuarioCard({ user, onDetails }: { user: Usuario; onDetails: () => void }) {
  return <article className={styles.card}>
    <h2><button type="button" onClick={onDetails} aria-label={`Visualizar detalhes de ${user.full_name}`}>{user.full_name}</button></h2>
    <span className={`${styles.role} ${user.role === "COORDENACAO_ACESSIBILIDADE" ? styles.coordination : styles.agent}`}>
      {usuarioRoleLabel(user.role)}
    </span>
    <p className={styles.status}><img src={user.is_active ? "/assets/status-active.svg" : "/assets/status-inactive.svg"} alt="" />{user.is_active ? "Ativo" : "Inativo"}</p>
    <div className={styles.cardActions}>
      <Button variant="outline" disabled title="Edição de usuários prevista no RF13"><img src="/assets/edit-outline.svg" alt="" /> Editar</Button>
      <Button variant="outline" disabled title="Exclusão de usuários não disponível nesta etapa"><img src="/assets/delete-outline.svg" alt="" /> Excluir</Button>
    </div>
  </article>;
}
