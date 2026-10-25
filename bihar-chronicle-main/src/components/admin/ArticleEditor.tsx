import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Bold, Italic, Underline, List, ListOrdered, Quote, Link2, Heading2, Heading3,
  Image as ImageIcon, Undo2, Redo2, Eye, Save, Send, Loader2, X,
  UploadCloud, AlertCircle, CheckCircle2, Sparkles, ChevronDown, ChevronRight,
  Trash2, RefreshCw, Star, Flame, Calendar, Tag as TagIcon,
} from "lucide-react";
import {
  upsertArticle,
  adminGetArticle,
  adminListAuthors,
  adminListCategories,
  adminUpsertAuthor,
  checkAdmin,
} from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { BIHAR_DISTRICTS, districtTag, cityTag, findDistrict } from "@/lib/bihar-districts";

// ---------------- helpers ----------------

function slugify(s: string) {
  // Server accepts only [a-z0-9-]. Strip everything else (incl. Devanagari)
  // and fall back to a timestamped slug when nothing usable remains.
  const cleaned = s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return cleaned || `khabar-${Date.now()}`;
}

function stripHtml(html: string) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
}

/*****************************************************************************
 * Note: If you face RLS issues during file upload, make sure you configure   *
 * the bucket policy in Supabase -> Storage -> news-images -> Policies       *
 *****************************************************************************/
function autoSummary(html: string, max = 240) {
  const text = stripHtml(html);
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function getWordCount(html: string) {
  const t = stripHtml(html);
  return t ? t.split(/\s+/).length : 0;
}

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 8 * 1024 * 1024; // 8MB pre-compress

async function compressImage(file: File, maxDim = 1920, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const ratio = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * ratio);
  const h = Math.round(bmp.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bmp, 0, 0, w, h);
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b || file), file.type === "image/png" ? "image/png" : "image/jpeg", quality),
  );
}

async function hashBlob(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-1", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

async function uploadToBucket(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ url: string; hash: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("केवल JPG, PNG, या WEBP फ़ाइल स्वीकार्य है");
  }
  if (file.size > MAX_SIZE) throw new Error("फ़ाइल का आकार 8MB से अधिक है");
  onProgress?.(10);
  const blob = await compressImage(file);
  onProgress?.(45);
  const hash = await hashBlob(blob);
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${new Date().getFullYear()}/${hash}-${Date.now()}.${ext}`;
  onProgress?.(60);
  
  const { error } = await supabase.storage.from("news-images").upload(path, blob, {
    cacheControl: "31536000",
    upsert: false,
    contentType: blob.type,
  });
  if (error) throw error;
  onProgress?.(90);
  const { data } = supabase.storage.from("news-images").getPublicUrl(path);
  onProgress?.(100);
  return { url: data.publicUrl, hash };
}

// ---------------- component ----------------

type FormState = {
  title: string;
  slug: string;
  slugTouched: boolean;
  subtitle: string;
  summary: string;
  summaryTouched: boolean;
  content: string; 
  image_url: string;
  gallery: string[];
  subcategory: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  publish_date: string;
  category_id: string;
  author_id: string;
  tags: string[];
  status: "draft" | "review" | "scheduled" | "published";
  is_featured: boolean;
  is_trending: boolean;
  featured_rank: string;
};

const emptyForm: FormState = {
  title: "", slug: "", slugTouched: false, subtitle: "", summary: "", summaryTouched: false,
  content: "", image_url: "", gallery: [], subcategory: "",
  seo_title: "", seo_description: "", seo_keywords: "", publish_date: "",
  category_id: "", author_id: "", tags: [],
  status: "draft", is_featured: false, is_trending: false, featured_rank: "",
};

export function ArticleEditor({ id: initialId }: { id?: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const upsertFn = useServerFn(upsertArticle);
  const getFn = useServerFn(adminGetArticle);
  const authorsFn = useServerFn(adminListAuthors);
  const catsFn = useServerFn(adminListCategories);
  const createAuthorFn = useServerFn(adminUpsertAuthor);
  const meFn = useServerFn(checkAdmin);

  const [id, setId] = useState<string | undefined>(initialId);

  const cats = useQuery({ queryKey: ["admin-cats"], queryFn: () => catsFn() });
  const authors = useQuery({ queryKey: ["admin-authors"], queryFn: () => authorsFn() });
  const me = useQuery({ queryKey: ["admin-me"], queryFn: () => meFn() });
  const existing = useQuery({
    queryKey: ["admin-article", id],
    queryFn: () => getFn({ data: { id: id! } }),
    enabled: !!id,
  });

  const [form, setForm] = useState<FormState>(emptyForm);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null);
  const [rejectionNote, setRejectionNote] = useState<string | null>(null);
  const [newAuthor, setNewAuthor] = useState("");
  const [preview, setPreview] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const featuredUp = useRef<{ pct: number; err?: string } | null>(null);
  const [, setFeaturedUpState] = useState({}); 
  const setFeaturedUp = (val: { pct: number; err?: string } | null) => {
    featuredUp.current = val;
    setFeaturedUpState({});
  };

  const [galleryUp, setGalleryUp] = useState<
    { id: string; name: string; pct: number; err?: string; url?: string }[]
  >([]);
  const galleryHashes = useRef<Set<string>>(new Set());
  const editorRef = useRef<HTMLDivElement | null>(null);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  useEffect(() => {
    if (existing.data) {
      const a: any = existing.data;
      setForm({
        title: a.title ?? "",
        slug: a.slug ?? "",
        slugTouched: true,
        subtitle: a.subtitle ?? "",
        summary: a.summary ?? "",
        summaryTouched: !!a.summary,
        content: a.content ?? "",
        image_url: a.image_url ?? "",
        gallery: Array.isArray(a.gallery) ? a.gallery : [],
        subcategory: a.subcategory ?? "",
        seo_title: a.seo_title ?? "",
        seo_description: a.seo_description ?? "",
        seo_keywords: (a.seo_keywords ?? []).join(", "),
        publish_date: a.published_at ? new Date(a.published_at).toISOString().slice(0, 16) : "",
        category_id: a.category_id ?? "",
        author_id: a.author_id ?? "",
        tags: a.tags ?? [],
        status: a.status,
        is_featured: !!a.is_featured,
        is_trending: !!a.is_trending,
        featured_rank: a.featured_rank?.toString() ?? "",
      });
      setRejectionNote(a.rejection_note ?? null);
      queueMicrotask(() => {
        if (editorRef.current && editorRef.current.innerHTML.trim() === "") {
          editorRef.current.innerHTML = DOMPurify.sanitize(a.content ?? "");
        }
      });
      setDirty(false);
    }
  }, [existing.data]);

  const handleFeatured = async (file: File) => {
    setFeaturedUp({ pct: 0 });
    try {
      const { url } = await uploadToBucket(file, (pct) => setFeaturedUp({ pct }));
      setForm((f) => ({ ...f, image_url: url }));
      setDirty(true);
      toast.success("मुख्य चित्र अपलोड हो गया");
      setTimeout(() => setFeaturedUp(null), 400);
    } catch (e: any) {
      setFeaturedUp({ pct: 0, err: e.message });
      toast.error(e.message || "अपलोड विफल");
    }
  };

  const handleGallery = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    const remaining = 12 - form.gallery.length;
    if (remaining <= 0) {
      toast.error("अधिकतम 12 इमेज ही जोड़ी जा सकती हैं");
      return;
    }
    const toUpload = list.slice(0, remaining);
    for (const file of toUpload) {
      const tempId = crypto.randomUUID();
      setGalleryUp((s) => [...s, { id: tempId, name: file.name, pct: 0 }]);
      try {
        const { url, hash } = await uploadToBucket(file, (pct) =>
          setGalleryUp((s) => s.map((u) => (u.id === tempId ? { ...u, pct } : u))),
        );
        if (galleryHashes.current.has(hash)) {
          setGalleryUp((s) => s.filter((u) => u.id !== tempId));
          toast.warning(`डुप्लिकेट: ${file.name}`);
          continue;
        }
        galleryHashes.current.add(hash);
        setForm((f) => ({ ...f, gallery: [...f.gallery, url] }));
        setDirty(true);
        setGalleryUp((s) => s.filter((u) => u.id !== tempId));
      } catch (e: any) {
        setGalleryUp((s) => s.map((u) => (u.id === tempId ? { ...u, err: e.message } : u)));
        toast.error(`${file.name}: ${e.message}`);
      }
    }
  };

  const retryGallery = (uploadId: string) => {
    setGalleryUp((s) => s.filter((u) => u.id !== uploadId));
  };

  const removeGalleryItem = (idx: number) => {
    setForm((f) => ({ ...f, gallery: f.gallery.filter((_, i) => i !== idx) }));
    setDirty(true);
  };

  const moveGallery = (idx: number, dir: -1 | 1) => {
    const next = [...form.gallery];
    const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    setForm((f) => ({ ...f, gallery: next }));
    setDirty(true);
  };

  const addAuthor = async () => {
    if (!newAuthor.trim()) return;
    try {
      const a = await createAuthorFn({ data: { name: newAuthor.trim() } });
      qc.invalidateQueries({ queryKey: ["admin-authors"] });
      setForm((f) => ({ ...f, author_id: (a as any).id }));
      setNewAuthor("");
      toast.success("लेखक जोड़ा गया");
    } catch (e: any) { toast.error(e.message); }
  };

  const commitTag = () => {
    const t = tagInput.trim().replace(/,/g, "");
    if (!t) return;
    if (form.tags.includes(t)) { setTagInput(""); return; }
    if (form.tags.length >= 15) { toast.error("अधिकतम 15 टैग"); return; }
    setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setDirty(true);
    setTagInput("");
  };
  
  const removeTag = (t: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }));
    setDirty(true);
  };

  // District/city metadata is stored in the existing tags array, so Preview
  // needs no schema migrations. It is only saved when the editor saves the article.
  const pictureValue = (prefix: string) => form.tags.find((tag) => tag.startsWith(prefix))?.slice(prefix.length) ?? "";
  const changePictureValue = (prefix: string, value: string) => {
    const withoutField = form.tags.filter((tag) => !tag.startsWith(prefix));
    const nextTags = value ? [...withoutField, prefix + value] : withoutField;
    if (nextTags.length > 15) {
      toast.error("अधिकतम 15 टैग: कुछ सामान्य टैग हटाएँ।");
      return;
    }
    update("tags", nextTags);
  };
  const selectedDistrictSlug = form.tags.find((tag) => tag.startsWith("जिला:"))?.slice("जिला:".length) ?? "";
  const selectedCitySlug = form.tags.find((tag) => tag.startsWith("शहर:"))?.slice("शहर:".length) ?? "";
  const selectedDistrict = findDistrict(selectedDistrictSlug);

  const chooseLocation = (districtSlug: string, citySlug = "") => {
    const district = findDistrict(districtSlug);
    const safeCity = district?.cities.some((city) => city.slug === citySlug) ? citySlug : "";
    const kept = form.tags.filter((tag) => !tag.startsWith("जिला:") && !tag.startsWith("शहर:"));
    const nextTags = district
      ? [...kept, districtTag(district.slug), ...(safeCity ? [cityTag(safeCity)] : [])]
      : kept;
    if (nextTags.length > 15) {
      toast.error("जिला जोड़ने के लिए कुछ अन्य टैग हटाएँ (अधिकतम 15 टैग)");
      return;
    }
    update("tags", nextTags);
  };

  const validate = (forPublish: boolean): string | null => {
    // Drafts should always save — auto-fill happens in buildPayload.
    if (forPublish) {
      if (!form.title.trim()) return "प्रकाशन के लिए शीर्षक आवश्यक है";
      if (!stripHtml(form.content)) return "प्रकाशन के लिए सामग्री आवश्यक है";
      if (!form.category_id && !(cats.data && cats.data.length)) return "पहले श्रेणी बनाएँ";
      if (!form.image_url) return "मुख्य चित्र आवश्यक है";
    }
    return null;
  };

  const buildPayload = (status: FormState["status"]) => {
    const isDraftish = status === "draft" || status === "review";
    const title = form.title.trim() || (isDraftish ? "बिना शीर्षक ड्राफ़्ट" : form.title.trim());
    const rawContent = stripHtml(form.content) ? form.content : (isDraftish ? "<p></p>" : form.content);
    // Always re-slugify to guarantee server regex passes, but keep user's manual edit if it's already valid.
    const manualSlugOk = form.slug && /^[a-z0-9-]+$/.test(form.slug);
    const slug = manualSlugOk ? form.slug : slugify(form.slug || title);
    const defaultCat =
      form.category_id || (isDraftish ? cats.data?.find((c) => !c.parent_id)?.id ?? null : null);
    const defaultAuthor = form.author_id || (isDraftish ? authors.data?.[0]?.id ?? null : null);
    return {
      id,
      title,
      slug,
      subtitle: form.subtitle || null,
      summary: form.summary || autoSummary(rawContent) || null,
      content: rawContent,
      image_url: form.image_url || null,
      category_id: defaultCat || null,
      author_id: defaultAuthor || null,
      tags: form.tags,
      gallery: form.gallery,
      subcategory: form.subcategory || null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      seo_keywords: form.seo_keywords
        ? form.seo_keywords.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      published_at: form.publish_date ? new Date(form.publish_date).toISOString() : null,
      status,
      is_featured: form.is_featured,
      is_trending: form.is_trending,
      featured_rank: form.featured_rank ? Number(form.featured_rank) : null,
    };
  };

  const doSave = useCallback(
    async (status: FormState["status"], opts?: { silent?: boolean; auto?: boolean }) => {
      const err = validate(status === "published" || status === "scheduled");
      if (err) {
        if (!opts?.silent) toast.error(err);
        return;
      }
      setSaving(true);
      try {
        const row: any = await upsertFn({ data: buildPayload(status) as any });
        if (!id && row?.id) setId(row.id);
        setForm((f) => ({ ...f, status }));
        setDirty(false);
        if (opts?.auto) setAutoSavedAt(new Date());
        else {
          toast.success(
            status === "published" ? "ख़बर प्रकाशित हो गई" :
            status === "review" ? "समीक्षा के लिए भेजा गया" :
            status === "scheduled" ? "प्रकाशन शेड्यूल हुआ" :
            "ड्राफ़्ट सहेजा गया",
          );
        }
        qc.invalidateQueries({ queryKey: ["admin-articles"] });
        if (status === "published" || status === "scheduled") {
          setTimeout(() => navigate({ to: "/admin/articles" }), 500);
        }
      } catch (e: any) {
        let msg = e?.message ?? "अज्ञात त्रुटि";
        try {
          const parsed = JSON.parse(msg);
          if (Array.isArray(parsed)) {
            msg = parsed.map((x: any) => `${(x.path || []).join(".") || "field"}: ${x.message}`).join(" | ");
          }
        } catch {}
        if (!opts?.silent) toast.error(msg);
      } finally {
        setSaving(false);
      }
    },
    [form, id, upsertFn, qc, navigate],
  );

  useEffect(() => {
    const t = window.setInterval(() => {
      if (dirty && !saving && form.title.trim() && stripHtml(form.content)) {
        const target: FormState["status"] = form.status === "published" ? "published" : "draft";
        doSave(target, { silent: true, auto: true });
      }
    }, 30000);
    return () => window.clearInterval(t);
  }, [dirty, saving, form.title, form.content, form.status, doSave]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const canPublish = !!me.data?.canPublish;
  
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); doSave("draft"); }
      else if (mod && e.key === "Enter") { e.preventDefault(); doSave(canPublish ? "published" : "review"); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [doSave, canPublish]);

  const isReporter = me.data?.role === "reporter";
  const subcatOptions = (cats.data ?? []).filter((c) => c.parent_id === form.category_id);
  const calculatedWordCount = useMemo(() => getWordCount(form.content), [form.content]);
  const readMin = Math.max(1, Math.ceil(calculatedWordCount / 220));

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    const html = editorRef.current?.innerHTML ?? "";
    setForm((f) => ({ ...f, content: html }));
    setDirty(true);
  };
  
  const insertLink = () => {
    const url = window.prompt("URL दर्ज करें", "https://");
    if (url) exec("createLink", url);
  };
  
  const insertInlineImage = async (file: File) => {
    try {
      const { url } = await uploadToBucket(file);
      exec("insertImage", url);
      toast.success("इमेज जोड़ी गई");
    } catch (e: any) { toast.error(e.message); }
  };

  const onEditorInput = () => {
    const html = editorRef.current?.innerHTML ?? "";
    setForm((f) => ({ ...f, content: html }));
    setDirty(true);
  };
  
  const onEditorDrop = async (e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
    if (files.length) { e.preventDefault(); for (const f of files) await insertInlineImage(f); }
  };

  const loadingExisting = !!id && existing.isLoading;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => {
              if (dirty && !confirm("बिना सहेजे बदलाव हैं। क्या बाहर जाना चाहते हैं?")) return;
              navigate({ to: "/admin/articles" });
            }}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
          >← वापस</button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {form.title || (id ? "ख़बर संपादित करें" : "नई ख़बर")}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
              <StatusPill status={form.status} />
              <span>{calculatedWordCount} शब्द · {readMin} मिनट पठन</span>
              {dirty ? (
                <span className="text-amber-600">● असहेजे बदलाव</span>
              ) : autoSavedAt ? (
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> स्वतः सहेजा {autoSavedAt.toLocaleTimeString()}</span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
          ><Eye className="h-3.5 w-3.5" /> पूर्वावलोकन</button>
          <button
            type="button"
            disabled={saving}
            onClick={() => doSave("draft")}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            ड्राफ़्ट सहेजें
          </button>
          {canPublish ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => doSave(form.publish_date && new Date(form.publish_date) > new Date() ? "scheduled" : "published")}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              प्रकाशित करें
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => doSave("review")}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              समीक्षा भेजें
            </button>
          )}
        </div>
      </div>

      {loadingExisting ? (
        <div className="mx-auto max-w-[1400px] p-6 space-y-4">
          <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      ) : (
        <div className="mx-auto grid max-w-[1400px] gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-5">
            {rejectionNote && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                <div className="flex items-center gap-2 font-semibold text-destructive">
                  <AlertCircle className="h-4 w-4" /> संपादक ने अस्वीकार किया
                </div>
                <p className="mt-1 text-foreground/80">{rejectionNote}</p>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <input
                value={form.title}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title: v,
                    slug: f.slugTouched ? f.slug : slugify(v),
                    seo_title: f.seo_title || v,
                  }));
                  setDirty(true);
                }}
                placeholder="शीर्षक लिखें…"
                className="w-full border-0 bg-transparent p-0 font-display text-3xl font-bold leading-snug outline-none placeholder:text-muted-foreground/50 sm:text-4xl"
              />
              <input
                value={form.subtitle}
                onChange={(e) => update("subtitle", e.target.value)}
                placeholder="उपशीर्षक (वैकल्पिक)"
                className="mt-2 w-full border-0 bg-transparent p-0 text-lg text-muted-foreground outline-none placeholder:text-muted-foreground/40"
              />

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>URL:</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono">/article/</span>
                <input
                  value={form.slug}
                  onChange={(e) => { setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true })); setDirty(true); }}
                  className="min-w-[120px] flex-1 rounded border border-transparent bg-muted/40 px-2 py-1 font-mono text-xs outline-none hover:border-border focus:border-primary"
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm">
              <EditorToolbar
                onCmd={exec}
                onLink={insertLink}
                onImage={insertInlineImage}
              />
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={onEditorInput}
                onDrop={onEditorDrop}
                onDragOver={(e) => e.preventDefault()}
                data-placeholder="यहाँ अपनी ख़बर लिखें… (Word से पेस्ट करें, इमेज ड्रॉप करें, Ctrl+B बोल्ड)"
                className="editor-body min-h-[420px] px-6 py-6 text-[17px] leading-[1.9] outline-none"
              />
              <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
                <span>{calculatedWordCount} शब्द</span>
                <span>Ctrl+S ड्राफ़्ट · Ctrl+Enter प्रकाशित</span>
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2">
              <Field label="श्रेणी *">
                <select value={form.category_id} onChange={(e) => { setForm((f) => ({ ...f, category_id: e.target.value, subcategory: "" })); setDirty(true); }} className="ae-input">
                  <option value="">— चुनें —</option>
                  {cats.data?.filter((c) => !c.parent_id).map((c) => <option key={c.id} value={c.id}>{c.name_hi}</option>)}
                </select>
              </Field>
              <Field label="उप-श्रेणी">
                {subcatOptions.length > 0 ? (
                  <select value={form.subcategory} onChange={(e) => update("subcategory", e.target.value)} className="ae-input">
                    <option value="">— कोई नहीं —</option>
                    {subcatOptions.map((s) => <option key={s.id} value={s.slug}>{s.name_hi}</option>)}
                  </select>
                ) : (
                  <input value={form.subcategory} onChange={(e) => update("subcategory", e.target.value)} placeholder={form.category_id ? "कोई उप-श्रेणी नहीं" : "पहले श्रेणी चुनें"} disabled={!form.category_id} className="ae-input" />
                )}
              </Field>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-foreground">स्थानीय खबर का स्थान</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="जिला (यदि खबर स्थानीय है)">
                  <select
                    className="ae-input"
                    value={selectedDistrictSlug}
                    onChange={(e) => chooseLocation(e.target.value)}
                  >
                    <option value="">— सभी बिहार / कोई जिला नहीं —</option>
                    {BIHAR_DISTRICTS.map((district) => (
                      <option key={district.slug} value={district.slug}>{district.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="शहर / क्षेत्र (वैकल्पिक)">
                  <select
                    className="ae-input"
                    disabled={!selectedDistrict}
                    value={selectedCitySlug}
                    onChange={(e) => chooseLocation(selectedDistrictSlug, e.target.value)}
                  >
                    <option value="">— पूरा जिला —</option>
                    {selectedDistrict?.cities.map((city) => (
                      <option key={city.slug} value={city.slug}>{city.name}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                खबर सेव करने पर जिला/शहर की पहचान टैग के रूप में जुड़ेगी और संबंधित स्थानीय पेज पर खबर दिखाई देगी।
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <TagIcon className="h-3.5 w-3.5" /> टैग्स
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.tags.filter(t => !t.startsWith("चित्र-विवरण:") && !t.startsWith("चित्र-स्रोत:") && !t.startsWith("चित्र-लिंक:")).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                    #{t}
                    <button type="button" onClick={() => removeTag(t)} className="hover:text-destructive" aria-label="Remove tag"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "," || e.key === "Tab") { e.preventDefault(); commitTag(); }
                    else if (e.key === "Backspace" && !tagInput && form.tags.length) {
                      setForm((f) => ({ ...f, tags: f.tags.slice(0, -1) })); setDirty(true);
                    }
                  }}
                  onBlur={commitTag}
                  placeholder={form.tags.length ? "और जोड़ें…" : "टैग टाइप करें और Enter दबाएँ"}
                  className="min-w-[140px] flex-1 border-0 bg-transparent p-1 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SideCard title="मुख्य चित्र *">
              <DropZone
                onFiles={(fs) => fs[0] && handleFeatured(fs[0])}
                accept={ALLOWED_TYPES}
                multiple={false}
              >
                {form.image_url ? (
                  <div className="relative">
                    <img src={form.image_url} alt="" className="aspect-video w-full rounded-lg object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between rounded-b-lg bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                      <label className="cursor-pointer text-xs text-white/90 hover:text-white">
                        <RefreshCw className="mr-1 inline h-3 w-3" /> बदलें
                        <input type="file" hidden accept={ALLOWED_TYPES.join(",")} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFeatured(f); e.target.value = ""; }} />
                      </label>
                      <button type="button" onClick={() => { update("image_url", ""); }} className="text-xs text-white/90 hover:text-red-300">
                        <Trash2 className="mr-1 inline h-3 w-3" /> हटाएँ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 py-6 text-center text-muted-foreground">
                    <UploadCloud className="h-8 w-8 text-primary/70" />
                    <p className="text-sm font-medium text-foreground">इमेज खींचें या क्लिक करें</p>
                    <p className="text-[11px]">JPG · PNG · WEBP · अधिकतम 8MB</p>
                  </div>
                )}
              </DropZone>
              {featuredUp.current && (
                <div className="mt-2">
                  <ProgressBar pct={featuredUp.current.pct} err={featuredUp.current.err} />
                </div>
              )}
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <Field label="फोटो कैप्शन (सांकेतिक हो तो जरूर लिखें)">
                  <input className="ae-input" value={pictureValue("चित्र-विवरण:")} maxLength={80 - "चित्र-विवरण:".length} onChange={e => changePictureValue("चित्र-विवरण:", e.target.value)} placeholder="सांकेतिक तस्वीर: बारिश के बादल" />
                </Field>
                <Field label="तस्वीर स्रोत / फोटोग्राफर">
                  <input className="ae-input" value={pictureValue("चित्र-स्रोत:")} maxLength={80 - "चित्र-स्रोत:".length} onChange={e => changePictureValue("चित्र-स्रोत:", e.target.value)} placeholder="फोटोग्राफर / संस्था / लाइसेंस" />
                </Field>
                <Field label="मूल फोटो या लाइसेंस का लिंक">
                  <input className="ae-input" value={pictureValue("चित्र-लिंक:")} maxLength={80 - "चित्र-लिंक:".length} onChange={e => changePictureValue("चित्र-लिंक:", e.target.value)} placeholder="https://..." />
                </Field>
                <p className="text-xs leading-5 text-muted-foreground">तस्वीर का स्रोत खबर में दिखाई देगा। प्रकाशन से पहले फोटो अधिकार जाँच लें।</p>
              </div>
            </SideCard>

            <SideCard title={`गैलरी (${form.gallery.length}/12)`}>
              <DropZone
                onFiles={(fs) => handleGallery(fs)}
                accept={ALLOWED_TYPES}
                multiple
                compact
              >
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                  <UploadCloud className="h-4 w-4" />
                  <span>इमेज जोड़ें (कई फ़ाइलें)</span>
                </div>
              </DropZone>
              {galleryUp.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {galleryUp.map((u) => (
                    <div key={u.id} className="text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="truncate">{u.name}</span>
                        {u.err && <button type="button" onClick={() => retryGallery(u.id)} className="text-primary hover:underline">पुनः प्रयास</button>}
                      </div>
                      <ProgressBar pct={u.pct} err={u.err} />
                    </div>
                  ))}
                </div>
              )}
              {form.gallery.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {form.gallery.map((url, i) => (
                    <div key={url + i} className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-end justify-between bg-black/50 px-1 pb-1 opacity-0 transition group-hover:opacity-100">
                        <div className="flex gap-0.5">
                          <button type="button" onClick={() => moveGallery(i, -1)} className="rounded bg-white/20 px-1 text-[10px] text-white hover:bg-white/40" title="ऊपर">◀</button>
                          <button type="button" onClick={() => moveGallery(i, 1)} className="rounded bg-white/20 px-1 text-[10px] text-white hover:bg-white/40" title="नीचे">▶</button>
                        </div>
                        <button type="button" onClick={() => removeGalleryItem(i)} className="rounded bg-red-500/80 px-1 text-[10px] text-white hover:bg-red-500" title="हटाएँ"><X className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {form.gallery.length > 0 && form.gallery.length < 5 && (
                <p className="mt-2 text-[11px] text-amber-600">कम से कम 5 इमेज सुझाई जाती हैं</p>
              )}
            </SideCard>

            <SideCard title="प्रकाशन">
              <div className="space-y-3">
                <Field label="स्थिति">
                  <select value={form.status} onChange={(e) => update("status", e.target.value as any)} className="ae-input">
                    <option value="draft">ड्राफ़्ट</option>
                    <option value="review">समीक्षा हेतु</option>
                    {canPublish && <option value="scheduled">शेड्यूल्ड</option>}
                    {canPublish && <option value="published">प्रकाशित</option>}
                  </select>
                </Field>
                <Field label={<><Calendar className="mr-1 inline h-3 w-3" /> प्रकाशन तिथि</>}>
                  <input type="datetime-local" value={form.publish_date} onChange={(e) => update("publish_date", e.target.value)} className="ae-input" />
                </Field>
                {isReporter && (
                  <p className="text-[11px] text-muted-foreground">आप ड्राफ़्ट सहेज सकते हैं या समीक्षा हेतु भेज सकते हैं।</p>
                )}
              </div>
            </SideCard>

            <SideCard title="लेखक">
              <select value={form.author_id} onChange={(e) => update("author_id", e.target.value)} className="ae-input">
                <option value="">— चुनें —</option>
                {authors.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <div className="mt-2 flex gap-2">
                <input value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} placeholder="नया लेखक" className="ae-input" />
                <button type="button" onClick={addAuthor} className="rounded-md border border-border px-3 text-sm hover:bg-muted">+</button>
              </div>
            </SideCard>

            <Collapsible title="SEO">
              <div className="space-y-3">
                <Field label="संक्षेप (Summary)">
                  <textarea
                    value={form.summary}
                    onChange={(e) => { setForm((f) => ({ ...f, summary: e.target.value, summaryTouched: true })); setDirty(true); }}
                    rows={3} placeholder={autoSummary(form.content) || "स्वतः जनरेट होगा"} className="ae-input"
                  />
                  {!form.summaryTouched && form.content && (
                    <button type="button" onClick={() => { setForm((f) => ({ ...f, summary: autoSummary(f.content), summaryTouched: true })); setDirty(true); }} className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                      <Sparkles className="h-3 w-3" /> सामग्री से जनरेट करें
                    </button>
                  )}
                </Field>
                <Field label="SEO शीर्षक"><input value={form.seo_title} onChange={(e) => update("seo_title", e.target.value)} className="ae-input" /></Field>
                <Field label="SEO विवरण"><textarea rows={2} value={form.seo_description} onChange={(e) => update("seo_description", e.target.value)} className="ae-input" /></Field>
                <Field label="Keywords (कॉमा)"><input value={form.seo_keywords} onChange={(e) => update("seo_keywords", e.target.value)} className="ae-input" /></Field>
              </div>
            </Collapsible>

            {canPublish && (
              <Collapsible title="उन्नत विकल्प">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} />
                    <Star className="h-3.5 w-3.5 text-primary" /> फ़ीचर्ड
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_trending} onChange={(e) => update("is_trending", e.target.checked)} />
                    <Flame className="h-3.5 w-3.5 text-amber-600" /> ट्रेंडिंग
                  </label>
                  <Field label="फ़ीचर्ड क्रम"><input type="number" value={form.featured_rank} onChange={(e) => update("featured_rank", e.target.value)} className="ae-input" /></Field>
                </div>
              </Collapsible>
            )}
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(false)}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-2xl bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-muted-foreground">पूर्वावलोकन</div>
                <h1 className="mt-1 font-display text-3xl font-bold leading-snug">{form.title || "—"}</h1>
                {form.subtitle && <p className="mt-1 text-muted-foreground">{form.subtitle}</p>}
              </div>
              <button onClick={() => setPreview(false)} className="rounded-md border border-border p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            {form.image_url && <img src={form.image_url} alt="" className="mt-4 aspect-video w-full rounded-lg object-cover" />}
            <div className="prose prose-lg dark:prose-invert mt-5 max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.content) }} />
          </div>
        </div>
      )}

      <style>{`
        .ae-input { width:100%; border:1px solid var(--color-border); background:var(--color-background); border-radius:0.5rem; padding:0.5rem 0.65rem; font-size:0.875rem; outline:none; }
        .ae-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 15%, transparent); }
        .editor-body:empty:before { content: attr(data-placeholder); color: var(--color-muted-foreground); opacity:.55; pointer-events:none; }
        .editor-body h2 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 .5rem; }
        .editor-body h3 { font-size: 1.25rem; font-weight: 700; margin: .9rem 0 .4rem; }
        .editor-body p { margin: 0 0 .8rem; }
        .editor-body ul { list-style: disc; padding-left: 1.4rem; margin: 0 0 .8rem; }
        .editor-body ol { list-style: decimal; padding-left: 1.4rem; margin: 0 0 .8rem; }
        .editor-body blockquote { border-left: 3px solid var(--color-primary); padding-left: .9rem; color: var(--color-muted-foreground); font-style: italic; margin: 0 0 .8rem; }
        .editor-body a { color: var(--color-primary); text-decoration: underline; }
        .editor-body img { max-width: 100%; height: auto; border-radius: .5rem; margin: .5rem 0; }
        .editor-body:focus { outline: none; }
      `}</style>
    </div>
  );
}

// ---------------- subcomponents ----------------

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        <span>{title}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && <div className="border-t border-border p-4">{children}</div>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "ड्राफ़्ट", cls: "bg-muted text-foreground/70" },
    review: { label: "समीक्षा", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
    scheduled: { label: "शेड्यूल्ड", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    published: { label: "प्रकाशित", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  };
  const it = map[status] ?? map.draft;
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${it.cls}`}>{it.label}</span>;
}

function ProgressBar({ pct, err }: { pct: number; err?: string }) {
  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
        <div className={`h-full transition-all ${err ? "bg-destructive" : "bg-primary"}`} style={{ width: `${err ? 100 : pct}%` }} />
      </div>
      {err && <p className="mt-1 text-[11px] text-destructive">{err}</p>}
    </div>
  );
}

function DropZone({
  onFiles, accept, multiple, compact, children,
}: {
  onFiles: (files: File[]) => void;
  accept: string[];
  multiple?: boolean;
  compact?: boolean;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setOver(false);
        const fs = Array.from(e.dataTransfer.files || []).filter((f) => accept.includes(f.type));
        if (fs.length) onFiles(multiple ? fs : [fs[0]]);
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-lg border-2 border-dashed transition ${over ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"} ${compact ? "" : "p-2"}`}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple={multiple}
        accept={accept.join(",")}
        onChange={(e) => {
          const fs = Array.from(e.target.files || []);
          if (fs.length) onFiles(fs);
          e.target.value = "";
        }}
      />
      {children}
    </div>
  );
}

function EditorToolbar({
  onCmd, onLink, onImage,
}: { onCmd: (cmd: string, val?: string) => void; onLink: () => void; onImage: (f: File) => void }) {
  const imgRef = useRef<HTMLInputElement>(null);
  const Btn = ({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" title={title} onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
      {children}
    </button>
  );
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
      <Btn title="H2" onClick={() => onCmd("formatBlock", "H2")}><Heading2 className="h-4 w-4" /></Btn>
      <Btn title="H3" onClick={() => onCmd("formatBlock", "H3")}><Heading3 className="h-4 w-4" /></Btn>
      <span className="mx-1 h-5 w-px bg-border" />
      <Btn title="Bold (Ctrl+B)" onClick={() => onCmd("bold")}><Bold className="h-4 w-4" /></Btn>
      <Btn title="Italic (Ctrl+I)" onClick={() => onCmd("italic")}><Italic className="h-4 w-4" /></Btn>
      <Btn title="Underline" onClick={() => onCmd("underline")}><Underline className="h-4 w-4" /></Btn>
      <span className="mx-1 h-5 w-px bg-border" />
      <Btn title="Bullet list" onClick={() => onCmd("insertUnorderedList")}><List className="h-4 w-4" /></Btn>
      <Btn title="Numbered list" onClick={() => onCmd("insertOrderedList")}><ListOrdered className="h-4 w-4" /></Btn>
      <Btn title="Quote" onClick={() => onCmd("formatBlock", "BLOCKQUOTE")}><Quote className="h-4 w-4" /></Btn>
      <span className="mx-1 h-5 w-px bg-border" />
      <Btn title="Link" onClick={onLink}><Link2 className="h-4 w-4" /></Btn>
      <Btn title="Image" onClick={() => imgRef.current?.click()}><ImageIcon className="h-4 w-4" /></Btn>
      <input ref={imgRef} type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImage(f); e.target.value = ""; }} />
      <span className="mx-1 h-5 w-px bg-border" />
      <Btn title="Undo" onClick={() => onCmd("undo")}><Undo2 className="h-4 w-4" /></Btn>
      <Btn title="Redo" onClick={() => onCmd("redo")}><Redo2 className="h-4 w-4" /></Btn>
    </div>
  );
}
