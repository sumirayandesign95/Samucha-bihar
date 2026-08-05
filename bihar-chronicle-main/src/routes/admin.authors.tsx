import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminDeleteAuthor, adminListAuthors, adminUpsertAuthor } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/authors")({ component: AuthorsAdmin });

function AuthorsAdmin() {
  const listFn = useServerFn(adminListAuthors);
  const saveFn = useServerFn(adminUpsertAuthor);
  const delFn = useServerFn(adminDeleteAuthor);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-authors"], queryFn: () => listFn() });
  const empty = { id: "", name: "", bio: "", avatar_url: "", email: "", x_url: "", facebook_url: "", linkedin_url: "" };
  const [form, setForm] = useState(empty);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveFn({ data: { ...form, id: form.id || undefined } });
    setForm(empty);
    qc.invalidateQueries({ queryKey: ["admin-authors"] });
  };
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="font-display text-3xl font-bold">Author Management</h1>
      <form onSubmit={save} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
        <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        <input placeholder="Avatar URL" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} className="input" />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
        <input placeholder="X/Twitter URL" value={form.x_url} onChange={(e) => setForm({ ...form, x_url: e.target.value })} className="input" />
        <input placeholder="Facebook URL" value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} className="input" />
        <input placeholder="LinkedIn URL" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} className="input" />
        <textarea placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input md:col-span-2" />
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground md:col-span-2">{form.id ? "Update author" : "Create author"}</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex gap-3">
              {a.avatar_url && <img src={a.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />}
              <div><div className="font-semibold">{a.name}</div><p className="text-sm text-muted-foreground line-clamp-2">{a.bio}</p></div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setForm({ ...empty, ...Object.fromEntries(Object.entries(a).map(([key, value]) => [key, value ?? ""])) } as typeof empty)} className="rounded-md border border-border px-3 py-1 text-sm">Edit</button>
              <button onClick={async () => { if (confirm("Delete author?")) { await delFn({ data: { id: a.id } }); qc.invalidateQueries({ queryKey: ["admin-authors"] }); } }} className="rounded-md border border-border px-3 py-1 text-sm text-destructive">Delete</button>
            </div>
          </div>
        ))}
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:.5rem;padding:.55rem .75rem;font-size:.875rem}`}</style>
    </div>
  );
}
