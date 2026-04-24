import type { LevelRecord, ProgressState } from './types';

const STORAGE_KEY = 'linelink-progress-v2';
const LEGACY_KEY_V1 = 'linelink-progress-v1';
const CURRENT_VERSION = 2;

function emptyRecord(): LevelRecord {
  return { solved: false, bestAttempts: 0, stars: 0 };
}

function sanitize(progress: ProgressState, levelCount: number): ProgressState {
  const records: Record<number, LevelRecord> = {};
  let maxSolved = 0;
  for (let id = 1; id <= levelCount; id += 1) {
    const r = progress.records[id];
    if (r && r.solved) {
      records[id] = {
        solved: true,
        bestAttempts: Math.max(1, Math.floor(r.bestAttempts || 1)),
        stars: (r.stars && r.stars >= 1 && r.stars <= 3 ? r.stars : 1) as 1 | 2 | 3,
      };
      if (id > maxSolved) maxSolved = id;
    }
  }
  const unlocked = Math.max(1, Math.min(levelCount, Math.max(progress.unlockedLevel, maxSolved + 1)));
  return { version: CURRENT_VERSION, unlockedLevel: unlocked, records };
}

function migrateV1(raw: string, levelCount: number): ProgressState | null {
  try {
    const parsed = JSON.parse(raw) as { unlockedLevel?: number; solvedLevels?: number[] };
    if (!parsed || !Array.isArray(parsed.solvedLevels)) return null;
    const records: Record<number, LevelRecord> = {};
    parsed.solvedLevels.forEach((id) => {
      if (Number.isInteger(id) && id >= 1 && id <= levelCount) {
        records[id] = { solved: true, bestAttempts: 1, stars: 1 };
      }
    });
    return sanitize(
      {
        version: CURRENT_VERSION,
        unlockedLevel: parsed.unlockedLevel ?? 1,
        records,
      },
      levelCount,
    );
  } catch {
    return null;
  }
}

export function loadProgress(levelCount: number): ProgressState {
  const fallback: ProgressState = { version: CURRENT_VERSION, unlockedLevel: 1, records: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProgressState>;
      if (parsed && typeof parsed.unlockedLevel === 'number' && parsed.records) {
        return sanitize(
          {
            version: CURRENT_VERSION,
            unlockedLevel: parsed.unlockedLevel,
            records: parsed.records as Record<number, LevelRecord>,
          },
          levelCount,
        );
      }
    }
    const legacy = localStorage.getItem(LEGACY_KEY_V1);
    if (legacy) {
      const migrated = migrateV1(legacy, levelCount);
      if (migrated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function saveProgress(progress: ProgressState, levelCount: number): ProgressState {
  const next = sanitize(progress, levelCount);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
  return next;
}

export function recordSolved(
  progress: ProgressState,
  levelId: number,
  attempts: number,
  levelCount: number,
): ProgressState {
  const stars: 1 | 2 | 3 = attempts <= 1 ? 3 : attempts <= 3 ? 2 : 1;
  const existing = progress.records[levelId] ?? emptyRecord();
  const bestAttempts = existing.bestAttempts > 0 ? Math.min(existing.bestAttempts, attempts) : attempts;
  const bestStars = (Math.max(existing.stars, stars) || stars) as 1 | 2 | 3;
  const nextRecords = {
    ...progress.records,
    [levelId]: { solved: true, bestAttempts, stars: bestStars },
  };
  return saveProgress(
    {
      version: CURRENT_VERSION,
      unlockedLevel: Math.min(levelCount, Math.max(progress.unlockedLevel, levelId + 1)),
      records: nextRecords,
    },
    levelCount,
  );
}

export function isLevelUnlocked(progress: ProgressState, levelId: number): boolean {
  return levelId <= progress.unlockedLevel;
}

export function isLevelSolved(progress: ProgressState, levelId: number): boolean {
  return progress.records[levelId]?.solved === true;
}

export function levelStars(progress: ProgressState, levelId: number): 0 | 1 | 2 | 3 {
  return progress.records[levelId]?.stars ?? 0;
}

export function totalStars(progress: ProgressState): number {
  return Object.values(progress.records).reduce((sum, r) => sum + (r.stars || 0), 0);
}

export function nextUnsolvedLevel(progress: ProgressState, levelCount: number): number | null {
  for (let id = 1; id <= levelCount; id += 1) {
    if (id > progress.unlockedLevel) break;
    if (!isLevelSolved(progress, id)) return id;
  }
  return null;
}
