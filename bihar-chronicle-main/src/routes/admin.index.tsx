import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminStats, adminListArticles } from "@/lib/admin.functions";
import { FileText, CheckCircle2, FileEdit, Flame, ClipboardCheck, Clock } from "lucide-react";
import { timeAgoHindi } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const statsFn = useServerFn(adminStats);
  const listFn = useServerFn(adminListArticles);
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn() });
  const recent = useQuery({ queryKey: ["admin-recent"], queryFn: () => listFn() });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-xs font-bold tracking-widest text-primary">SAMUCHA BIHAR · NEWSROOM</span>
          <h1 className="mt-1 font-display text-3xl font-extrabold">न्यूज़रूम डैशबोर्ड</h1>
          <p className="mt-2 text-sm text-muted-foreground">खबरों की स्थिति देखें और अपना संपादकीय काम शुरू करें।</p>
        </div>
        <Link to="/admin/articles/new" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">+ नई खबर लिखें</Link>
      </div>
      {stats.isError && <p role="alert" className="mt-4 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">आंकड़े नहीं खुल पाए। कृपया फिर कोशिश करें।</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="कुल ख़बरें" value={stats.data?.total ?? 0} icon={<FileText className="h-5 w-5" />} />
        <Stat label="प्रकाशित" value={stats.data?.published ?? 0} icon={<CheckCircle2 className="h-5 w-5" />} color="text-green-600" />
        <Stat label="ड्राफ़्ट" value={stats.data?.drafts ?? 0} icon={<FileEdit className="h-5 w-5" />} color="text-amber-600" />
        <Stat label="समीक्षा" value={stats.data?.review ?? 0} icon={<ClipboardCheck className="h-5 w-5" />} color="text-amber-700" />
        <Stat label="शेड्यूल्ड" value={stats.data?.scheduled ?? 0} icon={<Clock className="h-5 w-5" />} color="text-blue-600" />
        <Stat label="ट्रेंडिंग" value={stats.data?.trending ?? 0} icon={<Flame className="h-5 w-5" />} color="text-primary" />
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <Link to="/admin/review" className="rounded-xl border border-border bg-card p-4 transition hover:border-primary">
          <strong className="text-sm">समीक्षा हेतु खबरें</strong><p className="mt-1 text-xs text-muted-foreground">मंजूरी वाली खबरें देखें →</p>
        </Link>
        <Link to="/admin/articles" className="rounded-xl border border-border bg-card p-4 transition hover:border-primary">
          <strong className="text-sm">सभी खबरें</strong><p className="mt-1 text-xs text-muted-foreground">खबरें खोजें और संपादित करें →</p>
        </Link>
        <Link to="/admin/media" className="rounded-xl border border-border bg-card p-4 transition hover:border-primary">
          <strong className="text-sm">मीडिया लाइब्रेरी</strong><p className="mt-1 text-xs text-muted-foreground">फोटो और वीडियो प्रबंधन →</p>
        </Link>
      </div>
      <div className="mt-8 rounded-xl border border-border bg-card">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">हाल की ख़बरें</h2>
          <Link to="/admin/articles" className="text-sm text-primary hover:underline">सभी देखें →</Link>
        </div>
        <div className="divide-y divide-border">
          {recent.data?.slice(0, 8).map((a) => (
            <Link
              key={a.id}
              to="/admin/articles/$id"
              params={{ id: a.id }}
              className="flex items-center justify-between px-5 py-3 hover:bg-muted"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{a.title}</div>
                <div className="text-xs text-muted-foreground">
                  {a.category?.name_hi ?? "—"} · {timeAgoHindi(a.created_at)}
                </div>
              </div>
              <span className={`text-xs rounded-full px-2 py-0.5 ${a.status === "published" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"}`}>
                {a.status === "published" ? "प्रकाशित" : "ड्राफ़्ट"}
              </span>
            </Link>
          ))}
          {recent.isLoading && <p className="px-5 py-6 text-sm text-muted-foreground">खबरें खुल रही हैं...</p>}
          {recent.isError && <p role="alert" className="px-5 py-6 text-sm text-destructive">हाल की खबरों की सूची अभी नहीं खुली।</p>}
          {recent.data?.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">अभी कोई ख़बर नहीं है।</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, color = "text-foreground" }: { label: string; value: number; icon: React.ReactNode; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className={`flex items-center gap-2 ${color}`}>{icon}<span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span></div>
      <div className="mt-2 font-display text-3xl font-bold">{value.toLocaleString("hi-IN")}</div>
    </div>
  );
}