import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL, isLiveEnvironment } from "@/lib/sitemap.server";
export const Route = createFileRoute("/robots.txt")({
  server: { handlers: { GET: async () => {
    const live = isLiveEnvironment();
    const content = live ? [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin",
      "Disallow: /login",
      "Disallow: /bookmarks",
      `Sitemap: ${SITE_URL}/sitemap.xml`,
      `Sitemap: ${SITE_URL}/news-sitemap.xml`,
      "",
    ].join("\n") : "User-agent: *\nDisallow: /\n";
    return new Response(content, { headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=120",
      ...(!live ? { "X-Robots-Tag": "noindex, nofollow" } : {}),
    } });
  } } },
});
