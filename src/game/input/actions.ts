export const INPUT_ACTIONS = {
  drawStart: 'draw-start',
  drawExtend: 'draw-extend',
  undo: 'undo',
  reset: 'reset',
} as const;

export type InputAction = (typeof INPUT_ACTIONS)[keyof typeof INPUT_ACTIONS];
