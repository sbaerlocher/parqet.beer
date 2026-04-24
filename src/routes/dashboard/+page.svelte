<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import {
    BEVERAGES,
    BEVERAGE_CATEGORIES,
    CATEGORY_EMOJI,
    type BeverageCategory,
    type Currency,
  } from '$lib/data/beverages';
  import {
    calculateEquivalents,
    calculateFunStats,
    convertValue,
    formatNumber,
  } from '$lib/calculator';
  import { countryFlag } from '$lib/fx';
  import CountUp from '$lib/components/CountUp.svelte';
  import BeerGlass from '$lib/components/BeerGlass.svelte';
  import CoffeeGlass from '$lib/components/CoffeeGlass.svelte';
  import SmoothieGlass from '$lib/components/SmoothieGlass.svelte';
  import WhiskyGlass from '$lib/components/WhiskyGlass.svelte';
  import LocaleToggle from '$lib/components/LocaleToggle.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import NoteBadge from '$lib/components/NoteBadge.svelte';
  import { t, locale } from '$lib/stores/locale';
  import {
    getBeverageOfTheDay,
    getAllBadges,
    getFunComparisons,
    getMilestoneBadge,
    getNextMilestone,
  } from '$lib/fun';

  const GLASS_COMPONENTS = {
    beer: BeerGlass,
    coffee: CoffeeGlass,
    smoothie: SmoothieGlass,
    whisky: WhiskyGlass,
  } as const;

  function isBeverageCategory(value: unknown): value is BeverageCategory {
    return typeof value === 'string' && (BEVERAGE_CATEGORIES as string[]).includes(value);
  }

  interface Portfolio {
    id: string;
    name: string;
    currency: string;
  }

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
      /* storage unavailable */
    }
  }

  let currency = $state<Currency>('EUR');
  let portfolios: Portfolio[] = $state([]);
  let selectedIds: Set<string> = $state(new Set());
  let portfolioValue: number | null = $state(null);
  let portfolioCurrency: string = $state('EUR');
  let dividends: number = $state(0);
  let loading = $state(true);
  let loadingPerformance = $state(false);
  let error: string | null = $state(null);
  const CATEGORY_KEY = 'parqet-beer:category';
  let activeCategory = $state<BeverageCategory>('beer');
  let categoryLoaded = false;

  $effect(() => {
    if (categoryLoaded) return;
    categoryLoaded = true;
    const stored = localStorage.getItem(CATEGORY_KEY);
    if (isBeverageCategory(stored)) {
      activeCategory = stored;
    }
  });

  $effect(() => {
    if (!categoryLoaded) return;
    localStorage.setItem(CATEGORY_KEY, activeCategory);
  });

  const FAVORITES_KEY = 'parqet-beer:favorites';
  type Favorites = Record<BeverageCategory, Set<string>>;
  const emptyFavorites = (): Favorites =>
    Object.fromEntries(BEVERAGE_CATEGORIES.map((k) => [k, new Set<string>()])) as Favorites;
  let favorites = $state<Favorites>(emptyFavorites());
  let favoritesLoaded = false;

  $effect(() => {
    if (favoritesLoaded) return;
    favoritesLoaded = true;
    try {
      const raw = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '{}');
      favorites = Object.fromEntries(
        BEVERAGE_CATEGORIES.map((k) => [k, new Set<string>(Array.isArray(raw[k]) ? raw[k] : [])])
      ) as Favorites;
    } catch {
      /* storage unavailable */
    }
  });

  function toggleFavorite(name: string) {
    const cat = favorites[activeCategory];
    if (cat.has(name)) cat.delete(name);
    else cat.add(name);
    favorites = { ...favorites, [activeCategory]: new Set(cat) };
  }

  $effect(() => {
    if (!favoritesLoaded) return;
    try {
      localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(Object.fromEntries(BEVERAGE_CATEGORIES.map((k) => [k, [...favorites[k]]])))
      );
    } catch {
      /* storage unavailable */
    }
  });

  let showValue = $state(true);
  let showValueLoaded = false;

  $effect(() => {
    if (showValueLoaded) return;
    showValueLoaded = true;
    showValue = localStorage.getItem('parqet-beer:show-value') !== 'false';
  });

  $effect(() => {
    if (!showValueLoaded) return;
    localStorage.setItem('parqet-beer:show-value', String(showValue));
  });

  let loadingMsgIndex = $state(Math.floor(Math.random() * $t.loadingMessages.length));

  $effect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      loadingMsgIndex = (loadingMsgIndex + 1) % $t.loadingMessages.length;
    }, 2000);
    return () => clearInterval(interval);
  });

  const displayValue = $derived(
    portfolioValue !== null ? convertValue(portfolioValue, portfolioCurrency, currency) : null
  );

  const dayIndex = Math.floor(Date.now() / 86400000);

  const displayDividends = $derived(convertValue(dividends, portfolioCurrency, currency));

  const activeList = $derived(BEVERAGES[activeCategory]);

  const beverageOfTheDay = $derived(getBeverageOfTheDay(activeList, $locale, activeCategory));
  const botdPrice = $derived(beverageOfTheDay ? beverageOfTheDay.beverage.price : 0);
  const botdCurrency = $derived(beverageOfTheDay ? beverageOfTheDay.beverage.currency : '');
  const botdCount = $derived(
    portfolioValue !== null && botdPrice > 0
      ? Math.floor(convertValue(portfolioValue, portfolioCurrency, botdCurrency) / botdPrice)
      : 0
  );

  // All stats derive from botdCount so everything is consistent with the
  // beverage of the day shown in the UI.
  const funStats = $derived(botdCount > 0 ? calculateFunStats(botdCount) : null);
  const badge = $derived(
    botdCount > 0 ? getMilestoneBadge(botdCount, activeCategory, $locale) : null
  );
  const nextBadge = $derived(
    botdCount > 0 ? getNextMilestone(botdCount, activeCategory, $locale) : null
  );
  const comparisons = $derived(
    botdCount > 0 ? getFunComparisons(botdCount, activeCategory, $locale).slice(0, 6) : []
  );

  const glassFill = $derived.by(() => {
    if (botdCount <= 0) return 0.05;
    const badges = getAllBadges(activeCategory, $locale);
    if (badges.length === 0) return 0.5;
    const maxThreshold = badges[badges.length - 1]!.threshold;
    // Above max badge → full glass
    if (botdCount >= maxThreshold) return 0.95;
    // Find current tier and interpolate between thresholds
    // Each tier maps to a segment of the glass (e.g. 6 tiers → ~15% each)
    const tierSize = 0.9 / badges.length;
    for (let i = 0; i < badges.length; i++) {
      const upper = badges[i]!.threshold;
      const lower = i === 0 ? 0 : badges[i - 1]!.threshold;
      if (botdCount < upper) {
        const progress = (botdCount - lower) / (upper - lower);
        return Math.max(0.05, 0.05 + i * tierSize + progress * tierSize);
      }
    }
    return 0.95;
  });
  const dividendBeers = $derived(
    botdPrice > 0
      ? Math.floor(convertValue(dividends, portfolioCurrency, botdCurrency) / botdPrice)
      : 0
  );

  const sortenEquivsRaw = $derived(
    portfolioValue !== null
      ? calculateEquivalents(portfolioValue, portfolioCurrency, activeList)
      : []
  );
  const activeFavs = $derived(favorites[activeCategory]);
  const sortenEquivs = $derived(
    [...sortenEquivsRaw].sort((a, b) => {
      const af = activeFavs.has(a.name) ? 0 : 1;
      const bf = activeFavs.has(b.name) ? 0 : 1;
      return af - bf;
    })
  );

  const catLabel = $derived($t[activeCategory]);
  const catEmoji = $derived(CATEGORY_EMOJI[activeCategory]);
  const ActiveGlass = $derived(GLASS_COMPONENTS[activeCategory]);

  const catCards = $derived([
    { key: 'beer', emoji: CATEGORY_EMOJI.beer, intro: $t.catIntroBeer },
    { key: 'coffee', emoji: CATEGORY_EMOJI.coffee, intro: $t.catIntroCoffee },
    { key: 'smoothie', emoji: CATEGORY_EMOJI.smoothie, intro: $t.catIntroSmoothie },
    { key: 'whisky', emoji: CATEGORY_EMOJI.whisky, intro: $t.catIntroWhisky },
  ] as const);

  async function loadPortfolios() {
    try {
      const res = await fetch('/api/portfolios?fresh=1');
      if (res.status === 401) {
        await goto('/');
        return;
      }
      if (!res.ok) throw new Error('Failed to load portfolios');
      const data = (await res.json()) as Portfolio[];
      portfolios = data;
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
      for (const id of selectedIds) params.append('portfolioId', id);
      const res = await fetch(`/api/performance?${params}`);
      if (res.status === 401) {
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
      if (next.size > 1) next.delete(id);
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

<div class="min-h-screen" style="background: var(--paper); color: var(--ink)">
  <!-- header -->
  <header
    class="sticky top-0 z-30 px-4 sm:px-7 py-3"
    style="background: var(--header-bg); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border)"
  >
    <div class="max-w-[1200px] mx-auto flex items-center justify-between gap-3 sm:gap-5">
      <div class="flex items-center gap-2 sm:gap-3.5 min-w-0">
        <span
          class="w-7 h-7 rounded-[7px] inline-flex items-center justify-center font-extrabold text-[13px] font-mono shrink-0"
          style="border: 1.5px solid var(--highlight); background: var(--card); color: var(--highlight); box-shadow: inset 0 0 0 2px var(--card), 0 0 0 1.5px var(--highlight); letter-spacing: -0.03em"
        >
          🍺
        </span>
        <span class="font-display font-bold text-base shrink-0"
          >parqet<span class="text-amber-600">.beer</span></span
        >
        {#if displayValue !== null}
          <!-- equation chip (R12) -->
          <div
            class="hidden sm:inline-flex items-center gap-2 py-1 px-2.5 rounded-full"
            style="background: var(--accent); border: 1px solid var(--border)"
          >
            <span class="font-mono tabular-nums text-xs text-amber-800">
              {showValue
                ? `${formatNumber(Math.round(displayValue), $locale)} ${currency}`
                : $locale === 'de'
                  ? 'Verborgen'
                  : 'Hidden'}
            </span>
            <span class="font-mono text-[11px] text-amber-600">→</span>
            <span class="font-mono tabular-nums text-xs text-amber-900 font-bold">
              {formatNumber(botdCount, $locale)}
              {catEmoji}
            </span>
          </div>
        {/if}
      </div>
      <div class="flex gap-1.5 sm:gap-2 items-center shrink-0">
        <ThemeToggle />
        <LocaleToggle />
        <!-- currency toggle -->
        <div
          class="inline-flex p-0.5 rounded-md"
          style="background: var(--accent); border: 1px solid var(--border)"
        >
          {#each ['EUR', 'CHF'] as c (c)}
            <button
              onclick={() => (currency = c as Currency)}
              class="px-2 sm:px-2.5 py-1 rounded text-[11px] font-bold transition-all font-mono"
              style={currency === c
                ? 'background: var(--card); color: var(--highlight)'
                : 'background: transparent; color: var(--highlight)'}
            >
              {c}
            </button>
          {/each}
        </div>
        <!-- eye toggle -->
        <button
          onclick={() => (showValue = !showValue)}
          class="inline-flex items-center justify-center w-[30px] h-7 rounded-md"
          style="background: var(--accent); border: 1px solid var(--border); color: var(--highlight); font-size: 13px"
          title={showValue
            ? $locale === 'de'
              ? 'Werte verbergen'
              : 'Hide values'
            : $locale === 'de'
              ? 'Werte zeigen'
              : 'Show values'}
        >
          {showValue ? '👁' : '👁‍🗨'}
        </button>
        <form method="POST" action="/api/auth/logout">
          <button
            type="submit"
            class="btn btn-ghost text-[13px]"
            style="padding: 6px 8px"
            title={$t.logout}
          >
            <span class="hidden sm:inline">{$t.logout}</span>
            <span class="sm:hidden text-base">⏻</span>
          </button>
        </form>
      </div>
    </div>
  </header>

  <main class="max-w-[1200px] mx-auto px-4 sm:px-7 py-5 sm:py-7 pb-20">
    {#if loading}
      <div class="text-center py-20">
        <p class="text-5xl mb-4 animate-pulse">🍺</p>
        {#key loadingMsgIndex}
          <p
            class="text-amber-600 text-lg font-medium"
            in:fade={{ duration: 300 }}
            out:fade={{ duration: 200 }}
          >
            {$t.loadingMessages[loadingMsgIndex]}
          </p>
        {/key}
      </div>
    {:else if error}
      <div class="text-center py-20">
        <p class="text-red-600 text-lg">{error}</p>
        <a href="/" class="text-amber-600 hover:underline mt-4 inline-block">{$t.back}</a>
      </div>
    {:else if displayValue !== null}
      <!-- control bar -->
      <div class="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <div class="font-mono text-[11px] text-amber-700 mb-1">
            {selectedIds.size === portfolios.length
              ? $t.yourPortfolio
              : $t.portfoliosOf(selectedIds.size, portfolios.length)}
          </div>
          {#if portfolios.length > 1}
            <div
              class="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap max-w-[100vw]"
            >
              {#each portfolios as p (p.id)}
                <button
                  onclick={() => togglePortfolio(p.id)}
                  class="py-1.5 px-2.5 sm:px-3.5 rounded-full text-[12px] sm:text-[13px] font-semibold transition-all whitespace-nowrap inline-flex items-center gap-1 sm:gap-1.5 shrink-0"
                  style={selectedIds.has(p.id)
                    ? 'background: var(--amber-700, #b45309); color: white; border: 1px solid var(--amber-700, #b45309)'
                    : `background: var(--card); color: var(--highlight); border: 1px solid var(--border)`}
                >
                  <span style="opacity: {selectedIds.has(p.id) ? 1 : 0.6}">
                    {selectedIds.has(p.id) ? '●' : '○'}
                  </span>
                  {p.name}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Category cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3.5 mb-6">
        {#each catCards as card (card.key)}
          <button
            type="button"
            aria-pressed={activeCategory === card.key}
            onclick={() => (activeCategory = card.key)}
            class="bier-card px-2 sm:px-4 py-3 text-center transition-all cursor-pointer relative overflow-hidden"
            style={activeCategory === card.key
              ? 'border-color: var(--amber-600, #d97706); box-shadow: 0 4px 14px rgba(120, 53, 15, 0.12)'
              : ''}
          >
            {#if activeCategory === card.key}
              <div
                class="absolute top-0 left-0 right-0 h-0.5"
                style="background: var(--amber-600, #d97706)"
              ></div>
            {/if}
            <span class="text-2xl">{card.emoji}</span>
            <p class="font-mono text-[9px] sm:text-[11px] text-amber-700 mt-1 leading-tight">
              {card.intro}
            </p>
          </button>
        {/each}
      </div>

      <!-- Bento grid -->
      <div class="grid grid-cols-12 gap-2.5 sm:gap-3.5">
        <!-- Hero card -->
        <div
          class="col-span-12 lg:col-span-8 bier-card p-4 sm:p-7 min-h-[220px] sm:min-h-[260px] flex flex-col justify-between relative overflow-hidden"
          style="background: linear-gradient(135deg, var(--gradient-hero-from) 0%, var(--gradient-hero-to) 100%)"
        >
          <!-- Share button as tab (hangs from top edge) -->
          {#if beverageOfTheDay}
            <div class="absolute top-[-1px] right-8 z-10">
              <ShareButton
                emoji={catEmoji}
                count={botdCount}
                beverageName={beverageOfTheDay.beverage.name}
                portfolioValue={displayValue ?? 0}
                {currency}
                {showValue}
                badgeIcon={badge?.icon ?? ''}
                badgeTitle={badge?.title ?? ''}
              />
            </div>
          {/if}

          <!-- R6: Eyebrow → Big number → Name → Formula footer -->
          <div class="flex justify-between items-start gap-5">
            <div class="eyebrow whitespace-nowrap overflow-hidden text-ellipsis">
              {$t.eyebrowPortfolioValue} × {catLabel.toUpperCase()}
            </div>
            <div class="text-[36px] sm:text-[52px] leading-none shrink-0 mt-4 sm:mt-6">
              {catEmoji}
            </div>
          </div>
          <div>
            <div
              class="font-display tabular-nums font-bold text-amber-950 tracking-[-0.05em] leading-[0.9]"
              style="font-size: clamp(40px, 10vw, 120px)"
            >
              <CountUp value={botdCount} />
            </div>
            <div class="font-mono text-base text-amber-700 mt-1.5 tracking-wide">
              × {beverageOfTheDay?.beverage.name || '—'}
              <span style="color: var(--muted)">({beverageOfTheDay?.beverage.size || ''})</span>
            </div>
          </div>
          <!-- Formula as ticket footer -->
          <div
            class="mt-3 pt-3 flex justify-between items-center"
            style="border-top: 1px dashed var(--border)"
          >
            <span class="font-mono text-[10px] tracking-wide" style="color: var(--muted)">
              {showValue
                ? `${formatNumber(Math.round(displayValue), $locale)} ${currency}`
                : '•••••'}
              &nbsp;&divide;&nbsp;
              {botdPrice.toFixed(2)}
              {botdCurrency}
              {#if loadingPerformance}
                <span class="text-amber-400 ml-1">...</span>
              {/if}
            </span>
            <span class="font-mono text-[10px] text-amber-700">{$t.asOfNow}</span>
          </div>
        </div>

        <!-- Glass visual -->
        <div
          class="col-span-12 lg:col-span-4 bier-card p-4 sm:p-5 flex flex-col items-center min-h-[260px]"
        >
          <div class="eyebrow self-start mb-2">{$t.eyebrowFillLevel}</div>
          <div class="flex-1 flex items-center">
            <ActiveGlass fill={glassFill} size={130} />
          </div>
          <div class="font-mono text-sm text-amber-800 text-center mt-2">
            {#if badge}
              {badge.icon} {badge.title}
            {:else}
              —
            {/if}
          </div>
        </div>

        <!-- Fun stats -->
        <div class="col-span-12 lg:col-span-6 bier-card p-4 sm:p-6">
          <div class="eyebrow mb-3.5">{$t.eyebrowRunRate}</div>
          {#if funStats}
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
              {#each [{ k: funStats.perDay, l: $t.perDay, sub: '/d' }, { k: funStats.perWeek, l: $t.perWeek, sub: '/w' }, { k: funStats.perMonth, l: $t.perMonth, sub: '/mo' }, { k: funStats.perYear, l: $t.perYear, sub: '/y' }] as stat (stat.sub)}
                <div
                  style="border-left: 2px solid var(--amber-300, #fcd34d); padding-left: 10px; min-width: 0"
                >
                  <div class="font-mono text-[10px] text-amber-600 tracking-widest">{stat.sub}</div>
                  <div
                    class="font-display tabular-nums font-bold text-amber-950 leading-tight overflow-hidden text-ellipsis whitespace-nowrap"
                    style="font-size: clamp(18px, 2.5vw, 24px)"
                  >
                    {formatNumber(stat.k, $locale)}
                  </div>
                  <div class="text-[11px]" style="color: var(--muted)">{stat.l}</div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Milestone -->
        <div class="col-span-12 lg:col-span-6 bier-card p-4 sm:p-6">
          <div class="eyebrow mb-2.5">{$t.eyebrowRankStatus}</div>
          {#if badge}
            <div class="flex items-center gap-3.5">
              <div class="text-[44px]">{badge.icon}</div>
              <div class="flex-1">
                <div class="font-display font-bold text-lg text-amber-950">{badge.title}</div>
                <div class="font-mono text-[11px] mt-0.5" style="color: var(--muted)">
                  {badge.description}
                </div>
              </div>
            </div>
          {:else}
            <div style="color: var(--muted)">
              {$t.noRank}
            </div>
          {/if}
          {#if nextBadge}
            <div class="mt-4">
              <div class="font-mono text-[10px] text-amber-700 flex justify-between">
                <span>→ {nextBadge.title}</span>
                <span
                  >{formatNumber(botdCount, $locale)} / {formatNumber(
                    nextBadge.threshold,
                    $locale
                  )}</span
                >
              </div>
              <div
                class="mt-1.5 h-2 rounded overflow-hidden relative"
                style="background: var(--accent)"
              >
                <div
                  class="h-full transition-all duration-500"
                  style="width: {Math.min(
                    100,
                    (botdCount / nextBadge.threshold) * 100
                  )}%; background: repeating-linear-gradient(-35deg, var(--amber-600, #d97706) 0 6px, var(--amber-700, #b45309) 6px 12px)"
                ></div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Beverage of the Day -->
        <div class="col-span-12 lg:col-span-7 bier-card p-4 sm:p-6">
          <div class="flex justify-between items-center mb-2">
            <span class="eyebrow">{$t.eyebrowBeverageOfDay}</span>
            <span class="font-mono text-[10px]" style="color: var(--muted)">day #{dayIndex}</span>
          </div>
          {#if beverageOfTheDay}
            <div class="text-[13px] text-amber-700 italic mb-2.5">{beverageOfTheDay.quote}</div>
            <div class="flex items-center justify-between gap-5">
              <div>
                <div
                  class="font-display font-bold text-[20px] sm:text-[26px] text-amber-950 flex items-center gap-2 flex-wrap"
                >
                  <span>{beverageOfTheDay.beverage.name}</span>
                  {#if beverageOfTheDay.beverage.note}
                    <NoteBadge note={beverageOfTheDay.beverage.note} variant="prominent" />
                  {/if}
                </div>
                <div class="font-mono text-xs mt-1" style="color: var(--muted)">
                  {countryFlag(beverageOfTheDay.beverage.country)}
                  {beverageOfTheDay.beverage.size} · {beverageOfTheDay.beverage.price.toFixed(2)}
                  {beverageOfTheDay.beverage.currency}
                </div>
              </div>
              <div class="text-right">
                <div
                  class="font-display tabular-nums font-bold text-[32px] sm:text-[42px] text-amber-700 leading-none"
                >
                  <CountUp value={botdCount} />
                </div>
                <div class="font-mono text-[11px] text-amber-700">UNITS</div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Dividends (R14: always visible) -->
        <div
          class="col-span-12 lg:col-span-5 bier-card p-4 sm:p-6"
          style={dividendBeers > 0
            ? 'background: linear-gradient(135deg, var(--amber-600, #d97706), var(--amber-800, #92400e)); color: #fffdf7; border-color: var(--amber-700, #b45309)'
            : ''}
        >
          <div
            class="font-mono text-[11px] tracking-widest"
            style={dividendBeers > 0 ? 'opacity: 0.8' : 'color: var(--amber-700, #b45309)'}
          >
            DIVIDENDS × FREEBEER
          </div>
          {#if dividendBeers > 0}
            <div
              class="font-display tabular-nums font-bold text-[40px] sm:text-[56px] leading-none mt-2.5"
            >
              <CountUp value={dividendBeers} />
            </div>
            <div class="text-[13px] mt-1.5 opacity-90">
              {$t.dividendsFreeBeer}
            </div>
            <div class="font-mono text-[11px] mt-2.5 opacity-70">
              {showValue
                ? `${formatNumber(Math.round(displayDividends), $locale)} ${currency}`
                : '•••••'}
              · {$t.dividendsOnTab}
            </div>
          {:else}
            <div class="text-[36px] mt-6">🍺</div>
            <div class="font-display font-bold text-[22px] text-amber-950 mt-2">
              {$t.noFreeBeer}
            </div>
            <div class="font-mono text-[11px] mt-1.5" style="color: var(--muted)">
              {$t.noFreeBeerHint}
            </div>
          {/if}
        </div>

        <!-- Fun comparisons -->
        {#if comparisons.length > 0}
          <div class="col-span-12 bier-card p-4 sm:p-6">
            <div class="eyebrow mb-3.5">{$t.eyebrowFunComparisons}</div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
              {#each comparisons as c (c.label)}
                <div
                  class="p-4 rounded-[10px] flex flex-col gap-1"
                  style={c.highlight
                    ? 'background: var(--amber-600, #d97706); color: #fffdf7; border: 1px solid var(--amber-700, #b45309)'
                    : `background: var(--card); color: var(--ink); border: 1px solid var(--border)`}
                >
                  <div class="text-2xl">{c.emoji}</div>
                  <div class="font-display tabular-nums font-bold text-[22px]">{c.number}</div>
                  <div
                    class="font-mono text-[10px] tracking-wide"
                    style="opacity: {c.highlight ? 0.9 : 0.7}"
                  >
                    {c.label}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Sorten table -->
        <div class="col-span-12 bier-card p-4 sm:p-6">
          <div class="flex justify-between items-center mb-3.5">
            <div>
              <div class="eyebrow">{$t.eyebrowBeverageTable}</div>
              <div class="font-display font-bold text-xl">
                {$t.allVarieties}
              </div>
            </div>
          </div>
          <!-- Mobile: card list -->
          <div class="sm:hidden flex flex-col gap-2">
            {#each sortenEquivs as b (b.name)}
              {@const maxCount = Math.max(...sortenEquivs.map((x) => x.count))}
              {@const pct = maxCount > 0 ? (b.count / maxCount) * 100 : 0}
              {@const isFav = activeFavs.has(b.name)}
              {@const isBotd = beverageOfTheDay?.beverage.name === b.name}
              <div
                class="relative rounded-lg p-3 overflow-hidden"
                style="background: {isBotd
                  ? 'rgba(217, 119, 6, 0.08)'
                  : 'var(--card)'}; border: 1px solid var(--border)"
              >
                <div
                  class="absolute inset-0 pointer-events-none"
                  style="background: linear-gradient(90deg, var(--bar-bg) {pct}%, transparent {pct}%)"
                ></div>
                <div class="relative flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <button class="shrink-0 cursor-pointer" onclick={() => toggleFavorite(b.name)}>
                      <span style="font-size: 14px; opacity: {isFav ? 1 : 0.25}"
                        >{isFav ? '\u2605' : '\u2606'}</span
                      >
                    </button>
                    <span class="shrink-0">{countryFlag(b.country)}</span>
                    <div class="min-w-0">
                      <div
                        class="font-semibold text-amber-950 text-[13px] flex items-center gap-1.5 truncate"
                      >
                        {#if isBotd}
                          <span
                            class="font-mono text-[8px] py-0.5 px-1 rounded font-bold tracking-widest shrink-0"
                            style="background: var(--amber-600, #d97706); color: white">BOTD</span
                          >
                        {/if}
                        <span class="truncate">{b.name}</span>
                        {#if b.note}
                          <NoteBadge note={b.note} variant="icon" />
                        {/if}
                      </div>
                      <div class="font-mono text-[10px]" style="color: var(--muted)">
                        {b.size} · {b.price.toFixed(2)}
                        {b.currency}
                      </div>
                    </div>
                  </div>
                  <div
                    class="font-mono tabular-nums text-right font-bold text-amber-950 text-[15px] shrink-0"
                  >
                    {formatNumber(b.count, $locale)}×
                  </div>
                </div>
              </div>
            {/each}
          </div>
          <!-- Desktop: grid table -->
          <div
            class="hidden sm:grid"
            style="grid-template-columns: auto auto 1fr auto auto auto; font-size: 13px"
          >
            <!-- header -->
            <div class="px-1.5 py-2" style="border-bottom: 1px solid var(--border)"></div>
            <div class="px-1.5 py-2" style="border-bottom: 1px solid var(--border)"></div>
            <div
              class="font-mono px-3 py-2 text-amber-700 text-[10px] tracking-widest"
              style="border-bottom: 1px solid var(--border)"
            >
              NAME
            </div>
            <div
              class="font-mono px-3 py-2 text-amber-700 text-[10px] tracking-widest text-right"
              style="border-bottom: 1px solid var(--border)"
            >
              SIZE
            </div>
            <div
              class="font-mono px-3 py-2 text-amber-700 text-[10px] tracking-widest text-right"
              style="border-bottom: 1px solid var(--border)"
            >
              PRICE
            </div>
            <div
              class="font-mono px-3 py-2 text-amber-700 text-[10px] tracking-widest text-right"
              style="border-bottom: 1px solid var(--border)"
            >
              COUNT
            </div>
            <!-- rows -->
            {#each sortenEquivs as b (b.name)}
              {@const maxCount = Math.max(...sortenEquivs.map((x) => x.count))}
              {@const pct = maxCount > 0 ? (b.count / maxCount) * 100 : 0}
              {@const isFav = activeFavs.has(b.name)}
              {@const isBotd = beverageOfTheDay?.beverage.name === b.name}
              {@const rowBg = isBotd ? 'rgba(217, 119, 6, 0.08)' : 'transparent'}
              <button
                class="px-1.5 py-2.5 text-center cursor-pointer transition-opacity hover:opacity-70"
                style="border-bottom: 1px dashed var(--border); background: {rowBg}; border-left: none; border-right: none; border-top: none"
                onclick={() => toggleFavorite(b.name)}
                title={isFav
                  ? $locale === 'de'
                    ? 'Favorit entfernen'
                    : 'Remove favorite'
                  : $locale === 'de'
                    ? 'Als Favorit markieren'
                    : 'Mark as favorite'}
              >
                <span style="font-size: 14px; opacity: {isFav ? 1 : 0.25}"
                  >{isFav ? '\u2605' : '\u2606'}</span
                >
              </button>
              <div
                class="px-1.5 py-2.5 text-center text-sm"
                style="border-bottom: 1px dashed var(--border); background: {rowBg}"
                title={b.country}
              >
                {countryFlag(b.country)}
              </div>
              <div
                class="px-3 py-2.5 relative"
                style="border-bottom: 1px dashed var(--border); background: {rowBg}"
              >
                <div
                  class="absolute inset-0 pointer-events-none"
                  style="background: linear-gradient(90deg, rgba(252, 211, 77, 0.22) {pct}%, transparent {pct}%)"
                ></div>
                <div class="relative font-semibold text-amber-950 flex items-center gap-2">
                  {#if isBotd}
                    <span
                      class="font-mono text-[9px] py-0.5 px-1.5 rounded font-bold tracking-widest"
                      style="background: var(--amber-600, #d97706); color: white">BOTD</span
                    >
                  {/if}
                  {b.name}
                  {#if b.note}
                    <NoteBadge note={b.note} variant="full" />
                  {/if}
                </div>
              </div>
              <div
                class="font-mono px-3 py-2.5 text-right"
                style="color: var(--muted); border-bottom: 1px dashed var(--border); background: {rowBg}"
              >
                {b.size}
              </div>
              <div
                class="font-mono tabular-nums px-3 py-2.5 text-right text-amber-800"
                style="border-bottom: 1px dashed var(--border); background: {rowBg}"
              >
                {b.price.toFixed(2)}
                {b.currency}
              </div>
              <div
                class="font-mono tabular-nums px-3 py-2.5 text-right font-bold text-amber-950"
                style="border-bottom: 1px dashed var(--border); background: {rowBg}"
              >
                {formatNumber(b.count, $locale)}×
              </div>
            {/each}
          </div>
        </div>
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
          {$t.pricesWrong}<a
            href="https://github.com/sbaerlocher/parqet.beer"
            target="_blank"
            rel="noopener noreferrer"
            class="underline hover:text-amber-700 transition-colors">GitHub</a
          >{$t.pricesWrongSuffix}
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
            class="text-amber-700 no-underline hover:text-amber-900 transition-colors"
            >{$t.privacy}</a
          >
          <a
            href="https://github.com/sbaerlocher/parqet.beer"
            target="_blank"
            rel="noopener noreferrer"
            class="text-amber-700 no-underline hover:text-amber-900 transition-colors">GitHub ↗</a
          >
        </div>
      </div>
    {/if}
  </main>
</div>
