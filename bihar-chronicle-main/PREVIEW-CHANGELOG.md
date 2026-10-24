# Samucha Bihar — safe preview milestone (24 October 2026)

Branch: `development/premium-hindi-newsroom`.

## Scope
- Premium Hindi masthead, navigation, responsive article discovery and homepage layouts.
- Display the latest published article in the lead slot if editors have not set a featured flag.
- Distinguish most-read articles from editorial selection.
- Hide breaking ticker items older than 48 hours without deleting their database rows.
- Localize root errors and set HTML language to Hindi.
- Better keyboard focus and reduced-motion preferences.

## Safety
- No Supabase SQL, migrations, RLS, authentication, or storage modifications.
- No changes to admin panel routes, published content or editorial records.
- No production deployment, aliases, or domain changes.
- Check Preview environment variables are configured safely.
- Before a production merge, resolve the pre-existing RLS vulnerability on `public.user_roles` with tested policies; also review article HTML sanitization and deploy monitoring.

## Security dependency update
- Pinned `@tanstack/react-start` to patched 1.168.60 (CVE-2026-102989).
- Removed view-count writes from article GET to keep Preview browsing read-only.
- The build environment refreshes dependency resolution via `bun install`; reconcile and commit a regenerated `bun.lock` before enabling frozen-lockfile CI or production promotion.

## Runtime dependency compatibility (follow-up)
- Pin matching TanStack family versions: react-start 1.168.60; react-router 1.170.41; router-plugin 1.168.42; router-core 1.171.34; start-server-core 1.169.39.
- All modifications remain on the development branch. No production deploy.
