import { describe, expect, it } from 'vitest';
import { OneStrokeSession, edgeKey } from '../src/game/simulation/session';
import type { LevelDefinition } from '../src/game/simulation/types';

const triangle: LevelDefinition = {
  id: 1,
  tierName: 'test',
  tierRank: 1,
  rows: 3,
  cols: 3,
  nodes: [
    { row: 0, col: 0 },
    { row: 0, col: 2 },
    { row: 2, col: 1 },
  ],
  edges: [
    [{ row: 0, col: 0 }, { row: 0, col: 2 }],
    [{ row: 0, col: 2 }, { row: 2, col: 1 }],
    [{ row: 0, col: 0 }, { row: 2, col: 1 }],
  ],
};

describe('OneStrokeSession on a triangle', () => {
  it('wins after traversing all 3 edges', () => {
    const s = new OneStrokeSession(triangle);
    expect(s.extend({ row: 0, col: 0 }).ok).toBe(true);
    expect(s.extend({ row: 0, col: 2 }).ok).toBe(true);
    expect(s.extend({ row: 2, col: 1 }).ok).toBe(true);
    expect(s.snapshot().solved).toBe(false);
    expect(s.extend({ row: 0, col: 0 }).ok).toBe(true);
    expect(s.snapshot().solved).toBe(true);
  });

  it('rejects repeated edges', () => {
    const s = new OneStrokeSession(triangle);
    s.extend({ row: 0, col: 0 });
    s.extend({ row: 0, col: 2 });
    const repeat = s.extend({ row: 0, col: 0 });
    expect(repeat.ok).toBe(false);
  });

  it('undo removes the last edge', () => {
    const s = new OneStrokeSession(triangle);
    s.extend({ row: 0, col: 0 });
    s.extend({ row: 0, col: 2 });
    s.undo();
    expect(s.snapshot().usedEdges).toHaveLength(0);
    expect(s.snapshot().path).toHaveLength(1);
  });

  it('counts attempts as stroke starts', () => {
    const s = new OneStrokeSession(triangle);
    s.extend({ row: 0, col: 0 });
    s.reset();
    s.extend({ row: 0, col: 2 });
    expect(s.snapshot().attempts).toBe(2);
  });
});

describe('edgeKey', () => {
  it('is undirected', () => {
    const a = { row: 0, col: 0 };
    const b = { row: 1, col: 1 };
    expect(edgeKey(a, b)).toBe(edgeKey(b, a));
  });
});

it('counts a fresh attempt after undoing back to an empty path', () => {
  const s = new OneStrokeSession(triangle);
  s.extend(triangle.nodes[0]);
  s.extend(triangle.nodes[1]);
  s.undo();
  s.undo();
  s.extend(triangle.nodes[2]);
  expect(s.snapshot().attempts).toBe(2);
});

it('partial undo remains in the same attempt and solved sessions reject drawing', () => {
  const s = new OneStrokeSession(triangle);
  s.extend(triangle.nodes[0]); s.extend(triangle.nodes[1]); s.undo();
  s.extend(triangle.nodes[1]); s.extend(triangle.nodes[2]); s.extend(triangle.nodes[0]);
  expect(s.snapshot().attempts).toBe(1);
  expect(s.extend(triangle.nodes[1]).ok).toBe(false);
  expect(s.snapshot().solved).toBe(true);
});
