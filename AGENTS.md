<!-- For AI assistants. Human contributors: see CONTRIBUTING.md. -->

# parqet.beer

Humorous web app that converts a Parqet user's portfolio value into beers, coffees, or smoothies.

## Tech Stack

- **Framework**: SvelteKit (SSR on Cloudflare Pages)
- **Adapter**: `@sveltejs/adapter-cloudflare`
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Auth**: Parqet Connect OAuth 2.0 + PKCE (public client, no client secret),
  session cookie via jose JWE (httpOnly, userId only), OAuth tokens in KV (30d TTL)
- **Storage**: Cloudflare KV (`PARQET_KV`)
- **Validation**: Zod
- **Testing**: Vitest
- **Formatting**: Prettier + prettier-plugin-svelte

## Architecture

```text
Browser (SvelteKit SPA)
  ├── Landing Page (/)
  └── Dashboard (/dashboard)
        ├── fetch /api/performance
        ├── fetch /api/portfolios
        └── Beverage Calculation (client-side)

Server (SvelteKit API Routes)
  ├── /api/auth/login      → PKCE + redirect to Parqet
  ├── /api/auth/callback   → Token exchange + session
  ├── /api/auth/logout     → Delete session
  ├── /api/portfolios      → Parqet API proxy (cached 1h)
  ├── /api/performance     → Parqet API proxy (cached 15min)
  └── /api/preferences     → User preferences (KV)

Cloudflare KV
  ├── token:{userId}       → OAuth tokens (TTL 30d)
  ├── user:{userId}        → User info (TTL 1h)
  ├── portfolios:{userId}  → Portfolio list (TTL 1h)
  ├── performance:{userId} → Total value (TTL 15min)
  └── preferences:{userId} → Preferences
```

## Conventions

- **Files**: kebab-case.ts / PascalCase.svelte
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Server-only code**: `src/lib/server/` (SvelteKit enforces this automatically)
- **Components**: `src/lib/components/`
- **Beverage reference data**: `src/lib/data/{beer,coffee,smoothie}.json` —
  schema: `{name, size, price, currency, country}` (price in local currency,
  conversion via FX rate in `src/lib/fx.ts`)
- **Commits**: Conventional Commits, DCO-signed off (`git commit -s`) — see
  `CONTRIBUTING.md`

## Development

This project has a `.dde/config.yml`. **All project-dependent commands run in
the container, never directly on the host.** AI assistants: use the DDE
commands below, without exception.

### With DDE

```bash
dde project:up                            # Start container (runs pnpm install via adapter)
dde project:exec pnpm dev --host 0.0.0.0  # Dev server (already runs via docker-compose command)
dde project:exec pnpm build               # Build for CF Pages
dde project:exec pnpm preview             # Wrangler against .svelte-kit/cloudflare — requires build first
dde project:exec pnpm check               # TypeScript + Svelte check
dde project:exec pnpm check:watch         # svelte-check in watch mode
dde project:exec pnpm test                # Vitest
dde project:exec pnpm test:watch          # Vitest watch
dde project:exec pnpm test:e2e            # Playwright
dde project:exec pnpm lint                # Prettier --check (CI enforced)
dde project:exec pnpm format              # Prettier
dde project:exec pnpm generate:assets     # OG image / favicons from scripts/generate-assets.mjs
```

### Without DDE

Not an agent path — see `CONTRIBUTING.md` § Setup.

## Gotchas

- **Svelte 5 Runes**: `$state`, `$derived`, `$effect`, `$props` — not Svelte 4 syntax (`export let`, reactive `$:`)
- **Tailwind v4**: No `tailwind.config.js` — config via CSS (`@import "tailwindcss"` in `src/app.css`)
- **`pnpm preview`** requires `pnpm build` first (Wrangler reads `.svelte-kit/cloudflare`)
- **E2E runs against the built worker over HTTPS**, not `vite dev`:
  `pnpm test:e2e` boots `pnpm build && wrangler dev --env e2e --local-protocol
https` on port 4173. Both parts are load-bearing — `hooks.server.ts` only
  runs auth logic when `PARQET_KV` _and_ `SESSION_SECRET` are bound, and the
  `__Host-` cookie prefix implies `Secure`, which browsers drop over plain
  HTTP. Consequence: each e2e run pays for a build first.
- **The OAuth mocks live in the app**, under `src/routes/__e2e__/` (authorize,
  token, user, portfolios, performance). `env.e2e` in `wrangler.jsonc` points
  `PARQET_*_URL` back at them, so there is no second server and no extra TLS
  cert. Every one of those routes calls `assertE2e()` first and 404s unless
  `ENVIRONMENT === "e2e"` — a value only `env.e2e` ever sets. When adding a
  route there, the guard call comes before any other statement.
- **Mock endpoints that accept form bodies must parse the raw text**
  (`new URLSearchParams(await request.text())`), not `request.formData()`:
  SvelteKit's CSRF protection rejects urlencoded POSTs without a matching
  `Origin`, and the worker's own server-side `fetch` to the token endpoint
  sends none.
- **Node version** is pinned in `.nvmrc`

## Environment Variables

See `.dev.vars.example` for local development. Secrets are set in Cloudflare:

- `PARQET_CLIENT_ID` — OAuth App Client ID
- `SESSION_SECRET` — 32+ byte secret for JWE session cookies
