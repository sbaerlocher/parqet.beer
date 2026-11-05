#!/usr/bin/env sh
# The container runs as root, so files it writes into the bind mount (build
# output, .wrangler/, test reports, …) are root-owned on the host. Hand them
# back to the host user before the container goes away. The anonymous volumes
# from docker-compose.yml are pruned explicitly: their contents belong to the
# container, and `-xdev` would not skip them when the repo and /var/lib/docker
# share a filesystem (native Linux Docker).
set -eu
dde project:exec --root -- find /app \
  \( -path /app/node_modules -o -path /app/.svelte-kit -o -path /app/.pnpm-store \) -prune \
  -o -user 0 -exec chown "$(id -u):$(id -g)" {} + \
  || echo "warn: could not chown root-owned files in the bind mount; run 'dde project:up && dde project:down' to retry" >&2
