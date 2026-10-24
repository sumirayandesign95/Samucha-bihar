/** Canonical public URL, consistent for JSON-LD and sitemaps. */
export const SITE_URL = "https://www.samuchabihar.com";
export const absoluteSiteUrl = (path: string) => SITE_URL + (path.startsWith("/") ? path : "/" + path);
export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
