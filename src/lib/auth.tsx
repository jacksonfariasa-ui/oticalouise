import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "./permissions";

type AuthState = { session: Session | null; role: Role | null; nome: string; acessos: string[] | null; loading: boolean };
const EMPTY: AuthState = { session: null, role: null, nome: "", acessos: null, loading: false };
const Ctx = createContext<AuthState>({ ...EMPTY, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ ...EMPTY, loading: true });

  useEffect(() => {
    let alive = true;
    let generation = 0;
    let currentUser: string | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load(session: Session | null) {
      if (!session) { generation++; currentUser = null; if (alive) setState(EMPTY); return; }
      const uid = session.user.id;
      if (currentUser === uid) {
        setState((previous) => previous.session ? { ...previous, session } : previous);
        return;
      }
      currentUser = uid;
      const request = ++generation;
      const [{ data: roles }, { data: prof }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("profiles").select("nome, acessos").eq("id", uid).maybeSingle(),
      ]);
      const order: Role[] = ["admin", "gerente", "vendedor", "tecnico"];
      const list = (roles ?? []).map((r) => r.role as Role);
      const role = order.find((r) => list.includes(r)) ?? null;
      if (alive && generation === request) setState({ session, role, nome: prof?.nome || session.user.email || "", acessos: prof?.acessos ?? null, loading: false });
    }
    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      clearTimeout(timer);
      if (event === "SIGNED_OUT") { void load(null); return; }
      if (event === "USER_UPDATED") currentUser = null;
      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") timer = setTimeout(() => { if (alive) void load(session); }, 0);
    });
    return () => { alive = false; generation++; clearTimeout(timer); sub.subscription.unsubscribe(); };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
