import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../services/api";
import { createRelatorio } from "../services/relatorios";
import type { RelatorioCreate } from "../types/api";
import { useAuth } from "./useAuth";

export function useRelatorioSubmit(discenteId: number) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const locked = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<Error | null>(null);
  const clearFailure = useCallback(() => setFailure(null), []);

  async function submit(data: RelatorioCreate): Promise<Error | null> {
    if (locked.current || !session) return null;
    locked.current = true;
    setSubmitting(true);
    setFailure(null);
    try {
      const saved = await createRelatorio(session.access_token, discenteId, data);
      navigate(`/relatorios/${saved.id}`, { replace: true, state: { created: true } });
      return null;
    } catch (reason) {
      const error = reason instanceof Error ? reason : new Error("Não foi possível adicionar o relatório.");
      setFailure(error);
      return error;
    } finally {
      locked.current = false;
      setSubmitting(false);
    }
  }
  const message = failure instanceof ApiError && failure.status === 0
    ? "Não foi possível confirmar o cadastro. Confira a listagem antes de tentar novamente."
    : failure?.message ?? "";
  return { submit, submitting, message, clearFailure };
}
