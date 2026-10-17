import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleEnum = z.enum(["admin", "gerente", "vendedor", "tecnico"]);

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Apenas administradores podem gerenciar usuários.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context);
    const [{ data: profiles }, { data: roles }, { data: auth }] = await Promise.all([
      admin.from("profiles").select("id, nome, email, created_at").order("created_at"),
      admin.from("user_roles").select("user_id, role"),
      admin.auth.admin.listUsers({ perPage: 200 }),
    ]);
    const last = new Map((auth?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null]));
    return (profiles ?? []).map((p) => ({
      ...p,
      role: (roles ?? []).find((r) => r.user_id === p.id)?.role ?? null,
      ultimo_acesso: last.get(p.id) ?? null,
    }));
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      nome: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(255),
      senha: z.string().min(8).max(72),
      role: roleEnum,
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    const { data: created, error } = await admin.auth.admin.createUser({
      email: data.email, password: data.senha, email_confirm: true, user_metadata: { nome: data.nome },
    });
    if (error || !created.user) throw new Error(error?.message.includes("already") ? "Este e-mail já está cadastrado." : "Não foi possível criar o usuário.");
    await admin.from("user_roles").delete().eq("user_id", created.user.id);
    await admin.from("user_roles").insert({ user_id: created.user.id, role: data.role });
    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), role: roleEnum }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    if (data.userId === context.userId && data.role !== "admin") throw new Error("Você não pode remover seu próprio acesso de administrador.");
    await admin.from("user_roles").delete().eq("user_id", data.userId);
    await admin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    return { ok: true };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), senha: z.string().min(8).max(72) }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    const { error } = await admin.auth.admin.updateUserById(data.userId, { password: data.senha });
    if (error) throw new Error("Não foi possível alterar a senha.");
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Você não pode excluir a própria conta.");
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error("Não foi possível excluir o usuário.");
    return { ok: true };
  });
