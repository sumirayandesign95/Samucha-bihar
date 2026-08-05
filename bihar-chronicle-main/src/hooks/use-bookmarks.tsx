import { useEffect, useState, useCallback } from "react";

const KEY = "sb_bookmarks_v1";

type BookmarkArticle = {
  id: string;
  slug: string;
  title: string;
  image_url?: string | null;
  summary?: string | null;
  published_at: string | null;
  category?: { slug: string; name_hi: string; name_en: string } | null;
  author?: { name: string; avatar_url?: string | null } | null;
  savedAt: number;
};

function read(): BookmarkArticle[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function write(list: BookmarkArticle[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("sb-bookmarks-changed"));
}

export function useBookmarks() {
  const [items, setItems] = useState<BookmarkArticle[]>([]);

  useEffect(() => {
    setItems(read());
    const onChange = () => setItems(read());
    window.addEventListener("sb-bookmarks-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("sb-bookmarks-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const isBookmarked = useCallback(
    (id: string) => items.some((b) => b.id === id),
    [items],
  );

  const toggle = useCallback((a: Omit<BookmarkArticle, "savedAt">) => {
    const cur = read();
    const exists = cur.some((b) => b.id === a.id);
    const next = exists
      ? cur.filter((b) => b.id !== a.id)
      : [{ ...a, savedAt: Date.now() }, ...cur].slice(0, 200);
    write(next);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((b) => b.id !== id));
  }, []);

  return { items, isBookmarked, toggle, remove };
}

export type { BookmarkArticle };