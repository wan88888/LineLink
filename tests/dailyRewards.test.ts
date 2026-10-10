import { describe, expect, it } from 'vitest';
import { AMBER_COST, DAILY_AMOUNTS, DailyRewards, REWARD_KEY, dailyView, localDay } from '../src/game/simulation/dailyRewards';

function fixture() {
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  return { store: new DailyRewards(() => storage), storage, data };
}

describe('daily rewards', () => {
  it('uses local calendar dates across midnight and month boundaries', () => {
    expect(localDay(new Date(2026, 9, 10, 23, 59))).toBe(localDay(new Date(2026, 9, 10, 0, 1)));
    expect(localDay(new Date(2026, 10, 1)) - localDay(new Date(2026, 9, 31))).toBe(1);
  });

  it('claims once per day and survives reloads and stale tabs', () => {
    const { store, storage } = fixture();
    const secondTab = new DailyRewards(() => storage);
    secondTab.read();
    expect(store.claim(100)).toBe(10);
    expect(store.claim(100)).toBe(0);
    expect(secondTab.claim(100)).toBe(0);
    expect(new DailyRewards(() => storage).read().balance).toBe(10);
  });

  it('advances through seven days then starts another reward cycle', () => {
    const { store } = fixture();
    DAILY_AMOUNTS.forEach((amount, index) => expect(store.claim(100 + index)).toBe(amount));
    expect(store.read().balance).toBe(200);
    expect(dailyView(store.read(), 106)).toMatchObject({ claimed: true, day: 7, streak: 7 });
    expect(store.claim(107)).toBe(10);
    expect(dailyView(store.read(), 107)).toMatchObject({ claimed: true, day: 1, streak: 8 });
  });

  it('resets a broken streak without losing balance or unlocks', () => {
    const { store } = fixture();
    store.claim(100); store.claim(101);
    expect(dailyView(store.read(), 103)).toMatchObject({ day: 1, amount: 10, claimed: false });
    expect(store.claim(103)).toBe(10);
    expect(store.read()).toMatchObject({ streak: 1, balance: 35 });
  });

  it('does not grant extra rewards when the device clock moves backwards', () => {
    const { store } = fixture();
    store.claim(100);
    expect(store.claim(99)).toBe(0);
    expect(store.claim(100)).toBe(0);
    expect(store.claim(101)).toBe(15);
  });

  it('requires enough ink, charges a theme only once, and persists selection', () => {
    const { store, storage } = fixture();
    expect(store.selectTheme('amber')).toBe(false);
    for (let day = 100; day < 105; day++) store.claim(day);
    expect(store.read().balance).toBe(AMBER_COST);
    expect(store.selectTheme('amber')).toBe(true);
    expect(store.read()).toMatchObject({ balance: 0, amberUnlocked: true, theme: 'amber' });
    store.selectTheme('mint'); store.selectTheme('amber');
    expect(new DailyRewards(() => storage).read()).toMatchObject({ balance: 0, theme: 'amber' });
  });

  it('keeps same-session rewards and duplicate prevention if storage is unavailable', () => {
    const store = new DailyRewards(() => { throw new Error('blocked'); });
    expect(store.claim(100)).toBe(10);
    expect(store.persistent).toBe(false);
    expect(store.claim(100)).toBe(0);
    expect(store.read().balance).toBe(10);
  });

  it('handles corrupt saves and cannot activate a locked theme from a save', () => {
    const { store, data } = fixture();
    data.set(REWARD_KEY, JSON.stringify({ balance: 0, lastDay: 'bad', streak: -1, theme: 'amber' }));
    expect(store.read()).toMatchObject({ balance: 0, lastDay: null, streak: 0, theme: 'mint' });
    data.set(REWARD_KEY, '{');
    expect(store.claim(100)).toBe(10);
  });
});
