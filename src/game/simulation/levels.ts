import type { ShapeTemplate } from './shapes';
import type { GridPoint, LevelDefinition } from './types';

/** Validate a simple connected graph before shipping it as a puzzle. */
export function hasEulerPath(shape: ShapeTemplate): boolean {
  if (!shape.edges.length || !shape.nodes.length) return false;
  const adjacency = shape.nodes.map(() => new Set<number>());
  for (const [a, b] of shape.edges) {
    if (!Number.isInteger(a) || !Number.isInteger(b) || !adjacency[a] || !adjacency[b] || a === b || adjacency[a].has(b)) return false;
    adjacency[a].add(b);
    adjacency[b].add(a);
  }
  const odd = adjacency.filter(n => n.size % 2).length;
  if (odd !== 0 && odd !== 2) return false;
  const seen = new Set<number>();
  const visit = (node: number) => {
    if (seen.has(node)) return;
    seen.add(node);
    adjacency[node].forEach(visit);
  };
  visit(0);
  return seen.size === shape.nodes.length;
}

export function difficultyScore(level: LevelDefinition): number {
  const degree = level.nodes.map(n => level.edges.filter(e => e.includes(n)).length);
  return degree.reduce((sum, d) => sum + Math.max(0, d - 2) * 10, 0)
    + level.edges.length + (degree.some(d => d % 2) ? 4 : 0);
}

// Normalize rotations and reflections, so mirrored puzzles cannot fill the catalog.
function signature(size: number, edges: Array<[number, number]>): string {
  const variants: string[] = [];
  for (let offset = 0; offset < size; offset++) {
    for (const direction of [1, -1]) {
      variants.push(edges.map(([a, b]) => [a, b]
        .map(i => (i * direction + offset + size) % size).sort((x, y) => x - y).join('-')).sort().join('|'));
    }
  }
  return `${size}:${variants.sort()[0]}`;
}

export function createLevelCatalog(): LevelDefinition[] {
  const candidates: LevelDefinition[] = [];
  const seen = new Set<string>();
  let seed = 20261010;
  const random = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor(seed / 0x100000000 * n);
  };
  for (let attempt = 0; attempt < 4000; attempt++) {
    const size = attempt < 3 ? attempt + 3 : 5 + random(6);
    const nodes: GridPoint[] = Array.from({ length: size }, (_, i) => ({
      row: 2 + 2 * Math.sin(-Math.PI / 2 + i * Math.PI * 2 / size),
      col: 2 + 2 * Math.cos(-Math.PI / 2 + i * Math.PI * 2 / size),
    }));
    const edges: Array<[number, number]> = Array.from({ length: size }, (_, i) => [i, (i + 1) % size]);
    const edgeSet = new Set(edges.map(([a, b]) => [a, b].sort((x, y) => x - y).join('-')));
    const cycles = attempt < 3 ? 0 : 1 + random(4);
    for (let c = 0; c < cycles; c++) {
      // Adding an unused triangle preserves even degree at every vertex.
      for (let retry = 0; retry < 40; retry++) {
        const [a, b, d] = [random(size), random(size), random(size)];
        if (new Set([a, b, d]).size !== 3) continue;
        const triangle: Array<[number, number]> = [[a, b], [b, d], [d, a]];
        if (triangle.some(([x, y]) => edgeSet.has([x, y].sort((u, v) => u - v).join('-')))) continue;
        triangle.forEach(e => { edges.push(e); edgeSet.add([...e].sort((x, y) => x - y).join('-')); });
        break;
      }
    }
    if (attempt >= 3 && edges.length === size) continue;
    if (attempt >= 3 && random(2) === 0) edges.splice(random(edges.length), 1);
    const shape = { name: 'generated', rows: 5, cols: 5, nodes, edges };
    if (!hasEulerPath(shape)) continue;
    const key = signature(size, edges);
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({ id: 0, tierName: '', tierRank: 0, rows: 5, cols: 5, nodes, edges: edges.map(([a, b]) => [nodes[a], nodes[b]]) });
  }
  candidates.sort((a, b) => difficultyScore(a) - difficultyScore(b));
  if (candidates.length < 48) throw new Error('Not enough unique puzzles');
  // Spread the catalog over the complexity range, keeping three gentle tutorials.
  const selected = candidates.slice(0, 3);
  let cursor = 3;
  const low = difficultyScore(candidates[3]);
  const high = difficultyScore(candidates.at(-1)!);
  for (let i = 0; i < 45; i++) {
    const target = low + (high - low) * Math.pow(i / 44, 1.4);
    const lastAllowed = candidates.length - (45 - i);
    let best = cursor;
    for (let j = cursor + 1; j <= lastAllowed; j++) {
      if (Math.abs(difficultyScore(candidates[j]) - target) < Math.abs(difficultyScore(candidates[best]) - target)) best = j;
    }
    cursor = best;
    selected.push(candidates[cursor++]);
  }
  return selected.map((level, i) => ({ ...level, id: i + 1, tierRank: 1 + Math.floor(i / 12), tierName: ['新手', '进阶', '挑战', '大师'][Math.floor(i / 12)] }));
}
