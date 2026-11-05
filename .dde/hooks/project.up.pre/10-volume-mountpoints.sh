#!/usr/bin/env sh
# Pre-create the mountpoints of the anonymous volumes in docker-compose.yml as
# the host user. Otherwise Docker creates them as root in the bind mount, and
# host-side tools (lefthook's prettier/eslint/check/test hooks,
# `git worktree remove`) fail with EACCES in fresh clones and worktrees.
# Mountpoints Docker already created as root (checkouts started before this
# hook existed) cannot be fixed from here; see AGENTS.md for the one-time fix.
set -eu
cd "$(dirname "$0")/../../.."
mkdir -p node_modules .svelte-kit .pnpm-store
