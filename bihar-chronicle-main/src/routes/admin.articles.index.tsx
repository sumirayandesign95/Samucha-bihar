import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListArticles, deleteArticle, checkAdmin } from "@/lib/admin.functions";
import { timeAgoHindi } from "@/lib/format";
import { Plus, Trash2, Pencil, Star, Flame, Search, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/articles/")({
  component: ArticlesList,
});

function ArticlesList() {
  const listFn = useServerFn(adminListArticles);
  const delFn = useServerFn(deleteArticle);
  const qc = useQueryClient();
  const [search,setSearch] = useState("");
  const [status,setStatus] = useState("all");
  const [actionError,setActionError] = useState("");
  const [deleting,setDeleting] = useState<string|null>(null);
  const list = useQuery({ queryKey: ["admin-articles"], queryFn: () => listFn() });
  const meFn = useServerFn(checkAdmin);
  const me = useQuery({ queryKey: ["admin-me"], queryFn: () => meFn() });
  const canDelete = !!me.data?.canPublish;
  const isReporter = me.data?.role === "reporter";

  const filtered = useMemo(() => (list.data ?? []).filter(a => (status === "all" || a.status === status) && (!search.trim() || a.title.toLowerCase().includes(search.trim().toLowerCase()) || a.slug.toLowerCase().includes(search.trim().toLowerCase()))), [list.data,search,status]);

  const remove = async (id: string) => {
    if (!canDelete) return;
    if (!confirm("क्या आप वाकई इस ख़बर को हटाना चाहते हैं?")) return;
    setDeleting(id); setActionError("");
    try {
      await delFn({ data: { id } });
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-recent"] });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "खबर नहीं हटाई जा सकी।");
    } finally { setDeleting(null); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">ख़बरें</h1>
        <Link
          to="/admin/articles/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> नई ख़बर
        </Link>
      </div>
      <div className="mt-5 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_190px_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <span className="sr-only">खबरें खोजें</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="खबर के शीर्षक से खोजें..." className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none" />
        </label>
        <label>
          <span className="sr-only">खबर की स्थिति चुनें</span>
          <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none">
            <option value="all">सभी खबरें</option>
            <option value="published">प्रकाशित</option>
            <option value="draft">ड्राफ्ट</option>
            <option value="review">समीक्षा</option>
            <option value="scheduled">शेड्यूल्ड</option>
          </select>
        </label>
        <button type="button" disabled={list.isFetching} onClick={() => list.refetch()} className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-bold hover:border-primary disabled:opacity-50">
          <RefreshCw className="h-4 w-4" /> रीफ्रेश
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{list.isLoading ? "लोड हो रहा है..." : `${filtered.length} खबरें दिखाई जा रही हैं`}</p>
      {actionError && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{actionError}</p>}
      {list.isError && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">खबरों की सूची अभी नहीं खुल पाई। रीफ्रेश करके देखें।</p>}
      <div className="mt-3 rounded-xl border border-border bg-card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">शीर्षक</th>
              <th className="px-4 py-3">श्रेणी</th>
              <th className="px-4 py-3">स्थिति</th>
              <th className="px-4 py-3">फ़्लैग</th>
              <th className="px-4 py-3">समय</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium max-w-xs truncate">{a.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.category?.name_hi ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-4 py-3 flex gap-1 text-xs">
                  {a.is_featured && <Star className="h-3.5 w-3.5 text-primary" />}
                  {a.is_trending && <Flame className="h-3.5 w-3.5 text-amber-600" />}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{timeAgoHindi(a.created_at)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {(!isReporter || a.status !== "published") && <Link
                    to="/admin/articles/$id"
                    params={{ id: a.id }}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                  >
                    <Pencil className="h-3 w-3" /> संपादित
                  </Link>}
                  {canDelete && <button
                    onClick={() => remove(a.id)}
                    disabled={deleting !== null}
                    className="ml-2 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" /> हटाएँ
                  </button>}
                </td>
              </tr>
            ))}
            {!list.isLoading && !list.isError && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">इस खोज या फ़िल्टर में कोई खबर नहीं मिली।</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    draft: "bg-muted text-foreground/70",
    review: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  };
  const labels: Record<string, string> = {
    published: "प्रकाशित",
    draft: "ड्राफ़्ट",
    review: "समीक्षा",
    scheduled: "शेड्यूल्ड",
  };
  return (
    <span className={`text-xs rounded-full px-2 py-0.5 ${styles[status] ?? styles.draft}`}>
      {labels[status] ?? status}
    </span>
  );
}
