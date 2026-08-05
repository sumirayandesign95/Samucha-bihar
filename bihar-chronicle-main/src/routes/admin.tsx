import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { checkAdmin } from "@/lib/admin.functions";
import { LayoutDashboard, FileText, Megaphone, LogOut, Plus, FolderTree, Tags, Users, Image, ClipboardCheck, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "एडमिन — समूचा बिहार" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "anon" | "not-admin" | "admin">("loading");
  const [role, setRole] = useState<string | null>(null);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const checkFn = useServerFn(checkAdmin);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const verify = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setState("anon");
      navigate({ to: "/login", replace: true });
      return;
    }
    setUserEmail(u.user.email ?? u.user.id);
    try {
      const res = await checkFn();
      setState(res.isAdmin ? "admin" : "not-admin");
      setRole(res.role ?? null);
      setCanManageUsers(!!res.canManageUsers);
    } catch {
      setState("not-admin");
    }
  };

  useEffect(() => {
    verify();
    const { data: sub } = supabase.auth.onAuthStateChange(() => verify());
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  if (state === "loading" || state === "anon") {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">लोड हो रहा है...</div>;
  }

  if (state === "not-admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full rounded-2xl border border-border bg-card p-6 sm:p-8 text-center">
          <h1 className="font-display text-2xl font-bold">आपको अभी एडमिन भूमिका नहीं दी गई है</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            आप साइन इन हैं{userEmail ? <> (<span className="font-mono text-foreground/80 break-all">{userEmail}</span>)</> : null},
            लेकिन आपकी कोई स्टाफ़ भूमिका नहीं है। साइट के मालिक से अनुरोध करें कि वे Supabase में
            <span className="font-semibold"> user_roles </span> टेबल में आपकी आईडी के लिए भूमिका
            (<code className="rounded bg-muted px-1.5 py-0.5 text-xs">super_admin</code>,&nbsp;
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">admin</code>,&nbsp;
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">editor</code>, या&nbsp;
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">reporter</code>) जोड़ दें।
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <button onClick={verify} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
              फिर से जाँचें
            </button>
            <button onClick={signOut} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              साइन आउट
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card">
        <Link to="/" className="px-5 py-4 border-b border-border flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-display font-bold">स</div>
          <div>
            <div className="font-display font-bold leading-tight">समूचा बिहार</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin</div>
          </div>
        </Link>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <SideLink to="/admin" exact icon={<LayoutDashboard className="h-4 w-4" />} label="डैशबोर्ड" pathname={pathname} />
          <SideLink to="/admin/articles" icon={<FileText className="h-4 w-4" />} label="ख़बरें" pathname={pathname} />
          <SideLink to="/admin/review" icon={<ClipboardCheck className="h-4 w-4" />} label="Review Queue" pathname={pathname} />
          <SideLink to="/admin/categories" icon={<FolderTree className="h-4 w-4" />} label="Categories" pathname={pathname} />
          <SideLink to="/admin/tags" icon={<Tags className="h-4 w-4" />} label="Tags" pathname={pathname} />
          <SideLink to="/admin/authors" icon={<Users className="h-4 w-4" />} label="Authors" pathname={pathname} />
          <SideLink to="/admin/media" icon={<Image className="h-4 w-4" />} label="Media" pathname={pathname} />
          <SideLink to="/admin/breaking" icon={<Megaphone className="h-4 w-4" />} label="ब्रेकिंग न्यूज़" pathname={pathname} />
          {canManageUsers && (
            <SideLink to="/admin/users" icon={<ShieldCheck className="h-4 w-4" />} label="Users & Roles" pathname={pathname} />
          )}
          <Link
            to="/admin/articles/new"
            className="mt-3 flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> नई ख़बर
          </Link>
        </nav>
        <div className="m-3 space-y-2">
          {role && (
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Signed in as <span className="text-foreground font-semibold">{role.replace("_", " ")}</span>
            </div>
          )}
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
            <LogOut className="h-4 w-4" /> साइन आउट
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="md:hidden border-b border-border bg-card px-4 py-3 flex items-center gap-3 overflow-x-auto">
          <Link to="/admin" className="text-sm font-semibold">डैशबोर्ड</Link>
          <Link to="/admin/articles" className="text-sm">ख़बरें</Link>
          <Link to="/admin/review" className="text-sm">Review</Link>
          <Link to="/admin/categories" className="text-sm">Categories</Link>
          <Link to="/admin/tags" className="text-sm">Tags</Link>
          <Link to="/admin/authors" className="text-sm">Authors</Link>
          <Link to="/admin/media" className="text-sm">Media</Link>
          <Link to="/admin/breaking" className="text-sm">ब्रेकिंग</Link>
          {canManageUsers && <Link to="/admin/users" className="text-sm">Users</Link>}
          <Link to="/admin/articles/new" className="text-sm text-primary">+ नई</Link>
          <button onClick={signOut} className="ml-auto text-sm">साइन आउट</button>
        </header>
        <Outlet />
      </div>
    </div>
  );
}

function SideLink({
  to,
  label,
  icon,
  pathname,
  exact,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  pathname: string;
  exact?: boolean;
}) {
  const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
        active ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-foreground/80"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
