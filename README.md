# parqet.beer

![CI](https://github.com/sbaerlocher/parqet.beer/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue)
![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen)

A humorous web app that converts a Parqet user's portfolio value into beers,
coffees, or smoothies. **Community fun project — not an official Parqet
product.**

> _"Finally a meaningful metric."_

## Features

- 🍺 Portfolio value converted live into beer / coffee / smoothie
- 🔐 Parqet Connect OAuth 2.0 (PKCE, read-only)
- 💰 EUR / CHF toggle
- 🌙 Dark mode
- 🇩🇪 🇬🇧 German / English
- 📊 Fun stats, beverage of the day, milestone badges, dividends in beer
- 📸 Shareable image export

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev) (Svelte 5, SSR on Cloudflare Pages)
- **Adapter**: `@sveltejs/adapter-cloudflare`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **Auth**: Parqet Connect OAuth 2.0 + PKCE, sessions via [jose](https://github.com/panva/jose) JWE (httpOnly cookie)
- **Storage**: Cloudflare KV (`PARQET_KV`)
- **Validation**: Zod
- **Testing**: Vitest, Playwright (E2E)

## Setup

Prerequisites: [Node.js](https://nodejs.org) (see `.nvmrc`), [pnpm](https://pnpm.io).

```bash
# 1. Clone the repository
git clone https://github.com/sbaerlocher/parqet.beer.git
cd parqet.beer

# 2. Install dependencies
pnpm install

# 3. Copy and fill in environment variables
cp .dev.vars.example .dev.vars
# Set PARQET_CLIENT_ID and SESSION_SECRET

# 4. Start the dev server
pnpm dev
```

Then open `http://localhost:5173` in your browser.

### Environment Variables

| Variable           | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `PARQET_CLIENT_ID` | OAuth App Client ID from the Parqet Developer Portal |
| `SESSION_SECRET`   | 32+ byte random secret for JWE session cookies       |

Parqet Connect runs as a public client with PKCE — no client secret required.

In production, secrets are set via the Cloudflare dashboard, not through
`wrangler.jsonc`.

## Scripts

```bash
pnpm dev              # Vite dev server (localhost:5173)
pnpm build            # Build for Cloudflare Pages
pnpm preview          # Local Cloudflare Pages preview via wrangler
pnpm check            # TypeScript + Svelte check
pnpm test             # Vitest (unit tests)
pnpm lint             # Prettier check
pnpm format           # Prettier write
pnpm generate:assets  # SVG → PNG (favicon, OG image) re-render
```

## Deployment (Cloudflare Pages)

> **Fork note**: `wrangler.jsonc` contains only placeholder IDs. Before you can
> deploy, you need to create your own Cloudflare resources (KV namespace,
> Secrets Store) and fill in the IDs. The setup script automates this flow.

### Automated setup (recommended)

```bash
./scripts/setup-fork.sh
```

The script creates KV namespaces (preview + production), a Secrets Store, and
a session secret, then patches `wrangler.jsonc` with the generated IDs.

### Manual flow

For a step-by-step approach, see the individual commands in
[scripts/setup-fork.sh](scripts/setup-fork.sh) or
[scripts/README.md](scripts/README.md).

Then replace the **Parqet Client ID** in `wrangler.jsonc` under
`vars.PARQET_CLIENT_ID` with your own OAuth app ID from the Parqet Developer
Portal. The redirect URI configured in your Parqet app must match your deploy
domain.

Deploy via Git integration (push to `main`) or manually:

```bash
pnpm build
pnpm exec wrangler pages deploy .svelte-kit/cloudflare
```

## Project Structure

```text
src/
├── app.html                  # Root HTML with meta tags
├── app.css                   # Tailwind + colour scheme
├── hooks.server.ts           # Session check, rate limiting
├── lib/
│   ├── calculator.ts         # Portfolio → beverage logic
│   ├── components/           # Svelte components
│   ├── data/                 # Beverages & badges (JSON)
│   ├── fun.ts                # Fun stats, beverage of the day
│   ├── i18n.ts               # DE/EN translations
│   ├── server/               # Server-only: auth, parqet-client, kv-cache
│   └── stores/               # Svelte stores (locale, theme)
└── routes/
    ├── +layout.svelte
    ├── +page.svelte          # Landing
    ├── +error.svelte         # 404/500
    ├── api/                  # OAuth, portfolios, performance, preferences
    ├── dashboard/            # Auth-protected
    └── privacy/
tests/                        # Vitest unit & integration tests
static/                       # Favicon, OG image, etc.
```

## Data Sources

- **Beer prices**: Coop.ch, Rewe, Edeka, supermarktcheck.de — maintained in
  [src/lib/data/beer.json](src/lib/data/beer.json)
- **Coffee & smoothies**: cafe / shop prices, manually curated
- All prices are community-curated. **Pull requests welcome!**

## Further Documentation

- [AGENTS.md](AGENTS.md) — Quick reference for contributors / tools
- [CHANGELOG.md](CHANGELOG.md) — Change history

## Community

- [CONTRIBUTING.md](CONTRIBUTING.md) — How to contribute
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — Community guidelines
- [SECURITY.md](SECURITY.md) — Responsible vulnerability disclosure

## Legal

This project is an independent, community-driven tool and is **not affiliated**
with, endorsed by, or in any way officially connected to:

- Parqet Fintech GmbH or its subsidiaries
- any of the breweries, cafes, or beverage brands mentioned

All trademarks and product names are the property of their respective owners
and are used here for illustrative purposes only.

Not financial advice. No warranty.

## License

MIT — see [LICENSE](LICENSE).
