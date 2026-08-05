-- 1. Extend role enum (new values can't be USED in same txn, but ADD VALUE is fine)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'reporter';

-- 2. News articles: SEO / subcategory / gallery / workflow columns
ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS gallery text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_note text;

-- 3. Widen status check (allow review + scheduled)
ALTER TABLE public.news_articles DROP CONSTRAINT IF EXISTS news_articles_status_check;
ALTER TABLE public.news_articles
  ADD CONSTRAINT news_articles_status_check
  CHECK (status IN ('draft','review','scheduled','published'));

CREATE INDEX IF NOT EXISTS news_articles_status_idx ON public.news_articles(status);
CREATE INDEX IF NOT EXISTS news_articles_created_by_idx ON public.news_articles(created_by);
CREATE INDEX IF NOT EXISTS news_articles_scheduled_idx
  ON public.news_articles(published_at) WHERE status = 'scheduled';

-- 4. updated_at trigger
DROP TRIGGER IF EXISTS news_articles_touch_updated_at ON public.news_articles;
CREATE TRIGGER news_articles_touch_updated_at
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. Subcategories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS categories_parent_idx ON public.categories(parent_id);

-- 6. Author social fields
ALTER TABLE public.authors
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS x_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text;

-- 7. pg_cron job: auto-publish scheduled articles every minute
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('publish-scheduled-articles');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'publish-scheduled-articles',
  '* * * * *',
  $$ UPDATE public.news_articles
     SET status = 'published'
     WHERE status = 'scheduled'
       AND published_at IS NOT NULL
       AND published_at <= now(); $$
);