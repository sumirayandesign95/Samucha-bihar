-- Planned migration: run ONLY after staging validation and production
-- SUPABASE_SERVICE_ROLE_KEY configuration, and after confirming backup.
-- This file is a reviewed release plan; it is NOT automatically applied.
begin;
  alter table public.user_roles enable row level security;

  -- Role membership is private to the signed-in user. Admin server role uses
  -- the Supabase service key and bypasses RLS only on the trusted server.
  drop policy if exists "users read own roles" on public.user_roles;
  create policy "users read own roles"
    on public.user_roles
    for select to authenticated
    using (user_id = (select auth.uid()));

  -- Publishing and account-role mutations belong to server endpoints only.
  revoke all on table public.user_roles from public, anon, authenticated;
  grant select on table public.user_roles to authenticated;

  -- This SECURITY DEFINER helper must never be remotely callable.
  revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
commit;
