# parqet.beer

![CI](https://github.com/sbaerlocher/parqet.beer/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue)
![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen)

Humorvolle Web-App, die den Portfoliowert eines Parqet-Nutzers in Bier, Kaffee
oder Smoothies umrechnet. **Community-Spassprojekt — kein offizielles
Parqet-Produkt.**

> _"Endlich eine sinnvolle Kennzahl."_

## Features

- 🍺 Portfoliowert live in Bier/Kaffee/Smoothie umgerechnet
- 🔐 Parqet Connect OAuth 2.0 (PKCE, read-only)
- 💰 EUR / CHF Umschalter
- 🌙 Dark Mode
- 🇩🇪 🇬🇧 Deutsch / English
- 📊 Fun-Statistiken, Bier des Tages, Milestone-Badges, Dividends-in-Beer
- 📸 Shareable Bild-Export

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev) (Svelte 5, SSR auf Cloudflare Pages)
- **Adapter**: `@sveltejs/adapter-cloudflare`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **Auth**: Parqet Connect OAuth 2.0 + PKCE, Sessions via [jose](https://github.com/panva/jose) JWE (httpOnly Cookie)
- **Storage**: Cloudflare KV (`PARQET_KV`)
- **Validation**: Zod
- **Testing**: Vitest, Playwright (E2E)

## Setup

Voraussetzungen: [Node.js](https://nodejs.org) (siehe `.nvmrc`), [pnpm](https://pnpm.io).

```bash
# 1. Repository klonen
git clone https://github.com/sbaerlocher/parqet.beer.git
cd parqet.beer

# 2. Dependencies installieren
pnpm install

# 3. Env-Variablen kopieren und ausfüllen
cp .dev.vars.example .dev.vars
# PARQET_CLIENT_ID, SESSION_SECRET eintragen

# 4. Dev-Server starten
pnpm dev
```

Anschliessend im Browser auf `http://localhost:5173`.

### Env-Variablen

| Variable           | Beschreibung                                        |
| ------------------ | --------------------------------------------------- |
| `PARQET_CLIENT_ID` | OAuth App Client ID aus dem Parqet Developer Portal |
| `SESSION_SECRET`   | 32+ Byte Random-Secret für JWE Session-Cookies      |

Parqet Connect läuft als Public Client mit PKCE — ein Client Secret ist nicht nötig.

In Produktion werden Secrets über das Cloudflare Dashboard gesetzt, nicht via
`wrangler.jsonc`.

## Scripts

```bash
pnpm dev              # Vite dev server (localhost:5173)
pnpm build            # Build für Cloudflare Pages
pnpm preview          # Lokaler Cloudflare Pages Preview via wrangler
pnpm check            # TypeScript + Svelte Check
pnpm test             # Vitest (unit tests)
pnpm lint             # Prettier check
pnpm format           # Prettier write
pnpm generate:assets  # SVG → PNG (Favicon, OG-Image) neu rendern
```

## Deployment (Cloudflare Pages)

> **Fork-Hinweis**: `wrangler.jsonc` enthält nur Platzhalter-IDs. Bevor du
> deployen kannst, musst du deine eigenen Cloudflare-Ressourcen (KV-Namespace,
> Secrets Store) anlegen und die IDs eintragen. Das Setup-Script automatisiert
> diesen Flow.

### Automatisiertes Setup (empfohlen)

```bash
./scripts/setup-fork.sh
```

Das Script legt KV-Namespaces (preview + production), einen Secrets Store und
ein Session-Secret an und patcht `wrangler.jsonc` mit den generierten IDs.

### Manueller Flow

Wer es Schritt für Schritt machen will, findet die Einzel-Commands in
[scripts/setup-fork.sh](scripts/setup-fork.sh) oder
[scripts/README.md](scripts/README.md).

Anschliessend **Parqet Client ID** in `wrangler.jsonc` unter
`vars.PARQET_CLIENT_ID` durch deine eigene OAuth-App-ID aus dem Parqet
Developer Portal ersetzen. Die eingetragene Redirect-URI der Parqet-App muss
mit deiner Deploy-Domain übereinstimmen.

Deploy via Git-Integration (Push auf `main`) oder manuell:

```bash
pnpm build
pnpm exec wrangler pages deploy .svelte-kit/cloudflare
```

## Projekt-Struktur

```text
src/
├── app.html                  # Root HTML mit Meta-Tags
├── app.css                   # Tailwind + Farbschema
├── hooks.server.ts           # Session-Check, Rate-Limiting
├── lib/
│   ├── calculator.ts         # Portfolio → Beverage Logik
│   ├── components/           # Svelte-Komponenten
│   ├── data/                 # Beverages & Badges (JSON)
│   ├── fun.ts                # Fun-Stats, Beverage-of-the-Day
│   ├── i18n.ts               # DE/EN Translations
│   ├── server/               # Server-only: auth, parqet-client, kv-cache
│   └── stores/               # Svelte-Stores (locale, theme)
└── routes/
    ├── +layout.svelte
    ├── +page.svelte          # Landing
    ├── +error.svelte         # 404/500
    ├── api/                  # OAuth, portfolios, performance, preferences
    ├── dashboard/            # Auth-geschützt
    └── privacy/
tests/                        # Vitest unit & integration tests
static/                       # Favicon, OG-Image, etc.
```

## Daten-Quellen

- **Bierpreise**: Coop.ch, Rewe, Edeka, supermarktcheck.de — gepflegt in
  [src/lib/data/beer.json](src/lib/data/beer.json)
- **Kaffee & Smoothies**: Café-/Ladenpreise, manuell gepflegt
- Alle Preise sind Community-kuratiert. **Pull Requests willkommen!**

## Weitere Dokumentation

- [AGENTS.md](AGENTS.md) — Kurzreferenz für Contributor/Tools
- [CHANGELOG.md](CHANGELOG.md) — Änderungshistorie

## Community

- [CONTRIBUTING.md](CONTRIBUTING.md) — Wie du beitragen kannst
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — Community-Regeln
- [SECURITY.md](SECURITY.md) — Sicherheitslücken verantwortungsvoll melden

## Rechtliches

Dieses Projekt ist ein unabhängiges, community-getriebenes Tool und steht in
**keiner Verbindung** zu, wird nicht unterstützt von und ist in keiner Form
offiziell verbunden mit:

- der Parqet Fintech GmbH oder deren Tochtergesellschaften
- den genannten Brauereien, Cafés oder Getränkemarken

Alle Marken- und Produktnamen sind Eigentum ihrer jeweiligen Inhaber und werden
hier nur zu Illustrationszwecken verwendet.

Keine Anlageberatung. Alle Angaben ohne Gewähr.

## Lizenz

MIT — siehe [LICENSE](LICENSE).
