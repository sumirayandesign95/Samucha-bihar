import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listFeed } from "@/lib/news.functions";
import { NewsCard, type Article } from "@/components/site/NewsCard";

export const Route = createFileRoute("/tag/$tag")({
  loader: ({ params }) => listFeed({ data: { tag: decodeURIComponent(params.tag), limit: 12 } }),
  component: TagPage,
});

function TagPage() {
  const first = Route.useLoaderData();
  const { tag } = Route.useParams();
  const decodedTag = decodeURIComponent(tag);
  const feedFn = useServerFn(listFeed);
  const feed = useInfiniteQuery({
    queryKey: ["tag-feed", decodedTag],
    queryFn: ({ pageParam }) => feedFn({ data: { tag: decodedTag, cursor: pageParam as string | null, limit: 12 } }),
    initialPageParam: first.nextCursor,
    getNextPageParam: (last) => last.nextCursor,
    initialData: { pages: [{ items: first.items as Article[], nextCursor: first.nextCursor }], pageParams: [null] },
  });
  const items = feed.data?.pages.flatMap((p) => p.items as Article[]) ?? [];
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">#{decodedTag}</h1>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => <NewsCard key={a.id} article={a} />)}
      </div>
      {!items.length && <p className="py-12 text-center text-muted-foreground">इस टैग में अभी कोई ख़बर नहीं है।</p>}
    </div>
  );
}
