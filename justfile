# Task entrypoint for parqet.beer — see sbaerlocher/.github templates/justfile.
#
# Runner layering (do not collapse these into one another):
#   1. dde project:*   Runtime layer (containers, shell, logs). just delegates
#                      to dde, never replaces it.
#   2. just <verb>     Task entrypoint. The same verbs mean the same thing in
#                      every repo.
#   3. pnpm            Toolchain underneath, called *by* just. Toolchain-only
#                      scripts (check:watch, test:watch, test:coverage,
#                      test:data, preview, generate:assets, lint:fix,
#                      format:check, typecheck, prepare) stay in package.json
#                      and are not mirrored here.
#
# Local entrypoint only: every recipe is dde-backed, and no dde container runs
# on a GitHub runner. CI keeps calling pnpm through the reusable workflow
# (.github/workflows/pull-request.yml).

# default → list available recipes
default:
    @just --list

# dev → start the local dev loop
dev:
    dde project:up

# build → produce the deployable build artifact
build:
    dde project:exec pnpm build

# check → TypeScript + svelte-check (pre-push gate)
check:
    dde project:exec pnpm check

# test → run the unit test suite
test:
    dde project:exec pnpm test

# e2e → run the Playwright end-to-end suite
e2e:
    dde project:exec pnpm test:e2e

# lint → static checks
lint:
    dde project:exec pnpm lint

# fmt → format sources in place
fmt:
    dde project:exec pnpm format
