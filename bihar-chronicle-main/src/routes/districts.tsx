import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, ArrowRight } from "lucide-react";
import { BIHAR_DISTRICTS } from "@/lib/bihar-districts";
import { absoluteSiteUrl } from "@/lib/seo";
import { DistrictSelectorCard } from "@/components/site/DistrictSelector";

export const Route = createFileRoute("/districts")({
  head: () => ({ meta: [
    { title: "बिहार के 38 जिलों की खबरें — समूचा बिहार" },
    { name: "description", content: "बिहार के सभी 38 जिलों और प्रमुख शहरों की खबरें एक जगह पढ़ें।" },
  ], links: [{ rel: "canonical", href: absoluteSiteUrl("/districts") }] }),
  component: DistrictDirectory,
});

function DistrictDirectory() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <nav className="mb-5 text-xs text-muted-foreground"><Link to="/" className="hover:text-primary">मुखपृष्ठ</Link> / बिहार के जिले</nav>
      <div className="mb-8">
        <span className="text-xs font-bold tracking-widest text-primary">LOCAL EDITION · बिहार</span>
        <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">बिहार के 38 जिले</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">अपने इलाके की खबरें खोजिए — पहले जिला चुनें, फिर चाहें तो शहर भी चुन सकते हैं।</p>
      </div>
      <DistrictSelectorCard />
      <section className="mt-10">
        <h2 className="mb-5 font-display text-2xl font-bold">सभी जिलों की खबरें</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {BIHAR_DISTRICTS.map((district) => (
            <Link key={district.slug} to="/district/$slug" params={{ slug: district.slug }} search={{ city: undefined }}
              className="group flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-4 text-sm font-bold transition hover:border-primary hover:shadow-sm">
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" />{district.name}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
