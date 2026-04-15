import type { Beverage, BeverageCategory } from './data/beverages';
import type { Locale } from './i18n';
import badgesData from './data/badges.json';

// --- Beer of the Day ---

const quotesDe: Record<BeverageCategory, string[]> = {
  beer: [
    'Heute empfiehlt der Sommelier:',
    'Das Bier der Stunde:',
    'Dein Portfolio trinkt heute:',
    'Perfekt zum Feierabend:',
    'Der Algorithmus empfiehlt:',
    'Heute auf der Karte:',
    'Chef-Empfehlung:',
    'Passt zu deinem Portfolio:',
  ],
  coffee: [
    'Der Kaffee der Stunde:',
    'Der Barista empfiehlt:',
    'Dein Portfolio brüht heute:',
    'Perfekt für die Pause:',
    'Der Algorithmus empfiehlt:',
    'Heute in der Tasse:',
    'Barista-Empfehlung:',
    'Passt zu deinem Koffein-Level:',
  ],
  smoothie: [
    'Der Smoothie des Tages:',
    'Der Smoothie-Sommelier empfiehlt:',
    'Dein Portfolio mixt heute:',
    'Perfekt für den Vitaminkick:',
    'Der Algorithmus empfiehlt:',
    'Heute im Mixer:',
    'Detox-Empfehlung:',
    'Passt zu deinem Lifestyle:',
  ],
};

const quotesEn: Record<BeverageCategory, string[]> = {
  beer: [
    "Today's pick:",
    'The sommelier recommends:',
    'Your portfolio is drinking:',
    'Perfect for after work:',
    'The algorithm recommends:',
    "Today's special:",
    "Chef's choice:",
    'Pairs well with your portfolio:',
  ],
  coffee: [
    "Today's coffee pick:",
    'The barista recommends:',
    'Your portfolio is brewing:',
    'Perfect for your break:',
    'The algorithm recommends:',
    "Today's cup:",
    "Barista's choice:",
    'Pairs well with your caffeine level:',
  ],
  smoothie: [
    "Today's smoothie pick:",
    'The smoothie sommelier recommends:',
    'Your portfolio is blending:',
    'Perfect for a vitamin boost:',
    'The algorithm recommends:',
    "Today's blend:",
    'Detox pick:',
    'Pairs well with your lifestyle:',
  ],
};

export function getBeverageOfTheDay(
  beverages: Beverage[],
  locale: Locale,
  category: BeverageCategory = 'beer'
): { beverage: Beverage; quote: string } | null {
  if (beverages.length === 0) return null;
  // Days since Unix epoch — monotonically increasing, rolls over at UTC
  // midnight, and matches the bucket used in dashboard/+page.svelte.
  const dayIndex = Math.floor(Date.now() / 86_400_000);

  const beverage = beverages[dayIndex % beverages.length];
  if (!beverage) return null;
  const allQuotes = locale === 'de' ? quotesDe : quotesEn;
  const quotes = allQuotes[category];
  const quote = quotes[dayIndex % quotes.length] ?? '';

  return { beverage, quote };
}

// --- Fun Comparisons ---

export interface FunComparison {
  emoji: string;
  number: string;
  label: string;
  highlight: boolean;
  matched: boolean;
}

export function getFunComparisons(
  count: number,
  category: BeverageCategory,
  locale: Locale
): FunComparison[] {
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      maximumFractionDigits: 2,
    }).format(n);
  const built =
    locale === 'de'
      ? buildComparisonsDe(count, category, fmt)
      : buildComparisonsEn(count, category, fmt);
  return built.filter((c) => c.matched);
}

type Fmt = (n: number) => string;

function buildComparisonsDe(count: number, category: BeverageCategory, fmt: Fmt): FunComparison[] {
  if (category === 'beer') {
    return [
      {
        emoji: '🍻',
        number: fmt(Math.round(count / 6)),
        label: 'Sixpacks',
        highlight: false,
        matched: count >= 6,
      },
      {
        emoji: '🌅',
        number: fmt(Math.round(count / 365)),
        label: 'Jahre Feierabendbier',
        highlight: true,
        matched: count >= 365,
      },
      {
        emoji: '📦',
        number: fmt(Math.round(count / 14)),
        label: 'Kisten (20er)',
        highlight: false,
        matched: count >= 20,
      },
      {
        emoji: '🎪',
        number: `${fmt(Math.round(count / 5000))}x`,
        label: 'Oktoberfest-Budget',
        highlight: true,
        matched: count >= 5000,
      },
      {
        emoji: '🏠',
        number: fmt(Math.round(count / 3)),
        label: 'WG-Partys',
        highlight: false,
        matched: count >= 30,
      },
      {
        emoji: '🕯️',
        number: fmt(Math.round(count / 2)),
        label: 'romantische Dinner',
        highlight: false,
        matched: count >= 10,
      },
      {
        emoji: '🫗',
        number: fmt(Math.round(count * 500)),
        label: 'ml Bier insgesamt',
        highlight: false,
        matched: count >= 10,
      },
    ];
  }
  if (category === 'coffee') {
    return [
      {
        emoji: '🌅',
        number: fmt(Math.round(count / 365)),
        label: 'Jahre Morgenkaffee',
        highlight: true,
        matched: count >= 365,
      },
      {
        emoji: '☕',
        number: fmt(Math.round(count / 1095)),
        label: 'Jahre 3-Tassen-Gewohnheit',
        highlight: false,
        matched: count >= 1095,
      },
      {
        emoji: '🌙',
        number: fmt(Math.round(count / 5)),
        label: 'Nachtschichten Koffein',
        highlight: true,
        matched: count >= 25,
      },
      {
        emoji: '🫘',
        number: fmt(Math.round(count * 7)),
        label: 'Gramm Kaffeebohnen',
        highlight: false,
        matched: count >= 10,
      },
      {
        emoji: '📚',
        number: fmt(Math.round(count / 3)),
        label: 'Bücher beim Kaffee gelesen',
        highlight: false,
        matched: count >= 15,
      },
      {
        emoji: '⏰',
        number: fmt(Math.round(count * 4)),
        label: 'Minuten wach geblieben',
        highlight: false,
        matched: count >= 10,
      },
      {
        emoji: '🍪',
        number: fmt(Math.round(count)),
        label: 'Kekse dazu',
        highlight: false,
        matched: count >= 5,
      },
    ];
  }
  return [
    {
      emoji: '🌱',
      number: fmt(Math.round(count / 365)),
      label: 'Jahre täglicher Vitaminkick',
      highlight: true,
      matched: count >= 365,
    },
    {
      emoji: '🧘',
      number: fmt(Math.round(count / 30)),
      label: 'Monate Detox-Kur',
      highlight: false,
      matched: count >= 30,
    },
    {
      emoji: '🏕️',
      number: fmt(Math.round(count / 10)),
      label: 'Yoga-Retreats',
      highlight: false,
      matched: count >= 50,
    },
    {
      emoji: '🍌',
      number: fmt(Math.round(count * 2)),
      label: 'Bananen gemixt',
      highlight: true,
      matched: count >= 10,
    },
    {
      emoji: '🥬',
      number: fmt(Math.round(count * 3)),
      label: 'Blätter Grünkohl',
      highlight: false,
      matched: count >= 10,
    },
    {
      emoji: '💪',
      number: fmt(Math.round(count / 7)),
      label: 'Wochen Vitaminvorrat',
      highlight: false,
      matched: count >= 14,
    },
    {
      emoji: '🫐',
      number: fmt(Math.round(count * 15)),
      label: 'Blaubeeren verarbeitet',
      highlight: false,
      matched: count >= 5,
    },
  ];
}

function buildComparisonsEn(count: number, category: BeverageCategory, fmt: Fmt): FunComparison[] {
  if (category === 'beer') {
    return [
      {
        emoji: '🍻',
        number: fmt(Math.round(count / 6)),
        label: 'six-packs',
        highlight: false,
        matched: count >= 6,
      },
      {
        emoji: '🌅',
        number: fmt(Math.round(count / 365)),
        label: 'years of after-work beer',
        highlight: true,
        matched: count >= 365,
      },
      {
        emoji: '📦',
        number: fmt(Math.round(count / 24)),
        label: 'cases (24-pack)',
        highlight: false,
        matched: count >= 24,
      },
      {
        emoji: '🎪',
        number: `${fmt(Math.round(count / 5000))}x`,
        label: 'Oktoberfest budget',
        highlight: true,
        matched: count >= 5000,
      },
      {
        emoji: '🏠',
        number: fmt(Math.round(count / 3)),
        label: 'house parties',
        highlight: false,
        matched: count >= 30,
      },
      {
        emoji: '🕯️',
        number: fmt(Math.round(count / 2)),
        label: 'date nights',
        highlight: false,
        matched: count >= 10,
      },
      {
        emoji: '🫗',
        number: fmt(Math.round(count * 500)),
        label: 'ml of beer total',
        highlight: false,
        matched: count >= 10,
      },
    ];
  }
  if (category === 'coffee') {
    return [
      {
        emoji: '🌅',
        number: fmt(Math.round(count / 365)),
        label: 'years of morning coffee',
        highlight: true,
        matched: count >= 365,
      },
      {
        emoji: '☕',
        number: fmt(Math.round(count / 1095)),
        label: 'years of a 3-cup habit',
        highlight: false,
        matched: count >= 1095,
      },
      {
        emoji: '🌙',
        number: fmt(Math.round(count / 5)),
        label: 'all-nighters of caffeine',
        highlight: true,
        matched: count >= 25,
      },
      {
        emoji: '🫘',
        number: fmt(Math.round(count * 7)),
        label: 'grams of coffee beans',
        highlight: false,
        matched: count >= 10,
      },
      {
        emoji: '📚',
        number: fmt(Math.round(count / 3)),
        label: 'books read over coffee',
        highlight: false,
        matched: count >= 15,
      },
      {
        emoji: '⏰',
        number: fmt(Math.round(count * 4)),
        label: 'minutes stayed awake',
        highlight: false,
        matched: count >= 10,
      },
      {
        emoji: '🍪',
        number: fmt(Math.round(count)),
        label: 'cookies on the side',
        highlight: false,
        matched: count >= 5,
      },
    ];
  }
  return [
    {
      emoji: '🌱',
      number: fmt(Math.round(count / 365)),
      label: 'years of daily vitamins',
      highlight: true,
      matched: count >= 365,
    },
    {
      emoji: '🧘',
      number: fmt(Math.round(count / 30)),
      label: 'months of detox',
      highlight: false,
      matched: count >= 30,
    },
    {
      emoji: '🏕️',
      number: fmt(Math.round(count / 10)),
      label: 'yoga retreats',
      highlight: false,
      matched: count >= 50,
    },
    {
      emoji: '🍌',
      number: fmt(Math.round(count * 2)),
      label: 'bananas blended',
      highlight: true,
      matched: count >= 10,
    },
    {
      emoji: '🥬',
      number: fmt(Math.round(count * 3)),
      label: 'leaves of kale',
      highlight: false,
      matched: count >= 10,
    },
    {
      emoji: '💪',
      number: fmt(Math.round(count / 7)),
      label: 'weeks of vitamin supply',
      highlight: false,
      matched: count >= 14,
    },
    {
      emoji: '🫐',
      number: fmt(Math.round(count * 15)),
      label: 'blueberries blended',
      highlight: false,
      matched: count >= 5,
    },
  ];
}

// --- Milestone Badges ---

interface Badge {
  icon: string;
  title: string;
  description: string;
}

interface BadgeEntry extends Badge {
  threshold: number;
}

// Raw merged badge: localized strings live under `title`/`description` keyed
// by locale. `resolveBadge` picks the active locale at lookup time so we can
// ship a single JSON source of truth and still serve both languages.
interface RawBadge {
  threshold: number;
  icon: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}

const rawBadges = badgesData as Record<BeverageCategory, RawBadge[]>;

function resolveBadge(raw: RawBadge, locale: Locale): BadgeEntry {
  return {
    threshold: raw.threshold,
    icon: raw.icon,
    title: raw.title[locale],
    description: raw.description[locale],
  };
}

function resolveCategory(category: BeverageCategory, locale: Locale): BadgeEntry[] {
  return rawBadges[category].map((b) => resolveBadge(b, locale));
}

export function getMilestoneBadge(
  count: number,
  category: BeverageCategory,
  locale: Locale
): BadgeEntry | null {
  const categoryBadges = rawBadges[category];

  // Return the highest matched badge
  for (let i = categoryBadges.length - 1; i >= 0; i--) {
    const badge = categoryBadges[i];
    if (badge && count >= badge.threshold) {
      return resolveBadge(badge, locale);
    }
  }
  return null;
}

export function getAllBadges(category: BeverageCategory, locale: Locale): BadgeEntry[] {
  return resolveCategory(category, locale);
}

export function getNextMilestone(
  count: number,
  category: BeverageCategory,
  locale: Locale
): BadgeEntry | null {
  const categoryBadges = rawBadges[category];

  for (const badge of categoryBadges) {
    if (count < badge.threshold) {
      return resolveBadge(badge, locale);
    }
  }
  return null;
}
