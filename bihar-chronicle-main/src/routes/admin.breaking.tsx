import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListBreaking, adminUpsertBreaking, adminDeleteBreaking } from "@/lib/admin.functions";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/breaking")({
  component: BreakingAdmin,
});

function BreakingAdmin() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListBreaking);
  const upFn = useServerFn(adminUpsertBreaking);
  const delFn = useServerFn(adminDeleteBreaking);
  const list = useQuery({ queryKey: ["admin-breaking"], queryFn: () => listFn() });
  const [text, setText] = useState("");
  const [link, setLink] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await upFn({ data: { text: text.trim(), link: link.trim() || null, is_active: true, sort_order: 0 } });
    setText(""); setLink("");
    qc.invalidateQueries({ queryKey: ["admin-breaking"] });
  };

  const remove = async (id: string) => {
    await delFn({ data: { id } });
    qc.invalidateQueries({ queryKey: ["admin-breaking"] });
  };

  const toggle = async (id: string, is_active: boolean, t: string) => {
    await upFn({ data: { id, text: t, is_active: !is_active } });
    qc.invalidateQueries({ queryKey: ["admin-breaking"] });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-bold">ब्रेकिंग न्यूज़</h1>
      <form onSubmit={add} className="mt-6 rounded-xl border border-border bg-card p-5 space-y-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="ब्रेकिंग टेक्स्ट" maxLength={400}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required />
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="लिंक (वैकल्पिक, https://...)"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">जोड़ें</button>
      </form>
      <div className="mt-6 rounded-xl border border-border bg-card divide-y divide-border">
        {list.data?.map((b) => (
          <div key={b.id} className="px-5 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm">{b.text}</div>
              {b.link && <div className="text-xs text-muted-foreground truncate">{b.link}</div>}
            </div>
            <button onClick={() => toggle(b.id, b.is_active, b.text)} className={`text-xs rounded-full px-2 py-0.5 ${b.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>
              {b.is_active ? "सक्रिय" : "निष्क्रिय"}
            </button>
            <button onClick={() => remove(b.id)} className="text-destructive p-1.5 hover:bg-destructive/10 rounded">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {list.data?.length === 0 && <p className="px-5 py-8 text-center text-sm text-muted-foreground">कोई ब्रेकिंग आइटम नहीं।</p>}
      </div>
    </div>
  );
}