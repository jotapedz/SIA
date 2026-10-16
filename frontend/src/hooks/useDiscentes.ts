import { useEffect, useState } from "react";
import { listDiscentes } from "../services/discentes";
import type { DiscenteFilters, DiscenteList } from "../types/api";

export function useDiscentes(token: string, filters: DiscenteFilters, page: number, revision: number) {
  const [data, setData] = useState<DiscenteList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void listDiscentes(token, filters, page, controller.signal).then((result) => {
      if (!controller.signal.aborted) setData(result);
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) {
        setData(null);
        setError(reason instanceof Error ? reason.message : "Não foi possível carregar os discentes.");
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [token, filters, page, revision]);
  return { data, loading, error };
}
