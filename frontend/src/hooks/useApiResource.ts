import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../services/api";
import { useAuth } from "./useAuth";

type Loader<T> = (token: string, signal: AbortSignal) => Promise<T>;
type State<T> = {
  source: Loader<T> | null;
  token: string;
  data: T | null;
  loading: boolean;
  error: string;
  status: number | null;
};

export function useApiResource<T>(load: Loader<T> | null) {
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<State<T>>({ source: null, token: "", data: null, loading: true, error: "", status: null });
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    if (!load || !token) return;
    const controller = new AbortController();
    setState({ source: load, token, data: null, loading: true, error: "", status: null });
    void load(token, controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ source: load, token, data, loading: false, error: "", status: null });
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setState({ source: load, token, data: null, loading: false,
        error: reason instanceof Error ? reason.message : "Não foi possível carregar os dados.",
        status: reason instanceof ApiError ? reason.status : null });
    });
    return () => controller.abort();
  }, [load, token, revision]);
  const current = state.source === load && state.token === token;
  return { data: current ? state.data : null, loading: !!load && !!token && (!current || state.loading),
    error: current ? state.error : "", status: current ? state.status : null, reload };
}
