# Samucha Bihar — PRODUCTION RELEASE GATE

Status: BLOCKED. The user has approved the future website launch, but successful Preview builds alone do not demonstrate secure admin operation. Keep PR #1 in DRAFT until gates are cleared.

## Confirmed existing blockers (2026-10-24)
- `public.user_roles` has row-level security disabled while `anon` and `authenticated` have full table privileges.
- `public.rls_auto_enable()` is SECURITY DEFINER and is executable from public roles.
- Vercel `samucha-bihar` has `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in production/preview but **no `SUPABASE_SERVICE_ROLE_KEY`**.
- Current admin role management and `admin.auth.admin.listUsers` require a server-only service key. The previous fallback to publishable key is unsafe.
- No separate Supabase development branch currently exists; Preview currently shares production database.
- Preview writes have been blocked by server-side guards; keep it read-only until isolated staging DB is available.

## Required order before public launch
1. Confirm point-in-time backups or create a verified production backup and review rollback options. Do not paste any credentials into chat or Git.
2. Create an isolated Supabase test branch/project after owner authorizes any associated charges. Do not clone real production user data without permission.
3. In Vercel project Settings -> Environment Variables, add `SUPABASE_SERVICE_ROLE_KEY` **production only**, as a sensitive secret. Obtain it directly from the project's Supabase API settings; never put it in a `VITE_` variable or preview environment. Check the key belongs to `bgkiaesjyfivpvgvbyot`.
4. Test authenticated admin role verification, news drafts, editor approval, scheduling, media upload, user-role assignment, denial for anonymous users, and denial of reporter publish/delete in staging. Test Preview and draft links; ensure no real data changes.
5. Review and run `release/sql/secure_user_roles.sql` on staging. Verify:
    - Anon can neither SELECT nor INSERT/UPDATE/DELETE `user_roles`.
    - Authenticated users can only SELECT *their own* role rows, and cannot INSERT/UPDATE/DELETE roles.
    - `service_role` can manage newsroom data server-side; `rls_auto_enable()` cannot be invoked by anon/authenticated.
    - Security advisor no longer reports the RLS and SECURITY DEFINER findings.
6. Approve the production release only after the above checks. Merge the reviewed PR to `main`, then verify new Vercel production deployment and role access. Coordinate production DDL and redeploy so the old admin isn't locked out.
7. Inspect live homepage, /districts, district filtering, /admin login and story publishing without deleting existing content. Verify all prior articles and roles remain intact.

## Rollback
- Keep original Git `main` SHA and Vercel READY production deployment ID recorded; use Vercel rollback if new UI fails.
- Do not roll back the security hardening RLS grants just to restore editor access. Fix server secrets and grants correctly.
- If a release fails, stop editorial writes until permissions and role claims are verified.

## Known feature issues after launch
- Supabase article view counter is paused to protect Preview reads; replace with safeguarded analytics.
- Articles published before district metadata was added are not auto-assigned to a district.
- Regenerate `bun.lock` with the matching pinned TanStack patched dependencies, then build with `--frozen-lockfile`.
- Google News, sitemap, and performance testing need separate verification.

Supabase RLS docs: https://supabase.com/docs/guides/database/postgres/row-level-security

## Additional audit 24 October 2026
- Confirmed 16 published articles, two staff rows (one admin and one super_admin), and 22 media files in public news-images storage. Read-only counts only; no user identities read.
- `has_role` / `has_any_role` are SECURITY INVOKER and read public.user_roles; after enabling RLS the authenticated policy must continue to allow each user to read their own roles for media uploads to work. Test this explicitly.
- Supabase separate test branch quote: $0.01344 per hour, requiring owner cost approval before creation. Do not create it without explicit acceptance.
- Admin UI now hides editor-only navigation and delete controls from reporter role; server-side requireEditor and requireSuperAdmin checks remain authoritative.
