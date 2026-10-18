import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../services/api";
import { createRelatorio, updateRelatorio } from "../services/relatorios";
import type { Relatorio, RelatorioCreate } from "../types/api";
import { useAuth } from "./useAuth";

export function useRelatorioSubmit(discenteId: number, report?: Relatorio) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const locked = useRef(false);
  const snapshot = useRef(report).current;
  const [blocked, setBlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<Error | null>(null);
  const clearFailure = useCallback(() => { if (!blocked) setFailure(null); }, [blocked]);

  async function submit(data: RelatorioCreate): Promise<Error | null> {
    if (locked.current || !session || blocked) return null;
    locked.current = true;
    setSubmitting(true);
    setFailure(null);
    try {
      const saved = snapshot
        ? await updateRelatorio(session.access_token, snapshot.id, { ...data, expected_updated_at: snapshot.updated_at })
        : await createRelatorio(session.access_token, discenteId, data);
      navigate(`/relatorios/${saved.id}`, { replace: true, state: snapshot ? { updated: true } : { created: true } });
      return null;
    } catch (reason) {
      const error = reason instanceof Error ? reason : new Error("Não foi possível adicionar o relatório.");
      setFailure(error);
      if (error instanceof ApiError && ["stale_record", "report_cancelled"].includes(error.code)) setBlocked(true);
      return error;
    } finally {
      locked.current = false;
      setSubmitting(false);
    }
  }
  const message = failure instanceof ApiError && failure.status === 0
    ? "Não foi possível confirmar o salvamento. Confira o relatório antes de tentar novamente."
    : failure?.message ?? "";
  return { submit, submitting, message, clearFailure, blocked };
}
