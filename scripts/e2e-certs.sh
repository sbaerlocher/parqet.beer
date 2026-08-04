#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
#
# Generate the TLS certificate the e2e suite serves over.
#
# The suite needs real HTTPS because every OAuth cookie carries the `__Host-`
# prefix, which implies `Secure`; browsers drop those over plain HTTP. A
# self-signed certificate is not enough: `ignoreHTTPSErrors` only covers the
# browser, while the worker's own server-side `fetch` to the token endpoint
# goes through workerd, which has no such escape hatch and rejects a
# certificate it does not trust. mkcert issues from a CA in the system trust
# store, so both sides accept it.
#
# Idempotent: re-running with a valid certificate in place is a no-op, so
# `pretest:e2e` can call it on every run without adding seconds to the loop.
set -euo pipefail

CERT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.certs"
CERT_FILE="$CERT_DIR/localhost.pem"
KEY_FILE="$CERT_DIR/localhost-key.pem"

if ! command -v mkcert >/dev/null 2>&1; then
  cat >&2 <<'EOF'
error: mkcert is not installed, but `pnpm test:e2e` needs it.

The e2e suite serves HTTPS so that `__Host-` cookies survive, and workerd
only accepts a certificate chaining to a CA it trusts.

  macOS          brew install mkcert nss
  Debian/Ubuntu  apt install mkcert libnss3-tools
  Arch           pacman -S mkcert nss

Then run `mkcert -install` once to add the local CA to your trust store.
EOF
  exit 1
fi

# Reuse an existing certificate as long as it is still valid for a day. `-checkend`
# returns non-zero once expiry is inside the window, which then falls through to
# a re-issue.
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ] &&
  openssl x509 -in "$CERT_FILE" -checkend 86400 -noout >/dev/null 2>&1; then
  exit 0
fi

mkdir -p "$CERT_DIR"
mkcert -cert-file "$CERT_FILE" -key-file "$KEY_FILE" localhost 127.0.0.1
