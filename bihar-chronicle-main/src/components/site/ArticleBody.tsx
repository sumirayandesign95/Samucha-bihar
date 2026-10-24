import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";

// SSR and the first hydration render must never insert unsanitized editorial HTML.
// Show a safely escaped text-only fallback until client-side DOMPurify is available.
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function ArticleBody({ content }: { content: string }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const html = useMemo(() => {
    if (!content) return "";
    if (!hydrated) {
      // Safe and identical for SSR and the initial browser hydration.
      const plainText = content
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return `<p>${escapeHtml(plainText)}</p>`;
    }

    const looksLikeHtml = /<\/?[a-zA-Z][^>]*>/.test(content);
    const raw = looksLikeHtml
      ? content
      : content
          .split(/\n{2,}/)
          .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br/>")}</p>`)
          .join("");

    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "em", "u", "s", "blockquote",
        "ul", "ol", "li", "h1", "h2", "h3", "h4",
        "a", "img", "figure", "figcaption", "code", "pre", "hr", "span", "div",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title", "class"],
    });
  }, [content, hydrated]);

  return (
    <div
      className="article-body prose prose-lg dark:prose-invert mt-8 max-w-none leading-relaxed text-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
