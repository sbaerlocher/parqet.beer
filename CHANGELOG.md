# Changelog

All notable changes documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-04-22

### Added

- DDE development environment with Docker, Traefik (`parqet-beer.test`),
  and node-pnpm adapter for containerised local development.
- `resolveOrigin()` helper using `X-Forwarded-Proto` for OAuth redirects
  behind TLS-terminating reverse proxies.
- DDE setup instructions in README, CONTRIBUTING, and AGENTS docs.
- Gampert Bräu Förster Pils (500ml, DE) and Kulmbacher Edelherb (500ml, DE)
  to beer data.

### Changed

- pnpm version in DDE adapter reads from `package.json` via
  `corepack prepare --activate` (single source of truth).

### Removed

- Redundant DDE plugins (`build`, `check`, `lint`, `lint-fix`, `test`,
  `shell`) replaced by `dde exec pnpm <command>`.

## [0.2.0] - 2026-04-20

### Added

- Animated SVG glass components (`BeerGlass`, `CoffeeGlass`, `SmoothieGlass`)
  with Svelte 5 `Tween`-driven fill level that interpolates between badge tiers.
- Expanded milestone badges from 4–6 to 12 per category with finer steps
  under 100k and larger steps above (100 → 500 → 1k → … → 1M).
- Mobile-optimised dashboard and landing page: responsive padding, card layout
  for beverage table, horizontal scroll for portfolio buttons, 2×2 ticker grid,
  hero number with `clamp()`.
- Rank badge pill rendered on the canvas share card image.
- Beverage category selection persisted to `localStorage`.
- `RotatingTagline` component for the landing page.
- Local self-hosted fonts (Inter, Space Grotesk, JetBrains Mono) with
  `static/fonts/LICENSE` (SIL OFL 1.1).
- ~30 new i18n keys covering all previously inline-hardcoded strings across
  landing, dashboard, share dialog, and component files.

### Changed

- All inline `$locale === 'de' ? … : …` checks replaced with `$t.*` keys
  from the centralised i18n store (except tagline array selection and
  decorative eyebrow labels).
- Privacy page refactored from per-sentence ternaries to clean
  `{#if $locale === 'de'}` / `{:else}` content blocks.
- `localStorage` access made SSR-safe for Cloudflare Workers: guard changed
  from `typeof localStorage` to `typeof window`, reads moved into `$effect`
  with loaded flags to prevent hydration mismatches.
- Share preview dialog centred and enlarged (`max-w-2xl`, fixed inset with
  flex centering).
- Logout button shows icon on mobile instead of text to save width.

### Removed

- Google Fonts CDN preconnect and stylesheet links (fonts already served
  locally).
- 8 unused i18n translation keys (`landingDescription`, `funProject`,
  `thatsEquivalentTo`, `allVarieties`, `funStatsLabel`, `disclaimer2`,
  `shareCardSubtitle`, `shareCardPortfolioValue`).

### Fixed

- Glass fill level now responds to portfolio value changes instead of
  staying at a fixed height.
- Badge display no longer shows "—" when the maximum badge level is reached.
- Horizontal overflow on mobile caused by wide elements.
- FOUC (flash of old design) from redundant Google Fonts CDN.
- `localStorage` SSR crash on Cloudflare Workers.
- SSR/CSR hydration mismatch for `showValue` and `favorites` state.

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
- `"license": "MIT"` field in `package.json`.
- `.gitattributes` with `* text=auto` for line-ending normalisation.
- SPDX-License-Identifier headers (`MIT`) in all `.ts` and `.svelte`
  source files.
- Consolidated duplicate `Beverage` type: single source of truth in
  `src/lib/data/schema.ts` (Zod inferred), re-exported from
  `src/lib/data/beverages.ts`.

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
