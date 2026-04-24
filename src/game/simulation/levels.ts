import {
  SHAPE_BOWTIE,
  SHAPE_ENVELOPE,
  SHAPE_HEPTAGON,
  SHAPE_HEXAGON,
  SHAPE_HEX_FAN,
  SHAPE_HOUSE,
  SHAPE_HOUSE_X,
  SHAPE_OCTAGON,
  SHAPE_PENTAGON,
  SHAPE_PENTAGRAM,
  SHAPE_RECTANGLE_DIAG,
  SHAPE_SQUARE,
  SHAPE_SQUARE_DIAG,
  SHAPE_SQUARE_X,
  SHAPE_STAR5,
  SHAPE_TRIANGLE,
  type ShapeTemplate,
} from './shapes';
import type { GridPoint, LevelDefinition } from './types';

interface TierConfig {
  tierName: string;
  tierRank: number;
  shapes: ShapeTemplate[];
}

const TIERS: TierConfig[] = [
  {
    tierName: '新手',
    tierRank: 1,
    shapes: [SHAPE_TRIANGLE, SHAPE_SQUARE, SHAPE_PENTAGON, SHAPE_SQUARE_DIAG],
  },
  {
    tierName: '进阶',
    tierRank: 2,
    shapes: [SHAPE_PENTAGRAM, SHAPE_BOWTIE, SHAPE_HOUSE, SHAPE_RECTANGLE_DIAG],
  },
  {
    tierName: '挑战',
    tierRank: 3,
    shapes: [SHAPE_SQUARE_X, SHAPE_HEXAGON, SHAPE_HOUSE_X, SHAPE_HEX_FAN],
  },
  {
    tierName: '大师',
    tierRank: 4,
    shapes: [SHAPE_ENVELOPE, SHAPE_HEPTAGON, SHAPE_OCTAGON, SHAPE_STAR5],
  },
];

const LEVELS_PER_TIER = 12;
const SHAPES_PER_TIER = 4;

type Variant = 0 | 1 | 2;

function transformPoint(point: GridPoint, rows: number, cols: number, variant: Variant): GridPoint {
  switch (variant) {
    case 1:
      return { row: point.row, col: cols - 1 - point.col };
    case 2:
      return { row: rows - 1 - point.row, col: point.col };
    default:
      return { row: point.row, col: point.col };
  }
}

/** Returns true if the (connected) graph has an Euler path or circuit. */
export function hasEulerPath(shape: ShapeTemplate): boolean {
  const degrees = new Array(shape.nodes.length).fill(0);
  shape.edges.forEach(([a, b]) => {
    degrees[a] += 1;
    degrees[b] += 1;
  });
  const oddCount = degrees.filter((d) => d % 2 === 1).length;
  if (oddCount !== 0 && oddCount !== 2) return false;

  // connectivity over nodes that have at least one edge
  const adj = new Map<number, number[]>();
  shape.edges.forEach(([a, b]) => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  });
  if (adj.size === 0) return false;
  const start = adj.keys().next().value as number;
  const seen = new Set<number>([start]);
  const stack = [start];
  while (stack.length) {
    const u = stack.pop()!;
    (adj.get(u) || []).forEach((v) => {
      if (!seen.has(v)) {
        seen.add(v);
        stack.push(v);
      }
    });
  }
  return seen.size === adj.size;
}

function buildLevel(id: number, tier: TierConfig, localIndex: number): LevelDefinition {
  const shapeIndex = localIndex % SHAPES_PER_TIER;
  const variant = Math.floor(localIndex / SHAPES_PER_TIER) as Variant;
  const shape = tier.shapes[shapeIndex];
  const nodes = shape.nodes.map((n) => transformPoint(n, shape.rows, shape.cols, variant));
  return {
    id,
    tierName: tier.tierName,
    tierRank: tier.tierRank,
    rows: shape.rows,
    cols: shape.cols,
    nodes,
    edges: shape.edges.map(([a, b]) => [nodes[a], nodes[b]]),
  };
}

export function createLevelCatalog(): LevelDefinition[] {
  // fail-fast: any shape that can't be solved is a bug.
  TIERS.forEach((tier) =>
    tier.shapes.forEach((s) => {
      if (!hasEulerPath(s)) {
        throw new Error(`Shape "${s.name}" has no Euler path — remove or fix its edges.`);
      }
    }),
  );

  const levels: LevelDefinition[] = [];
  let id = 1;
  TIERS.forEach((tier) => {
    for (let i = 0; i < LEVELS_PER_TIER; i += 1) {
      levels.push(buildLevel(id, tier, i));
      id += 1;
    }
  });
  return levels;
}
