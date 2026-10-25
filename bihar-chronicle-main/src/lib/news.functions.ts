import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { districtTag, cityTag, findDistrict, isValidCity } from "@/lib/bihar-districts";

const ARTICLE_COLS =
  "id, slug, title, subtitle, summary, image_url, tags, published_at, is_featured, is_trending, featured_rank, view_count, category:categories(slug,name_hi,name_en), author:authors(name,avatar_url)";

const safeSearchTerm = (term: string) => term.replaceAll("%", "").replaceAll(",", " ").trim();

export const listFeed = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        category: z.string().min(1).max(120).optional(),
        tag: z.string().min(1).max(80).optional(),
        district: z.string().regex(/^[a-z-]+$/).max(64).optional(),
        city: z.string().regex(/^[a-z-]+$/).max(64).optional(),
        author: z.string().min(1).max(160).optional(),
        cursor: z.string().datetime().nullable().optional(),
        limit: z.number().int().min(1).max(40).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const limit = data.limit ?? 12;
    if (data.district) {
      const district = findDistrict(data.district);
      if (!district || !isValidCity(district, data.city)) return { items: [], nextCursor: null };
    } else if (data.city) {
      return { items: [], nextCursor: null };
    }
    let categoryId: string | undefined;
    let authorId: string | undefined;

    if (data.category) {
      const { data: category, error } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("slug", data.category)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!category) return { items: [], nextCursor: null };
      categoryId = category.id;
    }

    if (data.author) {
      const { data: author, error } = await supabaseAdmin
        .from("authors")
        .select("id")
        .eq("name", data.author)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!author) return { items: [], nextCursor: null };
      authorId = author.id;
    }

    let query = supabaseAdmin
      .from("news_articles")
      .select(ARTICLE_COLS)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (data.cursor) query = query.lt("published_at", data.cursor);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (authorId) query = query.eq("author_id", authorId);
    if (data.tag) query = query.contains("tags", [data.tag]);
    if (data.district) query = query.contains("tags", [districtTag(data.district)]);
    if (data.city) query = query.contains("tags", [cityTag(data.city)]);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const items = rows ?? [];
    return {
      items,
      nextCursor: items.length === limit ? items[items.length - 1]?.published_at ?? null : null,
    };
  });

export const getHomeBundle = createServerFn({ method: "GET" }).handler(async () => {
  const [featuredRes, trendingRes, breakingRes, categoriesRes, latestRes, popularRes] =
    await Promise.all([
      supabaseAdmin
        .from("news_articles")
        .select(ARTICLE_COLS)
        .eq("status", "published")
        .eq("is_featured", true)
        .order("featured_rank", { ascending: true, nullsFirst: false })
        .order("published_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("news_articles")
        .select(ARTICLE_COLS)
        .eq("status", "published")
        .eq("is_trending", true)
        .order("published_at", { ascending: false })
        .limit(6),
      supabaseAdmin
        .from("breaking_news")
        .select("id,text,link")
        .eq("is_active", true)
        // Do not show old ticker items as live breaking news.
        .gte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .order("sort_order", { ascending: true })
        .limit(20),
      supabaseAdmin
        .from("categories")
        .select("slug,name_hi,name_en")
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("news_articles")
        .select(ARTICLE_COLS)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("news_articles")
        .select(ARTICLE_COLS)
        .eq("status", "published")
        .order("view_count", { ascending: false })
        .limit(4),
    ]);

  for (const result of [featuredRes, trendingRes, breakingRes, categoriesRes, latestRes, popularRes]) {
    if (result.error) throw new Error(result.error.message);
  }

  const latest = latestRes.data ?? [];
  return {
    featured: featuredRes.data ?? [],
    trending: trendingRes.data ?? [],
    breaking: breakingRes.data ?? [],
    categories: categoriesRes.data ?? [],
    latest,
    editorsPick: popularRes.data ?? [],
    nextCursor: latest.length === 10 ? latest[latest.length - 1]?.published_at ?? null : null,
  };
});

export const getArticle = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(300) }).parse(d))
  .handler(async ({ data }) => {
    const { data: article, error } = await supabaseAdmin
      .from("news_articles")
      .select(
        "id,slug,title,subtitle,summary,seo_title,seo_description,content,image_url,tags,published_at,updated_at,view_count,category:categories(slug,name_hi,name_en),author:authors(name,bio,avatar_url)",
      )
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!article) return { article: null, related: [] };

    // Preview browsing must never mutate published news records.
    // View counting will be reintroduced through a separate, protected analytics path.

    let relatedQuery = supabaseAdmin
      .from("news_articles")
      .select(ARTICLE_COLS)
      .eq("status", "published")
      .neq("id", article.id)
      .order("published_at", { ascending: false })
      .limit(4);

    if (article.category?.slug) {
      const { data: category } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("slug", article.category.slug)
        .maybeSingle();
      if (category?.id) relatedQuery = relatedQuery.eq("category_id", category.id);
    }

    const { data: related } = await relatedQuery;
    return { article, related: related ?? [] };
  });

export const searchArticles = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ q: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const term = safeSearchTerm(data.q);
    if (!term) return { items: [] };
    const { data: rows, error } = await supabaseAdmin
      .from("news_articles")
      .select(ARTICLE_COLS)
      .eq("status", "published")
      .or(`title.ilike.%${term}%,summary.ilike.%${term}%,subtitle.ilike.%${term}%`)
      .order("published_at", { ascending: false })
      .limit(40);
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("slug,name_hi,name_en")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});
