import { useMemo } from "react";
import DOMPurify from "dompurify";

// Renders article content. If the string looks like HTML (has a tag),
// sanitize and render as HTML. Otherwise split plain text into paragraphs.
export function ArticleBody({ content }: { content: string }) {
  const html = useMemo(() => {
    if (!content) return "";
    const looksLikeHtml = /<\/?[a-zA-Z][^>]*>/.test(content);
    const raw = looksLikeHtml
      ? content
      : content
          .split(/\n{2,}/)
          .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
          .join("");
    if (typeof window === "undefined") return raw; // SSR: skip; hydrate later
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        "p","br","strong","em","u","s","blockquote","ul","ol","li",
        "h1","h2","h3","h4","a","img","figure","figcaption","code","pre","hr","span","div",
      ],
      ALLOWED_ATTR: ["href","target","rel","src","alt","title","class"],
    });
  }, [content]);

  return (
    <div
      className="article-body prose prose-lg dark:prose-invert mt-8 max-w-none leading-relaxed text-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}