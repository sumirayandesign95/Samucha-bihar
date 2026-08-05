import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  EDITOR_PLUS,
  getAdminClient,
  getRoles,
  highestRole,
  requireEditor,
  requireStaff,
  requireSuperAdmin,
  type Role,
} from "./admin.server";

// Sanitize any incoming slug so a save never fails on it. If nothing usable
// remains, fall back to a timestamped slug so drafts can always be saved.
const slugSchema = z
  .string()
  .max(200)
  .transform((s) => {
    const cleaned = (s || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
    return cleaned || `khabar-${Date.now()}`;
  });

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getRoles(context.userId);
    const top = highestRole(roles);
    return {
      isAdmin: top !== null,
      role: top,
      roles,
      canPublish: top !== null && EDITOR_PLUS.includes(top),
      canManageUsers: top === "super_admin",
      userId: context.userId,
    };
  });

export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = getAdminClient();
    const { count, error: countError } = await admin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .in("role", ["super_admin", "admin"]);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) throw new Error("Admin already exists");
    const { error } = await admin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "super_admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.userId);
    const admin = getAdminClient();
    const [total, published, drafts, review, scheduled, trending, categories, authors, views] = await Promise.all([
      admin.from("news_articles").select("*", { count: "exact", head: true }),
      admin.from("news_articles").select("*", { count: "exact", head: true }).eq("status", "published"),
      admin.from("news_articles").select("*", { count: "exact", head: true }).eq("status", "draft"),
      admin.from("news_articles").select("*", { count: "exact", head: true }).eq("status", "review"),
      admin.from("news_articles").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
      admin.from("news_articles").select("*", { count: "exact", head: true }).eq("is_trending", true),
      admin.from("categories").select("*", { count: "exact", head: true }),
      admin.from("authors").select("*", { count: "exact", head: true }),
      admin.from("news_articles").select("view_count"),
    ]);
    return {
      total: total.count ?? 0,
      published: published.count ?? 0,
      drafts: drafts.count ?? 0,
      review: review.count ?? 0,
      scheduled: scheduled.count ?? 0,
      trending: trending.count ?? 0,
      categories: categories.count ?? 0,
      users: authors.count ?? 0,
      views: views.data?.reduce((sum, row) => sum + (row.view_count ?? 0), 0) ?? 0,
    };
  });

export const adminListArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await requireStaff(context.userId);
    const admin = getAdminClient();
    let q = admin
      .from("news_articles")
      .select(
        "id,slug,title,status,is_featured,is_trending,featured_rank,published_at,created_at,created_by,category:categories(name_hi,slug),author:authors(name)",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (role === "reporter") q = q.eq("created_by", context.userId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const ArticleInput = z.object({
  id: z.string().uuid().optional(),
  slug: slugSchema,
  title: z.string().min(1).max(300),
  subtitle: z.string().max(400).optional().nullable(),
  summary: z.string().max(600).optional().nullable(),
  content: z.string().min(1),
  gallery: z.array(z.string().url()).max(12).optional(),
  subcategory: z.string().max(120).optional().nullable(),
  seo_title: z.string().max(300).optional().nullable(),
  seo_description: z.string().max(500).optional().nullable(),
  seo_keywords: z.array(z.string().min(1).max(40)).max(15).optional(),
  image_url: z.string().url().or(z.literal("")).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  author_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).max(15).optional(),
  status: z.enum(["draft", "review", "scheduled", "published"]),
  is_featured: z.boolean().optional(),
  is_trending: z.boolean().optional(),
  featured_rank: z.number().int().nullable().optional(),
  published_at: z.string().datetime().optional().nullable(),
});

export const upsertArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ArticleInput.parse(d))
  .handler(async ({ context, data }) => {
    const role = await requireStaff(context.userId);
    const isReporter = role === "reporter";
    const { id, ...rest } = data;

    // Reporters can't publish/schedule and can't toggle featured/trending flags
    if (isReporter) {
      if (rest.status === "published" || rest.status === "scheduled") {
        throw new Error("Reporters can only save as draft or send for review");
      }
      rest.is_featured = false;
      rest.is_trending = false;
      rest.featured_rank = null;
    }

    // Reporters can only edit their own, and not after publish
    if (id) {
      const admin = getAdminClient();
      const { data: cur } = await admin
        .from("news_articles")
        .select("created_by,status")
        .eq("id", id)
        .maybeSingle();
      if (!cur) throw new Error("Article not found");
      if (isReporter) {
        if (cur.created_by !== context.userId) throw new Error("Forbidden: not your article");
        if (cur.status === "published") throw new Error("Published articles can only be edited by editors");
      }
    }

    const now = new Date().toISOString();
    const basePayload = {
      ...rest,
      image_url: rest.image_url || null,
      tags: rest.tags ?? [],
      gallery: rest.gallery ?? [],
      seo_keywords: rest.seo_keywords ?? [],
      published_at:
        rest.status === "published"
          ? rest.published_at || now
          : rest.status === "scheduled"
            ? rest.published_at
            : null,
      rejection_note: rest.status === "review" ? undefined : null,
    };
    const admin = getAdminClient();
    const { data: row, error } = id
      ? await admin.from("news_articles").update(basePayload).eq("id", id).select().single()
      : await admin
          .from("news_articles")
          .insert({ ...basePayload, created_by: context.userId })
          .select()
          .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const { error } = await getAdminClient().from("news_articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGetArticle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const role = await requireStaff(context.userId);
    const { data: row, error } = await getAdminClient()
      .from("news_articles")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    if (role === "reporter" && row.created_by !== context.userId) {
      throw new Error("Forbidden: not your article");
    }
    return row;
  });

export const adminListAuthors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.userId);
    const { data, error } = await getAdminClient().from("authors").select("*").order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpsertAuthor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(120),
        bio: z.string().max(1000).optional().nullable(),
        avatar_url: z.string().url().or(z.literal("")).optional().nullable(),
        email: z.string().email().or(z.literal("")).optional().nullable(),
        x_url: z.string().url().or(z.literal("")).optional().nullable(),
        facebook_url: z.string().url().or(z.literal("")).optional().nullable(),
        linkedin_url: z.string().url().or(z.literal("")).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const { id, ...rest } = {
      ...data,
      avatar_url: data.avatar_url || null,
      email: data.email || null,
      x_url: data.x_url || null,
      facebook_url: data.facebook_url || null,
      linkedin_url: data.linkedin_url || null,
    };
    const admin = getAdminClient();
    const { data: row, error } = id
      ? await admin.from("authors").update(rest).eq("id", id).select().single()
      : await admin.from("authors").insert(rest).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminDeleteAuthor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const { error } = await getAdminClient().from("authors").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.userId);
    const { data, error } = await getAdminClient()
      .from("categories")
      .select("id,slug,name_hi,name_en,sort_order,parent_id")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        slug: slugSchema,
        name_hi: z.string().min(1).max(120),
        name_en: z.string().min(1).max(120),
        sort_order: z.number().int().optional(),
        parent_id: z.string().uuid().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const { id, ...rest } = data;
    if (id && rest.parent_id === id) throw new Error("A category cannot be its own parent");
    const admin = getAdminClient();
    const { data: row, error } = id
      ? await admin.from("categories").update(rest).eq("id", id).select().single()
      : await admin.from("categories").insert(rest).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const { error } = await getAdminClient().from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListTags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.userId);
    const { data, error } = await getAdminClient().from("news_articles").select("tags");
    if (error) throw new Error(error.message);
    const tags = Array.from(new Set((data ?? []).flatMap((row) => row.tags ?? []))).sort((a, b) => a.localeCompare(b));
    return tags.map((name) => ({ name, count: (data ?? []).filter((row) => row.tags?.includes(name)).length }));
  });

export const adminListBreaking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.userId);
    const { data, error } = await getAdminClient().from("breaking_news").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpsertBreaking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        text: z.string().min(1).max(400),
        link: z.string().url().optional().nullable().or(z.literal("")),
        sort_order: z.number().int().optional(),
        is_active: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const payload = { ...data, link: data.link || null };
    const admin = getAdminClient();
    const { data: row, error } = data.id
      ? await admin.from("breaking_news").update(payload).eq("id", data.id).select().single()
      : await admin.from("breaking_news").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminDeleteBreaking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const { error } = await getAdminClient().from("breaking_news").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminCreateAuthor = adminUpsertAuthor;

// ---------- Review workflow ----------

export const adminListReviewQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireEditor(context.userId);
    const { data, error } = await getAdminClient()
      .from("news_articles")
      .select("id,slug,title,status,created_at,updated_at,created_by,category:categories(name_hi,slug),author:authors(name)")
      .eq("status", "review")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminApproveArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), publishAt: z.string().datetime().nullable().optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const publishAt = data.publishAt && new Date(data.publishAt) > new Date() ? data.publishAt : null;
    const { error } = await getAdminClient()
      .from("news_articles")
      .update({
        status: publishAt ? "scheduled" : "published",
        published_at: publishAt ?? new Date().toISOString(),
        rejection_note: null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRejectArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), note: z.string().min(1).max(800) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const { error } = await getAdminClient()
      .from("news_articles")
      .update({ status: "draft", rejection_note: data.note })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Tag management ----------

export const adminRenameTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ from: z.string().min(1).max(40), to: z.string().min(1).max(40) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const admin = getAdminClient();
    const { data: rows, error } = await admin
      .from("news_articles")
      .select("id,tags")
      .contains("tags", [data.from]);
    if (error) throw new Error(error.message);
    for (const r of rows ?? []) {
      const next = Array.from(new Set((r.tags ?? []).map((t: string) => (t === data.from ? data.to : t))));
      await admin.from("news_articles").update({ tags: next }).eq("id", r.id);
    }
    return { updated: rows?.length ?? 0 };
  });

export const adminDeleteTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ name: z.string().min(1).max(40) }).parse(d))
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const admin = getAdminClient();
    const { data: rows, error } = await admin
      .from("news_articles")
      .select("id,tags")
      .contains("tags", [data.name]);
    if (error) throw new Error(error.message);
    for (const r of rows ?? []) {
      const next = (r.tags ?? []).filter((t: string) => t !== data.name);
      await admin.from("news_articles").update({ tags: next }).eq("id", r.id);
    }
    return { updated: rows?.length ?? 0 };
  });

// ---------- Users & roles (super_admin only) ----------

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireSuperAdmin(context.userId);
    const admin = getAdminClient();
    const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error(error.message);
    const { data: roleRows, error: rErr } = await admin.from("user_roles").select("user_id,role");
    if (rErr) throw new Error(rErr.message);
    const byUser = new Map<string, Role[]>();
    for (const r of roleRows ?? []) {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role as Role);
      byUser.set(r.user_id, arr);
    }
    return list.users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      roles: byUser.get(u.id) ?? [],
    }));
  });

const RoleEnum = z.enum(["super_admin", "admin", "editor", "reporter"]);

export const adminAssignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), role: RoleEnum }).parse(d))
  .handler(async ({ context, data }) => {
    await requireSuperAdmin(context.userId);
    const { error } = await getAdminClient()
      .from("user_roles")
      .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRemoveRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), role: RoleEnum }).parse(d))
  .handler(async ({ context, data }) => {
    await requireSuperAdmin(context.userId);
    const admin = getAdminClient();
    if (data.userId === context.userId && data.role === "super_admin") {
      const { count } = await admin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_admin");
      if ((count ?? 0) <= 1) throw new Error("Cannot remove the last super admin");
    }
    const { error } = await admin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
