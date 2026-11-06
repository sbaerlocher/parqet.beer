#!/usr/bin/env sh
# The container runs as root, so files it writes into the bind mount (build
# output, .wrangler/, test reports, …) are root-owned on the host. Hand them
# back to the host user before the container goes away. The anonymous volumes
# from docker-compose.yml are pruned explicitly: their contents belong to the
# container, and `-xdev` would not skip them when the repo and /var/lib/docker
# share a filesystem (native Linux Docker). Skipped under rootless Docker/Podman,
# where container root already maps to the host user (uid_map not identity).
# `chown -h` changes root-owned symlinks themselves, never their targets.
set -eu
# shellcheck disable=SC2016 # expanded by the container shell, not here
dde project:exec --root -- sh -c '
  awk "NR == 1 && \$2 != 0 { exit 1 }" /proc/self/uid_map || exit 0
  find /app \( -path /app/node_modules -o -path /app/.svelte-kit -o -path /app/.pnpm-store \) -prune \
    -o -user 0 -exec chown -h "$1" {} +
' sh "$(id -u):$(id -g)" \
  || echo "warn: could not chown root-owned files in the bind mount; run 'dde project:up && dde project:down' to retry" >&2
