<!-- For AI assistants. Human contributors: see CONTRIBUTING.md. -->

# parqet.beer

Humorvolle Web-App die den Portfoliowert eines Parqet-Nutzers in Bier, Kaffee oder Smoothies umrechnet.

## Tech Stack

- **Framework**: SvelteKit (SSR auf Cloudflare Pages)
- **Adapter**: `@sveltejs/adapter-cloudflare`
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Auth**: Parqet Connect OAuth 2.0 + PKCE (Public Client, kein Client Secret), Session via jose JWE (httpOnly Cookie)
- **Storage**: Cloudflare KV (`PARQET_KV`)
- **Validation**: Zod
- **Testing**: Vitest
- **Formatting**: Prettier + prettier-plugin-svelte

## Architektur

```text
Browser (SvelteKit SPA)
  ├── Landing Page (/)
  └── Dashboard (/dashboard)
        ├── fetch /api/performance
        ├── fetch /api/portfolios
        └── Beverage Calculation (client-side)

Server (SvelteKit API Routes)
  ├── /api/auth/login      → PKCE + Redirect zu Parqet
  ├── /api/auth/callback   → Token Exchange + Session
  ├── /api/auth/logout     → Session löschen
  ├── /api/portfolios      → Parqet API Proxy (cached 1h)
  ├── /api/performance     → Parqet API Proxy (cached 15min)
  └── /api/preferences     → User-Einstellungen (KV)

Cloudflare KV
  ├── token:{userId}       → OAuth Tokens
  ├── user:{userId}        → User-Info (TTL 1h)
  ├── portfolios:{userId}  → Portfolio-Liste (TTL 1h)
  ├── performance:{userId} → Gesamtwert (TTL 15min)
  └── preferences:{userId} → Einstellungen
```

## Konventionen

- **Dateien**: kebab-case.ts / PascalCase.svelte
- **Funktionen**: camelCase
- **Konstanten**: UPPER_SNAKE_CASE
- **Server-only Code**: `src/lib/server/` (SvelteKit schützt automatisch)
- **Komponenten**: `src/lib/components/`
- **Getränke-Referenzdaten**: `src/lib/data/{beer,coffee,smoothie}.json` — Schema: `{name, size, priceEur, priceChf}`
- **Commits**: Conventional Commits mit Claude Code Signatur

## Entwicklung

```bash
pnpm install
pnpm dev              # Dev Server auf localhost:5173
pnpm build            # Build für CF Pages
pnpm preview          # Wrangler gegen .svelte-kit/cloudflare — benötigt vorher `pnpm build`
pnpm check            # TypeScript + Svelte Check
pnpm check:watch      # svelte-check im Watch-Mode
pnpm test             # Vitest
pnpm test:watch       # Vitest Watch
pnpm test:e2e         # Playwright
pnpm lint             # Prettier --check (CI enforced)
pnpm format           # Prettier
pnpm generate:assets  # OG-Image / Favicons aus scripts/generate-assets.mjs
```

## Gotchas

- **Svelte 5 Runes**: `$state`, `$derived`, `$effect`, `$props` — nicht Svelte-4-Syntax (`export let`, reactive `$:`)
- **Tailwind v4**: Kein `tailwind.config.js` — Config via CSS (`@import "tailwindcss"` in `src/app.css`)
- **`pnpm preview`** setzt `pnpm build` voraus (Wrangler liest `.svelte-kit/cloudflare`)
- **Node-Version** ist in `.nvmrc` gepinnt

## Umgebungsvariablen

Siehe `.dev.vars.example` für lokale Entwicklung. Secrets werden in Cloudflare gesetzt:

- `PARQET_CLIENT_ID` — OAuth App Client ID
- `SESSION_SECRET` — 32+ Byte Secret für JWE Session-Cookies
