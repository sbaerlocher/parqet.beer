// SPDX-License-Identifier: MIT
import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { translations, type Locale } from '$lib/i18n';

const STORAGE_KEY = 'locale';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function isLocale(value: unknown): value is Locale {
  return value === 'de' || value === 'en';
}

function detectInitialLocale(): Locale {
  // SSR: always start from the default. The root layout calls
  // `initLocale(data.locale)` on mount, so the client immediately reconciles
  // with whatever `event.locals.locale` was on this request.
  if (!browser) return 'de';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;
  const navLang = navigator.language?.toLowerCase() ?? '';
  return navLang.startsWith('de') ? 'de' : 'en';
}

function writeCookie(value: Locale) {
  if (!browser) return;
  // Plain (non-httpOnly) cookie so the client can rotate it. `hooks.server.ts`
  // reads this on the next request to keep SSR HTML in sync.
  document.cookie = `${STORAGE_KEY}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function createLocaleStore() {
  const store = writable<Locale>(detectInitialLocale());
  const { subscribe, set: rawSet } = store;

  function set(value: Locale) {
    if (browser) {
      localStorage.setItem(STORAGE_KEY, value);
      writeCookie(value);
    }
    rawSet(value);
  }

  // Seed the store from SSR-provided data. Idempotent and non-destructive:
  // must never clobber an explicit user choice (localStorage/cookie already
  // set). The layout calls this from `$effect.pre`, which can re-run on
  // subsequent renders — if this wrote the SSR default back unconditionally,
  // it would undo `locale.set(...)` immediately after the user toggled.
  function init(value: Locale | undefined | null) {
    if (!isLocale(value)) return;
    if (get(store) !== value) {
      rawSet(value);
    }
    if (browser && localStorage.getItem(STORAGE_KEY) === null) {
      // First visit with no prior choice — pin the SSR-resolved locale so
      // future SSR requests and the client agree without extra round-trips.
      localStorage.setItem(STORAGE_KEY, value);
      writeCookie(value);
    }
  }

  return {
    subscribe,
    set,
    init,
  };
}

export const locale = createLocaleStore();

export const t = derived(locale, ($locale) => translations[$locale]);
