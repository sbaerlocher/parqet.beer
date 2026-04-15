# scripts/

One-off helper scripts. Run from the repo root.

## `setup-fork.sh`

Bootstraps a freshly forked repo against your own Cloudflare account.

```bash
./scripts/setup-fork.sh
```

What it does:

1. Verifies `wrangler` + `openssl` are installed (`jq` is optional).
2. Creates two KV namespaces: `parqet-beer-preview` and `parqet-beer-production`.
3. Prints the new namespace IDs and tells you where to paste them in `wrangler.jsonc`.
4. Generates `.dev.vars` (if missing) with a fresh `SESSION_SECRET_DEV` via `openssl rand -base64 32`.
5. Lists the remaining manual steps: Parqet OAuth app, Secrets Store, custom domain, GitHub secrets.

Safe to re-run. Existing `.dev.vars` is never overwritten.

## `generate-assets.mjs`

Regenerates the OG image, favicon, and PWA icons from the source SVG.

```bash
pnpm generate:assets
```

Run this after editing any of the source art files under `static/` so the derived PNGs stay in sync. Output is committed alongside the source.
