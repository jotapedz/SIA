import { createContext, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getProfile } from "../services/auth";
import type { Profile } from "../types/api";

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  status: "loading" | "anonymous" | "authenticated" | "recovery" | "error";
  error: string;
};

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
const initialState: AuthState = { session: null, profile: null, status: "loading", error: "" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const navigate = useNavigate();
  const pending = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const signingIn = useRef(false);
  const recovery = useRef(window.location.pathname === "/redefinir-senha");
  const lastError = useRef("");

  const validateSession = useCallback(async (session: Session | null): Promise<boolean> => {
    const id = ++requestId.current;
    pending.current?.abort();
    if (!session) {
      recovery.current = false;
      setState({ ...initialState, status: "anonymous" });
      return false;
    }
    if (recovery.current) {
      setState({ session, profile: null, status: "recovery", error: "" });
      return false;
    }
    const controller = new AbortController();
    pending.current = controller;
    setState((previous) => ({
      session,
      profile: previous.session?.user.id === session.user.id ? previous.profile : null,
      status: previous.session?.user.id === session.user.id && previous.profile ? "authenticated" : "loading",
      error: "",
    }));
    try {
      const profile = await getProfile(session.access_token, controller.signal);
      if (id !== requestId.current) return false;
      lastError.current = "";
      setState({ session, profile, status: "authenticated", error: "" });
      return true;
    } catch (error) {
      if (controller.signal.aborted || id !== requestId.current) return false;
      lastError.current = error instanceof Error ? error.message : "Não foi possível validar seu acesso.";
      setState({ session, profile: null, status: "error", error: lastError.current });
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let receivedAuthEvent = false;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      receivedAuthEvent = true;
      if (!mounted || (signingIn.current && event === "SIGNED_IN")) return;
      if (event === "PASSWORD_RECOVERY") {
        recovery.current = true;
        navigate("/redefinir-senha", { replace: true });
      }
      void validateSession(session);
    });
    void supabase.auth.getSession().then(({ data: current, error }) => {
      if (!mounted || receivedAuthEvent) return;
      if (error) {
        setState({ ...initialState, status: "anonymous", error: "Não foi possível restaurar sua sessão. Entre novamente." });
        return;
      }
      void validateSession(current.session);
    }).catch(() => {
      if (mounted) setState({ ...initialState, status: "anonymous", error: "Não foi possível restaurar sua sessão." });
    });
    return () => {
      mounted = false;
      ++requestId.current;
      pending.current?.abort();
      data.subscription.unsubscribe();
    };
  }, [navigate, validateSession]);

  async function signIn(email: string, password: string) {
    signingIn.current = true;
    recovery.current = false;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.session) throw new Error("E-mail ou senha incorretos. Confira suas credenciais.");
      if (!await validateSession(data.session)) throw new Error(lastError.current || "Perfil sem acesso autorizado.");
    } finally {
      signingIn.current = false;
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error("Não foi possível encerrar a sessão. Tente novamente.");
    await validateSession(null);
  }

  async function retry() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      await validateSession(data.session);
    } catch {
      setState((previous) => ({ ...previous, profile: null, status: "error", error: "Não foi possível restaurar sua sessão. Tente novamente." }));
    }
  }

  return <AuthContext.Provider value={{ ...state, signIn, signOut, retry }}>{children}</AuthContext.Provider>;
}
