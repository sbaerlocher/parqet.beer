<script lang="ts">
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { BEVERAGES, type BeverageCategory, type Currency } from '$lib/data/beverages';
  import {
    calculateEquivalents,
    calculateFunStats,
    convertValue,
    formatNumber,
  } from '$lib/calculator';
  import BeverageCard from '$lib/components/BeverageCard.svelte';
  import CurrencyToggle from '$lib/components/CurrencyToggle.svelte';
  import FunStats from '$lib/components/FunStats.svelte';
  import BeverageOfTheDay from '$lib/components/BeverageOfTheDay.svelte';
  import FunComparisons from '$lib/components/FunComparisons.svelte';
  import BeerLevel from '$lib/components/BeerLevel.svelte';
  import DividendsInBeer from '$lib/components/DividendsInBeer.svelte';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import CountUp from '$lib/components/CountUp.svelte';
  import LocaleToggle from '$lib/components/LocaleToggle.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { t } from '$lib/stores/locale';
  import { locale } from '$lib/stores/locale';
  import { getBeverageOfTheDay } from '$lib/fun';

  interface Portfolio {
    id: string;
    name: string;
    currency: string;
  }

  // Persist the portfolio selection in localStorage so a returning user sees
  // the same picks they left with. Keyed by a single generic name — entries
  // are validated against the current user's portfolio list on load, so a
  // stale selection from another account is silently dropped.
  const SELECTION_STORAGE_KEY = 'parqet-beer:selected-portfolios';

  function loadStoredSelection(available: Portfolio[]): Set<string> | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SELECTION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      const availableIds = new Set(available.map((p) => p.id));
      const valid = parsed.filter(
        (id): id is string => typeof id === 'string' && availableIds.has(id)
      );
      return valid.length > 0 ? new Set(valid) : null;
    } catch {
      return null;
    }
  }

  function persistSelection(ids: Set<string>) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      // Quota exceeded or storage disabled — ignore, selection is ephemeral.
    }
  }

  const transitionsDe = ['Lieber Kaffee?', 'Oder doch etwas Gesundes?'];
  const transitionsEn = ['More of a coffee person?', 'Or something healthy?'];

  let currency = $state<Currency>('EUR');
  let portfolios: Portfolio[] = $state([]);
  let selectedIds: Set<string> = $state(new Set());
  let portfolioValue: number | null = $state(null);
  let portfolioCurrency: string = $state('EUR');
  let dividends: number = $state(0);
  let loading = $state(true);
  let loadingPerformance = $state(false);

  let error: string | null = $state(null);
  let activeCategory = $state<BeverageCategory>('beer');
  let showValue = $state(true);

  let heroEl: HTMLElement | null = $state(null);
  let heroVisible = $state(true);

  $effect(() => {
    if (!heroEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) heroVisible = entry.isIntersecting;
      },
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(heroEl);
    return () => observer.disconnect();
  });

  const displayValue = $derived(
    portfolioValue !== null ? convertValue(portfolioValue, portfolioCurrency, currency) : null
  );

  const transitions = $derived($locale === 'de' ? transitionsDe : transitionsEn);

  // Per-category data
  const beerEquivs = $derived(
    displayValue !== null ? calculateEquivalents(displayValue, currency, BEVERAGES.beer) : []
  );
  const coffeeEquivs = $derived(
    displayValue !== null ? calculateEquivalents(displayValue, currency, BEVERAGES.coffee) : []
  );
  const smoothieEquivs = $derived(
    displayValue !== null ? calculateEquivalents(displayValue, currency, BEVERAGES.smoothie) : []
  );

  // Rotate featured beverage daily per category. Captured once on mount —
  // a long-lived tab intentionally won't flip at midnight so the user's
  // featured pick stays stable during a session.
  const dayIndex = Math.floor(Date.now() / 86400000);

  const allFirst = $derived({
    beer: beerEquivs[dayIndex % beerEquivs.length],
    coffee: coffeeEquivs[(dayIndex + 1) % coffeeEquivs.length],
    smoothie: smoothieEquivs[(dayIndex + 2) % smoothieEquivs.length],
  });

  const activeFirst = $derived(allFirst[activeCategory]);
  const funStats = $derived(activeFirst ? calculateFunStats(activeFirst.count) : null);
  const displayDividends = $derived(convertValue(dividends, portfolioCurrency, currency));
  const beverageOfTheDay = $derived(
    getBeverageOfTheDay(BEVERAGES[activeCategory], $locale, activeCategory)
  );
  const botdCount = $derived(
    displayValue !== null && beverageOfTheDay
      ? Math.floor(
          displayValue /
            (currency === 'CHF'
              ? beverageOfTheDay.beverage.priceChf
              : beverageOfTheDay.beverage.priceEur)
        )
      : 0
  );

  const sortenEquivs = $derived(
    activeCategory === 'beer'
      ? beerEquivs
      : activeCategory === 'coffee'
        ? coffeeEquivs
        : smoothieEquivs
  );

  const sortenMaxCount = $derived(
    sortenEquivs.length > 0 ? Math.max(...sortenEquivs.map((e) => e.count)) : 0
  );

  // Force a cache-bypassing call on mount so a token that was revoked while
  // the tab was sitting idle surfaces immediately instead of serving stale
  // KV-cached portfolios for up to an hour.
  async function loadPortfolios() {
    try {
      const res = await fetch('/api/portfolios?fresh=1');
      if (res.status === 401) {
        // Parqet rejected the token — server already cleared the session
        // cookie + KV cache. Kick the user back to the landing page so
        // they can reconnect.
        await goto('/');
        return;
      }
      if (!res.ok) throw new Error('Failed to load portfolios');
      const data = (await res.json()) as Portfolio[];
      portfolios = data;
      // Restore the previous selection from localStorage if any of the
      // stored IDs still exist in the current portfolio list; otherwise
      // fall back to "all selected" as before.
      const stored = loadStoredSelection(data);
      selectedIds = stored ?? new Set(data.map((p) => p.id));

      if (data.length > 0) {
        const primaryCurrency = data[0]?.currency;
        if (primaryCurrency === 'CHF') currency = 'CHF';
      }

      await loadPerformance();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  // Persist the user's current selection on every change, but only after
  // the initial load — otherwise the empty pre-fetch state would wipe the
  // stored value on every dashboard visit.
  $effect(() => {
    if (loading) return;
    persistSelection(selectedIds);
  });

  async function loadPerformance() {
    if (selectedIds.size === 0) {
      portfolioValue = 0;
      return;
    }

    loadingPerformance = true;
    try {
      const params = new URLSearchParams();
      for (const id of selectedIds) {
        params.append('portfolioId', id);
      }
      const res = await fetch(`/api/performance?${params}`);
      if (res.status === 401) {
        // Token was revoked between the initial `loadPortfolios` probe and
        // the performance fetch. Bail back to the landing page.
        await goto('/');
        return;
      }
      if (!res.ok) throw new Error('Failed to load performance');
      const data = (await res.json()) as {
        totalValue: number;
        dividends: number;
        currency: string;
      };
      portfolioValue = data.totalValue;
      dividends = data.dividends ?? 0;
      portfolioCurrency = data.currency;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      loadingPerformance = false;
    }
  }

  function togglePortfolio(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    selectedIds = next;
    loadPerformance();
  }

  $effect(() => {
    loadPortfolios();
  });
</script>

<div class="min-h-screen bg-amber-50">
  <!-- Header (sticky so portfolio value stays visible when scrolling) -->
  <header
    class="sticky top-0 z-40 bg-gradient-to-b from-amber-600 to-amber-700 text-white py-4 px-6 flex items-center justify-between shadow-sm"
  >
    <div class="flex items-center gap-3 min-w-0">
      <h1 class="text-xl font-bold shrink-0">🍺 parqet.beer</h1>
      {#if !heroVisible && displayValue !== null}
        <span
          in:fade={{ duration: 150 }}
          out:fade={{ duration: 100 }}
          class="text-sm font-medium tabular-nums text-amber-100 truncate"
        >
          {showValue ? `${formatNumber(Math.round(displayValue), $locale)} ${currency}` : '•••••'} 🍺
        </span>
      {/if}
    </div>
    <div class="flex items-center gap-3 shrink-0">
      <ThemeToggle />
      <LocaleToggle />
      <form method="POST" action="/api/auth/logout">
        <button
          type="submit"
          class="text-amber-200 hover:text-white text-sm transition-colors bg-transparent border-0 p-0 cursor-pointer"
        >
          {$t.logout}
        </button>
      </form>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 py-8">
    {#if loading}
      <div class="text-center py-20">
        <p class="text-amber-600 text-lg">{$t.loading}</p>
      </div>
    {:else if error}
      <div class="text-center py-20">
        <p class="text-red-600 text-lg">{error}</p>
        <a href="/" class="text-amber-600 hover:underline mt-4 inline-block">{$t.back}</a>
      </div>
    {:else}
      <!-- Portfolio selector -->
      {#if portfolios.length > 1}
        <div
          class="flex flex-nowrap gap-2 mb-6 overflow-x-auto scrollbar-hide px-1 sm:flex-wrap sm:justify-center"
        >
          {#each portfolios as portfolio (portfolio.id)}
            <button
              class="px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 {selectedIds.has(
                portfolio.id
              )
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-amber-700 border border-amber-200 hover:border-amber-400'}"
              onclick={() => togglePortfolio(portfolio.id)}
            >
              {portfolio.name}
            </button>
          {/each}
        </div>
      {/if}

      {#if displayValue !== null}
        <!-- Hero: Portfolio value -->
        <div class="text-center mb-4" bind:this={heroEl}>
          <p class="text-amber-600 text-sm mb-1">
            {portfolios.length > 1 && selectedIds.size < portfolios.length
              ? $t.portfoliosOf(selectedIds.size, portfolios.length)
              : $t.yourPortfolio}
          </p>
          <div class="flex items-center justify-center gap-2">
            <p class="text-4xl font-display font-bold text-slate-800 tabular-nums">
              {#if showValue}
                <CountUp value={Math.round(displayValue)} />
              {:else}
                •••••
              {/if}
              {#if loadingPerformance}
                <span class="text-lg text-amber-400 ml-2">...</span>
              {/if}
            </p>
            <div class="flex items-center gap-1">
              <CurrencyToggle bind:currency />
              <button
                class="text-amber-400 hover:text-amber-600 transition-colors p-1"
                onclick={() => (showValue = !showValue)}
                title={showValue
                  ? $locale === 'de'
                    ? 'Vermögen verbergen'
                    : 'Hide value'
                  : $locale === 'de'
                    ? 'Vermögen anzeigen'
                    : 'Show value'}
              >
                {#if showValue}
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                {:else}
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                {/if}
              </button>
            </div>
          </div>
        </div>

        <!-- Three categories side by side. Each card is a real <button> with
             ShareButton as a sibling (not nested) to keep interactive elements
             properly separated. -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {#if allFirst.beer}
            <div class="relative">
              <button
                type="button"
                aria-pressed={activeCategory === 'beer'}
                aria-label={$locale === 'de' ? 'Bier-Kategorie auswählen' : 'Select beer category'}
                class="w-full bg-white rounded-2xl p-6 text-center relative overflow-hidden transition-all cursor-pointer {activeCategory ===
                'beer'
                  ? 'shadow-md border-2 border-amber-400'
                  : 'shadow-sm border border-amber-200 hover:shadow-md'}"
                onclick={() => (activeCategory = 'beer')}
              >
                {#if activeCategory === 'beer'}<div
                    class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600"
                  ></div>{/if}
                <p class="text-xs text-amber-500 italic mb-2">
                  {$locale === 'de' ? 'Prost!' : 'Cheers!'}
                </p>
                <p class="text-4xl mb-2">🍺</p>
                <p class="text-4xl font-display font-bold text-slate-800 tabular-nums mb-1">
                  <CountUp value={allFirst.beer.count} />
                </p>
                <p class="text-sm text-amber-700 font-medium">{allFirst.beer.name}</p>
              </button>
              <ShareButton
                emoji="🍺"
                count={allFirst.beer.count}
                beverageName={allFirst.beer.name}
                portfolioValue={displayValue ?? 0}
                {currency}
                {showValue}
              />
            </div>
          {/if}

          {#if allFirst.coffee}
            <div class="relative">
              <button
                type="button"
                aria-pressed={activeCategory === 'coffee'}
                aria-label={$locale === 'de'
                  ? 'Kaffee-Kategorie auswählen'
                  : 'Select coffee category'}
                class="w-full bg-white rounded-2xl p-6 text-center relative overflow-hidden transition-all cursor-pointer {activeCategory ===
                'coffee'
                  ? 'shadow-md border-2 border-amber-400'
                  : 'shadow-sm border border-amber-200 hover:shadow-md'}"
                onclick={() => (activeCategory = 'coffee')}
              >
                {#if activeCategory === 'coffee'}<div
                    class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600"
                  ></div>{/if}
                <p class="text-xs text-amber-500 italic mb-2">{transitions[0]}</p>
                <p class="text-4xl mb-2">☕</p>
                <p class="text-4xl font-display font-bold text-slate-800 tabular-nums mb-1">
                  <CountUp value={allFirst.coffee.count} />
                </p>
                <p class="text-sm text-amber-700 font-medium">{allFirst.coffee.name}</p>
              </button>
              <ShareButton
                emoji="☕"
                count={allFirst.coffee.count}
                beverageName={allFirst.coffee.name}
                portfolioValue={displayValue ?? 0}
                {currency}
                {showValue}
              />
            </div>
          {/if}

          {#if allFirst.smoothie}
            <div class="relative">
              <button
                type="button"
                aria-pressed={activeCategory === 'smoothie'}
                aria-label={$locale === 'de'
                  ? 'Smoothie-Kategorie auswählen'
                  : 'Select smoothie category'}
                class="w-full bg-white rounded-2xl p-6 text-center relative overflow-hidden transition-all cursor-pointer {activeCategory ===
                'smoothie'
                  ? 'shadow-md border-2 border-amber-400'
                  : 'shadow-sm border border-amber-200 hover:shadow-md'}"
                onclick={() => (activeCategory = 'smoothie')}
              >
                {#if activeCategory === 'smoothie'}<div
                    class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600"
                  ></div>{/if}
                <p class="text-xs text-amber-500 italic mb-2">{transitions[1]}</p>
                <p class="text-4xl mb-2">🥤</p>
                <p class="text-4xl font-display font-bold text-slate-800 tabular-nums mb-1">
                  <CountUp value={allFirst.smoothie.count} />
                </p>
                <p class="text-sm text-amber-700 font-medium">{allFirst.smoothie.name}</p>
              </button>
              <ShareButton
                emoji="🥤"
                count={allFirst.smoothie.count}
                beverageName={allFirst.smoothie.name}
                portfolioValue={displayValue ?? 0}
                {currency}
                {showValue}
              />
            </div>
          {/if}
        </div>

        <!-- Beverage of the Day -->
        {#if beverageOfTheDay}
          <BeverageOfTheDay
            beverage={beverageOfTheDay.beverage}
            quote={beverageOfTheDay.quote}
            count={botdCount}
            {currency}
          />
        {/if}

        <!-- Beer Level -->
        {#if activeFirst}
          <BeerLevel count={activeFirst.count} category={activeCategory} />
        {/if}

        <!-- Dividends -->
        {#if beverageOfTheDay}
          <DividendsInBeer
            dividends={displayDividends}
            beverage={beverageOfTheDay.beverage}
            {currency}
            category={activeCategory}
          />
        {/if}

        <!-- Fun comparisons as Bento grid -->
        {#if activeFirst}
          <FunComparisons count={activeFirst.count} category={activeCategory} />
        {/if}

        <!-- Fun stats -->
        {#if funStats && activeFirst}
          <FunStats stats={funStats} beverageName={activeFirst.name} />
        {/if}

        <!-- All varieties with tabs -->
        <div class="mt-10">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-800">
              {$locale === 'de' ? 'Alle Sorten' : 'All varieties'}
            </h2>
            <div class="flex gap-1 bg-white rounded-lg border border-amber-200 p-1">
              {#each [{ key: 'beer' as BeverageCategory, emoji: '🍺' }, { key: 'coffee' as BeverageCategory, emoji: '☕' }, { key: 'smoothie' as BeverageCategory, emoji: '🥤' }] as tab (tab.key)}
                <button
                  class="px-3 py-1.5 rounded text-sm font-medium transition-all {activeCategory ===
                  tab.key
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-600 hover:bg-amber-100'}"
                  onclick={() => (activeCategory = tab.key)}
                >
                  {tab.emoji}
                  {$t[tab.key]}
                </button>
              {/each}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each sortenEquivs as equiv (equiv.name)}
              <BeverageCard {equiv} {currency} maxCount={sortenMaxCount} />
            {/each}
          </div>
        </div>
      {/if}
    {/if}

    <footer
      class="mt-12 py-8 border-t border-amber-200 text-center text-xs text-amber-400 space-y-2"
    >
      <p>{$t.disclaimer1}</p>
      <p>
        {$locale === 'de'
          ? 'Preise basieren auf Supermarkt- und Café-Durchschnittspreisen. Wechselkurse sind Näherungswerte.'
          : 'Prices based on average supermarket and café prices. Exchange rates are approximations.'}
      </p>
      <p>
        {$locale === 'de'
          ? 'Preise stimmen nicht? Jeder kann sie auf '
          : 'Prices wrong? Anyone can update them on '}<a
          href="https://github.com/sbaerlocher/parqet.beer"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-amber-500 transition-colors">GitHub</a
        >{$locale === 'de' ? ' anpassen!' : '!'}
      </p>
      <p>{$t.disclaimer3}</p>
      <div class="flex items-center justify-center gap-3 pt-2 text-amber-300">
        <a href="/privacy" class="hover:text-amber-500 transition-colors"
          >{$locale === 'de' ? 'Datenschutz' : 'Privacy'}</a
        >
        <span>·</span>
        <a
          href="https://www.parqet.com"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-amber-500 transition-colors">Parqet</a
        >
        <span>·</span>
        <a
          href="https://github.com/sbaerlocher/parqet.beer"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-amber-500 transition-colors">GitHub</a
        >
        <span>·</span>
        <span>{$locale === 'de' ? 'Gebaut mit' : 'Built with'} 🍺</span>
      </div>
    </footer>
  </main>
</div>
