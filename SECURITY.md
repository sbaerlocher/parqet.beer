# Security Policy

Thanks for helping keep parqet.beer and its users safe. This document explains
which versions receive security fixes, how to report a vulnerability, and what
is in and out of scope for this project.

## Supported Versions

parqet.beer is a small project deployed from a single branch. Only the current
`main` branch (the deployed version at `parqet.beer`) receives security fixes.
Older commits, forks, and unreleased feature branches are not supported.

| Version       | Supported |
| ------------- | --------- |
| `main` (HEAD) | Yes       |
| anything else | No        |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security problems.**

Report privately via email to **<simon@baerlocher.ch>**.

Please include:

- A clear description of the issue and its potential impact
- Steps to reproduce, a proof of concept, or a minimal test case
- The affected URL, commit SHA, or file path if known
- Whether the issue has already been disclosed anywhere

### Response SLA

- **Acknowledgement**: within **5 business days** of your report.
- **Triage & fix plan**: communicated after acknowledgement.
- **Coordinated disclosure**: timeline agreed with the reporter; credit given
  on request.

### PGP

PGP-encrypted reports are not currently offered. A key may be published here
in the future (TODO). Until then, please send unencrypted email and avoid
including exploit details that cannot be shared over plain email; a minimal
reproducer and a request for a secure channel is enough to start.

## Scope

### In scope

- The **OAuth 2.0 + PKCE flow** with Parqet Connect (login, callback, token
  handling, refresh, logout)
- **Session cookies** (JWE sealed with `SESSION_SECRET`, `__Host-` prefix,
  `HttpOnly`, `Secure`, `SameSite`)
- The **rate limiter** and any auth/abuse mitigation in the SvelteKit server
  routes
- **Cloudflare KV data handling** (`user:`, `portfolios:`, `performance:`,
  `preferences:` keys) — including cache poisoning, cross-user leakage, and
  TTL mishandling
- Source code in this repository that touches any of the above

### Out of scope

- **Upstream Parqet API issues** — please report those directly to Parqet
- **Third-party services** (Cloudflare, jose, Svelte, etc.) — report upstream
- **Social engineering** against maintainers, contributors, or users
- Missing best-practice headers without a demonstrated impact
- Rate-limit / DoS reports without a concrete amplification vector
- Automated scanner output without manual validation

## Safe Harbor

Good-faith security research that follows this policy will not be pursued
legally. Please avoid privacy violations, data destruction, service
degradation, and accessing data that is not your own.
