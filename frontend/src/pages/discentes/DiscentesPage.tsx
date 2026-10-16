import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useDiscentes } from "../../hooks/useDiscentes";
import { getHome } from "../../services/auth";
import type { Discente, Home } from "../../types/api";
import { DiscenteCard } from "../../components/discentes/DiscenteCard";
import { DiscenteCreateModal } from "../../components/discentes/DiscenteCreateModal";
import { DiscenteFilters, defaultFilters } from "../../components/discentes/DiscenteFilters";
import { Button } from "../../components/ui/Button";
import styles from "./DiscentesPage.module.css";

export function DiscentesPage() {
  const { session } = useAuth();
  const token = session!.access_token;
  const [home, setHome] = useState<Home | null>(null);
  const [homeError, setHomeError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [success, setSuccess] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const query = useMemo(() => ({ ...filters, q: debouncedSearch }), [filters, debouncedSearch]);
  const { data, loading, error } = useDiscentes(token, query, page, revision);
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / 12));
  const canCreate = home?.features.some((feature) => feature.method === "POST" && feature.endpoint === "/v1/discentes");

  useEffect(() => {
    const controller = new AbortController();
    setHome(null);
    setHomeError("");
    void getHome(token, controller.signal).then((result) => {
      if (!controller.signal.aborted) setHome(result);
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setHomeError(reason instanceof Error ? reason.message : "Não foi possível carregar as funcionalidades.");
    });
    return () => controller.abort();
  }, [token, revision]);

  useEffect(() => {
    if (data && !loading && page > pageCount) setPage(pageCount);
  }, [data, loading, page, pageCount]);

  function created(discente: Discente) {
    setShowCreate(false);
    setSuccess(`${discente.social_name || discente.full_name} cadastrado(a) com sucesso.`);
    setSearch("");
    setFilters(defaultFilters);
    setShowFilters(false);
    setPage(1);
    setRevision((value) => value + 1);
  }
  function clearFilters() {
    setSearch(""); setFilters(defaultFilters); setShowFilters(false); setPage(1);
  }

  return <main id="main-content" className={styles.main}>
    <div className={styles.content}>
      <h1>Discentes</h1>
      <div className={styles.toolbar}>
        <div className={styles.search} role="search">
          <img src="/assets/search.svg" alt="" />
          <label className="sr-only" htmlFor="student-search">Buscar por nome ou matrícula</label>
          <input id="student-search" type="search" placeholder="Busque um discente" maxLength={150} value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          <button type="button" aria-label={showFilters ? "Ocultar filtros" : "Mostrar filtros"} aria-expanded={showFilters}
            aria-controls="discente-filters" onClick={() => setShowFilters(!showFilters)}>
            <img src="/assets/filter.svg" alt="" />
          </button>
        </div>
        <Button disabled={!canCreate} onClick={() => { setShowCreate(true); setSuccess(""); }}>
          <img src="/assets/add.svg" width="24" height="24" alt="" /> Cadastrar discente
        </Button>
      </div>
      {showFilters && <DiscenteFilters applied={filters} onApply={(next) => { setFilters(next); setPage(1); }} />}
      {success && <div className={styles.success} role="status">{success}</div>}
      {(error || homeError) && <div className={styles.feedback} role="alert">
        <p>{error || homeError}</p><Button variant="text" onClick={() => setRevision((value) => value + 1)}>Tentar novamente</Button>
      </div>}
      <section aria-label="Lista de discentes" aria-busy={loading}>
        {loading ? <p className={styles.feedback} role="status">Carregando discentes...</p>
          : data && data.items.length > 0 ? <div className={styles.grid}>
            {data.items.map((discente) => <DiscenteCard key={discente.id} discente={discente} />)}
          </div>
          : data && <div className={styles.feedback}>
            <h2>Nenhum discente encontrado</h2>
            <p>{search || Object.values(filters).some(Boolean) ? "Ajuste sua busca ou limpe os filtros." : "Cadastre o primeiro discente para iniciar o acompanhamento."}</p>
            {(search || Object.values(filters).some(Boolean)) && <Button variant="text" onClick={clearFilters}>Limpar busca e filtros</Button>}
          </div>}
      </section>
      {data && !loading && data.total > 0 && <nav className={styles.pagination} aria-label="Paginação de discentes">
        <span>{data.total} {data.total === 1 ? "discente" : "discentes"}</span>
        <div><Button variant="text" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span aria-live="polite">Página {page} de {pageCount}</span>
          <Button variant="text" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Próxima</Button></div>
      </nav>}
    </div>
    {showCreate && <DiscenteCreateModal onClose={() => setShowCreate(false)} onCreated={created} />}
  </main>;
}
