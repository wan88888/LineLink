import type { LevelDefinition, SessionSnapshot } from '../../game/simulation/types';

export type ToastTone = 'info' | 'warn' | 'success';

export interface SceneHandlers {
  loadLevel: (level: LevelDefinition) => void;
  reset: () => void;
  undo: () => void;
}

export class SceneBridge {
  private resolveReady!: () => void;
  ready = new Promise<void>((resolve) => { this.resolveReady = resolve; });

  resetRuntime(): void {
    this.sceneHandlers = null;
    this.queuedLevel = null;
    this.queuedReset = false;
    this.queuedUndo = false;
    this.ready = new Promise<void>((resolve) => { this.resolveReady = resolve; });
  }
  private sceneHandlers: SceneHandlers | null = null;
  private queuedLevel: LevelDefinition | null = null;
  private queuedReset = false;
  private queuedUndo = false;
  private snapshotListeners: Array<(snapshot: SessionSnapshot) => void> = [];
  private toastListeners: Array<(message: string, tone: ToastTone) => void> = [];
  private solvedListeners: Array<(snapshot: SessionSnapshot) => void> = [];

  attachSceneHandlers(handlers: SceneHandlers): void {
    this.sceneHandlers = handlers;
    this.resolveReady();

    if (this.queuedLevel) {
      handlers.loadLevel(this.queuedLevel);
      this.queuedLevel = null;
    }

    if (this.queuedReset) {
      handlers.reset();
      this.queuedReset = false;
    }

    if (this.queuedUndo) {
      handlers.undo();
      this.queuedUndo = false;
    }
  }

  loadLevel(level: LevelDefinition): void {
    if (this.sceneHandlers) {
      this.sceneHandlers.loadLevel(level);
      return;
    }

    this.queuedLevel = level;
  }

  reset(): void {
    if (this.sceneHandlers) {
      this.sceneHandlers.reset();
      return;
    }

    this.queuedReset = true;
  }

  undo(): void {
    if (this.sceneHandlers) {
      this.sceneHandlers.undo();
      return;
    }

    this.queuedUndo = true;
  }

  emitSnapshot(snapshot: SessionSnapshot): void {
    this.snapshotListeners.forEach((listener) => listener(snapshot));
  }

  emitToast(message: string, tone: ToastTone = 'info'): void {
    this.toastListeners.forEach((listener) => listener(message, tone));
  }

  emitSolved(snapshot: SessionSnapshot): void {
    this.solvedListeners.forEach((listener) => listener(snapshot));
  }

  onSnapshot(listener: (snapshot: SessionSnapshot) => void): () => void {
    this.snapshotListeners.push(listener);
    return () => {
      this.snapshotListeners = this.snapshotListeners.filter((item) => item !== listener);
    };
  }

  onToast(listener: (message: string, tone: ToastTone) => void): () => void {
    this.toastListeners.push(listener);
    return () => {
      this.toastListeners = this.toastListeners.filter((item) => item !== listener);
    };
  }

  onSolved(listener: (snapshot: SessionSnapshot) => void): () => void {
    this.solvedListeners.push(listener);
    return () => {
      this.solvedListeners = this.solvedListeners.filter((item) => item !== listener);
    };
  }
}
