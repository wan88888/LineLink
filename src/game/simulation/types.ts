export interface GridPoint {
  row: number;
  col: number;
}

export interface LevelDefinition {
  id: number;
  tierName: string;
  tierRank: number;
  rows: number;
  cols: number;
  nodes: GridPoint[];
  edges: Array<[GridPoint, GridPoint]>;
}

export interface AttemptStatus {
  ok: boolean;
  reason?: string;
}

export interface SessionSnapshot {
  level: LevelDefinition;
  path: GridPoint[];
  usedEdges: string[]; // edge keys already drawn, in draw order
  solved: boolean;
  attempts: number;
}

export interface LevelRecord {
  solved: boolean;
  bestAttempts: number; // min attempts to solve; 0 = unsolved
  stars: 0 | 1 | 2 | 3;
}

export interface ProgressState {
  version: number;
  unlockedLevel: number;
  records: Record<number, LevelRecord>;
}
