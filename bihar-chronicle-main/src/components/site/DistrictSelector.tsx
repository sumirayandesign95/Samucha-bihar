import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { MapPin, ArrowRight } from "lucide-react";
import { BIHAR_DISTRICTS, findDistrict } from "@/lib/bihar-districts";

export function DistrictSelector({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("samucha-preferred-district") ?? "";
      if (findDistrict(saved)) setDistrict(saved);
    } catch {
      // Preferences are optional; the selector works without localStorage.
    }
  }, []);
  const districtData = findDistrict(district);
  function navigateToDistrict(e: React.FormEvent) {
    e.preventDefault();
    if (!districtData) return;
    try { localStorage.setItem("samucha-preferred-district", districtData.slug); } catch { /* optional */ }
    navigate({ to: "/district/$slug", params: { slug: districtData.slug }, search: { city: city || undefined } });
  }

  return (
    <form onSubmit={navigateToDistrict} className={compact ? "flex flex-wrap items-end gap-2" : "grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"}>
      <label className="block min-w-0 flex-1 text-xs font-bold">
        <span className="mb-1.5 block text-muted-foreground">अपना जिला चुनें</span>
        <select
          aria-label="जिला चुनें"
          className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
          value={district}
          onChange={(e) => { setDistrict(e.target.value); setCity(""); }}
        >
          <option value="">— बिहार के 38 जिले —</option>
          {BIHAR_DISTRICTS.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
        </select>
      </label>
      <label className="block min-w-0 flex-1 text-xs font-bold">
        <span className="mb-1.5 block text-muted-foreground">शहर / क्षेत्र (वैकल्पिक)</span>
        <select
          aria-label="शहर चुनें"
          className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={!districtData}
        >
          <option value="">पूरा जिला</option>
          {districtData?.cities.map((town) => <option key={town.slug} value={town.slug}>{town.name}</option>)}
        </select>
      </label>
      <button
        type="submit"
        disabled={!districtData}
        className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        खबरें देखें <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

export function DistrictSelectorCard() {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-7" aria-label="जिला और शहर की खबरें चुनें">
      <div className="mb-5 flex items-start gap-3">
        <span className="rounded-xl bg-primary/10 p-3 text-primary"><MapPin className="h-5 w-5" /></span>
        <div>
          <span className="text-[10px] font-bold tracking-[0.12em] text-primary">LOCAL NEWS · स्थानीय खबरें</span>
          <h2 className="mt-1 font-display text-xl font-extrabold sm:text-2xl">आपका शहर, आपकी खबर</h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground sm:text-sm">बिहार का अपना जिला और शहर चुनकर स्थानीय समाचार पढ़ें।</p>
        </div>
      </div>
      <DistrictSelector />
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <span className="mr-1 text-xs font-semibold text-muted-foreground">सीधे जिला खोलें:</span>
        {["patna", "gaya", "muzaffarpur", "darbhanga", "bhagalpur", "purnia"].map((slug) => {
          const district = findDistrict(slug);
          return district ? (
            <Link
              key={district.slug}
              to="/district/$slug"
              params={{ slug: district.slug }}
              search={{ city: undefined }}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold hover:border-primary hover:text-primary"
            >
              {district.name}
            </Link>
          ) : null;
        })}
        <Link to="/districts" className="ml-auto text-xs font-bold text-primary underline underline-offset-4">
          सभी 38 जिले
        </Link>
      </div>
    </section>
  );
}
