#!/bin/bash

detect() {
    command -v node >/dev/null 2>&1
}

configure() {
    export CI=true
    corepack enable
    corepack prepare pnpm@10.33.0 --activate
    pnpm install --frozen-lockfile --ignore-scripts
    for dir in /home/dde/.cache /app/node_modules; do
        [ -d "$dir" ] && chown -R dde:dde "$dir" 2>/dev/null || true
    done
}
