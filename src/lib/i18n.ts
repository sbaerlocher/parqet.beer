export type Locale = 'de' | 'en';

export const translations = {
  de: {
    // Landing
    tagline: 'Dein Portfolio in Bier umgerechnet.',
    landingDescription:
      'Verbinde dein Parqet-Konto und erfahre, wie viele Bier, Kaffee oder Smoothies dein Portfolio wert ist.',
    connectButton: 'Mit Parqet verbinden',
    readOnly: 'Read-only Zugriff. Wir können nichts an deinem Portfolio ändern.',
    funProject: 'Ein Spass-Projekt. Keine Anlageberatung.',

    // Dashboard
    logout: 'Abmelden',
    loading: 'Lade Portfolio...',
    back: 'Zurück',
    yourPortfolio: 'Dein Portfolio',
    allPortfolios: 'Alle Portfolios',
    portfoliosOf: (selected: number, total: number) => `${selected} von ${total} Portfolios`,
    thatsEquivalentTo: 'Das sind',
    allVarieties: (category: string) => `Alle ${category}-Sorten`,
    perDay: 'pro Tag',
    perWeek: 'pro Woche',
    perMonth: 'pro Monat',
    perYear: 'pro Jahr',
    funStatsLabel: (name: string) => `${name} pro Zeiteinheit, ein ganzes Jahr lang`,

    // Categories
    beer: 'Bier',
    coffee: 'Kaffee',
    smoothie: 'Smoothie',

    // Disclaimer
    disclaimer1: 'Ein Spass-Projekt. Keine Anlageberatung. Alle Angaben ohne Gewähr.',
    disclaimer2:
      'Preise basieren auf Supermarkt- und Café-Durchschnittspreisen. Wechselkurse sind Näherungswerte. Preise stimmen nicht? Jeder kann sie auf GitHub anpassen!',
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
    shareCardSubtitle: 'Mein Portfolio umgerechnet',
    shareCardPortfolioValue: (value: string) => `Portfoliowert: ${value}`,
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
    landingDescription:
      'Connect your Parqet account and find out how many beers, coffees or smoothies your portfolio is worth.',
    connectButton: 'Connect with Parqet',
    readOnly: "Read-only access. We can't change anything in your portfolio.",
    funProject: 'A fun project. Not financial advice.',

    // Dashboard
    logout: 'Log out',
    loading: 'Loading portfolio...',
    back: 'Back',
    yourPortfolio: 'Your Portfolio',
    allPortfolios: 'All Portfolios',
    portfoliosOf: (selected: number, total: number) => `${selected} of ${total} portfolios`,
    thatsEquivalentTo: "That's",
    allVarieties: (category: string) => `All ${category} varieties`,
    perDay: 'per day',
    perWeek: 'per week',
    perMonth: 'per month',
    perYear: 'per year',
    funStatsLabel: (name: string) => `${name} per time unit, for a whole year`,

    // Categories
    beer: 'Beer',
    coffee: 'Coffee',
    smoothie: 'Smoothie',

    // Disclaimer
    disclaimer1: 'A fun project. Not financial advice. No guarantees.',
    disclaimer2:
      'Prices based on average supermarket and café prices. Exchange rates are approximations. Prices wrong? Anyone can update them on GitHub!',
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
    shareCardSubtitle: 'My portfolio converted',
    shareCardPortfolioValue: (value: string) => `Portfolio value: ${value}`,
    shareCardDisclaimer: 'Not financial advice',
    shareTitle: (count: string, beverageName: string, emoji: string) =>
      `${count} ${beverageName} ${emoji} — parqet.beer`,
    shareText: (count: string, beverageName: string, emoji: string) =>
      `My portfolio is worth ${count} ${beverageName}! ${emoji}`,
    shareError: 'Preview could not be generated. Please try again.',
  },
} as const;

export type Translations = (typeof translations)[Locale];
