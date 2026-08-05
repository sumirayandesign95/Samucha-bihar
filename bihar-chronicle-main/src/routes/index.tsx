import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHomeBundle, listFeed } from "@/lib/news.functions";
import { BreakingTicker } from "@/components/site/BreakingTicker";
import { NewsCard, type Article } from "@/components/site/NewsCard";
import { TrendingUp, Flame, Award, Newspaper } from "lucide-react";

const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: () => getHomeBundle(),
  staleTime: 60 * 1000,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: HomePage,
});

function HomePage() {
  const { data: home } = useSuspenseQuery(homeQuery);
  const feedFn = useServerFn(listFeed);

  const feed = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => feedFn({ data: { cursor: pageParam as string | null, limit: 10 } }),
    initialPageParam: home.nextCursor,
    getNextPageParam: (last) => last.nextCursor,
    initialData: {
      pages: [{ items: home.latest as Article[], nextCursor: home.nextCursor }],
      pageParams: [null],
    },
  });

  const feedItems = feed.data?.pages.flatMap((p) => p.items as Article[]) ?? [];
  const hero = home.featured[0] as Article | undefined;
  const secondaryFeatured = home.featured.slice(1, 5) as Article[];
  const editorsPick = ((home as any).editorsPick ?? []) as Article[];

  const hasContent =
    home.featured.length + home.trending.length + home.latest.length > 0;

  return (
    <div>
      <BreakingTicker items={home.breaking} />
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {!hasContent ? (
          <EmptyState />
        ) : (
          <>
            {/* Featured hero grid */}
            {hero && (
              <section className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <NewsCard article={hero} variant="featured" />
                </div>
                <div className="grid gap-4">
                  {secondaryFeatured.slice(0, 2).map((a) => (
                    <NewsCard key={a.id} article={a} variant="featured" />
                  ))}
                </div>
              </section>
            )}

            {/* Trending strip */}
            {home.trending.length > 0 && (
              <section className="mt-10">
                <SectionHeader icon={<Flame className="h-4 w-4" />} title="ट्रेंडिंग ख़बरें" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(home.trending as Article[]).map((a) => (
                    <NewsCard key={a.id} article={a} />
                  ))}
                </div>
              </section>
            )}

            {/* Editor's Pick */}
            {editorsPick.length > 0 && (
              <section className="mt-10 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-accent/5 border border-border p-5 sm:p-7">
                <SectionHeader icon={<Award className="h-4 w-4" />} title="संपादक की पसंद" />
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {editorsPick.slice(0, 4).map((a) => (
                    <NewsCard key={a.id} article={a} />
                  ))}
                </div>
              </section>
            )}

            {/* Main feed + sidebar */}
            <section className="mt-10 grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <SectionHeader icon={<Newspaper className="h-4 w-4" />} title="ताज़ा अपडेट" />
                <div className="grid gap-5 sm:grid-cols-2">
                  {feedItems.map((a) => (
                    <NewsCard key={a.id} article={a} />
                  ))}
                </div>
                <div className="mt-8 flex justify-center">
                  {feed.hasNextPage ? (
                    <button
                      onClick={() => feed.fetchNextPage()}
                      disabled={feed.isFetchingNextPage}
                      className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50"
                    >
                      {feed.isFetchingNextPage ? "लोड हो रहा है..." : "और ख़बरें दिखाएँ"}
                    </button>
                  ) : (
                    <p className="text-sm text-muted-foreground">— यहाँ तक की सभी ख़बरें —</p>
                  )}
                </div>
              </div>

              <aside className="space-y-8">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-display text-lg font-bold mb-2 border-l-4 border-primary pl-3">
                    श्रेणियाँ
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {home.categories.map((c) => (
                      <Link
                        key={c.slug}
                        to="/category/$slug"
                        params={{ slug: c.slug }}
                        className="text-xs rounded-full border border-border px-3 py-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition"
                      >
                        {c.name_hi}
                      </Link>
                    ))}
                  </div>
                </div>

                {home.trending.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="font-display text-lg font-bold mb-2 border-l-4 border-primary pl-3">
                      सबसे ज़्यादा पढ़ी गई
                    </h3>
                    <div>
                      {(home.trending as Article[]).slice(0, 5).map((a) => (
                        <NewsCard key={a.id} article={a} variant="compact" />
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        {icon}
      </span>
      <h2 className="font-display text-xl sm:text-2xl font-bold">{title}</h2>
      <span className="ml-2 h-px flex-1 bg-border" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <h2 className="font-display text-2xl font-bold">अभी कोई ख़बर प्रकाशित नहीं है</h2>
      <p className="mt-2 text-muted-foreground max-w-md mx-auto">
        एडमिन पैनल में लॉगिन करके पहली ख़बर प्रकाशित करें। प्रकाशित ख़बरें यहाँ
        स्वचालित रूप से दिखाई देंगी।
      </p>
      <Link
        to="/login"
        className="mt-5 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        एडमिन लॉगिन
      </Link>
    </div>
  );
}