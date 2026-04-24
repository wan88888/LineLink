import { describe, expect, it } from 'vitest';
import { createLevelCatalog, hasEulerPath } from '../src/game/simulation/levels';

describe('level catalog', () => {
  const levels = createLevelCatalog();

  it('produces 48 levels with sequential ids', () => {
    expect(levels).toHaveLength(48);
    levels.forEach((lv, idx) => expect(lv.id).toBe(idx + 1));
  });

  it('assigns one of the four tiers to every level', () => {
    const tiers = new Set(levels.map((l) => l.tierRank));
    expect(tiers).toEqual(new Set([1, 2, 3, 4]));
  });
});

describe('hasEulerPath', () => {
  it('accepts a triangle', () => {
    expect(
      hasEulerPath({
        name: 't',
        rows: 3,
        cols: 3,
        nodes: [
          { row: 0, col: 0 },
          { row: 0, col: 2 },
          { row: 2, col: 1 },
        ],
        edges: [
          [0, 1],
          [1, 2],
          [0, 2],
        ],
      }),
    ).toBe(true);
  });

  it('rejects a graph with 4 odd-degree vertices (K4 minus an edge is ok, but wheel on 4 is not)', () => {
    // Wheel W4: center connected to 4 corners + corners in a 4-cycle → 4 odd-degree corners
    expect(
      hasEulerPath({
        name: 'w4',
        rows: 3,
        cols: 3,
        nodes: [
          { row: 0, col: 0 },
          { row: 0, col: 2 },
          { row: 2, col: 2 },
          { row: 2, col: 0 },
          { row: 1, col: 1 },
        ],
        edges: [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 0],
          [0, 4],
          [1, 4],
          [2, 4],
          [3, 4],
        ],
      }),
    ).toBe(false);
  });
});
