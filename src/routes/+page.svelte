<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { page } from '$app/state';
  import { t } from '$lib/stores/locale';
  import { locale } from '$lib/stores/locale';
  import LocaleToggle from '$lib/components/LocaleToggle.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import RotatingTagline from '$lib/components/RotatingTagline.svelte';

  const authenticated = $derived(page.data.authenticated === true);

  // Live ticker state for R3 flash effect
  const tickerBase = [
    { ticker: 'ASTRA', px: 0.79 },
    { ticker: 'AUGUS', px: 1.1 },
    { ticker: 'IPA.WR', px: 6.9 },
    { ticker: 'BEER_IDX', px: 287.42, composite: true },
  ];
  let tick = $state(0);
  let tickerData = $state(tickerBase.map((x) => ({ ...x, px: x.px, prevPx: x.px, chg: 0 })));

  $effect(() => {
    const id = setInterval(() => {
      tick++;
      tickerData = tickerBase.map((x, i) => {
        const drift = Math.sin(tick * 0.7 + i) * 0.05;
        const px = +(x.px + drift).toFixed(2);
        const prev = tickerData[i]?.px ?? px;
        return { ...x, px, prevPx: prev, chg: +drift.toFixed(2) };
      });
    }, 2800);
    return () => clearInterval(id);
  });

  const taglinesDe = [
    'Endlich eine sinnvolle Kennzahl.',
    'Dein Depot in der einzig wahren Währung.',
    'Vergiss KGV — zähl lieber Bier.',
    'Lieber Kaffee? Können wir auch.',
    'Auf Gesundheit? Dann halt Smoothie.',
    'Warren Buffett rechnet auch in Bier. Wahrscheinlich.',
    'Dein Portfolio-Sommelier.',
    'Sparplan? Trinkplan!',
  ];

  const taglinesEn = [
    'Finally a meaningful metric.',
    'Your portfolio in the only currency that matters.',
    'Forget P/E ratio — count beers instead.',
    'More of a coffee person? We got you.',
    'Warren Buffett counts in beers too. Probably.',
    'Your portfolio sommelier.',
  ];

  const taglines = $derived($locale === 'de' ? taglinesDe : taglinesEn);
</script>

<div class="min-h-screen" style="background: var(--paper); color: var(--ink)">
  <div class="max-w-[1200px] mx-auto px-4 sm:px-7 py-6 pb-15">
    <!-- top bar -->
    <div class="flex justify-between items-center mb-10 sm:mb-15">
      <div class="flex items-center gap-2.5">
        <span
          class="w-7 h-7 rounded-[7px] inline-flex items-center justify-center font-extrabold text-[13px] font-mono"
          style="border: 1.5px solid var(--highlight); background: var(--card); color: var(--highlight); box-shadow: inset 0 0 0 2px var(--card), 0 0 0 1.5px var(--highlight); letter-spacing: -0.03em"
        >
          🍺
        </span>
        <span class="font-display font-bold text-lg"
          >parqet<span class="text-amber-600">.beer</span></span
        >
        <span
          class="hidden sm:inline font-mono text-[11px] text-amber-700 py-0.5 px-2 rounded ml-2"
          style="background: var(--accent)"
        >
        </span>
      </div>
      <div class="flex items-center gap-2">
        <ThemeToggle />
        <LocaleToggle />
      </div>
    </div>

    <!-- hero -->
    <div class="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 sm:gap-15 items-center">
      <div>
        <div class="font-mono text-xs text-amber-700 mb-3.5">
          // {$t.heroEyebrow}
        </div>

        <h1
          class="font-display font-bold text-amber-950 leading-[0.9] tracking-[-0.045em]"
          style="font-size: clamp(56px, 8vw, 96px)"
        >
          Count<br />
          <span class="text-amber-600">beers</span>,<br />
          not P/E.
        </h1>

        <div class="mt-7 max-w-[460px] text-lg leading-relaxed" style="color: var(--ink-soft)">
          <RotatingTagline {taglines} />
        </div>

        <div class="mt-8 flex gap-3 items-center flex-wrap">
          <a
            href={authenticated ? '/dashboard' : '/api/auth/login'}
            data-testid="hero-cta"
            class="btn btn-primary"
            style="padding: 14px 22px; font-size: 15px; border-radius: 10px"
          >
            <img
              src="https://developer.parqet.com/img/parqet-icon-trans.svg"
              alt=""
              aria-hidden="true"
              style="width: 20px; height: 20px"
            />
            {authenticated ? $t.openDashboardButton : $t.connectButton} →
          </a>
          <span class="font-mono text-xs text-amber-700">
            🔒 {$t.readOnly}
          </span>
        </div>

        <!-- live terminal strip -->
        <div
          class="mt-12 rounded-[10px] overflow-hidden"
          style="border: 1px solid var(--border); background: var(--card)"
        >
          <div
            class="px-3.5 py-2 flex justify-between items-center"
            style="background: var(--accent); border-bottom: 1px solid var(--border)"
          >
            <span class="font-mono text-[11px] text-amber-800 tracking-widest">
              {$t.eyebrowBeerIndex}
            </span>
            <span class="font-mono text-[10px] text-amber-700">
              <span
                class="inline-block w-1.5 h-1.5 rounded-full mr-1 ticker-pulse"
                style="background: var(--success)"
              ></span>
              {$t.marketsOpen}
            </span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 ticker-grid">
            {#each tickerData as row, _i (row.ticker)}
              {@const flash = row.px !== row.prevPx ? (row.px > row.prevPx ? 'up' : 'down') : null}
              <div
                class="px-3 sm:px-3.5 py-2.5"
                style={row.composite ? 'background: var(--accent)' : ''}
              >
                <div class="font-mono text-[11px] text-amber-700">
                  {row.ticker}{row.composite ? ' ·' : ''}
                </div>
                <div class="font-mono text-base text-amber-950 font-bold">
                  <span
                    class="inline-block px-0.5 rounded transition-colors duration-300"
                    style="background: {flash === 'up'
                      ? 'var(--flash-up)'
                      : flash === 'down'
                        ? 'var(--flash-down)'
                        : 'transparent'}"
                  >
                    €{row.px.toFixed(2)}
                  </span>
                </div>
                <div
                  class="font-mono text-[11px]"
                  style="color: {row.chg > 0
                    ? 'var(--success)'
                    : row.chg < 0
                      ? '#dc2626'
                      : 'var(--muted)'}"
                >
                  {row.chg > 0 ? '+' : ''}{row.chg.toFixed(2)}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Hero preview card -->
      <div
        class="relative rounded-2xl p-5 sm:p-7"
        style="background: var(--card); border: 1px solid var(--border); box-shadow: var(--shadow-hero)"
      >
        <div class="flex justify-between items-center mb-4.5">
          <span class="font-mono text-[11px] text-amber-700">// live preview</span>
          <span
            class="font-mono text-[10px] text-amber-800 py-0.5 px-2 rounded-full"
            style="background: var(--accent)"
          >
            DEMO
          </span>
        </div>
        <div class="font-mono text-xs" style="color: var(--muted)">portfolio.value →</div>
        <div
          class="font-display font-bold tabular-nums text-amber-950 tracking-tight text-4xl sm:text-5xl"
        >
          48.720 <span class="text-lg sm:text-[22px] text-amber-600">EUR</span>
        </div>
        <div class="h-px my-4.5" style="background: var(--border)"></div>
        <div class="font-mono text-xs" style="color: var(--muted)">portfolio.value.in_beer →</div>
        <div
          class="font-display font-bold tabular-nums text-amber-700 tracking-[-0.035em]"
          style="font-size: clamp(40px, 8vw, 64px)"
        >
          44.291 🍺
        </div>
        <div class="mt-3.5 flex gap-1.5 flex-wrap">
          {#each ['🍺 Hopfen-Held', '🌅 121× Jahre Feierabend', '🎪 9× Oktoberfest', '🍻 7.382 Sixpacks'] as pill (pill)}
            <span
              class="font-mono text-[11px] py-1 px-2 rounded text-amber-800"
              style="background: var(--accent); border: 1px solid var(--border)"
            >
              {pill}
            </span>
          {/each}
        </div>
      </div>
    </div>

    <!-- how it works -->
    <div class="mt-[70px]">
      <div class="font-mono text-[11px] text-amber-700 tracking-widest mb-3.5">
        // {$t.howItWorks}
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {#each [{ n: '01', title: $t.step01Title, body: $t.step01Body }, { n: '02', title: $t.step02Title, body: $t.step02Body }, { n: '03', title: $t.step03Title, body: $t.step03Body }] as step (step.n)}
          <div class="bier-card p-5.5 relative">
            <div class="font-mono font-bold text-[40px] leading-none tracking-tight text-amber-300">
              {step.n}
            </div>
            <div class="font-display font-bold text-lg mt-2">{step.title}</div>
            <div class="text-[13px] leading-relaxed mt-1" style="color: var(--muted)">
              {step.body}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- value props -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-7">
      {#each [{ emoji: '🍺', title: $t.featureLiveTitle, body: $t.featureLiveBody }, { emoji: '🏆', title: $t.featureBadgesTitle, body: $t.featureBadgesBody }, { emoji: '🔒', title: $t.featureSecurityTitle, body: $t.featureSecurityBody }] as card (card.emoji)}
        <div class="bier-card p-5.5">
          <div class="text-[28px] mb-2.5">{card.emoji}</div>
          <div class="font-display font-bold text-lg mb-1.5">{card.title}</div>
          <div class="text-[13px] leading-relaxed" style="color: var(--muted)">{card.body}</div>
        </div>
      {/each}
    </div>

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
        <a
          href="/privacy"
          class="text-amber-700 no-underline hover:text-amber-900 transition-colors">{$t.privacy}</a
        >
        <a
          href="https://github.com/sbaerlocher/parqet.beer"
          target="_blank"
          rel="noopener noreferrer"
          class="text-amber-700 no-underline hover:text-amber-900 transition-colors">GitHub ↗</a
        >
      </div>
    </div>
  </div>
</div>
