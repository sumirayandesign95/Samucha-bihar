import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminListReviewQueue, adminApproveArticle, adminRejectArticle } from "@/lib/admin.functions";
import { timeAgoHindi } from "@/lib/format";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/admin/review")({ component: ReviewQueue });

function ReviewQueue() {
  const listFn = useServerFn(adminListReviewQueue);
  const approveFn = useServerFn(adminApproveArticle);
  const rejectFn = useServerFn(adminRejectArticle);
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-review"], queryFn: () => listFn() });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [scheduleAt, setScheduleAt] = useState<Record<string, string>>({});

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-review"] });
    qc.invalidateQueries({ queryKey: ["admin-articles"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const approve = async (id: string) => {
    setBusyId(id); setActionError("");
    try {
      const at = scheduleAt[id];
      if (at && new Date(at).getTime() <= Date.now()) { setActionError("शेड्यूल के लिए भविष्य का समय चुनें।"); return; }
      await approveFn({ data: { id, publishAt: at ? new Date(at).toISOString() : null } });
      invalidate();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "प्रकाशन विफल हुआ।");
    } finally {
      setBusyId(null);
    }
  };
  const reject = async (id: string) => {
    const note = prompt("अस्वीकृति का कारण लिखें (रिपोर्टर को दिखेगा):");
    if (!note?.trim()) return;
    setBusyId(id);
    try {
      await rejectFn({ data: { id, note: note.trim() } });
      invalidate();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "समीक्षा अपडेट विफल हुआ।");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-bold">समीक्षा हेतु खबरें</h1>
      <p className="text-sm text-muted-foreground mt-1">संपादक द्वारा जाँच और स्वीकृति के लिए भेजी गई खबरें।</p>

      {actionError && <p role="alert" className="mt-4 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{actionError}</p>}
      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">लोड हो रहा है...</p>}
        {!isLoading && data.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            इस समय समीक्षा के लिए कोई खबर नहीं है।
          </div>
        )}
        {data.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to="/admin/articles/$id" params={{ id: a.id }} className="font-semibold hover:text-primary">
                  {a.title}
                </Link>
                <div className="text-xs text-muted-foreground mt-1">
                  {a.category?.name_hi ?? "—"} · {a.author?.name ?? "—"} · {timeAgoHindi(a.updated_at ?? a.created_at)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="datetime-local"
                  value={scheduleAt[a.id] ?? ""}
                  onChange={(e) => setScheduleAt({ ...scheduleAt, [a.id]: e.target.value })}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                  title="प्रकाशन का समय चुनें (वैकल्पिक)"
                />
                <button
                  disabled={busyId === a.id}
                  onClick={() => approve(a.id)}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {scheduleAt[a.id] ? "शेड्यूल करें" : "प्रकाशित करें"}
                </button>
                <button
                  disabled={busyId === a.id}
                  onClick={() => reject(a.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-destructive disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" /> अस्वीकार करें
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}