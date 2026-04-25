// SPDX-License-Identifier: MIT
export type Locale = 'de' | 'en';

export const translations = {
  de: {
    // Landing
    tagline: 'Dein Portfolio in Bier umgerechnet.',
    connectButton: 'Mit Parqet verbinden',
    openDashboardButton: 'Dashboard öffnen',
    readOnly: 'Read-only Zugriff. Wir können nichts an deinem Portfolio ändern.',

    // Dashboard
    logout: 'Abmelden',
    loading: 'Lade Portfolio...',
    loadingMessages: [
      'Dein Bier wird gezapft...',
      'Fass wird angestochen...',
      'Schaum setzt sich...',
      'Bestellung wird zubereitet...',
      'Braumeister rechnet nach...',
      'Bierdeckel wird beschrieben...',
      'Kühlschrank wird geöffnet...',
      'Kronkorken fliegt...',
    ],
    back: 'Zurück',
    yourPortfolio: 'Dein Portfolio',
    allPortfolios: 'Alle Portfolios',
    portfoliosOf: (selected: number, total: number) => `${selected} von ${total} Portfolios`,
    perDay: 'pro Tag',
    perWeek: 'pro Woche',
    perMonth: 'pro Monat',
    perYear: 'pro Jahr',

    // Categories
    beer: 'Bier',
    coffee: 'Kaffee',
    smoothie: 'Smoothie',
    whisky: 'Whisky',

    // Category intros
    catIntroBeer: 'Prost!',
    catIntroCoffee: 'Lieber Kaffee?',
    catIntroSmoothie: 'Oder doch etwas Gesundes?',
    catIntroWhisky: 'Oder lieber ein Dram?',

    // Landing
    heroEyebrow: 'Die einzige Kennzahl, die zählt',
    marketsOpen: 'Märkte offen',
    howItWorks: 'So funktionierts',
    step01Title: 'Parqet verbinden',
    step01Body: 'OAuth 2.0 mit PKCE. Wir bekommen read-only Zugriff — mehr nicht.',
    step02Title: 'Depot wird gezählt',
    step02Body: 'Wert durch Bierpreis. Fertig. Keine Magie, keine Datenkrake.',
    step03Title: 'Bier-Status sichern',
    step03Body: '„Hopfen-Held" auf der Visitenkarte? Nur hier möglich.',
    featureLiveTitle: 'Live-Umrechnung',
    featureLiveBody: (counts: { beer: number; coffee: number; smoothie: number; whisky: number }) =>
      `${counts.beer} Biere, ${counts.coffee} Kaffees, ${counts.smoothie} Smoothies, ${counts.whisky} Whiskys. EUR/CHF in Echtzeit.`,
    featureBadgesTitle: 'Milestone Badges',
    featureBadgesBody: 'Stammgast, Hopfen-Held, Bierkönig. Vom Feierabend zur Legende.',
    featureSecurityTitle: 'Read-only · PKCE',
    featureSecurityBody: 'OAuth 2.0 mit PKCE. Wir sehen nur, was du siehst.',
    privacy: 'Datenschutz',

    // Dashboard eyebrows
    eyebrowPortfolioValue: 'Portfoliowert',
    eyebrowFillLevel: 'Füllstand',
    eyebrowRunRate: 'Laufende Rate',
    eyebrowRankStatus: 'Dein Rang',
    eyebrowBeverageOfDay: 'Getränk des Tages',
    eyebrowFunComparisons: 'Lustige Vergleiche',
    eyebrowBeverageTable: 'Alle Sorten',
    eyebrowLegalDisclaimer: 'Rechtlicher Hinweis',
    eyebrowBeerIndex: 'Bier-Index · Live',

    // Dashboard extras
    asOfNow: 'stand jetzt',
    noRank: 'Noch kein Rang.',
    allVarieties: 'Alle Sorten',
    dividendsFreeBeer: 'Deine Dividenden = Freibier',
    dividendsOnTab: 'auf Kosten deiner Aktien',
    noFreeBeer: 'Noch kein Freibier',
    noFreeBeerHint: 'Sobald Dividenden eintrudeln, gibt\u2019s hier die Rechnung.',
    pricesWrong: 'Preise stimmen nicht? Jeder kann sie auf ',
    pricesWrongSuffix: ' anpassen!',
    shareLabel: 'TEILEN',

    // Components
    units: 'Stück',
    newRecommendation: "Morgen gibt's eine neue Empfehlung",
    yourDividends: 'Deine Dividenden',
    dividendsSubtitle: 'Ausschüttungen der letzten 12 Monate',
    onTheHouse: 'gratis dazu',
    maxLevelReached: 'Höchstes Level erreicht!',

    // Disclaimer
    disclaimer1: 'Ein Spass-Projekt. Keine Anlageberatung. Alle Angaben ohne Gewähr.',
    disclaimer3: 'parqet.beer ist kein offizielles Produkt von Parqet.',

    // Error page
    errorStatusLabel: 'Fehler',
    error404Title: 'Dieses Bier gibt es nicht',
    error404Message: 'Die gesuchte Seite hat sich verflüchtigt wie Schaum.',
    error404Hint: 'Vielleicht ein Tippfehler? Oder die Seite wurde verschoben.',
    error500Title: 'Unser Server braucht ein Bier',
    error500Message: 'Da ist uns das Fass übergeschäumt.',
    error500Hint: 'Wir arbeiten daran. Probier es gleich nochmal.',
    errorBackHome: 'Zurück zur Startseite',
    errorTryAgain: 'Nochmal versuchen',

    // Share
    shareButtonTitle: 'Teilen',
    sharePreview: 'Vorschau',
    sharePreviewAlt: (count: string, beverageName: string) =>
      `Vorschau: ${count} ${beverageName} als Teilen-Bild`,
    shareGenerating: 'Generiere...',
    shareAction: 'Teilen',
    shareCancel: 'Abbrechen',
    shareCardEyebrow: 'PORTFOLIOWERT',
    shareCardDisclaimer: 'Keine Anlageberatung',
    shareTitle: (count: string, beverageName: string, emoji: string) =>
      `${count} ${beverageName} ${emoji} — parqet.beer`,
    shareText: (count: string, beverageName: string, emoji: string) =>
      `Mein Portfolio ist ${count} ${beverageName} wert! ${emoji}`,
    shareError: 'Vorschau konnte nicht erstellt werden. Versuch es nochmal.',
  },
  en: {
    // Landing
    tagline: 'Your portfolio converted into beer.',
    connectButton: 'Connect with Parqet',
    openDashboardButton: 'Open dashboard',
    readOnly: "Read-only access. We can't change anything in your portfolio.",

    // Dashboard
    logout: 'Log out',
    loading: 'Loading portfolio...',
    loadingMessages: [
      'Your beer is being poured...',
      'Tapping the keg...',
      'Letting the foam settle...',
      'Preparing your order...',
      'Brewmaster is calculating...',
      'Scribbling on the beer mat...',
      'Opening the fridge...',
      'Bottle cap is flying...',
    ],
    back: 'Back',
    yourPortfolio: 'Your Portfolio',
    allPortfolios: 'All Portfolios',
    portfoliosOf: (selected: number, total: number) => `${selected} of ${total} portfolios`,
    perDay: 'per day',
    perWeek: 'per week',
    perMonth: 'per month',
    perYear: 'per year',

    // Categories
    beer: 'Beer',
    coffee: 'Coffee',
    smoothie: 'Smoothie',
    whisky: 'Whisky',

    // Category intros
    catIntroBeer: 'Cheers!',
    catIntroCoffee: 'More of a coffee person?',
    catIntroSmoothie: 'Or something healthy?',
    catIntroWhisky: 'Or perhaps a dram?',

    // Landing
    heroEyebrow: 'The only metric that matters',
    marketsOpen: 'markets open',
    howItWorks: 'How it works',
    step01Title: 'Connect Parqet',
    step01Body: 'OAuth 2.0 with PKCE. We get read-only access — nothing more.',
    step02Title: 'Portfolio is counted',
    step02Body: 'Value divided by beer price. Done. No magic, no data mining.',
    step03Title: 'Claim your status',
    step03Body: '"Hops Hero" on the business card? Only here.',
    featureLiveTitle: 'Live conversion',
    featureLiveBody: (counts: { beer: number; coffee: number; smoothie: number; whisky: number }) =>
      `${counts.beer} beers, ${counts.coffee} coffees, ${counts.smoothie} smoothies, ${counts.whisky} whiskies. EUR/CHF in real time.`,
    featureBadgesTitle: 'Milestone badges',
    featureBadgesBody: 'Regular, Hops Hero, Beer Royalty. From after-work to legend.',
    featureSecurityTitle: 'Read-only · PKCE',
    featureSecurityBody: 'OAuth 2.0 with PKCE. We only see what you see.',
    privacy: 'Privacy',

    // Dashboard eyebrows
    eyebrowPortfolioValue: 'Portfolio value',
    eyebrowFillLevel: 'Fill level',
    eyebrowRunRate: 'Run rate',
    eyebrowRankStatus: 'Your rank',
    eyebrowBeverageOfDay: 'Beverage of the day',
    eyebrowFunComparisons: 'Fun comparisons',
    eyebrowBeverageTable: 'All varieties',
    eyebrowLegalDisclaimer: 'Legal disclaimer',
    eyebrowBeerIndex: 'Beer Index · Live',

    // Dashboard extras
    asOfNow: 'as of now',
    noRank: 'No rank yet.',
    allVarieties: 'All varieties',
    dividendsFreeBeer: 'Your dividends = free beer',
    dividendsOnTab: "on your stocks' tab",
    noFreeBeer: 'No free beer yet',
    noFreeBeerHint: 'Once dividends arrive, we\u2019ll post the tab here.',
    pricesWrong: 'Prices wrong? Anyone can update them on ',
    pricesWrongSuffix: '!',
    shareLabel: 'SHARE',

    // Components
    units: 'units',
    newRecommendation: 'New recommendation tomorrow',
    yourDividends: 'Your dividends',
    dividendsSubtitle: 'Distributions over the last 12 months',
    onTheHouse: 'on the house',
    maxLevelReached: 'Max level reached!',

    // Disclaimer
    disclaimer1: 'A fun project. Not financial advice. No guarantees.',
    disclaimer3: 'parqet.beer is not an official Parqet product.',

    // Error page
    errorStatusLabel: 'Error',
    error404Title: 'This beer does not exist',
    error404Message: 'The page you were looking for evaporated like foam.',
    error404Hint: 'Maybe a typo? Or the page has moved.',
    error500Title: 'Our server needs a beer',
    error500Message: 'The keg overflowed on us.',
    error500Hint: 'We are on it. Give it another shot in a moment.',
    errorBackHome: 'Back to home',
    errorTryAgain: 'Try again',

    // Share
    shareButtonTitle: 'Share',
    sharePreview: 'Preview',
    sharePreviewAlt: (count: string, beverageName: string) =>
      `Preview: ${count} ${beverageName} share card`,
    shareGenerating: 'Generating...',
    shareAction: 'Share',
    shareCancel: 'Cancel',
    shareCardEyebrow: 'PORTFOLIO VALUE',
    shareCardDisclaimer: 'Not financial advice',
    shareTitle: (count: string, beverageName: string, emoji: string) =>
      `${count} ${beverageName} ${emoji} — parqet.beer`,
    shareText: (count: string, beverageName: string, emoji: string) =>
      `My portfolio is worth ${count} ${beverageName}! ${emoji}`,
    shareError: 'Preview could not be generated. Please try again.',
  },
} as const;

export type Translations = (typeof translations)[Locale];
