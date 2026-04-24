import './style.css';
import { createLevelCatalog } from './game/simulation/levels';
import {
  isLevelSolved,
  isLevelUnlocked,
  levelStars,
  loadProgress,
  nextUnsolvedLevel,
  recordSolved,
  totalStars,
} from './game/simulation/progress';
import { SceneBridge } from './phaser/adapters/sceneBridge';
import { createMobileShell, renderLevelCards, showPage, showToast } from './ui/mobileShell';
import { playSolvedCue, playStepCue } from './ui/sfx';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('缺少 #app 节点，无法启动游戏。');
}

const levels = createLevelCatalog();
const levelById = new Map(levels.map((level) => [level.id, level]));

let progress = loadProgress(levels.length);
let currentLevelId: number | null = null;

const bridge = new SceneBridge();
const shell = createMobileShell(app);

type PhaserGame = import('phaser').Game;
let phaserGame: PhaserGame | null = null;

function refreshStars(): void {
  const stars = totalStars(progress);
  shell.starValue.textContent = `${stars}`;
  shell.levelStarValue.textContent = `${stars}`;
}

function renderLevelList(): void {
  const stateByLevel = new Map(
    levels.map((level) => [
      level.id,
      {
        unlocked: isLevelUnlocked(progress, level.id),
        solved: isLevelSolved(progress, level.id),
        stars: levelStars(progress, level.id),
      },
    ]),
  );
  renderLevelCards(shell.levelList, levels, stateByLevel, (levelId) => openLevel(levelId));
}

function refreshGameHeader(levelId: number): void {
  const level = levelById.get(levelId);
  if (!level) return;
  shell.levelTitle.textContent = `Level ${level.id}`;
}

async function ensurePhaserGame(): Promise<PhaserGame> {
  if (phaserGame) return phaserGame;
  const [{ default: Phaser }, { PuzzleScene }] = await Promise.all([
    import('phaser'),
    import('./phaser/scenes/PuzzleScene'),
  ]);
  phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: shell.canvasHost,
    backgroundColor: '#ecf8f4',
    scene: [new PuzzleScene(bridge)],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 720,
      height: 1180,
    },
    render: { antialias: true, powerPreference: 'high-performance' },
  });

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver((entries) => {
      if (!phaserGame) return;
      const entry = entries[0];
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      if (width > 0 && height > 0) {
        phaserGame.scale.resize(width, height);
        phaserGame.scale.refresh();
      }
    });
    observer.observe(shell.canvasHost);
  }
  return phaserGame;
}

async function openLevel(levelId: number): Promise<void> {
  const level = levelById.get(levelId);
  if (!level) return;
  if (!isLevelUnlocked(progress, levelId)) {
    showToast(shell.toast, '该关卡尚未解锁。', 'warn');
    return;
  }
  currentLevelId = levelId;
  showPage(shell, 'game');
  shell.nextButton.classList.add('hidden');
  shell.solvedBanner.classList.add('hidden');

  const game = await ensurePhaserGame();
  window.requestAnimationFrame(() => {
    const width = shell.canvasHost.clientWidth;
    const height = shell.canvasHost.clientHeight;
    if (width > 0 && height > 0) {
      game.scale.resize(width, height);
      game.scale.refresh();
    }
    bridge.loadLevel(level);
  });
  refreshGameHeader(levelId);
}

// --- event wiring -----------------------------------------------------------

shell.playButton.addEventListener('click', () => {
  const nextId = nextUnsolvedLevel(progress, levels.length) ?? 1;
  if (nextId && levelById.has(nextId)) {
    openLevel(nextId);
  } else {
    showPage(shell, 'levels');
  }
});

shell.settingsButton.addEventListener('click', () => {
  showToast(shell.toast, '设置功能即将上线。', 'info');
});

shell.starButton.addEventListener('click', () => {
  showToast(shell.toast, `当前星星：${totalStars(progress)}`, 'info');
});

shell.levelBackButton.addEventListener('click', () => showPage(shell, 'home'));
shell.levelStarButton.addEventListener('click', () => {
  showToast(shell.toast, `当前星星：${totalStars(progress)}`, 'info');
});
shell.gameBackButton.addEventListener('click', () => showPage(shell, 'levels'));
shell.undoButton.addEventListener('click', () => bridge.undo());
shell.resetButton.addEventListener('click', () => bridge.reset());

shell.nextButton.addEventListener('click', () => {
  if (currentLevelId === null) return;
  const next = nextUnsolvedLevel(progress, levels.length);
  if (next !== null) {
    openLevel(next);
    return;
  }
  const nextId = currentLevelId + 1;
  if (!levelById.has(nextId)) {
    showPage(shell, 'levels');
    return;
  }
  if (!isLevelUnlocked(progress, nextId)) {
    showToast(shell.toast, '下一关还没解锁，先回关卡页看看。', 'info');
    return;
  }
  openLevel(nextId);
});

let lastPathLength = 0;
bridge.onSnapshot((snapshot) => {
  refreshGameHeader(snapshot.level.id);
  if (snapshot.path.length > lastPathLength) {
    playStepCue();
  }
  lastPathLength = snapshot.path.length;
});

bridge.onToast((message, tone) => {
  showToast(shell.toast, message, tone);
});

bridge.onSolved((snapshot) => {
  progress = recordSolved(progress, snapshot.level.id, snapshot.attempts, levels.length);
  refreshStars();
  renderLevelList();
  playSolvedCue();

  shell.solvedBanner.classList.remove('hidden');
  window.setTimeout(() => shell.solvedBanner.classList.add('hidden'), 1500);

  const nextId = snapshot.level.id + 1;
  if (levelById.has(nextId) && isLevelUnlocked(progress, nextId)) {
    shell.nextButton.classList.remove('hidden');
  }
});

showPage(shell, 'home');
refreshStars();
renderLevelList();
