import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getArticle } from "@/lib/news.functions";
import { NewsCard, type Article } from "@/components/site/NewsCard";
import { timeAgoHindi } from "@/lib/format";
import { Share2, Facebook, Twitter, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ArticleBody } from "@/components/site/ArticleBody";

export const Route = createFileRoute("/article/$slug")({
  loader: async ({ params }) => {
    const res = await getArticle({ data: { slug: params.slug } });
    if (!res.article) throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    if (!loaderData?.article) return { meta: [] };
    const a = loaderData.article;
    return {
      meta: [
        { title: `${a.title} — समूचा बिहार` },
        { name: "description", content: a.summary ?? a.subtitle ?? a.title },
        { property: "og:title", content: a.title },
        { property: "og:description", content: a.summary ?? "" },
        ...(a.image_url ? [{ property: "og:image", content: a.image_url }] : []),
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: ArticlePage,
  notFoundComponent: () => (
    <div className="container mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">यह ख़बर नहीं मिली</h1>
      <Link to="/" className="mt-4 inline-block text-primary hover:underline">
        होम पर जाएँ
      </Link>
    </div>
  ),
});

function ArticlePage() {
  const { article: loadedArticle, related } = Route.useLoaderData();
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!loadedArticle) return null;
  const article = loadedArticle;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = encodeURIComponent(article.title);
  const enc = encodeURIComponent(shareUrl);

  return (
    <>
      <div className="fixed left-0 top-0 z-50 h-1 bg-primary transition-all" style={{ width: `${progress}%` }} />
    <article className="container mx-auto max-w-4xl px-4 py-8">
      <nav className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
        <Link to="/" className="hover:text-primary">होम</Link>
        <span>/</span>
        {article.category && (
          <>
            <Link
              to="/category/$slug"
              params={{ slug: article.category.slug }}
              className="hover:text-primary"
            >
              {article.category.name_hi}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="truncate">{article.title}</span>
      </nav>

      {article.category && (
        <span className="inline-block rounded bg-primary/10 text-primary px-2 py-1 text-xs font-bold uppercase tracking-wider">
          {article.category.name_hi}
        </span>
      )}
      <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
        {article.title}
      </h1>
      {article.subtitle && (
        <p className="mt-3 text-lg text-muted-foreground leading-relaxed">{article.subtitle}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-y border-border py-3">
        {article.author && (
          <span>
            लेखक: <Link to="/author/$name" params={{ name: article.author.name }} className="font-semibold text-foreground hover:text-primary">{article.author.name}</Link>
          </span>
        )}
        <span>{timeAgoHindi(article.published_at)}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs flex items-center gap-1"><Share2 className="h-3 w-3" /> शेयर:</span>
          <a target="_blank" rel="noopener" href={`https://wa.me/?text=${shareText}%20${enc}`} className="rounded-md border border-border p-1.5 hover:bg-muted" aria-label="WhatsApp">
            <MessageCircle className="h-4 w-4" />
          </a>
          <a target="_blank" rel="noopener" href={`https://twitter.com/intent/tweet?text=${shareText}&url=${enc}`} className="rounded-md border border-border p-1.5 hover:bg-muted" aria-label="Twitter">
            <Twitter className="h-4 w-4" />
          </a>
          <a target="_blank" rel="noopener" href={`https://www.facebook.com/sharer/sharer.php?u=${enc}`} className="rounded-md border border-border p-1.5 hover:bg-muted" aria-label="Facebook">
            <Facebook className="h-4 w-4" />
          </a>
        </div>
      </div>

      {article.image_url && (
        <img
          src={article.image_url}
          alt={article.title}
          className="mt-6 w-full rounded-xl object-cover aspect-[16/9]"
        />
      )}

      <ArticleBody content={article.content} />

      {article.tags && article.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {article.tags.map((t: string) => (
            <Link key={t} to="/tag/$tag" params={{ tag: t }} className="rounded-full bg-muted px-3 py-1 text-xs hover:bg-primary hover:text-primary-foreground">
              #{t}
            </Link>
          ))}
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold mb-5 border-l-4 border-primary pl-3">
            संबंधित ख़बरें
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {(related as Article[]).map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </article>
    </>
  );
}