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

## District and City Edition (second preview milestone)
- Reviewed UI/navigation patterns of Jagran and Live Hindustan (city selection, scannable news) and incorporated a distinct Bihar-first layout.
- 38 verified Bihar districts, each with a curated list of representative cities/towns; not a complete village directory.
- Added `/districts` directory and `/district/$slug` filterable news pages, with city query parameter.
- Added responsive district/city selector to homepage and global navigation.
- Added district/city fields in the existing article editor. Existing `tags` array stores `जिला:<slug>` and `शहर:<slug>` values.
- Old news stays untouched and is not silently classified. Empty district pages show a truthful no-content message.
- No DB schema change, role/policy modification, or production deployment.

## Article reading experience
- Localized absolute publication dates (Asia/Kolkata) in article meta.
- Added reading-time estimate and A-/A+ adjustable text for accessibility.
- Added newspaper-style Hindi article typography and clearer paragraph spacing.
- Existing article body text, authors, publication dates and media preserved.

## Reader ease of use and Preview safeguards
- Six quick district links under the location picker; links avoid unnecessary dropdown steps.
- News stories link official district/city tags back to local editions instead of exposing machine-readable metadata.
- Replaced dummy footer social placeholders and an unverified email with functional internal links.
- Preview admin routes show a read-only notice instead of loading edit and media-upload interfaces.
- All 15 server-side admin POST handlers now check that the deployment is Vercel production on main before writing; all other environments are denied.
- Live database schema, records, permissions and production branch are unchanged.
- Remaining: isolated staging Supabase project and end-to-end browser testing before production deployment.

## HTML rendering and build fix
- Corrected a translated icon symbol in admin imports (`Tags`), preserving Hindi display labels.
- Article body now renders escaped text on SSR and first hydration; sanitized rich HTML appears after hydration.
- Admin editor loads saved HTML through DOMPurify and sanitizes its preview before rendering.
- Production, live content and database remain unchanged. A separate staging database remains the recommended prerequisite for enabling Preview editing.

## Admin usability milestone
- Localize newsroom dashboard, review queue, role labels and article status badges in Hindi.
- Pending security release gate: public.user_roles RLS must be addressed with tested service-key authorization before a production release.

## Hindi admin usability 2
- Dashboard quick actions and Hindi workflow descriptions.
- Admin article list search, status filtering, result count, reload and deletion error reporting.
- Review queue actionable error reporting and future-time checks for scheduling.
- Cleaner permission messages in role management. No production SQL or schema modifications.

## Release gate hardening
- Privileged admin client now fails closed without server-only SUPABASE_SERVICE_ROLE_KEY.
- Added migration blueprint for RLS and role privileges, intentionally unapplied.
- Added pre-release staging tests, backup, migration order, and rollback checklist.

## Mobile first-screen correction (user screenshot feedback, 24 October 2026)
- Homepage on screens under md now has a single compact "अपने जिले की खबरें / जिला चुनें" row; expands only when the reader taps it.
- First main-news block appears immediately under the compact row instead of below a full-screen location form.
- Removed the verbose tagline, secondary description and search shortcut from the narrow mobile first-screen only (search remains in the header menu).
- Desktop retains its full district and city selector; district directory and admin functionality remain unchanged.
- No live data, Supabase, or production deployment changes.
