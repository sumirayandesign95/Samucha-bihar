import { createFileRoute, notFound } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listFeed, listCategories } from "@/lib/news.functions";
import { NewsCard, type Article } from "@/components/site/NewsCard";
import { absoluteSiteUrl } from "@/lib/seo";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params, context }) => {
    const cats = await context.queryClient.ensureQueryData({
      queryKey: ["categories"],
      queryFn: () => listCategories(),
    });
    const cat = cats.find((c) => c.slug === params.slug);
    if (!cat) throw notFound();
    const first = await listFeed({ data: { category: params.slug, limit: 12 } });
    return { cat, first };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.cat.name_hi} — समूचा बिहार` },
          { name: "description", content: `${loaderData.cat.name_hi} की ताज़ा हिन्दी ख़बरें।` },
        ]
      : [],
    links: loaderData ? [{ rel: "canonical", href: absoluteSiteUrl(`/category/${encodeURIComponent(loaderData.cat.slug)}`) }] : [],
  }),
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="container mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">श्रेणी नहीं मिली</h1>
    </div>
  ),
});

function CategoryPage() {
  const { cat, first } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const feedFn = useServerFn(listFeed);

  const feed = useInfiniteQuery({
    queryKey: ["category-feed", slug],
    queryFn: ({ pageParam }) =>
      feedFn({ data: { category: slug, cursor: pageParam as string | null, limit: 12 } }),
    initialPageParam: first.nextCursor,
    getNextPageParam: (last) => last.nextCursor,
    initialData: {
      pages: [{ items: first.items as Article[], nextCursor: first.nextCursor }],
      pageParams: [null],
    },
  });

  const items = feed.data?.pages.flatMap((p) => p.items as Article[]) ?? [];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 border-l-4 border-primary pl-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{cat.name_en}</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold">{cat.name_hi}</h1>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          इस श्रेणी में अभी कोई ख़बर नहीं है।
        </p>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            {feed.hasNextPage && (
              <button
                onClick={() => feed.fetchNextPage()}
                disabled={feed.isFetchingNextPage}
                className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50"
              >
                {feed.isFetchingNextPage ? "लोड हो रहा है..." : "और दिखाएँ"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}