<script lang="ts">
  import { locale } from '$lib/stores/locale';
  import LocaleToggle from '$lib/components/LocaleToggle.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
</script>

<div class="min-h-screen bg-amber-50">
  <header
    class="bg-gradient-to-b from-amber-600 to-amber-700 text-white py-4 px-6 flex items-center justify-between"
  >
    <a href="/" class="text-xl font-bold hover:opacity-80 transition-opacity">🍺 parqet.beer</a>
    <div class="flex items-center gap-3">
      <ThemeToggle />
      <LocaleToggle />
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-4 py-10 text-amber-900">
    <h1 class="text-3xl font-bold mb-6">
      {$locale === 'de' ? 'Datenschutz & Datenverarbeitung' : 'Privacy & Data Processing'}
    </h1>

    <p class="text-amber-700 mb-8">
      {$locale === 'de'
        ? 'parqet.beer ist ein unabhängiges Community-Projekt. Wir nehmen deinen Datenschutz ernst und speichern nur das absolut Nötigste. Hier erfährst du genau, welche Daten wir wo verarbeiten.'
        : 'parqet.beer is an independent community project. We take your privacy seriously and store only what is absolutely necessary. Here is exactly what data we process and where.'}
    </p>

    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-3 text-amber-800">
        {$locale === 'de' ? '1. Was wir tun' : '1. What we do'}
      </h2>
      <p class="text-amber-700 leading-relaxed">
        {$locale === 'de'
          ? 'Wir verbinden uns via OAuth 2.0 mit deinem Parqet-Konto, lesen deinen Portfoliowert aus und rechnen ihn in Getränke (Bier, Kaffee, Smoothie) um. Mehr nicht.'
          : 'We connect to your Parqet account via OAuth 2.0, read your portfolio value and convert it into beverages (beer, coffee, smoothie). Nothing more.'}
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-3 text-amber-800">
        {$locale === 'de' ? '2. Welche Daten wir verarbeiten' : '2. What data we process'}
      </h2>
      <ul class="list-disc list-outside ml-5 space-y-2 text-amber-700">
        <li>
          <strong>{$locale === 'de' ? 'OAuth-Tokens' : 'OAuth tokens'}</strong> —
          {$locale === 'de'
            ? 'Access Token und Refresh Token deiner Parqet-Anbindung, um in deinem Namen Daten abzurufen.'
            : 'Access token and refresh token from your Parqet connection, used to fetch data on your behalf.'}
        </li>
        <li>
          <strong>{$locale === 'de' ? 'Nutzer-ID' : 'User ID'}</strong> —
          {$locale === 'de'
            ? 'Die von Parqet vergebene ID, um deine Tokens und Cache-Einträge zuzuordnen.'
            : 'The ID assigned by Parqet to associate your tokens and cache entries.'}
        </li>
        <li>
          <strong>{$locale === 'de' ? 'Portfolio-Daten' : 'Portfolio data'}</strong> —
          {$locale === 'de'
            ? 'Gesamtwert, Dividenden der letzten 12 Monate, Portfoliowährung und Liste deiner Portfolios. Keine einzelnen Positionen, keine Transaktionen, keine Historie.'
            : 'Total value, dividends over the last 12 months, portfolio currency and list of your portfolios. No individual positions, no transactions, no history.'}
        </li>
        <li>
          <strong>{$locale === 'de' ? 'Session-Cookie' : 'Session cookie'}</strong> —
          {$locale === 'de'
            ? 'Ein verschlüsseltes, httpOnly-Cookie (JWE), das deine Session identifiziert. Kein Tracking.'
            : 'An encrypted, httpOnly cookie (JWE) that identifies your session. No tracking.'}
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-3 text-amber-800">
        {$locale === 'de' ? '3. Wo wir Daten speichern' : '3. Where we store data'}
      </h2>
      <p class="text-amber-700 leading-relaxed mb-3">
        {$locale === 'de'
          ? 'Alle Daten werden ausschliesslich in Cloudflare KV (Key-Value-Store) gespeichert, betrieben von Cloudflare, Inc. (USA, mit Rechenzentren in der EU):'
          : 'All data is stored exclusively in Cloudflare KV (key-value store), operated by Cloudflare, Inc. (USA, with data centers in the EU):'}
      </p>
      <ul class="list-disc list-outside ml-5 space-y-1 text-amber-700 font-mono text-sm">
        <li>
          <code>token:{'{userId}'}</code> — {$locale === 'de'
            ? 'OAuth-Tokens, bis zum Ablauf'
            : 'OAuth tokens, until expiry'}
        </li>
        <li>
          <code>user:{'{userId}'}</code> — {$locale === 'de'
            ? 'Nutzer-Info, TTL 1 Stunde'
            : 'User info, TTL 1 hour'}
        </li>
        <li>
          <code>portfolios:{'{userId}'}</code> — {$locale === 'de'
            ? 'Portfolio-Liste, TTL 1 Stunde'
            : 'Portfolio list, TTL 1 hour'}
        </li>
        <li>
          <code>performance:{'{userId}'}</code> — {$locale === 'de'
            ? 'Portfoliowert, TTL 15 Minuten'
            : 'Portfolio value, TTL 15 minutes'}
        </li>
      </ul>
      <p class="text-amber-600 text-sm mt-3">
        {$locale === 'de'
          ? 'Nach Ablauf der TTL werden die Einträge automatisch gelöscht. Beim Logout werden deine Tokens sofort entfernt.'
          : 'Entries are automatically deleted after TTL expires. Upon logout, your tokens are removed immediately.'}
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-3 text-amber-800">
        {$locale === 'de' ? '4. Woher die Daten kommen' : '4. Where the data comes from'}
      </h2>
      <ul class="list-disc list-outside ml-5 space-y-2 text-amber-700">
        <li>
          {$locale === 'de'
            ? 'Dein Portfoliowert, deine Dividenden und Portfolio-Liste kommen ausschliesslich von der offiziellen Parqet Connect API (connect.parqet.com).'
            : 'Your portfolio value, dividends and portfolio list come exclusively from the official Parqet Connect API (connect.parqet.com).'}
        </li>
        <li>
          {$locale === 'de'
            ? 'Wechselkurse EUR/CHF werden aus den FX-Daten deiner Parqet-Positionen abgeleitet.'
            : 'EUR/CHF exchange rates are derived from the FX data of your Parqet positions.'}
        </li>
        <li>
          {$locale === 'de'
            ? 'Getränkepreise sind statisch im Code hinterlegt (öffentlich einsehbar auf GitHub) und beruhen auf Supermarkt- und Café-Durchschnittspreisen.'
            : 'Beverage prices are hardcoded in the source (publicly visible on GitHub) and are based on average supermarket and café prices.'}
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-3 text-amber-800">
        {$locale === 'de' ? '5. Was wir NICHT tun' : '5. What we do NOT do'}
      </h2>
      <ul class="list-disc list-outside ml-5 space-y-2 text-amber-700">
        <li>
          {$locale === 'de'
            ? 'Kein Tracking, keine Analytics, keine Cookies von Dritten'
            : 'No tracking, no analytics, no third-party cookies'}
        </li>
        <li>
          {$locale === 'de'
            ? 'Keine Weitergabe deiner Daten an Dritte'
            : 'No sharing of your data with third parties'}
        </li>
        <li>
          {$locale === 'de'
            ? 'Kein Schreibzugriff auf dein Parqet-Konto (Read-only)'
            : 'No write access to your Parqet account (read-only)'}
        </li>
        <li>
          {$locale === 'de'
            ? 'Keine Speicherung einzelner Positionen oder Transaktionen'
            : 'No storage of individual positions or transactions'}
        </li>
        <li>
          {$locale === 'de'
            ? 'Keine Werbung, keine Monetarisierung'
            : 'No advertising, no monetization'}
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-3 text-amber-800">
        {$locale === 'de' ? '6. Deine Rechte' : '6. Your rights'}
      </h2>
      <p class="text-amber-700 leading-relaxed">
        {$locale === 'de'
          ? 'Du kannst dich jederzeit abmelden (Logout) — damit werden deine Tokens sofort aus unserem Storage entfernt. Den Zugriff von parqet.beer kannst du zusätzlich direkt in deinen Parqet-Kontoeinstellungen widerrufen.'
          : 'You can log out at any time — your tokens will be immediately removed from our storage. You can additionally revoke access for parqet.beer directly in your Parqet account settings.'}
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-3 text-amber-800">
        {$locale === 'de' ? '7. Open Source' : '7. Open source'}
      </h2>
      <p class="text-amber-700 leading-relaxed">
        {$locale === 'de'
          ? 'Der gesamte Quellcode ist öffentlich auf '
          : 'The entire source code is publicly available on '}<a
          href="https://github.com/sbaerlocher/parqet.beer"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-amber-900">GitHub</a
        >{$locale === 'de'
          ? ' einsehbar. Jeder kann prüfen, was genau mit den Daten passiert.'
          : '. Anyone can verify exactly what happens with the data.'}
      </p>
    </section>

    <div class="mt-10 pt-6 border-t border-amber-200">
      <a href="/" class="text-amber-600 hover:text-amber-800 text-sm">
        ← {$locale === 'de' ? 'Zurück zur Startseite' : 'Back to home'}
      </a>
    </div>
  </main>
</div>
