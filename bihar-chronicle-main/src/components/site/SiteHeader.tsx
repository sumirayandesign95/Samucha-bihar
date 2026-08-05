import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Menu, Moon, Sun, X, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader({
  categories,
}: {
  categories: { slug: string; name_hi: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [q, setQ] = useState("");
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      navigate({ to: "/search", search: { q: q.trim() } });
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            {/* --- Updated Logo Section Here --- */}
            <img 
              src="/logo of samucha bihar.png" 
              alt="समूचा बिहार लोगो" 
              className="h-10 w-10 rounded-md object-contain shadow-sm"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-display text-lg font-bold tracking-tight text-foreground">
                समूचा बिहार
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Samucha Bihar 
              </span>
            </div>
          </Link>

          <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ख़बरें खोजें..."
                className="w-full rounded-full border border-border bg-muted/50 pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:bg-background transition"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Link
              to="/bookmarks"
              aria-label="बुकमार्क"
              className="p-2 rounded-md hover:bg-muted text-foreground"
            >
              <Bookmark className="h-4 w-4" />
            </Link>
            <button
              onClick={toggleDark}
              className="p-2 rounded-md hover:bg-muted text-foreground"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to={authed ? "/admin" : "/login"}
              className="hidden sm:inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              {authed ? "एडमिन" : "लॉगिन"}
            </Link>
            <button
              className="md:hidden p-2 rounded-md hover:bg-muted"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-2 -mx-4 px-4 scrollbar-none">
          <NavLink to="/" label="होम" />
          {categories.map((c) => (
            <NavLink key={c.slug} to={`/category/${c.slug}`} label={c.name_hi} />
          ))}
          <NavLink to="/about" label="हमारे बारे में" />
          <NavLink to="/contact" label="संपर्क" />
        </nav>

        {open && (
          <div className="md:hidden border-t border-border py-3 space-y-3">
            <form onSubmit={onSearch} className="flex">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ख़बरें खोजें..."
                className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
              />
            </form>
            <div className="flex flex-wrap gap-2">
              <MobileLink onClick={() => setOpen(false)} to="/" label="होम" />
              {categories.map((c) => (
                <MobileLink
                  key={c.slug}
                  onClick={() => setOpen(false)}
                  to={`/category/${c.slug}`}
                  label={c.name_hi}
                />
              ))}
              <MobileLink onClick={() => setOpen(false)} to="/bookmarks" label="बुकमार्क" />
              <MobileLink onClick={() => setOpen(false)} to="/about" label="हमारे बारे में" />
              <MobileLink onClick={() => setOpen(false)} to="/contact" label="संपर्क" />
              <MobileLink
                onClick={() => setOpen(false)}
                to={authed ? "/admin" : "/login"}
                label={authed ? "एडमिन" : "लॉगिन"}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      activeProps={{ className: "text-primary border-primary" }}
      className="whitespace-nowrap border-b-2 border-transparent px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-primary transition"
    >
      {label}
    </Link>
  );
}

function MobileLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
    >
      {label}
    </Link>
  );
}
