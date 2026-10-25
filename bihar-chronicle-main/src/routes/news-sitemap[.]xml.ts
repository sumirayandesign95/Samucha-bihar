import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { absoluteSiteUrl } from "@/lib/seo";
import { escapeXml, sitemapHeaders } from "@/lib/sitemap.server";

export const Route = createFileRoute("/news-sitemap.xml")({
  server: { handlers: { GET: async () => {
    try {
      const now = new Date();
      const since = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabaseAdmin.from("news_articles")
        .select("slug,title,published_at").eq("status", "published")
        .gte("published_at", since).lte("published_at", now.toISOString())
        .order("published_at", { ascending: false }).limit(1000);
      if (error) throw new Error("News sitemap source not available");
      const urls = (data ?? []).filter(a => a.slug && a.title && a.published_at).map(a =>
        `<url><loc>${escapeXml(absoluteSiteUrl(`/article/${encodeURIComponent(a.slug)}`))}</loc>` +
        `<news:news><news:publication><news:name>समूचा बिहार</news:name><news:language>hi</news:language></news:publication>` +
        `<news:publication_date>${escapeXml(a.published_at!)}</news:publication_date>` +
        `<news:title>${escapeXml(a.title)}</news:title></news:news></url>`);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${urls.join("\n")}\n</urlset>`,
        { headers: sitemapHeaders() });
    } catch {
      return new Response("News sitemap temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
    }
  } } },
});
