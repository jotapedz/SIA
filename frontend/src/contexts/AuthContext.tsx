import { createContext, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { invalidateApiCache } from "../services/api";
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
const PROFILE_STORAGE_KEY = "sia.validated_profile";

function readCachedProfile(userId: string): Profile | null {
  try {
    const raw = window.sessionStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId?: string; profile?: Profile };
    if (parsed.userId === userId && parsed.profile && parsed.profile.is_active) {
      return parsed.profile;
    }
  } catch {
    // ignora falha de leitura de sessionStorage
  }
  return null;
}

function writeCachedProfile(userId: string, profile: Profile | null): void {
  try {
    if (!profile) {
      window.sessionStorage.removeItem(PROFILE_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ userId, profile }));
    }
  } catch {
    // ignora falha de escrita em sessionStorage
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const navigate = useNavigate();
  const pending = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const signingIn = useRef(false);
  const recovery = useRef(window.location.pathname === "/redefinir-senha");
  const lastError = useRef("");

  const validateSession = useCallback(async (session: Session | null, allowOptimistic = true): Promise<boolean> => {
    const id = ++requestId.current;
    pending.current?.abort();
    if (!session) {
      recovery.current = false;
      writeCachedProfile("", null);
      invalidateApiCache();
      setState({ ...initialState, status: "anonymous" });
      return false;
    }
    if (recovery.current) {
      setState({ session, profile: null, status: "recovery", error: "" });
      return false;
    }
    const controller = new AbortController();
    pending.current = controller;
    setState((previous) => {
      const existingProfile =
        previous.session?.user.id === session.user.id && previous.profile
          ? previous.profile
          : allowOptimistic
            ? readCachedProfile(session.user.id)
            : null;
      return {
        session,
        profile: existingProfile,
        status: existingProfile ? "authenticated" : "loading",
        error: "",
      };
    });
    try {
      const profile = await getProfile(session.access_token, controller.signal);
      if (id !== requestId.current) return false;
      lastError.current = "";
      writeCachedProfile(session.user.id, profile);
      setState({ session, profile, status: "authenticated", error: "" });
      return true;
    } catch (error) {
      if (controller.signal.aborted || id !== requestId.current) return false;
      writeCachedProfile(session.user.id, null);
      invalidateApiCache();
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
    writeCachedProfile("", null);
    invalidateApiCache();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.session) throw new Error("E-mail ou senha incorretos. Confira suas credenciais.");
      if (!await validateSession(data.session, false)) throw new Error(lastError.current || "Perfil sem acesso autorizado.");
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
    invalidateApiCache();
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      await validateSession(data.session, false);
    } catch {
      setState((previous) => ({ ...previous, profile: null, status: "error", error: "Não foi possível restaurar sua sessão. Tente novamente." }));
    }
  }

  return <AuthContext.Provider value={{ ...state, signIn, signOut, retry }}>{children}</AuthContext.Provider>;
}
