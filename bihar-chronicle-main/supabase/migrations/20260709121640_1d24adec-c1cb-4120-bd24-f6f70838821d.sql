-- Keep the role helper aligned with the app's staff roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  );
$$;

-- Articles: editors/admins/super admins can manage all; reporters can manage their own unpublished/review content
DROP POLICY IF EXISTS "admin read all articles" ON public.news_articles;
DROP POLICY IF EXISTS "admin write articles" ON public.news_articles;
DROP POLICY IF EXISTS "staff read admin articles" ON public.news_articles;
DROP POLICY IF EXISTS "editor manage all articles" ON public.news_articles;
DROP POLICY IF EXISTS "reporter create own articles" ON public.news_articles;
DROP POLICY IF EXISTS "reporter update own unpublished articles" ON public.news_articles;
DROP POLICY IF EXISTS "reporter delete own unpublished articles" ON public.news_articles;

CREATE POLICY "staff read admin articles"
ON public.news_articles
FOR SELECT
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[])
  OR (
    public.has_any_role(auth.uid(), ARRAY['reporter']::public.app_role[])
    AND created_by = auth.uid()
  )
);

CREATE POLICY "editor manage all articles"
ON public.news_articles
FOR ALL
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]));

CREATE POLICY "reporter create own articles"
ON public.news_articles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['reporter']::public.app_role[])
  AND created_by = auth.uid()
  AND status IN ('draft', 'review')
  AND COALESCE(is_featured, false) = false
  AND COALESCE(is_trending, false) = false
);

CREATE POLICY "reporter update own unpublished articles"
ON public.news_articles
FOR UPDATE
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['reporter']::public.app_role[])
  AND created_by = auth.uid()
  AND status <> 'published'
)
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['reporter']::public.app_role[])
  AND created_by = auth.uid()
  AND status IN ('draft', 'review')
  AND COALESCE(is_featured, false) = false
  AND COALESCE(is_trending, false) = false
);

CREATE POLICY "reporter delete own unpublished articles"
ON public.news_articles
FOR DELETE
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['reporter']::public.app_role[])
  AND created_by = auth.uid()
  AND status <> 'published'
);

-- Staff content tables: editors/admins/super admins manage, public read policies remain unchanged
DROP POLICY IF EXISTS "authors admin write" ON public.authors;
DROP POLICY IF EXISTS "authors staff write" ON public.authors;
CREATE POLICY "authors staff write"
ON public.authors
FOR ALL
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]));

DROP POLICY IF EXISTS "categories admin write" ON public.categories;
DROP POLICY IF EXISTS "categories staff write" ON public.categories;
CREATE POLICY "categories staff write"
ON public.categories
FOR ALL
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]));

DROP POLICY IF EXISTS "breaking admin write" ON public.breaking_news;
DROP POLICY IF EXISTS "breaking staff write" ON public.breaking_news;
CREATE POLICY "breaking staff write"
ON public.breaking_news
FOR ALL
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[]));

-- Storage policies for the public news image bucket
DROP POLICY IF EXISTS "news images admin write" ON storage.objects;
DROP POLICY IF EXISTS "news images admin update" ON storage.objects;
DROP POLICY IF EXISTS "news images admin delete" ON storage.objects;
DROP POLICY IF EXISTS "news images staff write" ON storage.objects;
DROP POLICY IF EXISTS "news images editor update" ON storage.objects;
DROP POLICY IF EXISTS "news images editor delete" ON storage.objects;

CREATE POLICY "news images staff write"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'news-images'
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','reporter']::public.app_role[])
);

CREATE POLICY "news images editor update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'news-images'
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[])
)
WITH CHECK (
  bucket_id = 'news-images'
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[])
);

CREATE POLICY "news images editor delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'news-images'
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::public.app_role[])
);

-- Ensure Data API grants exist for all admin-managed public tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authors TO authenticated;
GRANT ALL ON public.authors TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_articles TO authenticated;
GRANT ALL ON public.news_articles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.breaking_news TO authenticated;
GRANT ALL ON public.breaking_news TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;