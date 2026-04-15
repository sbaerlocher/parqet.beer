<script lang="ts">
  import { t } from '$lib/stores/locale';
  import { locale } from '$lib/stores/locale';
  import LocaleToggle from '$lib/components/LocaleToggle.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';

  const taglinesDe = [
    'Endlich eine sinnvolle Kennzahl.',
    'Dein Depot in der einzig wahren Währung.',
    'Vergiss KGV — zähl lieber Bier.',
    'Lieber Kaffee? Können wir auch.',
    'Auf Gesundheit? Dann halt Smoothie.',
    'Die wichtigste Zahl in deinem Portfolio.',
    'Bier, Kaffee oder Smoothie — du entscheidest.',
    'Warren Buffett rechnet auch in Bier. Wahrscheinlich.',
    'Dein Portfolio-Sommelier.',
    'Sparplan? Trinkplan!',
  ];

  const taglinesEn = [
    'Finally a meaningful metric.',
    'Your portfolio in the only currency that matters.',
    'Forget P/E ratio — count beers instead.',
    'More of a coffee person? We got you.',
    'Health-conscious? Smoothies it is.',
    'The most important number in your portfolio.',
    'Beer, coffee or smoothie — your call.',
    'Warren Buffett counts in beers too. Probably.',
    'Your portfolio sommelier.',
    'Savings plan? Drinking plan!',
  ];

  let index = $state(0);
  let visible = $state(true);

  const taglines = $derived($locale === 'de' ? taglinesDe : taglinesEn);
  const currentTagline = $derived(taglines[index % taglines.length]);

  $effect(() => {
    const interval = setInterval(() => {
      visible = false;
      setTimeout(() => {
        index = (index + 1) % taglines.length;
        visible = true;
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  });
</script>

<div class="min-h-screen bg-amber-50 flex flex-col items-center px-4 py-16">
  <div class="absolute top-4 right-4 flex items-center gap-2">
    <ThemeToggle />
    <LocaleToggle />
  </div>

  <div class="max-w-lg text-center flex-1 flex flex-col justify-center">
    <h1 class="text-6xl font-bold text-amber-900 mb-3">🍺 parqet.beer</h1>

    <div
      class="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-800 text-xs font-medium px-3 py-1 rounded-full mb-4"
    >
      <span>🍻</span>
      <span
        >{$locale === 'de'
          ? 'Ein Community-Spassprojekt — nicht von Parqet'
          : 'A community fun project — not by Parqet'}</span
      >
    </div>

    <p
      class="text-xl text-amber-700 mb-2 h-8 transition-all duration-300 {visible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 -translate-y-2'}"
    >
      {currentTagline}
    </p>

    <p class="text-amber-600 mb-8">{$t.landingDescription}</p>

    <a href="/api/auth/login" class="connect-with-parqet connect-with-parqet--xl">
      <img
        src="https://developer.parqet.com/img/parqet-icon-trans.svg"
        alt=""
        aria-hidden="true"
        class="connect-with-parqet__icon"
      />
      {$t.connectButton}
    </a>

    <p class="text-sm text-amber-500 mt-6">{$t.readOnly}</p>

    <div
      class="mt-8 p-4 bg-white/60 border border-amber-200 rounded-xl text-left text-xs text-amber-700 space-y-2"
    >
      <p class="font-semibold text-amber-800">
        {$locale === 'de' ? 'Rechtlicher Hinweis' : 'Legal notice'}
      </p>
      <p>
        {$locale === 'de'
          ? 'Dieses Projekt ist ein unabhängiges, community-getriebenes Tool. Es steht in keiner geschäftlichen, rechtlichen oder sonstigen offiziellen Beziehung zu den nachfolgend genannten Unternehmen und wird von ihnen weder unterstützt, gesponsert, autorisiert noch in anderer Weise gefördert:'
          : 'This project is an independent, community-driven tool. It is not affiliated with, endorsed, sponsored, or authorized by any of the entities listed below, nor is there any commercial, legal, or other official relationship:'}
      </p>
      <ul class="list-disc list-inside space-y-0.5 text-amber-600">
        <li>
          {$locale === 'de'
            ? 'der Parqet Fintech GmbH oder deren Tochtergesellschaften'
            : 'Parqet Fintech GmbH or any of its subsidiaries'}
        </li>
        <li>
          {$locale === 'de'
            ? 'den genannten Brauereien, Cafés oder Getränkemarken'
            : 'any of the mentioned breweries, cafés or beverage brands'}
        </li>
      </ul>
      <p class="text-amber-500">
        {$locale === 'de'
          ? 'Alle genannten Marken-, Produkt- und Firmennamen sind Eigentum ihrer jeweiligen Inhaber. Ihre Nennung erfolgt ausschliesslich zu beschreibenden und illustrativen Zwecken (nominative Nutzung) und begründet keine geschäftliche Verbindung.'
          : 'All trademarks, product names, and company names are the property of their respective owners. Their mention is solely for descriptive and illustrative purposes (nominative fair use) and does not imply any commercial affiliation.'}
      </p>
    </div>
  </div>

  <footer class="mt-12 text-center text-xs text-amber-400 space-y-1 px-4">
    <p>{$t.disclaimer1}</p>
    <p>{$t.disclaimer2}</p>
    <p>{$t.disclaimer3}</p>
    <div class="flex items-center justify-center gap-3 pt-1 text-amber-300">
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
</div>

<style>
  .connect-with-parqet {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    background-color: #009991;
    color: white;
    text-decoration: none;
    cursor: pointer;
    font-weight: 600;
    white-space: nowrap;
    border-radius: 0.375rem;
    border: none;
    transition: background-color 0.15s;
  }

  .connect-with-parqet:hover {
    background-color: #5bcec2;
  }

  .connect-with-parqet:focus-visible {
    outline: 2px solid #009991;
    outline-offset: 2px;
  }

  .connect-with-parqet--xl {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
  }

  .connect-with-parqet__icon {
    width: 1.6em;
    height: 1.6em;
    margin-block: -0.25em;
    flex-shrink: 0;
  }
</style>
