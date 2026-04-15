import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

function createThemeStore() {
  const initial: Theme = browser
    ? (localStorage.getItem('theme') as Theme) ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : 'light';

  const store = writable<Theme>(initial);

  function apply(theme: Theme) {
    if (!browser) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }

  if (browser) apply(initial);

  return {
    subscribe: store.subscribe,
    set: (theme: Theme) => {
      apply(theme);
      store.set(theme);
    },
    // `get(store)` reads the current value without subscribing — the previous
    // `subscribe(cb)()` pattern re-entered `set` from inside a subscription
    // callback, which triggered the same callback again with the new value
    // and flipped the theme right back.
    toggle: () => {
      const next: Theme = get(store) === 'dark' ? 'light' : 'dark';
      apply(next);
      store.set(next);
    },
  };
}

export const theme = createThemeStore();
