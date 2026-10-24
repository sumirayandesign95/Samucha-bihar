import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListArticles, deleteArticle } from "@/lib/admin.functions";
import { timeAgoHindi } from "@/lib/format";
import { Plus, Trash2, Pencil, Star, Flame } from "lucide-react";

export const Route = createFileRoute("/admin/articles/")({
  component: ArticlesList,
});

function ArticlesList() {
  const listFn = useServerFn(adminListArticles);
  const delFn = useServerFn(deleteArticle);
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["admin-articles"], queryFn: () => listFn() });

  const remove = async (id: string) => {
    if (!confirm("क्या आप वाकई इस ख़बर को हटाना चाहते हैं?")) return;
    await delFn({ data: { id } });
    qc.invalidateQueries({ queryKey: ["admin-articles"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
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
      <div className="mt-6 rounded-xl border border-border bg-card overflow-x-auto">
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
            {list.data?.map((a) => (
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
                  <Link
                    to="/admin/articles/$id"
                    params={{ id: a.id }}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                  >
                    <Pencil className="h-3 w-3" /> संपादित
                  </Link>
                  <button
                    onClick={() => remove(a.id)}
                    className="ml-2 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" /> हटाएँ
                  </button>
                </td>
              </tr>
            ))}
            {list.data?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">अभी कोई ख़बर नहीं है।</td></tr>
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
