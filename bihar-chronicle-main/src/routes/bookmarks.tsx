import { createFileRoute, Link } from "@tanstack/react-router";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { NewsCard, type Article } from "@/components/site/NewsCard";
import { Bookmark } from "lucide-react";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "मेरे बुकमार्क — समूचा बिहार" },
      { name: "description", content: "आपके सहेजे हुए लेख — समूचा बिहार पर।" },
    ],
  }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const { items } = useBookmarks();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 border-l-4 border-primary pl-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">My Library</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold">मेरे बुकमार्क</h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Bookmark className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="mt-4 font-display text-xl font-bold">अभी कोई बुकमार्क नहीं</h2>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto text-sm">
            किसी भी ख़बर पर बुकमार्क आइकन दबाएँ और वह यहाँ पढ़ने के लिए सहेज जाएगी।
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            ख़बरें ब्राउज़ करें
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <NewsCard key={a.id} article={a as unknown as Article} />
          ))}
        </div>
      )}
    </div>
  );
}