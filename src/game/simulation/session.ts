import type { AttemptStatus, GridPoint, LevelDefinition, SessionSnapshot } from './types';

export function pointKey(point: GridPoint): string {
  return `${point.row}:${point.col}`;
}

export function edgeKey(left: GridPoint, right: GridPoint): string {
  const l = pointKey(left);
  const r = pointKey(right);
  return l < r ? `${l}|${r}` : `${r}|${l}`;
}

export class OneStrokeSession {
  private readonly level: LevelDefinition;
  private readonly edgeSet = new Set<string>();
  private readonly totalEdges: number;
  private path: GridPoint[] = [];
  private readonly usedEdges: string[] = [];
  private readonly usedEdgeSet = new Set<string>();
  private solved = false;
  private attempts = 0;
  private countedAttempt = false;

  constructor(level: LevelDefinition) {
    this.level = level;
    level.edges.forEach(([left, right]) => {
      this.edgeSet.add(edgeKey(left, right));
    });
    this.totalEdges = this.edgeSet.size;
  }

  getAttempts(): number {
    return this.attempts;
  }

  private startAttemptIfNeeded(): void {
    if (!this.countedAttempt) {
      this.countedAttempt = true;
      this.attempts += 1;
    }
  }

  reset(): void {
    if (this.path.length > 0 && !this.solved) {
      // leaving an unfinished attempt does not count as a new one; next draw will
    }
    this.path = [];
    this.usedEdges.length = 0;
    this.usedEdgeSet.clear();
    this.solved = false;
    this.countedAttempt = false;
  }

  undo(): void {
    if (this.path.length === 0) {
      return;
    }
    const last = this.path.pop();
    const previous = this.path[this.path.length - 1];
    if (last && previous) {
      const key = edgeKey(previous, last);
      this.usedEdgeSet.delete(key);
      const idx = this.usedEdges.lastIndexOf(key);
      if (idx >= 0) {
        this.usedEdges.splice(idx, 1);
      }
    }
    this.solved = false;
  }

  extend(point: GridPoint): AttemptStatus {
    if (!this.isNode(point)) {
      return { ok: false, reason: '只能走到图上的节点。' };
    }

    if (this.path.length === 0) {
      this.startAttemptIfNeeded();
      this.path.push(point);
      return { ok: true };
    }

    const previous = this.path[this.path.length - 1];
    if (previous.row === point.row && previous.col === point.col) {
      return { ok: false };
    }

    const candidate = edgeKey(previous, point);
    if (!this.edgeSet.has(candidate)) {
      return { ok: false, reason: '只能沿着连线走。' };
    }
    if (this.usedEdgeSet.has(candidate)) {
      return { ok: false, reason: '这条线已经走过了。' };
    }

    this.path.push(point);
    this.usedEdges.push(candidate);
    this.usedEdgeSet.add(candidate);

    if (this.usedEdgeSet.size === this.totalEdges) {
      this.solved = true;
    }
    return { ok: true };
  }

  snapshot(): SessionSnapshot {
    return {
      level: this.level,
      path: [...this.path],
      usedEdges: [...this.usedEdges],
      solved: this.solved,
      attempts: this.attempts,
    };
  }

  private isNode(point: GridPoint): boolean {
    return this.level.nodes.some((n) => n.row === point.row && n.col === point.col);
  }
}

export function computeStars(attempts: number): 1 | 2 | 3 {
  if (attempts <= 1) return 3;
  if (attempts <= 3) return 2;
  return 1;
}
