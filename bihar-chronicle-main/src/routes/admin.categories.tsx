import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminDeleteCategory, adminListCategories, adminUpsertCategory } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/categories")({ component: CategoriesAdmin });

function CategoriesAdmin() {
  const listFn = useServerFn(adminListCategories);
  const saveFn = useServerFn(adminUpsertCategory);
  const delFn = useServerFn(adminDeleteCategory);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-cats"], queryFn: () => listFn() });
  const empty = { id: "", slug: "", name_hi: "", name_en: "", sort_order: 0, parent_id: "" };
  const [form, setForm] = useState(empty);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveFn({
      data: {
        ...form,
        id: form.id || undefined,
        sort_order: Number(form.sort_order),
        parent_id: form.parent_id || null,
      },
    });
    setForm(empty);
    qc.invalidateQueries({ queryKey: ["admin-cats"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };
  const parents = data.filter((c) => !c.parent_id);
  const nameById = new Map(data.map((c) => [c.id, c.name_hi]));
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="font-display text-3xl font-bold">Category Management</h1>
      <form onSubmit={save} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-6">
        <input required placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input" />
        <input required placeholder="हिन्दी नाम" value={form.name_hi} onChange={(e) => setForm({ ...form, name_hi: e.target.value })} className="input" />
        <input required placeholder="English name" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="input" />
        <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="input">
          <option value="">— Top-level —</option>
          {parents.filter((p) => p.id !== form.id).map((p) => <option key={p.id} value={p.id}>{p.name_hi}</option>)}
        </select>
        <input type="number" placeholder="Order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="input" />
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{form.id ? "Update" : "Add"}</button>
      </form>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {data.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 last:border-0">
            <div>
              <div className="font-semibold">
                {c.parent_id && <span className="text-muted-foreground">{nameById.get(c.parent_id) ?? "?"} › </span>}
                {c.name_hi} / {c.name_en}
              </div>
              <div className="text-xs text-muted-foreground">/{c.slug} · order {c.sort_order}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setForm({ ...empty, ...c, parent_id: c.parent_id ?? "" } as typeof empty)}
                className="rounded-md border border-border px-3 py-1 text-sm"
              >
                Edit
              </button>
              <button onClick={async () => { if (confirm("Delete category?")) { await delFn({ data: { id: c.id } }); qc.invalidateQueries({ queryKey: ["admin-cats"] }); } }} className="rounded-md border border-border px-3 py-1 text-sm text-destructive">Delete</button>
            </div>
          </div>
        ))}
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:.5rem;padding:.55rem .75rem;font-size:.875rem}`}</style>
    </div>
  );
}
