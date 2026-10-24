import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MapPin } from "lucide-react";
import { BIHAR_DISTRICTS, findDistrict, isValidCity } from "@/lib/bihar-districts";
import { listFeed } from "@/lib/news.functions";
import { NewsCard, type Article } from "@/components/site/NewsCard";
import { DistrictSelectorCard, MobileDistrictPicker } from "@/components/site/DistrictSelector";
import { absoluteSiteUrl } from "@/lib/seo";

export const Route = createFileRoute("/district/$slug")({
  validateSearch: z.object({ city: z.string().max(64).optional() }),
  loaderDeps: ({ search }) => ({ city: search.city }),
  loader: async ({ params, deps }) => {
    const district = findDistrict(params.slug);
    if (!district || !isValidCity(district, deps.city)) throw notFound();
    const first = await listFeed({ data: { district: district.slug, city: deps.city, limit: 12 } });
    return { first, district };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.district.name} की खबरें — समूचा बिहार` },
      { name: "description", content: `${loaderData.district.name} जिले और आसपास के शहरों की हिंदी खबरें पढ़ें।` },
    ] : [],
    links: loaderData ? [{ rel: "canonical", href: absoluteSiteUrl(`/district/${loaderData.district.slug}`) }] : [],
  }),
  component: DistrictNews,
  notFoundComponent: () => <div className="container mx-auto max-w-4xl px-4 py-16 text-center"><h1 className="font-display text-3xl font-bold">यह जिला या शहर उपलब्ध नहीं है</h1><Link to="/districts" className="mt-4 inline-block text-primary underline">सभी जिले देखें</Link></div>,
});

function DistrictNews() {
  const { district, first } = Route.useLoaderData();
  const { city } = Route.useSearch();
  const feedFn = useServerFn(listFeed);
  const selectedCity = district.cities.find((town) => town.slug === city);
  const feed = useInfiniteQuery({
    queryKey: ["district-feed", district.slug, city ?? ""],
    queryFn: ({ pageParam }) => feedFn({ data: { district: district.slug, city, cursor: pageParam as string | null, limit: 12 } }),
    initialPageParam: first.nextCursor,
    getNextPageParam: (last) => last.nextCursor,
    initialData: { pages: [{ items: first.items as Article[], nextCursor: first.nextCursor }], pageParams: [null] },
  });
  const items = feed.data?.pages.flatMap((p) => p.items as Article[]) ?? [];
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-11">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">मुखपृष्ठ</Link> /
        <Link to="/districts" className="hover:text-primary">बिहार के जिले</Link> /
        <span>{district.name}{selectedCity ? ` / ${selectedCity.name}` : ""}</span>
      </nav>
      <div className="mb-8 border-b border-border pb-6">
        <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-primary"><MapPin className="h-4 w-4" /> स्थानीय समाचार</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">{selectedCity ? selectedCity.name : district.name} की खबरें</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{selectedCity ? `${district.name} जिले के ${selectedCity.name} शहर` : `${district.name} जिले`} से प्रकाशित खबरें एक जगह।</p>
      </div>
      <div className="md:hidden"><MobileDistrictPicker /></div>
      <div className="hidden md:block"><DistrictSelectorCard /></div>
      <section className="mt-8 sm:mt-10">
        <h2 className="mb-5 font-display text-2xl font-bold">स्थानीय समाचार</h2>
        {items.length ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((article) => <NewsCard key={article.id} article={article} />)}</div>
            {feed.hasNextPage && (
              <button onClick={() => feed.fetchNextPage()} disabled={feed.isFetchingNextPage} className="mx-auto mt-8 block rounded-full border border-border px-6 py-2 text-sm font-semibold hover:border-primary hover:text-primary disabled:opacity-50">
                {feed.isFetchingNextPage ? "लोड हो रहा है..." : "और खबरें देखें"}
              </button>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-border bg-muted/20 px-5 py-14 text-center">
            <h3 className="font-display text-xl font-bold">इस क्षेत्र की खबरें अभी उपलब्ध नहीं हैं</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
              पुरानी खबरों में जिला और शहर की पहचान दर्ज नहीं है। नई खबरों में संपादक द्वारा स्थान चुनने के बाद वे यहाँ दिखाई देंगी।
            </p>
            <Link to="/" className="mt-5 inline-block text-sm font-bold text-primary underline">सभी ताजा खबरें पढ़ें</Link>
          </div>
        )}
      </section>
      <div className="mt-10 border-t border-border pt-6">
        <h2 className="mb-3 text-sm font-bold">अन्य जिले</h2>
        <div className="flex flex-wrap gap-2">
          {BIHAR_DISTRICTS.filter((item) => item.slug !== district.slug).slice(0, 8).map((item) =>
            <Link key={item.slug} to="/district/$slug" params={{slug:item.slug}} search={{city:undefined}} className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary">{item.name}</Link>
          )}
          <Link to="/districts" className="rounded-full border border-primary px-3 py-1 text-xs font-bold text-primary">सभी 38 जिले</Link>
        </div>
      </div>
    </div>
  );
}
