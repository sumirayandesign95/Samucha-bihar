
-- Fix search_path on trigger function
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end $$;

-- Remove broad listing policy; public bucket still serves files via public CDN URLs
drop policy if exists "news images public read" on storage.objects;

-- Restrict has_role execute permission
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
