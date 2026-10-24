import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Flame, Newspaper, TrendingUp } from "lucide-react";
import { BreakingTicker } from "@/components/site/BreakingTicker";
import { DistrictSelectorCard } from "@/components/site/DistrictSelector";
import { NewsCard, type Article } from "@/components/site/NewsCard";
import { timeAgoHindi } from "@/lib/format";
import { getHomeBundle, listFeed } from "@/lib/news.functions";

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
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: {
      pages: [{ items: home.latest as Article[], nextCursor: home.nextCursor }],
      pageParams: [null],
    },
  });

  const featured = home.featured as Article[];
  const latest = home.latest as Article[];
  const trending = home.trending as Article[];
  const mostRead = (home.editorsPick ?? []) as Article[];
  // The homepage must still have a lead story when no article was marked "featured".
  const lead = featured[0] ?? latest[0] ?? trending[0];
  const seen = new Set(lead ? [lead.id] : []);
  const sideStories: Article[] = [];
  for (const article of [...featured.slice(1), ...latest]) {
    if (seen.has(article.id)) continue;
    seen.add(article.id);
    sideStories.push(article);
    if (sideStories.length === 3) break;
  }
  const feedItems = feed.data?.pages.flatMap((page) => page.items as Article[]) ?? [];
  const uniqueFeed = feedItems.filter((item) => !seen.has(item.id));
  const hasContent = featured.length + trending.length + latest.length > 0;

  return (
    <div>
      <BreakingTicker items={home.breaking} />
      <div className="container mx-auto max-w-7xl px-4 pb-16 pt-6 sm:pt-9">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">SAMUCHA BIHAR · NEWS DESK</p>
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">बिहार की खबरें, आपकी नजर</h1>
            <p className="mt-1 text-sm text-muted-foreground">बिहार, देश और दुनिया से समाचार और खास रिपोर्ट</p>
          </div>
          <Link to="/search" search={{ q: "बिहार" }} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
            और खबरें खोजें <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mb-8"><DistrictSelectorCard /></div>
        {!hasContent ? (
          <EmptyState />
        ) : (
          <>
            {lead && (
              <section aria-label="मुख्य समाचार" className="grid gap-5 lg:grid-cols-12">
                <div className="lg:col-span-7 xl:col-span-8">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-6 w-1 rounded-full bg-primary" />
                    <h2 className="font-display text-xl font-bold">मुख्य समाचार</h2>
                  </div>
                  <div className="overflow-hidden rounded-xl [&>a]:h-full [&>a>div:first-child]:lg:aspect-[16/10]">
                    <NewsCard article={lead} variant="featured" />
                  </div>
                </div>
                {sideStories.length > 0 && (
                  <div className="lg:col-span-5 xl:col-span-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-6 w-1 rounded-full bg-primary" />
                      <h2 className="font-display text-xl font-bold">अन्य बड़ी खबरें</h2>
                    </div>
                    <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
                      {sideStories.map((article) => (
                        <SideStory key={article.id} article={article} />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {home.categories.length > 0 && (
              <section aria-label="समाचार की श्रेणियां" className="mt-9 rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="mr-2 shrink-0 text-sm font-bold">अपनी रुचि की खबरें</span>
                  {home.categories.map((category) => (
                    <Link
                      key={category.slug}
                      to="/category/$slug"
                      params={{ slug: category.slug }}
                      className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold transition hover:border-primary hover:bg-primary hover:text-white"
                    >
                      {category.name_hi}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {trending.length > 0 && (
              <section className="mt-12">
                <SectionTitle title="चर्चा में खबरें" kicker="TRENDING" icon={<Flame className="h-5 w-5" />} />
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {trending.slice(0, 3).map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            <section className="mt-12 grid gap-9 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <SectionTitle title="नई प्रकाशित खबरें" kicker="LATEST STORIES" icon={<Newspaper className="h-5 w-5" />} />
                {uniqueFeed.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {uniqueFeed.map((article) => (
                      <NewsCard key={article.id} article={article} />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">बाकी सभी उपलब्ध खबरें ऊपर दिखाई गई हैं।</p>
                )}
                <div className="mt-7 flex justify-center">
                  {feed.hasNextPage ? (
                    <button
                      type="button"
                      onClick={() => feed.fetchNextPage()}
                      disabled={feed.isFetchingNextPage}
                      className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-bold hover:border-primary hover:text-primary disabled:opacity-60"
                    >
                      {feed.isFetchingNextPage ? "खबरें खुल रही हैं..." : "और खबरें पढ़ें"}
                    </button>
                  ) : (
                    <p className="text-sm text-muted-foreground">सभी उपलब्ध खबरें देख ली गई हैं।</p>
                  )}
                </div>
              </div>

              <aside className="lg:col-span-4">
                {mostRead.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="mb-3 flex items-center gap-2 border-b border-border pb-4">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h2 className="font-display text-xl font-extrabold">सबसे ज्यादा पढ़ी गई</h2>
                    </div>
                    {mostRead.slice(0, 4).map((article, index) => (
                      <Link key={article.id} to="/article/$slug" params={{ slug: article.slug }} className="group flex gap-4 border-b border-border py-4 last:border-0">
                        <span className="font-display text-3xl font-black text-primary/30">{String(index + 1).padStart(2, "0")}</span>
                        <span className="text-sm font-bold leading-7 group-hover:text-primary">{article.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
                <div className="mt-6 rounded-xl bg-[#171b22] p-6 text-white">
                  <span className="text-[11px] font-bold tracking-widest text-white/60">समूचा बिहार</span>
                  <h2 className="mt-2 font-display text-xl font-extrabold leading-relaxed">आपके इलाके की खबर, आपकी भाषा में</h2>
                  <p className="mt-3 text-sm leading-7 text-white/65">बिहार की स्थानीय खबरों से लेकर देश और दुनिया की महत्वपूर्ण जानकारी तक।</p>
                  <Link to="/about" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white underline underline-offset-4">
                    हमारे बारे में जानें <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </aside>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function SideStory({ article }: { article: Article }) {
  return (
    <Link to="/article/$slug" params={{ slug: article.slug }} className="group flex items-start gap-4 py-4">
      <div className="aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-32">
        {article.image_url ? (
          <img src={article.image_url} alt={article.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs font-bold text-primary/60">समूचा बिहार</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-bold text-primary">{article.category?.name_hi ?? "समाचार"}</span>
        <h3 className="mt-1 line-clamp-3 font-display text-sm font-bold leading-7 group-hover:text-primary sm:text-base">{article.title}</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">{timeAgoHindi(article.published_at)}</p>
      </div>
    </Link>
  );
}

function SectionTitle({ title, kicker, icon }: { title: string; kicker: string; icon: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-3">
      <div>
        <span className="text-[10px] font-bold tracking-[0.16em] text-primary">{kicker}</span>
        <h2 className="mt-1 flex items-center gap-2 font-display text-xl font-extrabold sm:text-2xl">
          <span aria-hidden="true" className="text-primary">{icon}</span>{title}
        </h2>
      </div>
      <span className="h-1 w-10 shrink-0 rounded-full bg-primary" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <h2 className="font-display text-2xl font-bold">अभी कोई खबर उपलब्ध नहीं है</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">नई खबरें प्रकाशित होने पर इस पेज पर दिखाई देंगी। आप बाद में फिर देख सकते हैं।</p>
      <Link to="/about" className="mt-5 inline-flex text-sm font-bold text-primary hover:underline">समूचा बिहार के बारे में जानें</Link>
    </div>
  );
}
