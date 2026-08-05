import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Role = "super_admin" | "admin" | "editor" | "reporter";

export const STAFF: Role[] = ["super_admin", "admin", "editor", "reporter"];
export const EDITOR_PLUS: Role[] = ["super_admin", "admin", "editor"];

export function getAdminClient() {
  return supabaseAdmin;
}

export async function getRoles(userId: string): Promise<Role[]> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.role as Role);
}

export function highestRole(roles: Role[]): Role | null {
  for (const r of ["super_admin", "admin", "editor", "reporter"] as Role[]) {
    if (roles.includes(r)) return r;
  }
  return null;
}

export async function requireStaff(userId: string): Promise<Role> {
  const roles = await getRoles(userId);
  const top = highestRole(roles);
  if (!top || !STAFF.includes(top)) throw new Error("Forbidden: staff role required");
  return top;
}

export async function requireEditor(userId: string): Promise<Role> {
  const top = await requireStaff(userId);
  if (!EDITOR_PLUS.includes(top)) throw new Error("Forbidden: editor role required");
  return top;
}

export async function requireSuperAdmin(userId: string): Promise<void> {
  const top = await requireStaff(userId);
  if (top !== "super_admin") throw new Error("Forbidden: super admin only");
}