import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Menu, Moon, Sun, X, Bookmark, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type CategoryLink = { slug: string; name_hi: string };

export function SiteHeader({ categories }: { categories: CategoryLink[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    const isDark = theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(!!session));
    return () => authSubscription.subscription.unsubscribe();
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    navigate({ to: "/search", search: { q: query.trim() } });
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 bg-background shadow-sm">
      <div className="hidden border-b border-border lg:block">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-[11px] text-muted-foreground">
          <span>बिहार की खबरें, पूरी जिम्मेदारी के साथ</span>
          <div className="flex items-center gap-5">
            <Link to="/about" className="hover:text-primary">हमारे बारे में</Link>
            <Link to="/contact" className="hover:text-primary">संपर्क करें</Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex min-h-18 items-center justify-between gap-3 py-3 sm:min-h-22">
          <p className="hidden max-w-52 text-xs leading-6 text-muted-foreground lg:block">
            <span className="mb-1 block font-semibold text-primary">समाचार · विश्लेषण · रिपोर्ट</span>
            बिहार से लेकर देश-दुनिया तक, आपके लिए जरूरी खबरें
          </p>

          <Link to="/" aria-label="समूचा बिहार — मुखपृष्ठ" className="flex items-center gap-3 sm:gap-4">
            <img
              src="/logo of samucha bihar.png"
              alt="समूचा बिहार का आधिकारिक लोगो"
              width="60"
              height="60"
              className="h-12 w-12 rounded-md object-contain sm:h-15 sm:w-15"
            />
            <div className="leading-tight">
              <strong className="block font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                समूचा <span className="text-primary">बिहार</span>
              </strong>
              <span className="mt-1 block text-[9px] font-bold tracking-[0.2em] text-muted-foreground sm:text-[11px]">
                SAMUCHA BIHAR · हिन्दी समाचार
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <form className="relative mr-2 hidden xl:block" onSubmit={submitSearch} role="search">
              <label className="sr-only" htmlFor="desktop-news-search">खबरें खोजें</label>
              <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="desktop-news-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="खबरें खोजें..."
                className="w-52 rounded-full border border-border bg-muted/40 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-background"
              />
            </form>
            <Link to="/bookmarks" aria-label="सहेजी गई खबरें" title="सहेजी गई खबरें" className="rounded-lg p-2.5 text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
              <Bookmark className="h-5 w-5" />
            </Link>
            <button type="button" onClick={toggleTheme} title={dark ? "लाइट मोड" : "डार्क मोड"} aria-label={dark ? "लाइट मोड चालू करें" : "डार्क मोड चालू करें"} className="rounded-lg p-2.5 hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link to={signedIn ? "/admin" : "/login"} className="ml-1 hidden items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-bold hover:bg-muted sm:flex">
              {signedIn ? "एडमिन" : "लॉगिन"} <ArrowUpRight className="h-3 w-3" />
            </Link>
            <button
              type="button"
              aria-label={menuOpen ? "मेन्यू बंद करें" : "मेन्यू खोलें"}
              aria-expanded={menuOpen}
              aria-controls="mobile-news-navigation"
              onClick={() => setMenuOpen((v) => !v)}
              className="ml-1 rounded-lg border border-border p-2.5 lg:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <nav aria-label="मुख्य समाचार श्रेणियां" className="hidden bg-[#171b22] text-white lg:block">
        <div className="container mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4">
          <DesktopLink to="/" label="मुखपृष्ठ" />
          {categories.map((category) => (
            <DesktopLink key={category.slug} to={`/category/${category.slug}`} label={category.name_hi} />
          ))}
          <DesktopLink to="/about" label="परिचय" />
        </div>
      </nav>

      {menuOpen && (
        <div id="mobile-news-navigation" className="border-t border-border bg-background p-4 lg:hidden">
          <form onSubmit={submitSearch} className="relative" role="search">
            <label className="sr-only" htmlFor="mobile-news-search">खबरें खोजें</label>
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="mobile-news-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="खबरें खोजें..."
              className="w-full rounded-md border border-border bg-muted/40 py-3 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
            />
            <button type="submit" className="sr-only">खोजें</button>
          </form>
          <nav aria-label="मोबाइल समाचार श्रेणियां" className="mt-4 grid grid-cols-2 gap-2">
            <MobileLink to="/" label="मुखपृष्ठ" close={() => setMenuOpen(false)} />
            {categories.map((category) => (
              <MobileLink key={category.slug} to={`/category/${category.slug}`} label={category.name_hi} close={() => setMenuOpen(false)} />
            ))}
            <MobileLink to="/about" label="हमारे बारे में" close={() => setMenuOpen(false)} />
            <MobileLink to="/contact" label="संपर्क" close={() => setMenuOpen(false)} />
            <MobileLink to={signedIn ? "/admin" : "/login"} label={signedIn ? "एडमिन" : "लॉगिन"} close={() => setMenuOpen(false)} />
          </nav>
        </div>
      )}
    </header>
  );
}

function DesktopLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      activeProps={{ className: "border-primary text-white bg-white/10" }}
      className="whitespace-nowrap border-b-[3px] border-transparent px-4 py-3.5 text-[13px] font-bold text-white/85 transition hover:border-primary hover:bg-white/10 hover:text-white"
    >
      {label}
    </Link>
  );
}

function MobileLink({ to, label, close }: { to: string; label: string; close: () => void }) {
  return (
    <Link to={to} onClick={close} className="rounded-md border border-border p-3 text-sm font-semibold hover:border-primary hover:text-primary">
      {label}
    </Link>
  );
}
