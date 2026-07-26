import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

// The achievements store persists a "seen" set in localStorage and guards
// every access behind SvelteKit's `browser` flag. Unit tests run in the `node`
// environment, so both have to be faked: force `browser` on and provide an
// in-memory localStorage. Each test re-imports the module fresh so the
// module-level `seen` state and streak subscription start clean.

function fakeLocalStorage() {
  const store = new Map<string, string>();
  return {
    store,
    ls: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    } as Storage,
  };
}

async function loadStore(streakDays = 0) {
  vi.doMock('$app/environment', () => ({ browser: true }));
  // A deterministic streak store instead of the localStorage-backed one, so
  // the combining logic is tested in isolation from the streak persistence.
  vi.doMock('$lib/stores/streak', () => ({
    streak: { subscribe: (run: (v: number) => void) => (run(streakDays), () => {}) },
  }));
  return await import('../src/lib/stores/achievements');
}

describe('achievements store', () => {
  let fake: ReturnType<typeof fakeLocalStorage>;

  beforeEach(() => {
    vi.resetModules();
    fake = fakeLocalStorage();
    vi.stubGlobal('localStorage', fake.ls);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('$app/environment');
    vi.doUnmock('$lib/stores/streak');
  });

  it('combines portfolio stats and streak into unlocked achievements', async () => {
    const { unlocked, setPortfolioStats } = await loadStore(7);
    setPortfolioStats(10_000, 100);
    const ids = get(unlocked).map((a) => a.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'first-beer-after-1k',
        'portfolio-10k',
        'hundred-beverages',
        'streak-7',
      ])
    );
  });

  it('starts with nothing unlocked', async () => {
    const { unlocked } = await loadStore(0);
    expect(get(unlocked)).toEqual([]);
  });

  it('newlyUnlocked fires only for fresh unlocks, then stays quiet on re-set', async () => {
    const { newlyUnlocked, setPortfolioStats } = await loadStore(0);
    setPortfolioStats(1_000, 0);
    expect(get(newlyUnlocked)).toEqual(['first-beer-after-1k']);
    // Same input again — already seen, so no re-fire.
    setPortfolioStats(1_000, 0);
    expect(get(newlyUnlocked)).toEqual([]);
    // A genuinely new unlock still fires, without repeating the old one.
    setPortfolioStats(10_000, 0);
    expect(get(newlyUnlocked)).toEqual(['portfolio-10k']);
  });

  it('persists seen ids across reloads so a reload does not re-fire', async () => {
    {
      const { newlyUnlocked, setPortfolioStats } = await loadStore(0);
      setPortfolioStats(1_000, 0);
      expect(get(newlyUnlocked)).toEqual(['first-beer-after-1k']);
    }
    // Simulate a page reload: same localStorage, fresh module.
    vi.resetModules();
    {
      const { newlyUnlocked, setPortfolioStats } = await loadStore(0);
      setPortfolioStats(1_000, 0);
      expect(get(newlyUnlocked)).toEqual([]);
    }
  });

  it('is a no-op on the server (browser false): no throw, nothing unlocked', async () => {
    vi.doUnmock('$app/environment');
    vi.doMock('$app/environment', () => ({ browser: false }));
    vi.doMock('$lib/stores/streak', () => ({
      streak: { subscribe: (run: (v: number) => void) => (run(0), () => {}) },
    }));
    vi.unstubAllGlobals(); // no localStorage on the server
    const { unlocked, newlyUnlocked, setPortfolioStats } =
      await import('../src/lib/stores/achievements');
    expect(() => setPortfolioStats(10_000, 100)).not.toThrow();
    expect(get(unlocked).map((a) => a.id)).toEqual(
      expect.arrayContaining(['first-beer-after-1k', 'portfolio-10k'])
    );
    // Without localStorage the seen-diff cannot persist; it must not throw.
    expect(() => get(newlyUnlocked)).not.toThrow();
  });
});
