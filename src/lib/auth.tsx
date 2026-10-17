import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "./permissions";

type AuthState = { session: Session | null; role: Role | null; nome: string; loading: boolean };
const Ctx = createContext<AuthState>({ session: null, role: null, nome: "", loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, role: null, nome: "", loading: true });

  useEffect(() => {
    let alive = true;
    async function load(session: Session | null) {
      if (!session) { if (alive) setState({ session: null, role: null, nome: "", loading: false }); return; }
      const uid = session.user.id;
      const [{ data: roles }, { data: prof }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("profiles").select("nome").eq("id", uid).maybeSingle(),
      ]);
      const order: Role[] = ["admin", "gerente", "vendedor", "tecnico"];
      const list = (roles ?? []).map((r) => r.role as Role);
      const role = order.find((r) => list.includes(r)) ?? null;
      if (alive) setState({ session, role, nome: prof?.nome || session.user.email || "", loading: false });
    }
    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") setTimeout(() => load(session), 0);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
