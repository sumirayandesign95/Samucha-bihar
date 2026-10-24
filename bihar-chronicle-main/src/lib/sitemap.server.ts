import { SITE_URL } from "@/lib/seo";
export { SITE_URL };
export function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&apos;" })[char] ?? char);
}
export const isLiveEnvironment = () => process.env.VERCEL_ENV === "production";
export const sitemapHeaders = () => ({
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  ...(!isLiveEnvironment() ? { "X-Robots-Tag": "noindex, nofollow" } : {}),
});
