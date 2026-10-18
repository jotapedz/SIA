import { useCallback, useEffect, useMemo, useState } from "react";
import { ContentPage } from "../../components/layout/ContentPage";
import { UsuarioCard } from "../../components/usuarios/UsuarioCard";
import { UsuarioCreateModal } from "../../components/usuarios/UsuarioCreateModal";
import { UsuarioDetailsModal } from "../../components/usuarios/UsuarioDetailsModal";
import { UsuarioFilters, defaultUsuarioFilters } from "../../components/usuarios/UsuarioFilters";
import { Button } from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
import { ResourceMessage } from "../../components/ui/ResourceMessage";
import { useApiResource } from "../../hooks/useApiResource";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { listUsuarios } from "../../services/usuarios";
import styles from "../../components/usuarios/Usuarios.module.css";

export function UsuariosPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(defaultUsuarioFilters);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const criteria = useMemo(() => ({ ...filters, q: debouncedSearch }), [filters, debouncedSearch]);
  const load = useCallback((token: string, signal: AbortSignal) => listUsuarios(token, criteria, page, signal), [criteria, page]);
  const { data, loading, error, status, reload } = useApiResource(load);
  useEffect(() => {
    if (data && page > Math.max(1, Math.ceil(data.total / data.page_size))) setPage(Math.max(1, Math.ceil(data.total / data.page_size)));
  }, [data, page]);
  function resetFilters() { setSearch(""); setFilters(defaultUsuarioFilters); setShowFilters(false); setPage(1); }
  return <ContentPage title="Usuários" compactTitle breadcrumbs={[{ label: "Início", to: "/discentes" }, { label: "Usuários" }]}>
    <div className={styles.toolbar}>
      <div className={styles.search} role="search">
        <img src="/assets/search.svg" alt="" />
        <label className="sr-only" htmlFor="usuario-search">Buscar usuário por nome ou e-mail</label>
        <input id="usuario-search" type="search" placeholder="Busque um usuário" maxLength={180} value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
        <button type="button" aria-label={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          aria-expanded={showFilters} aria-controls="usuario-filters" onClick={() => setShowFilters(!showFilters)}>
          <img src="/assets/filter.svg" alt="" />
        </button>
      </div>
      <Button onClick={() => { setCreating(true); setNotice(""); }}><img src="/assets/add.svg" alt="" /> Cadastrar usuários</Button>
    </div>
    {showFilters && <UsuarioFilters applied={filters} onApply={(next) => { setFilters(next); setPage(1); }} />}
    {notice && <p className={styles.success} role="status">{notice}</p>}
    <section aria-label="Lista de usuários" aria-busy={loading}>
      {loading || error ? <ResourceMessage loading={loading} error={error} notFound={status === 404} onRetry={reload} />
        : data && data.items.length > 0 ? <div className={styles.grid}>
          {data.items.map((user) => <UsuarioCard key={user.id} user={user} onDetails={() => setSelected(user.id)} />)}
        </div> : <div className={styles.empty}><h2>Nenhum usuário encontrado</h2>
          {(search || filters.role || filters.status) && <Button variant="text" onClick={resetFilters}>Limpar busca e filtros</Button>}
        </div>}
    </section>
    {data && <Pagination total={data.total} page={page} pageSize={data.page_size} onChange={setPage} label="usuários" busy={loading} />}
    {selected !== null && <UsuarioDetailsModal id={selected} onClose={() => setSelected(null)} />}
    {creating && <UsuarioCreateModal onClose={() => { setCreating(false); reload(); }} onCreated={() => {
      setCreating(false); setNotice("Usuário cadastrado com sucesso."); resetFilters(); reload();
    }} />}
  </ContentPage>;
}
