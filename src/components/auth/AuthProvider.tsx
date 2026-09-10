"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type HeaderUser = {
  email?: string;
  full_name?: string;
  avatar_url?: string;
} | null;

type AuthState = { user: HeaderUser; isAdmin: boolean; ready: boolean };
const AuthContext = createContext<AuthState>({ user: null, isAdmin: false, ready: false });

/** Keeps authenticated decoration off the public route's server critical path. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isAdmin: false, ready: false });

  useEffect(() => {
    let cancelled = false;
    const load = () => fetch("/api/auth/context", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { user: null, isAdmin: false })
      .then((data) => {
        if (!cancelled) setState({ user: data.user ?? null, isAdmin: data.isAdmin === true, ready: true });
      })
      .catch(() => {
        if (!cancelled) setState({ user: null, isAdmin: false, ready: true });
      });
    load();
    const { data: { subscription } } = createClient().auth.onAuthStateChange(() => load());
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
