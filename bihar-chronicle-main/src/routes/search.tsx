import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { searchArticles } from "@/lib/news.functions";
import { NewsCard, type Article } from "@/components/site/NewsCard";
import { z } from "zod";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().optional() }),
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "खोज परिणाम — समूचा बिहार" },
      { name: "description", content: "समूचा बिहार पर ख़बरें खोजें।" },
    ],
  }),
});

function SearchPage() {
  const { q } = Route.useSearch();
  const fn = useServerFn(searchArticles);
  const query = useQuery({
    queryKey: ["search", q],
    queryFn: () => fn({ data: { q: q! } }),
    enabled: !!q && q.length > 0,
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold">
        खोज परिणाम{q ? `: "${q}"` : ""}
      </h1>
      {!q ? (
        <p className="mt-4 text-muted-foreground">हेडर में सर्च बार से ख़बरें खोजें।</p>
      ) : query.isLoading ? (
        <p className="mt-6 text-muted-foreground">खोजा जा रहा है...</p>
      ) : (query.data?.items.length ?? 0) === 0 ? (
        <p className="mt-6 text-muted-foreground">कोई ख़बर नहीं मिली।</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(query.data!.items as Article[]).map((a) => (
            <NewsCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}