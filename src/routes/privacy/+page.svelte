<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { locale, t } from '$lib/stores/locale';
  import LocaleToggle from '$lib/components/LocaleToggle.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
</script>

<div class="min-h-screen" style="background: var(--paper); color: var(--ink)">
  <div class="max-w-3xl mx-auto px-4 sm:px-7 py-6 pb-15">
    <!-- top bar -->
    <div class="flex justify-between items-center mb-10 sm:mb-15">
      <div class="flex items-center gap-2.5">
        <a href="/" class="flex items-center gap-2.5 no-underline">
          <span
            class="w-7 h-7 rounded-[7px] inline-flex items-center justify-center font-extrabold text-[13px] font-mono"
            style="border: 1.5px solid var(--highlight); background: var(--card); color: var(--highlight); box-shadow: inset 0 0 0 2px var(--card), 0 0 0 1.5px var(--highlight); letter-spacing: -0.03em"
          >
            🍺
          </span>
          <span class="font-display font-bold text-lg"
            >parqet<span class="text-amber-600">.beer</span></span
          >
        </a>
      </div>
      <div class="flex items-center gap-2">
        <ThemeToggle />
        <LocaleToggle />
      </div>
    </div>

    <main>
      {#if $locale === 'de'}
        <div class="font-mono text-[11px] text-amber-700 tracking-widest mb-3.5">
          // DATENSCHUTZ
        </div>
        <h1 class="font-display font-bold text-3xl text-amber-950 mb-6">
          Datenschutz & Datenverarbeitung
        </h1>

        <p class="leading-relaxed mb-8" style="color: var(--ink-soft)">
          parqet.beer ist ein unabhängiges Community-Projekt. Wir nehmen deinen Datenschutz ernst
          und speichern nur das absolut Nötigste. Hier erfährst du genau, welche Daten wir wo
          verarbeiten.
        </p>

        <section class="mb-8">
          <h2 class="font-display font-bold text-xl text-amber-950 mb-3">1. Was wir tun</h2>
          <p class="leading-relaxed" style="color: var(--ink-soft)">
            Wir verbinden uns via OAuth 2.0 mit deinem Parqet-Konto, lesen deinen Portfoliowert aus
            und rechnen ihn in Getränke (Bier, Kaffee, Smoothie) um. Mehr nicht.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="font-display font-bold text-xl text-amber-950 mb-3">
            2. Welche Daten wir verarbeiten
          </h2>
          <ul class="list-disc list-outside ml-5 space-y-2" style="color: var(--ink-soft)">
            <li>
              <strong>OAuth-Tokens</strong> — Access Token und Refresh Token deiner Parqet-Anbindung,
              um in deinem Namen Daten abzurufen.
            </li>
            <li>
              <strong>Nutzer-ID</strong> — Die von Parqet vergebene ID, um deine Tokens und Cache-Einträge
              zuzuordnen.
            </li>
            <li>
              <strong>Portfolio-Daten</strong> — Gesamtwert, Dividenden der letzten 12 Monate, Portfoliowährung
              und Liste deiner Portfolios. Keine einzelnen Positionen, keine Transaktionen, keine Historie.
            </li>
            <li>
              <strong>Session-Cookie</strong> — Ein verschlüsseltes, httpOnly-Cookie (JWE), das deine
              Session identifiziert. Kein Tracking.
            </li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="font-display font-bold text-xl text-amber-950 mb-3">
            3. Wo wir Daten speichern
          </h2>
          <p class="leading-relaxed mb-3" style="color: var(--ink-soft)">
            Alle Daten werden ausschliesslich in Cloudflare KV (Key-Value-Store) gespeichert,
            betrieben von Cloudflare, Inc. (USA, mit Rechenzentren in der EU):
          </p>
          <ul
            class="list-disc list-outside ml-5 space-y-1 font-mono text-sm"
            style="color: var(--ink-soft)"
          >
            <li><code>token:{'{userId}'}</code> — OAuth-Tokens, bis zum Ablauf</li>
            <li><code>user:{'{userId}'}</code> — Nutzer-Info, TTL 1 Stunde</li>
            <li><code>portfolios:{'{userId}'}</code> — Portfolio-Liste, TTL 1 Stunde</li>
            <li><code>performance:{'{userId}'}</code> — Portfoliowert, TTL 15 Minuten</li>
          </ul>
          <p class="text-sm mt-3" style="color: var(--muted)">
            Nach Ablauf der TTL werden die Einträge automatisch gelöscht. Beim Logout werden deine
            Tokens sofort entfernt.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="font-display font-bold text-xl text-amber-950 mb-3">
            4. Woher die Daten kommen
          </h2>
          <ul class="list-disc list-outside ml-5 space-y-2" style="color: var(--ink-soft)">
            <li>
              Dein Portfoliowert, deine Dividenden und Portfolio-Liste kommen ausschliesslich von
              der offiziellen Parqet Connect API (connect.parqet.com).
            </li>
            <li>
              Wechselkurse EUR/CHF werden aus den FX-Daten deiner Parqet-Positionen abgeleitet.
            </li>
            <li>
              Getränkepreise sind statisch im Code hinterlegt (öffentlich einsehbar auf GitHub) und
              beruhen auf Supermarkt- und Café-Durchschnittspreisen.
            </li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="font-display font-bold text-xl text-amber-950 mb-3">5. Was wir NICHT tun</h2>
          <ul class="list-disc list-outside ml-5 space-y-2" style="color: var(--ink-soft)">
            <li>Kein Tracking, keine Analytics, keine Cookies von Dritten</li>
            <li>Keine Weitergabe deiner Daten an Dritte</li>
            <li>Kein Schreibzugriff auf dein Parqet-Konto (Read-only)</li>
            <li>Keine Speicherung einzelner Positionen oder Transaktionen</li>
            <li>Keine Werbung, keine Monetarisierung</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="font-display font-bold text-xl text-amber-950 mb-3">6. Deine Rechte</h2>
          <p class="leading-relaxed" style="color: var(--ink-soft)">
            Du kannst dich jederzeit abmelden (Logout) — damit werden deine Tokens sofort aus
            unserem Storage entfernt. Den Zugriff von parqet.beer kannst du zusätzlich direkt in
            deinen Parqet-Kontoeinstellungen widerrufen.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="font-display font-bold text-xl text-amber-950 mb-3">7. Open Source</h2>
          <p class="leading-relaxed" style="color: var(--ink-soft)">
            Der gesamte Quellcode ist öffentlich auf <a
              href="https://github.com/sbaerlocher/parqet.beer"
              target="_blank"
              rel="noopener noreferrer"
              class="underline transition-colors"
              style="color: var(--highlight)">GitHub</a
            > einsehbar. Jeder kann prüfen, was genau mit den Daten passiert.
          </p>
        </section>
      {:else}
        <div class="font-mono text-[11px] text-amber-700 tracking-widest mb-3.5">// PRIVACY</div>
        <h1 class="font-display font-bold text-3xl text-amber-950 mb-6">
          Privacy & Data Processing
        </h1>

        <p class="leading-relaxed mb-8" style="color: var(--ink-soft)">
          parqet.beer is an independent community project. We take your privacy seriously and store
          only what is absolutely necessary. Here is exactly what data we process and where.
        </p>

        <section class="mb-8">
          <h2 class="font-display font-bold text-xl text-amber-950 mb-3">1. What we do</h2>
          <p class="leading-relaxed" style="color: var(--ink-soft)">
            We connect to your Parqet account via OAuth 2.0, read your portfolio value and convert
            it into beverages (beer, coffee, smoothie). Nothing more.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="font-display font-bold text-xl text-amber-950 mb-3">
            2. What data we process
          </h2>
          <ul class="list-disc list-outside ml-5 space-y-2" style="color: var(--ink-soft)">
            <li>
              <strong>OAuth tokens</strong> — Access token and refresh token from your Parqet connection,
              used to fetch data on your behalf.
            </li>
            <li>
              <strong>User ID</strong> — The ID assigned by Parqet to associate your tokens and cache
              entries.
            </li>
            <li>
              <strong>Portfolio data</strong> — Total value, dividends over the last 12 months, portfolio
              currency and list of your portfolios. No individual positions, no transactions, no history.
            </li>
            <li>
              <strong>Session cookie</strong> — An encrypted, httpOnly cookie (JWE) that identifies your
              session. No tracking.
            </li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="font-display font-bold text-xl text-amber-950 mb-3">3. Where we store data</h2>
          <p class="leading-relaxed mb-3" style="color: var(--ink-soft)">
            All data is stored exclusively in Cloudflare KV (key-value store), operated by
            Cloudflare, Inc. (USA, with data centers in the EU):
          </p>
          <ul
            class="list-disc list-outside ml-5 space-y-1 font-mono text-sm"
            style="color: var(--ink-soft)"
          >
            <li><code>token:{'{userId}'}</code> — OAuth tokens, until expiry</li>
            <li><code>user:{'{userId}'}</code> — User info, TTL 1 hour</li>
            <li><code>portfolios:{'{userId}'}</code> — Portfolio list, TTL 1 hour</li>
            <li><code>performance:{'{userId}'}</code> — Portfolio value, TTL 15 minutes</li>
          </ul>
          <p class="text-sm mt-3" style="color: var(--muted)">
            Entries are automatically deleted after TTL expires. Upon logout, your tokens are
            removed immediately.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="font-display font-bold text-xl text-amber-950 mb-3">
            4. Where the data comes from
          </h2>
          <ul class="list-disc list-outside ml-5 space-y-2" style="color: var(--ink-soft)">
            <li>
              Your portfolio value, dividends and portfolio list come exclusively from the official
              Parqet Connect API (connect.parqet.com).
            </li>
            <li>EUR/CHF exchange rates are derived from the FX data of your Parqet positions.</li>
            <li>
              Beverage prices are hardcoded in the source (publicly visible on GitHub) and are based
              on average supermarket and café prices.
            </li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="font-display font-bold text-xl text-amber-950 mb-3">5. What we do NOT do</h2>
          <ul class="list-disc list-outside ml-5 space-y-2" style="color: var(--ink-soft)">
            <li>No tracking, no analytics, no third-party cookies</li>
            <li>No sharing of your data with third parties</li>
            <li>No write access to your Parqet account (read-only)</li>
            <li>No storage of individual positions or transactions</li>
            <li>No advertising, no monetization</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="font-display font-bold text-xl text-amber-950 mb-3">6. Your rights</h2>
          <p class="leading-relaxed" style="color: var(--ink-soft)">
            You can log out at any time — your tokens will be immediately removed from our storage.
            You can additionally revoke access for parqet.beer directly in your Parqet account
            settings.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="font-display font-bold text-xl text-amber-950 mb-3">7. Open source</h2>
          <p class="leading-relaxed" style="color: var(--ink-soft)">
            The entire source code is publicly available on <a
              href="https://github.com/sbaerlocher/parqet.beer"
              target="_blank"
              rel="noopener noreferrer"
              class="underline transition-colors"
              style="color: var(--highlight)">GitHub</a
            >. Anyone can verify exactly what happens with the data.
          </p>
        </section>
      {/if}

      <!-- legal bar -->
      <div
        class="mt-15 px-5.5 py-4.5 rounded-[10px]"
        style="background: var(--accent); border: 1px dashed var(--accent-hover)"
      >
        <div class="font-mono text-[10px] text-amber-800 tracking-widest mb-1.5">
          {$t.eyebrowLegalDisclaimer}
        </div>
        <div class="text-xs text-amber-900 leading-relaxed">
          {$locale === 'de'
            ? 'Dieses Projekt ist ein unabhängiges, community-getriebenes Tool. Es steht in keiner geschäftlichen Beziehung zu Parqet Fintech GmbH oder den genannten Brauereien, Cafés oder Marken.'
            : 'This project is an independent, community-driven tool. It is not affiliated with Parqet Fintech GmbH or any of the mentioned breweries, cafés or brands.'}
        </div>
      </div>

      <!-- footer -->
      <div
        class="mt-7 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs"
        style="color: var(--muted)"
      >
        <div class="font-mono text-center sm:text-left">
          © 2026 · parqet.beer · Not affiliated with Parqet Fintech GmbH
        </div>
        <div class="flex gap-3.5 shrink-0">
          <a href="/" class="text-amber-700 no-underline hover:text-amber-900 transition-colors"
            >← {$t.errorBackHome}</a
          >
          <a
            href="https://github.com/sbaerlocher/parqet.beer"
            target="_blank"
            rel="noopener noreferrer"
            class="text-amber-700 no-underline hover:text-amber-900 transition-colors">GitHub ↗</a
          >
        </div>
      </div>
    </main>
  </div>
</div>
