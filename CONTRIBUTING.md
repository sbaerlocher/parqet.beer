# Contributing to parqet.beer

Thanks for taking the time to contribute. parqet.beer is a small, humorous
SvelteKit app that converts a Parqet portfolio value into beers, coffees, or
smoothies. Contributions of all sizes are welcome — bug fixes, documentation,
new beverages, or larger features.

By participating in this project you agree to abide by our
[Code of Conduct](./CODE_OF_CONDUCT.md).

## Table of Contents

- [Setup](#setup)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Tests](#tests)
- [Adding a Beverage](#adding-a-beverage)
- [Developer Certificate of Origin (DCO)](#developer-certificate-of-origin-dco)
- [Pull Request Checklist](#pull-request-checklist)
- [Reporting Security Issues](#reporting-security-issues)

## Setup

You will need:

- **Node.js** as pinned in [`.nvmrc`](./.nvmrc) (use `nvm use` or an
  equivalent version manager)
- **pnpm** (the repo is pnpm-only; do not commit `package-lock.json` or
  `yarn.lock`)

Then:

```bash
pnpm install
cp .dev.vars.example .dev.vars   # fill in PARQET_CLIENT_ID and SESSION_SECRET
pnpm dev                         # http://localhost:5173
```

Other useful commands:

```bash
pnpm check        # TypeScript + svelte-check
pnpm test         # Vitest
pnpm test:e2e     # Playwright
pnpm lint         # Prettier --check (CI enforced)
pnpm format       # Prettier write
pnpm build        # Build for Cloudflare Pages
pnpm preview      # Wrangler preview against .svelte-kit/cloudflare
```

`pnpm preview` requires `pnpm build` to have been run first, because Wrangler
reads from `.svelte-kit/cloudflare`.

## Branch Naming

Use a short, descriptive slug under one of the following prefixes:

- `feat/` — new user-facing features
- `fix/` — bug fixes
- `docs/` — documentation-only changes
- `data/` — beverage data changes (see [Adding a Beverage](#adding-a-beverage))

Examples: `feat/multi-currency-toggle`, `fix/callback-state-mismatch`,
`docs/security-policy`, `data/add-brlo-helles`.

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/).
Examples:

```text
feat(dashboard): add beverage category toggle
fix(auth): refresh token before proxy request
docs(contributing): clarify beverage curation rules
data(beer): add BRLO Helles 0.33l
```

Keep the subject line under ~72 characters and use the imperative mood.

## Tests

**Code changes require tests.** This is not optional.

- Unit tests live next to the code they cover (`*.test.ts`) or under
  `tests/unit/`
- Server-side logic must be covered by Vitest (`pnpm test`)
- User-facing changes should be covered by a Playwright flow (`pnpm test:e2e`)
  where practical
- Bug fixes should include a regression test that fails before the fix

Beverage data changes do not require tests, but they must still pass
`pnpm check` and `pnpm lint`.

## Adding a Beverage

Beverage reference data lives in:

- `src/lib/data/beer.json`
- `src/lib/data/coffee.json`
- `src/lib/data/smoothie.json`

Each entry follows this schema:

```json
{
  "name": "string",
  "size": "string (e.g. \"0.33l\", \"250ml\", \"12oz\")",
  "priceEur": 0.0,
  "priceChf": 0.0
}
```

### Curation rules

parqet.beer prefers **specialty over mass-market**. The bar is:

- **Beer**: craft breweries — independently owned, small-batch, regionally
  notable. No macro lagers (Heineken, Budweiser, Corona, Carlsberg, etc.)
- **Coffee**: third-wave roasters — single-origin or transparent blends from
  named roasters. No chain-store default drip.
- **Smoothies**: indie / cold-pressed / independent brands. No supermarket
  private label as a default choice.

**Max one entry per brand.** If a brand already has an entry, replace it or
discuss in an issue first — do not stack SKUs.

### Required in the PR body

1. **Source URL** for the price and size (producer page, menu, or a reputable
   retailer).
2. **Date** you checked the price (prices drift; we want a timestamp).
3. **Craft / specialty justification** — one or two sentences on why this
   producer fits the curation rule above.
4. **Currency note** — if one of `priceEur` / `priceChf` is converted rather
   than observed, say so and give the conversion basis.

PRs that only bump mass-market SKUs will be closed with a pointer back to this
section.

## Developer Certificate of Origin (DCO)

All commits must be signed off under the
[Developer Certificate of Origin 1.1](https://developercertificate.org/).
Add a `Signed-off-by` trailer to every commit:

```bash
git commit -s -m "feat(dashboard): add beverage category toggle"
```

That produces:

```text
Signed-off-by: Your Name <you@example.com>
```

By signing off you assert that you wrote the patch or otherwise have the right
to submit it under the project's MIT license.

## Pull Request Checklist

Before opening a PR, please confirm:

- [ ] `pnpm lint` passes
- [ ] `pnpm check` passes (TypeScript + svelte-check are green)
- [ ] `pnpm test` passes, and new code has tests
- [ ] No secrets, tokens, or `.dev.vars` content committed
- [ ] Documentation updated if behavior or config changed
- [ ] Beverage data changes include source URL, date, and curation
      justification in the PR body (see [Adding a Beverage](#adding-a-beverage))
- [ ] Commits are Conventional Commits and `Signed-off-by`

## Reporting Security Issues

Please do **not** open public issues for security problems. See
[`SECURITY.md`](./SECURITY.md) for the private reporting process.
