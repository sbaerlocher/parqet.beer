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
- **Commits**: Conventional Commits with Claude Code signature

## Development

```bash
pnpm install
pnpm dev              # Dev server on localhost:5173
pnpm build            # Build for CF Pages
pnpm preview          # Wrangler against .svelte-kit/cloudflare — requires `pnpm build` first
pnpm check            # TypeScript + Svelte check
pnpm check:watch      # svelte-check in watch mode
pnpm test             # Vitest
pnpm test:watch       # Vitest watch
pnpm test:e2e         # Playwright
pnpm lint             # Prettier --check (CI enforced)
pnpm format           # Prettier
pnpm generate:assets  # OG image / favicons from scripts/generate-assets.mjs
```

## Gotchas

- **Svelte 5 Runes**: `$state`, `$derived`, `$effect`, `$props` — not Svelte 4 syntax (`export let`, reactive `$:`)
- **Tailwind v4**: No `tailwind.config.js` — config via CSS (`@import "tailwindcss"` in `src/app.css`)
- **`pnpm preview`** requires `pnpm build` first (Wrangler reads `.svelte-kit/cloudflare`)
- **Node version** is pinned in `.nvmrc`

## Environment Variables

See `.dev.vars.example` for local development. Secrets are set in Cloudflare:

- `PARQET_CLIENT_ID` — OAuth App Client ID
- `SESSION_SECRET` — 32+ byte secret for JWE session cookies
