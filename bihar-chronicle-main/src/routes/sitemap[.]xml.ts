import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { BIHAR_DISTRICTS } from "@/lib/bihar-districts";
import { absoluteSiteUrl } from "@/lib/seo";
import { escapeXml, sitemapHeaders } from "@/lib/sitemap.server";

function urlEntry(path: string, updated?: string | null) {
  const lastmod = updated && !Number.isNaN(Date.parse(updated))
    ? `<lastmod>${new Date(updated).toISOString()}</lastmod>` : "";
  return `<url><loc>${escapeXml(absoluteSiteUrl(path))}</loc>${lastmod}</url>`;
}
export const Route = createFileRoute("/sitemap.xml")({
  server: { handlers: { GET: async () => {
    try {
      const [articles, categories] = await Promise.all([
        supabaseAdmin.from("news_articles").select("slug,updated_at,published_at,tags").eq("status", "published").order("published_at", { ascending: false }).limit(1000),
        supabaseAdmin.from("categories").select("slug").order("sort_order"),
      ]);
      if (articles.error || categories.error) throw new Error("Sitemap source not available");
      const rows = (articles.data ?? []).filter(row => !!row.slug);
      const taggedDistricts = new Set<string>();
      for (const row of rows) for (const tag of row.tags ?? [])
        if (typeof tag === "string" && tag.startsWith("जिला:")) taggedDistricts.add(tag.slice(5));
      const urls = [
        urlEntry("/"), urlEntry("/districts"), urlEntry("/about"), urlEntry("/contact"),
        ...(categories.data ?? []).filter(c => c.slug).map(c => urlEntry(`/category/${encodeURIComponent(c.slug)}`)),
        ...BIHAR_DISTRICTS.filter(d => taggedDistricts.has(d.slug)).map(d => urlEntry(`/district/${d.slug}`)),
        ...rows.map(row => urlEntry(`/article/${encodeURIComponent(row.slug)}`, row.updated_at || row.published_at)),
      ];
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`, { headers: sitemapHeaders() });
    } catch {
      return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
    }
  } } },
});
