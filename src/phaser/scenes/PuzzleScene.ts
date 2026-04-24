import Phaser from 'phaser';

import { OneStrokeSession } from '../../game/simulation/session';
import type { GridPoint, LevelDefinition } from '../../game/simulation/types';
import { SceneBridge } from '../adapters/sceneBridge';

interface BoardLayout {
  cellSize: number;
  tokenRadius: number;
  originX: number;
  originY: number;
}

interface TokenVisual {
  circle: Phaser.GameObjects.Arc;
}

function pointKey(point: GridPoint): string {
  return `${point.row}:${point.col}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class PuzzleScene extends Phaser.Scene {
  private readonly bridge: SceneBridge;

  private staticGraphics!: Phaser.GameObjects.Graphics;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private previewGraphics!: Phaser.GameObjects.Graphics;

  private level: LevelDefinition | null = null;
  private session: OneStrokeSession | null = null;
  private layout: BoardLayout | null = null;
  private activeCells = new Set<string>();

  private tokenVisuals = new Map<string, TokenVisual>();
  private neighborMap = new Map<string, GridPoint[]>();
  private overlayObjects: Phaser.GameObjects.GameObject[] = [];
  private drawSessionActive = false;
  private lastToastAt = 0;

  constructor(bridge: SceneBridge) {
    super('PuzzleScene');
    this.bridge = bridge;
  }

  create(): void {
    this.staticGraphics = this.add.graphics();
    this.pathGraphics = this.add.graphics();
    this.previewGraphics = this.add.graphics();

    this.bridge.attachSceneHandlers({
      loadLevel: (level) => this.loadLevel(level),
      reset: () => this.resetLevel(),
      undo: () => this.undoStep(),
    });

    this.scale.on('resize', () => {
      if (this.level) {
        this.renderLevel();
      }
    });

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);

    this.renderIdleState();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.level || !this.session) {
      return;
    }

    const snapshot = this.session.snapshot();
    if (snapshot.path.length > 0) {
      const last = snapshot.path[snapshot.path.length - 1];
      const lastPos = this.pointToPosition(last);
      const distanceToLast = Phaser.Math.Distance.Between(pointer.x, pointer.y, lastPos.x, lastPos.y);
      const nearest = this.pointFromPointer(pointer);
      const isOnLast = nearest && nearest.row === last.row && nearest.col === last.col;
      if (!isOnLast && distanceToLast > (this.layout?.tokenRadius ?? 0) * 2) {
        this.session.reset();
        this.updateRenderingFromSession(this.session.snapshot());
        this.bridge.emitSnapshot(this.session.snapshot());
      }
    }

    this.drawSessionActive = true;
    this.tryExtendPath(pointer);
    this.updatePreviewLine(pointer);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.drawSessionActive || !pointer.isDown || !this.level || !this.session) {
      return;
    }

    this.tryExtendPath(pointer);
    this.updatePreviewLine(pointer);
  }

  private handlePointerUp(): void {
    if (!this.level || !this.session) {
      return;
    }

    this.drawSessionActive = false;
    this.previewGraphics.clear();
  }

  private updatePreviewLine(pointer: Phaser.Input.Pointer): void {
    if (!this.session || !this.layout) {
      return;
    }
    this.previewGraphics.clear();
    const snapshot = this.session.snapshot();
    const last = snapshot.path[snapshot.path.length - 1];
    if (!last) {
      return;
    }
    const start = this.pointToPosition(last);
    const width = Math.max(4, this.layout.tokenRadius * 0.46);
    this.previewGraphics.lineStyle(width, 0x277767, 0.45);
    this.previewGraphics.lineBetween(start.x, start.y, pointer.x, pointer.y);
  }

  private tryExtendPath(pointer: Phaser.Input.Pointer): void {
    if (!this.level || !this.session || !this.layout) {
      return;
    }

    const point = this.pointFromPointer(pointer);
    if (!point) {
      return;
    }

    const snapshot = this.session.snapshot();
    const lastPoint = snapshot.path[snapshot.path.length - 1];

    if (lastPoint && lastPoint.row === point.row && lastPoint.col === point.col) {
      return;
    }

    const result = this.session.extend(point);
    if (!result.ok) {
      if (result.reason) {
        this.emitThrottledToast(result.reason);
      }
      return;
    }

    const nextSnapshot = this.session.snapshot();
    this.updateRenderingFromSession(nextSnapshot);
    this.bridge.emitSnapshot(nextSnapshot);

    if (nextSnapshot.solved) {
      this.pathSolvedFx();
      this.bridge.emitToast('过关！一笔走完所有线条。', 'success');
      this.bridge.emitSolved(nextSnapshot);
    }
  }

  private emitThrottledToast(message: string): void {
    const now = performance.now();
    if (now - this.lastToastAt < 500) {
      return;
    }

    this.lastToastAt = now;
    this.bridge.emitToast(message, 'warn');
  }

  private loadLevel(level: LevelDefinition): void {
    this.level = level;
    this.session = new OneStrokeSession(level);
    this.activeCells = new Set<string>();
    this.neighborMap = new Map<string, GridPoint[]>();

    level.nodes.forEach((node) => {
      this.activeCells.add(pointKey(node));
    });

    level.edges.forEach(([left, right]) => {
      const leftKey = pointKey(left);
      const rightKey = pointKey(right);

      const leftNeighbors = this.neighborMap.get(leftKey) ?? [];
      leftNeighbors.push({ row: right.row, col: right.col });
      this.neighborMap.set(leftKey, leftNeighbors);

      const rightNeighbors = this.neighborMap.get(rightKey) ?? [];
      rightNeighbors.push({ row: left.row, col: left.col });
      this.neighborMap.set(rightKey, rightNeighbors);
    });

    this.renderLevel();

    if (this.session) {
      this.bridge.emitSnapshot(this.session.snapshot());
    }
  }

  private resetLevel(): void {
    if (!this.session) {
      return;
    }

    this.session.reset();
    const snapshot = this.session.snapshot();
    this.updateRenderingFromSession(snapshot);
    this.bridge.emitSnapshot(snapshot);
  }

  private undoStep(): void {
    if (!this.session) {
      return;
    }

    this.session.undo();
    const snapshot = this.session.snapshot();
    this.updateRenderingFromSession(snapshot);
    this.bridge.emitSnapshot(snapshot);
  }

  private renderIdleState(): void {
    this.cameras.main.setBackgroundColor('#ecf8f4');
    this.staticGraphics.clear();
    this.pathGraphics.clear();
    this.previewGraphics.clear();
    this.clearTokenVisuals();
    this.clearOverlayObjects();

    this.staticGraphics.fillStyle(0xffffff, 0.55);
    this.staticGraphics.fillRoundedRect(
      this.scale.width * 0.1,
      this.scale.height * 0.3,
      this.scale.width * 0.8,
      this.scale.height * 0.32,
      28,
    );

    const title = this.add
      .text(this.scale.width / 2, this.scale.height * 0.4, '从关卡页选择一个关卡', {
        fontFamily: '"Noto Sans SC", "Trebuchet MS", sans-serif',
        fontSize: `${Math.round(this.scale.width * 0.055)}px`,
        color: '#18584a',
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(this.scale.width / 2, this.scale.height * 0.47, '一笔连通全部节点', {
        fontFamily: '"Noto Sans SC", "Trebuchet MS", sans-serif',
        fontSize: `${Math.round(this.scale.width * 0.037)}px`,
        color: '#3a7468',
      })
      .setOrigin(0.5);

    this.overlayObjects.push(title, subtitle);
  }

  private clearTokenVisuals(): void {
    this.tokenVisuals.forEach((visual) => {
      visual.circle.destroy();
    });
    this.tokenVisuals.clear();
  }

  private clearOverlayObjects(): void {
    this.overlayObjects.forEach((object) => {
      object.destroy();
    });
    this.overlayObjects = [];
  }

  private renderLevel(): void {
    if (!this.level || !this.session) {
      return;
    }

    this.cameras.main.setBackgroundColor('#ecf8f4');

    const { rows, cols } = this.level;
    const usableWidth = this.scale.width * 0.86;
    const usableHeight = this.scale.height * 0.78;

    const cellSize = Math.min(
      usableWidth / Math.max(1, cols - 1),
      usableHeight / Math.max(1, rows - 1),
    );

    const boardWidth = cellSize * (cols - 1);
    const boardHeight = cellSize * (rows - 1);

    this.layout = {
      cellSize,
      tokenRadius: clamp(cellSize * 0.12, 10, 22),
      originX: (this.scale.width - boardWidth) / 2,
      originY: (this.scale.height - boardHeight) / 2,
    };

    this.staticGraphics.clear();
    this.pathGraphics.clear();
    this.previewGraphics.clear();
    this.clearTokenVisuals();
    this.clearOverlayObjects();

    // base (unvisited) edges
    this.staticGraphics.lineStyle(Math.max(3, this.layout.tokenRadius * 0.34), 0xcfe3dc, 1);

    this.level.edges.forEach(([left, right]) => {
      const leftCenter = this.pointToPosition(left);
      const rightCenter = this.pointToPosition(right);
      this.staticGraphics.lineBetween(leftCenter.x, leftCenter.y, rightCenter.x, rightCenter.y);
    });

    this.level.nodes.forEach((point) => {
      const center = this.pointToPosition(point);
      const radius = this.layout!.tokenRadius;
      const circle = this.add
        .circle(center.x, center.y, radius, 0x2f7d6b, 1)
        .setStrokeStyle(0, 0x000000, 0);
      this.tokenVisuals.set(pointKey(point), { circle });
    });

    this.updateRenderingFromSession(this.session?.snapshot() ?? null);
  }

  private updateRenderingFromSession(snapshot: ReturnType<OneStrokeSession['snapshot']> | null): void {
    this.pathGraphics.clear();

    if (!this.layout || !snapshot) {
      return;
    }

    const pathWidth = Math.max(6, this.layout.tokenRadius * 0.64);
    this.pathGraphics.lineStyle(pathWidth, 0x25a16a, 1);

    const { path } = snapshot;
    if (path.length > 1) {
      for (let index = 0; index < path.length - 1; index += 1) {
        const current = this.pointToPosition(path[index]);
        const next = this.pointToPosition(path[index + 1]);
        this.pathGraphics.lineBetween(current.x, current.y, next.x, next.y);
      }
    }

    const visited = new Set(path.map((point) => pointKey(point)));
    this.tokenVisuals.forEach((visual, key) => {
      if (visited.has(key)) {
        visual.circle.setFillStyle(0x25a16a, 1);
        this.pulseNode(visual.circle);
      } else {
        visual.circle.setFillStyle(0x2f7d6b, 1);
      }
    });
  }

  private pulseNode(circle: Phaser.GameObjects.Arc): void {
    if ((circle as unknown as { __pulsing?: boolean }).__pulsing) return;
    (circle as unknown as { __pulsing?: boolean }).__pulsing = true;
    this.tweens.add({
      targets: circle,
      scale: 1.22,
      duration: 110,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        circle.setScale(1);
        (circle as unknown as { __pulsing?: boolean }).__pulsing = false;
      },
    });
  }

  private pathSolvedFx(): void {
    this.tweens.add({
      targets: this.pathGraphics,
      alpha: 0.25,
      duration: 140,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    });
  }

  private pointFromPointer(pointer: Phaser.Input.Pointer): GridPoint | null {
    if (!this.layout || !this.level) {
      return null;
    }

    const hitRadius = Math.max(this.layout.tokenRadius * 2.4, this.layout.cellSize * 0.45);
    let best: GridPoint | null = null;
    let bestDist = Infinity;

    this.activeCells.forEach((key) => {
      const [rowText, colText] = key.split(':');
      const candidate = { row: Number(rowText), col: Number(colText) };
      const center = this.pointToPosition(candidate);
      const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, center.x, center.y);
      if (distance < bestDist && distance <= hitRadius) {
        bestDist = distance;
        best = candidate;
      }
    });

    return best;
  }

  private pointToPosition(point: GridPoint): Phaser.Math.Vector2 {
    if (!this.layout) {
      return new Phaser.Math.Vector2(0, 0);
    }

    return new Phaser.Math.Vector2(
      this.layout.originX + point.col * this.layout.cellSize,
      this.layout.originY + point.row * this.layout.cellSize,
    );
  }
}
