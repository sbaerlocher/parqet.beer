// SPDX-License-Identifier: MIT
declare global {
  namespace App {
    interface Locals {
      session: {
        userId: string;
        accessToken: string;
      } | null;
      locale: 'de' | 'en';
    }

    interface Platform {
      env: {
        PARQET_KV: KVNamespace;
        PARQET_CLIENT_ID: string;
        PARQET_AUTHORIZE_URL: string;
        PARQET_TOKEN_URL: string;
        PARQET_API_URL: string;
        // Cloudflare Secrets Store binding in prod. Local dev via `.dev.vars`
        // still provides it as a plain string, so accept both and normalise
        // through `resolveSessionSecret` in `$lib/server/auth`.
        SESSION_SECRET: string | SecretsStoreSecret;
        // Local-dev fallback sourced from `.dev.vars`. The Secrets Store
        // binding shadows any same-named `.dev.vars` entry locally, so we
        // expose the dev-only secret under a separate key that
        // `resolveSessionSecret` picks up when the emulator call fails.
        SESSION_SECRET_DEV?: string;
        ENVIRONMENT: string;
      };
    }
  }
}

export {};
