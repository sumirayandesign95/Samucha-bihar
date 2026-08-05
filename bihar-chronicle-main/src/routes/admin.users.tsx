import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  adminListUsers,
  adminAssignRole,
  adminRemoveRole,
  checkAdmin,
} from "@/lib/admin.functions";
import { ShieldCheck, X } from "lucide-react";

export const Route = createFileRoute("/admin/users")({ component: UsersAdmin });

const ROLES = ["super_admin", "admin", "editor", "reporter"] as const;
const LABELS: Record<(typeof ROLES)[number], string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
  reporter: "Reporter",
};

function UsersAdmin() {
  const meFn = useServerFn(checkAdmin);
  const listFn = useServerFn(adminListUsers);
  const assignFn = useServerFn(adminAssignRole);
  const removeFn = useServerFn(adminRemoveRole);
  const qc = useQueryClient();

  const me = useQuery({ queryKey: ["admin-me"], queryFn: () => meFn() });
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listFn(),
    enabled: !!me.data?.canManageUsers,
  });
  const [pending, setPending] = useState<{ user: string; role: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (me.isLoading) return <p className="p-6 text-sm text-muted-foreground">लोड...</p>;
  if (!me.data?.canManageUsers) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="mt-3 font-display text-2xl font-bold">Super Admin only</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Only Super Admins can manage user roles.
          </p>
        </div>
      </div>
    );
  }

  const run = async (fn: typeof assignFn | typeof removeFn, args: { userId: string; role: (typeof ROLES)[number] }) => {
    setPending({ user: args.userId, role: args.role });
    setErr(null);
    try {
      await fn({ data: args });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) {
      setErr(e.message ?? "Error");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-bold">User Roles</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Grant any combination of Super Admin / Admin / Editor / Reporter to each signed-up user.
      </p>
      {err && <p className="mt-3 text-sm text-destructive">{err}</p>}

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Current roles</th>
              <th className="px-4 py-3 text-right">Grant role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.data?.map((u) => {
              const available = ROLES.filter((r) => !u.roles.includes(r));
              return (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.email ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {u.last_sign_in_at ? `Last seen ${new Date(u.last_sign_in_at).toLocaleDateString()}` : "Never signed in"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {u.roles.length === 0 && <span className="text-xs text-muted-foreground">No roles</span>}
                      {u.roles.map((r) => (
                        <span key={r} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {LABELS[r as (typeof ROLES)[number]] ?? r}
                          <button
                            disabled={pending?.user === u.id && pending.role === r}
                            onClick={() => run(removeFn, { userId: u.id, role: r as (typeof ROLES)[number] })}
                            className="hover:text-destructive"
                            title="Remove"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {available.length > 0 ? (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            run(assignFn, { userId: u.id, role: e.target.value as (typeof ROLES)[number] });
                            e.target.value = "";
                          }
                        }}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                        defaultValue=""
                      >
                        <option value="">+ Add role…</option>
                        {available.map((r) => (
                          <option key={r} value={r}>{LABELS[r]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-muted-foreground">All assigned</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {users.data?.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
