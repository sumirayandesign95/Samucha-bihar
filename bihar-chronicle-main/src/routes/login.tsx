import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "एडमिन लॉगिन — समूचा बिहार" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/admin", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo("खाता बन गया। कृपया ईमेल में आए लिंक से पुष्टि करें, फिर लॉगिन करें।");
        }
      }
    } catch (e: any) {
      setErr(e.message ?? "त्रुटि हुई");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground font-display font-bold text-2xl">
              स
            </div>
            <div>
              <div className="font-display text-xl font-bold">समूचा बिहार</div>
              <div className="text-xs text-muted-foreground">Admin Panel</div>
            </div>
          </div>
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="font-display text-2xl font-bold">
            {mode === "signin" ? "लॉगिन" : "नया खाता बनाएँ"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "ईमेल और पासवर्ड से साइन इन करें।"
              : "ईमेल और पासवर्ड से नया खाता बनाएँ। एडमिन भूमिका मालिक द्वारा असाइन की जाती है।"}
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium">ईमेल</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium">पासवर्ड</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            {err && <div className="text-sm text-destructive">{err}</div>}
            {info && <div className="rounded-md bg-primary/10 p-3 text-sm text-foreground">{info}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "..." : mode === "signin" ? "साइन इन" : "खाता बनाएँ"}
            </button>
          </form>
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 text-xs text-muted-foreground hover:text-primary"
          >
            {mode === "signin" ? "नया खाता बनाएँ →" : "← पहले से खाता है? लॉगिन करें"}
          </button>
        </div>
        <Link to="/" className="mt-4 block text-center text-xs text-muted-foreground hover:text-primary">
          ← होम पर वापस जाएँ
        </Link>
      </div>
    </div>
  );
}