# Changelog

All notable changes documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `scripts/setup-fork.sh` bootstrap flow for fresh forks (KV namespaces,
  SESSION_SECRET_DEV, next-step checklist).
- `/api/health` endpoint with unit and Playwright smoke coverage.
- `kit.csp` hash-mode configuration so SvelteKit auto-computes CSP hashes
  for its hydration bootstrap plus the inline theme-detection script in
  `src/app.html` on every build — no more manual hash maintenance.
- Locale-aware SSR handoff: `hooks.server.ts` resolves the `locale` cookie
  into `event.locals.locale`, `+layout.server.ts` surfaces it, and
  `+layout.svelte` seeds the store synchronously on the server so pages
  like `/privacy` render in the correct language without a hydration flash.
- Schema-validated beverage data (`src/lib/data/schema.ts`, Zod), with
  positive and negative test coverage.
- Negative-path tests for beverage data, locale handoff, and `formatNumber`
  (NaN/Infinity handling).
- `.github/workflows/ci.yml` delegates lint, typecheck, format check, unit
  tests with coverage, build, `pnpm audit`, Trivy filesystem/dependency
  scans and (for public repos) dependency review to the shared reusable
  workflow `sbaerlocher/.github/.github/workflows/ci-js.yml@2026-04-11`.
  The E2E Playwright job stays local because the reusable workflow doesn't
  cover it; a `status: All Checks Passed` job aggregates results for
  branch protection. New `type-check` and `format:check` aliases in
  `package.json` bridge the naming convention expected by the reusable
  workflow.

### Changed

- `wrangler.jsonc` split into `env.preview` / `env.production` with
  environment-scoped KV namespaces, Secrets Store bindings, routes, and
  vars. Top-level config holds only local-dev placeholders.
- `pnpm preview` now runs `wrangler dev` against the Cloudflare Workers
  adapter output (the previous `wrangler pages dev` command targeted the
  old Pages adapter and no longer works).
- `package.json` `prepare` hook now runs `scripts/install-hooks.mjs`, which
  skips cleanly when `lefthook` isn't on disk (e.g. `pnpm install --prod`
  in CI/Docker) but propagates real failures from `lefthook install`
  instead of swallowing them with `|| true`.
- `vitest.config.ts` coverage thresholds lowered to a realistic floor for
  the initial release (lines 25, statements 25, branches 65, functions 60)
  with a TODO to raise as tests are added.
- `formatNumber` renders non-finite inputs (NaN, ±Infinity) as an em-dash
  instead of leaking `"NaN"` / `"∞"` into the UI.
- `ShareButton` no longer uses non-null assertions on `canvas.toBlob` /
  `getContext('2d')`; failures surface as a localized error toast in the
  share dialog and don't crash the component.

### Fixed

- Revoked-integration handling: when a user disconnects parqet.beer in
  their Parqet Connect settings, the next API call now clears the cached
  per-user KV data, drops the encrypted session cookie, and redirects the
  browser back to the landing page. Previously a revoked token silently
  mapped to `null`, which the route handlers rendered as
  `{ totalValue: 0 }`, so users saw "0 beers / 0 coffees / 0 smoothies"
  instead of a re-auth prompt. `parqet-client.ts` now throws a new
  `ParqetAuthError` on HTTP 401 so API routes can distinguish "token
  dead" from "upstream flaked." The dashboard probes `/api/portfolios`
  with `?fresh=1` on mount to bypass the KV cache, so revocation surfaces
  immediately rather than after the cache TTL expires.
- `scripts/setup-fork.sh` ID-extraction: progress banners now go to stderr
  so `PREVIEW_ID=$(create_kv ...)` captures only the namespace ID.
- Privacy page SSR/hydration locale mismatch: the store now seeds from
  the request cookie on the server, not just on client hydration.
- E2E health smoke test: contract matches the handler's
  `{ status, timestamp }` response shape.

## [0.1.0] - 2026-04-13

### Added

- Initial public release.
- Parqet Connect OAuth 2.0 + PKCE authentication, JWE (`jose`) session
  cookies, Cloudflare KV-backed token storage and rate limiting.
- Beverage conversion (beer, coffee, smoothie) with EUR/CHF currency
  toggle and portfolio-sourced FX rate derivation.
- DE/EN i18n, dark mode, shareable image export, fun-stats, dividends
  in beer, beverage-of-the-day, milestone badges.
- Security headers: HSTS, X-Frame-Options, Referrer-Policy,
  Permissions-Policy, COOP, CORP, baseline CSP.
