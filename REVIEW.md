# Code Review Guidelines

## Scope

In scope:

- SvelteKit source changes (`src/routes/`, `src/lib/`)
- Server-only code (`src/lib/server/`) — auth, KV access, Parqet API proxy
- API routes (`src/routes/api/`)
- Build and adapter configuration (`svelte.config.js`, `vite.config.ts`)
- CI/CD workflow changes
- Renovate configuration updates

Out of scope:

- Auto-generated files (`.svelte-kit/`, `pnpm-lock.yaml`)
- Generated assets (`static/` output of `pnpm generate:assets`)
- Renovate dependency-only PRs (patch/minor with automerge enabled)

## Required checks

- All checks pass (`pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build`)
- No secrets committed — OAuth tokens in KV, session secret via Cloudflare env
- Server-only logic stays under `src/lib/server/` (never leaks to the client bundle)
- Zod validation at trust boundaries (external API responses, user input)
- Svelte 5 runes only (`$state`, `$derived`, `$effect`, `$props`) — no Svelte 4 syntax

## Severity levels

| Level        | Meaning                                             | Merge impact       |
| ------------ | --------------------------------------------------- | ------------------ |
| Bug          | Incorrect behavior or broken contract               | Blocks merge       |
| Nit          | Minor issue — suboptimal but not incorrect          | Non-blocking       |
| Pre-existing | Issue present before this PR; flagged for awareness | No action required |

## Skip

- Renovate PRs with `automerge: true` (patch/minor) after CI passes
- Documentation-only changes with no functional impact
