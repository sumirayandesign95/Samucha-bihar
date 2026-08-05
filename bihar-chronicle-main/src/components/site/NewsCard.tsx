import { Link } from "@tanstack/react-router";
import { Clock, User, Bookmark, BookmarkCheck } from "lucide-react";
import { timeAgoHindi } from "@/lib/format";
import { useBookmarks } from "@/hooks/use-bookmarks";

export type Article = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  summary?: string | null;
  image_url?: string | null;
  published_at: string | null;
  tags?: string[] | null;
  category?: { slug: string; name_hi: string; name_en: string } | null;
  author?: { name: string; avatar_url?: string | null } | null;
};

export function NewsCard({ article, variant = "feed" }: { article: Article; variant?: "feed" | "compact" | "featured" }) {
  const { isBookmarked, toggle } = useBookmarks();
  const saved = isBookmarked(article.id);
  const onBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle({
      id: article.id,
      slug: article.slug,
      title: article.title,
      image_url: article.image_url,
      summary: article.summary,
      published_at: article.published_at,
      category: article.category,
      author: article.author,
    });
  };

  if (variant === "featured") {
    return (
      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className="group relative block overflow-hidden rounded-2xl bg-card shadow-sm hover:shadow-xl transition-shadow"
      >
        <div className="aspect-[16/10] bg-muted overflow-hidden">
          {article.image_url ? (
            <img
              src={article.image_url}
              alt={article.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <PlaceholderImg />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <button
          onClick={onBookmark}
          aria-label="सहेजें"
          className="absolute top-3 right-3 rounded-full bg-black/40 backdrop-blur p-2 text-white hover:bg-black/60 transition"
        >
          {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </button>
        <div className="absolute bottom-0 p-5 sm:p-6 text-white">
          {article.category && (
            <span className="inline-block bg-primary px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded">
              {article.category.name_hi}
            </span>
          )}
          <h2 className="mt-2 font-display text-lg sm:text-xl lg:text-2xl font-bold leading-snug line-clamp-3 pb-1 group-hover:text-primary-foreground/90">
            {article.title}
          </h2>
          {article.summary && (
            <p className="mt-2 text-xs sm:text-sm text-white/80 line-clamp-2">{article.summary}</p>
          )}
          <Meta article={article} className="mt-3 text-white/70" />
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className="group flex gap-3 py-3 border-b border-border last:border-0"
      >
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
          {article.image_url ? (
            <img src={article.image_url} alt={article.title} className="h-full w-full object-cover group-hover:scale-105 transition" loading="lazy" />
          ) : (
            <PlaceholderImg />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {article.category && (
            <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
              {article.category.name_hi}
            </span>
          )}
          <h3 className="font-display text-sm font-semibold leading-snug line-clamp-2 pb-1 group-hover:text-primary">
            {article.title}
          </h3>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {timeAgoHindi(article.published_at)}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article className="group rounded-xl bg-card border border-border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <Link to="/article/$slug" params={{ slug: article.slug }} className="relative block">
        <div className="aspect-[16/9] bg-muted overflow-hidden">
          {article.image_url ? (
            <img
              src={article.image_url}
              alt={article.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <PlaceholderImg />
          )}
        </div>
        <button
          onClick={onBookmark}
          aria-label="सहेजें"
          className="absolute top-3 right-3 rounded-full bg-black/40 backdrop-blur p-2 text-white hover:bg-black/60 transition"
        >
          {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </button>
      </Link>
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 text-[11px]">
          {article.category && (
            <Link
              to="/category/$slug"
              params={{ slug: article.category.slug }}
              className="rounded bg-primary/10 text-primary px-2 py-0.5 font-semibold uppercase tracking-wider"
            >
              {article.category.name_hi}
            </Link>
          )}
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgoHindi(article.published_at)}
          </span>
        </div>
        <Link to="/article/$slug" params={{ slug: article.slug }}>
          <h3 className="mt-2 font-display text-xl font-bold leading-snug pb-1 text-foreground group-hover:text-primary transition">
            {article.title}
          </h3>
        </Link>
        {article.summary && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {article.summary}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <Meta article={article} />
          <Link
            to="/article/$slug"
            params={{ slug: article.slug }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            पूरी ख़बर →
          </Link>
        </div>
      </div>
    </article>
  );
}

function Meta({ article, className = "" }: { article: Article; className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-[11px] text-muted-foreground ${className}`}>
      {article.author && (
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" /> {article.author.name}
        </span>
      )}
    </div>
  );
}

function PlaceholderImg() {
  return (
    <div className="h-full w-full bg-gradient-to-br from-primary/10 via-muted to-accent/10 flex items-center justify-center">
      <span className="font-display text-3xl text-primary/30">समूचा बिहार</span>
    </div>
  );
}