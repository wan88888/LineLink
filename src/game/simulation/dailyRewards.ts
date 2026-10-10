export const REWARD_KEY = 'linelink-daily-v1';
export const DAILY_AMOUNTS = [10, 15, 20, 25, 30, 40, 60] as const;
export const AMBER_COST = 100;

export interface DailyState {
  lastDay: number | null;
  streak: number;
  balance: number;
  amberUnlocked: boolean;
  theme: 'mint' | 'amber';
}

export function localDay(date = new Date()): number {
  // Calendar days, not elapsed 24-hour periods, also work across DST changes.
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

export function dailyView(state: DailyState, today = localDay()) {
  const claimed = state.lastDay !== null && state.lastDay >= today;
  const streak = claimed ? state.streak : state.lastDay === today - 1 ? state.streak + 1 : 1;
  const day = (Math.max(1, streak) - 1) % DAILY_AMOUNTS.length + 1;
  return { claimed, day, amount: DAILY_AMOUNTS[day - 1], streak };
}

const emptyState = (): DailyState => ({ lastDay: null, streak: 0, balance: 0, amberUnlocked: false, theme: 'mint' });
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

export class DailyRewards {
  private state = emptyState();
  private readonly storage: () => StoragePort;
  persistent = true;

  constructor(storage: () => StoragePort = () => localStorage) {
    this.storage = storage;
  }

  read(): DailyState {
    if (!this.persistent) return { ...this.state };
    try {
      const raw = this.storage().getItem(REWARD_KEY);
      const value = raw ? JSON.parse(raw) : null;
      this.state = emptyState();
      if (value && Number.isSafeInteger(value.balance) && value.balance >= 0) {
        const validClaim = Number.isSafeInteger(value.lastDay) && value.lastDay >= 0
          && Number.isSafeInteger(value.streak) && value.streak > 0;
        this.state = {
          lastDay: validClaim ? value.lastDay : null,
          streak: validClaim ? value.streak : 0,
          balance: value.balance,
          amberUnlocked: value.amberUnlocked === true,
          theme: value.amberUnlocked === true && value.theme === 'amber' ? 'amber' : 'mint',
        };
      }
    } catch {
      // Malformed saves and unavailable storage must not block the game.
      this.persistent = false;
    }
    return { ...this.state };
  }

  private save(state: DailyState): void {
    this.state = state;
    try { this.storage().setItem(REWARD_KEY, JSON.stringify(state)); }
    catch { this.persistent = false; }
  }

  claim(today = localDay()): number {
    const state = this.read();
    const view = dailyView(state, today);
    if (view.claimed) return 0;
    this.save({ ...state, lastDay: today, streak: view.streak, balance: state.balance + view.amount });
    return view.amount;
  }

  selectTheme(theme: DailyState['theme']): boolean {
    const state = this.read();
    if (theme === 'amber' && !state.amberUnlocked) {
      if (state.balance < AMBER_COST) return false;
      state.balance -= AMBER_COST;
      state.amberUnlocked = true;
    }
    this.save({ ...state, theme });
    return true;
  }
}
