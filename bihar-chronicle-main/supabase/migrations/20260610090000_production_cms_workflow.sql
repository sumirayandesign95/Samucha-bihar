-- Production CMS workflow hardening.
-- Adds review/scheduled states requested by the newsroom workflow while keeping
-- existing draft/published content untouched.

ALTER TABLE public.news_articles
  DROP CONSTRAINT IF EXISTS news_articles_status_check;

ALTER TABLE public.news_articles
  ADD CONSTRAINT news_articles_status_check
  CHECK (status in ('draft', 'review', 'scheduled', 'published'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'super_admin'
      AND enumtypid = 'public.app_role'::regtype
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'super_admin';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'reporter'
      AND enumtypid = 'public.app_role'::regtype
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'reporter';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS news_articles_tags_idx ON public.news_articles USING gin (tags);
CREATE INDEX IF NOT EXISTS news_articles_status_created_idx ON public.news_articles (status, created_at desc);

ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS gallery text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.authors
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS x_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Required for RLS policies that call public.has_role from authenticated requests
-- such as Storage uploads from the CMS UI.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
