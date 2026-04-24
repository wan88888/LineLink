import type { GridPoint } from './types';

export interface ShapeTemplate {
  name: string;
  rows: number;
  cols: number;
  nodes: GridPoint[];
  edges: Array<[number, number]>;
}

// All shapes below have at most 2 odd-degree vertices, so an Euler path exists.

export const SHAPE_TRIANGLE: ShapeTemplate = {
  name: 'triangle',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 0, col: 0 },
    { row: 0, col: 4 },
    { row: 4, col: 2 },
  ],
  edges: [
    [0, 1],
    [1, 2],
    [0, 2],
  ],
};

export const SHAPE_SQUARE: ShapeTemplate = {
  name: 'square',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 0, col: 0 },
    { row: 0, col: 4 },
    { row: 4, col: 4 },
    { row: 4, col: 0 },
  ],
  edges: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ],
};

export const SHAPE_SQUARE_DIAG: ShapeTemplate = {
  name: 'square-diag',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 0, col: 0 },
    { row: 0, col: 4 },
    { row: 4, col: 4 },
    { row: 4, col: 0 },
  ],
  edges: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [0, 2],
  ],
};

export const SHAPE_PENTAGON: ShapeTemplate = {
  name: 'pentagon',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 0, col: 2 },
    { row: 2, col: 0 },
    { row: 2, col: 4 },
    { row: 4, col: 1 },
    { row: 4, col: 3 },
  ],
  edges: [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 4],
    [3, 4],
  ],
};

export const SHAPE_PENTAGRAM: ShapeTemplate = {
  name: 'pentagram',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 0, col: 2 },
    { row: 2, col: 0 },
    { row: 2, col: 4 },
    { row: 4, col: 1 },
    { row: 4, col: 3 },
  ],
  edges: [
    [0, 3],
    [0, 4],
    [1, 2],
    [1, 4],
    [2, 3],
  ],
};

export const SHAPE_BOWTIE: ShapeTemplate = {
  name: 'bowtie',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 0, col: 0 },
    { row: 4, col: 0 },
    { row: 2, col: 2 },
    { row: 0, col: 4 },
    { row: 4, col: 4 },
  ],
  edges: [
    [0, 1],
    [0, 2],
    [1, 2],
    [2, 3],
    [2, 4],
    [3, 4],
  ],
};

export const SHAPE_HOUSE: ShapeTemplate = {
  name: 'house',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 0, col: 2 },
    { row: 1, col: 0 },
    { row: 1, col: 4 },
    { row: 4, col: 0 },
    { row: 4, col: 4 },
  ],
  edges: [
    [0, 1],
    [0, 2],
    [1, 2],
    [1, 3],
    [2, 4],
    [3, 4],
  ],
};

export const SHAPE_RECTANGLE_DIAG: ShapeTemplate = {
  name: 'rectangle-diag',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 0, col: 0 },
    { row: 0, col: 4 },
    { row: 4, col: 0 },
    { row: 4, col: 4 },
    { row: 2, col: 2 },
  ],
  edges: [
    [0, 1],
    [1, 3],
    [2, 3],
    [0, 2],
    [0, 4],
    [3, 4],
  ],
};

export const SHAPE_SQUARE_X: ShapeTemplate = {
  name: 'square-x',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 0, col: 0 },
    { row: 0, col: 4 },
    { row: 4, col: 0 },
    { row: 4, col: 4 },
    { row: 2, col: 2 },
  ],
  edges: [
    [0, 1],
    [2, 3],
    [0, 4],
    [1, 4],
    [2, 4],
    [3, 4],
  ],
};

export const SHAPE_HOUSE_X: ShapeTemplate = {
  name: 'house-x',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 0, col: 2 },
    { row: 1, col: 0 },
    { row: 1, col: 4 },
    { row: 4, col: 0 },
    { row: 4, col: 4 },
  ],
  edges: [
    [0, 1],
    [0, 2],
    [1, 2],
    [1, 3],
    [2, 4],
    [3, 4],
    [1, 4],
  ],
};

export const SHAPE_ENVELOPE: ShapeTemplate = {
  name: 'envelope',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 1, col: 0 },
    { row: 1, col: 4 },
    { row: 4, col: 0 },
    { row: 4, col: 4 },
    { row: 0, col: 2 },
  ],
  edges: [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
    [0, 4],
    [1, 4],
    [0, 3],
    [1, 2],
  ],
};

export const SHAPE_STAR5: ShapeTemplate = {
  name: 'star5',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 0, col: 2 },
    { row: 2, col: 0 },
    { row: 2, col: 4 },
    { row: 4, col: 1 },
    { row: 4, col: 3 },
  ],
  edges: [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 4],
    [3, 4],
    [0, 3],
    [0, 4],
    [1, 2],
    [1, 4],
    [2, 3],
  ],
};

export const SHAPE_HEXAGON: ShapeTemplate = {
  name: 'hexagon',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 0, col: 1 },
    { row: 0, col: 3 },
    { row: 2, col: 0 },
    { row: 2, col: 4 },
    { row: 4, col: 1 },
    { row: 4, col: 3 },
  ],
  edges: [
    [0, 1],
    [1, 3],
    [3, 5],
    [5, 4],
    [4, 2],
    [2, 0],
  ],
};

export const SHAPE_HEX_FAN: ShapeTemplate = {
  name: 'hex-fan',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 0, col: 1 },
    { row: 0, col: 3 },
    { row: 2, col: 0 },
    { row: 2, col: 4 },
    { row: 4, col: 1 },
    { row: 4, col: 3 },
    { row: 2, col: 2 },
  ],
  edges: [
    [0, 1],
    [1, 3],
    [3, 5],
    [5, 4],
    [4, 2],
    [2, 0],
    [6, 0],
    [6, 5],
  ],
};

export const SHAPE_HEPTAGON: ShapeTemplate = {
  name: 'heptagon',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 0, col: 2 },
    { row: 1, col: 0 },
    { row: 1, col: 4 },
    { row: 3, col: 0 },
    { row: 3, col: 4 },
    { row: 4, col: 1 },
    { row: 4, col: 3 },
  ],
  edges: [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 4],
    [3, 5],
    [4, 6],
    [5, 6],
  ],
};

export const SHAPE_OCTAGON: ShapeTemplate = {
  name: 'octagon',
  rows: 5,
  cols: 5,
  nodes: [
    { row: 0, col: 1 },
    { row: 0, col: 3 },
    { row: 1, col: 0 },
    { row: 1, col: 4 },
    { row: 3, col: 0 },
    { row: 3, col: 4 },
    { row: 4, col: 1 },
    { row: 4, col: 3 },
  ],
  edges: [
    [0, 1],
    [1, 3],
    [3, 5],
    [5, 7],
    [7, 6],
    [6, 4],
    [4, 2],
    [2, 0],
  ],
};
