import './style.css';
import { createLevelCatalog } from './game/simulation/levels';
import { isLevelSolved, isLevelUnlocked, levelStars, loadProgress, nextUnsolvedLevel, recordSolved, totalStars } from './game/simulation/progress';
import { computeStars } from './game/simulation/session';
import { DailyRewards, REWARD_KEY } from './game/simulation/dailyRewards';
import { SceneBridge } from './phaser/adapters/sceneBridge';
import { runtimeLoader } from './phaser/runtimeLoader';
import { createMobileShell, renderDailyRewards, renderLevelCards, showPage, showToast } from './ui/mobileShell';
import { playSolvedCue, playStepCue, setSoundEnabled, soundEnabled } from './ui/sfx';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('缺少 #app 节点，无法启动游戏。');
const shell = createMobileShell(app);
const levels = createLevelCatalog();
const levelById = new Map(levels.map(level => [level.id, level]));
let progress = loadProgress(levels.length);
const dailyRewards = new DailyRewards();

function refreshDailyRewards(): void {
  const state = dailyRewards.read();
  renderDailyRewards(shell, state, dailyRewards.persistent);
}

async function updateDailyRewards(action: () => void): Promise<void> {
  // Serialize read-modify-write across tabs when Web Locks is available.
  try {
    if (navigator.locks) await navigator.locks.request(REWARD_KEY, action);
    else action();
  } catch {
    showToast(shell.toast, '暂时无法更新奖励，请稍后再试。', 'warn');
  } finally {
    refreshDailyRewards();
  }
}

shell.claimButton.addEventListener('click', () => {
  shell.claimButton.disabled = true;
  void updateDailyRewards(() => {
    const amount = dailyRewards.claim();
    showToast(shell.toast, amount ? `签到成功，获得 ${amount} 墨滴！可在设置兑换首页配色。` : '今日奖励已经领取，明天再来吧。', amount ? 'success' : 'info');
  });
});
[shell.mintButton, shell.amberButton].forEach((button, index) => button.addEventListener('click', () => {
  void updateDailyRewards(() => { dailyRewards.selectTheme(index === 0 ? 'mint' : 'amber'); });
}));

let dailyTimer: ReturnType<typeof setTimeout>;
function scheduleDailyRefresh(): void {
  clearTimeout(dailyTimer);
  refreshDailyRewards();
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  dailyTimer = setTimeout(scheduleDailyRefresh, Math.max(1000, tomorrow.getTime() - Date.now() + 100));
}
window.addEventListener('focus', scheduleDailyRefresh);
window.addEventListener('storage', event => { if (event.key === REWARD_KEY || event.key === null) refreshDailyRewards(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleDailyRefresh(); });
scheduleDailyRefresh();
let currentLevelId: number | null = null;
let navigation = 0;
let lastPathLength = 0;
const bridge = new SceneBridge();
type PhaserGame = import('phaser').Game;
let phaserGame: PhaserGame | null = null;

function syncSize(game: PhaserGame): void {
  const { clientWidth: width, clientHeight: height } = shell.canvasHost;
  if (width > 0 && height > 0 && (game.scale.width !== width || game.scale.height !== height)) {
    game.scale.resize(width, height);
    game.scale.refresh();
  }
}

const ensurePhaserGame = runtimeLoader(async () => {
  bridge.resetRuntime();
  let game: PhaserGame | null = null;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error('Game startup timeout')), 20000);
    });
    const [{ default: Phaser }, { PuzzleScene }] = await Promise.race([
      Promise.all([import('phaser'), import('./phaser/scenes/PuzzleScene')]),
      deadline,
    ]);
    game = new Phaser.Game({
      type: Phaser.AUTO, parent: shell.canvasHost, backgroundColor: '#ecf8f4',
      scene: [new PuzzleScene(bridge)],
      scale: { mode: Phaser.Scale.NONE, width: shell.canvasHost.clientWidth || 360, height: shell.canvasHost.clientHeight || 400 },
      render: { antialias: true, powerPreference: 'low-power' },
    });
    await Promise.race([
      bridge.ready,
      deadline,
    ]);
    phaserGame = game;
    return game;
  } catch (error) {
    game?.destroy(true);
    bridge.resetRuntime();
    throw error;
  } finally {
    clearTimeout(timeout);
  }
});

const observer = new ResizeObserver(() => { if (phaserGame) syncSize(phaserGame); });
observer.observe(shell.canvasHost);

function refreshProgress(): void {
  const stars = `${totalStars(progress)}`;
  shell.starValue.textContent = stars;
  shell.levelStarValue.textContent = stars;
  const solvedCount = levels.filter(level => isLevelSolved(progress, level.id)).length;
  shell.homeProgress.textContent = `${solvedCount} / ${levels.length} 关`;
  shell.homeProgressBar.value = solvedCount;
  const next = nextUnsolvedLevel(progress, levels.length);
  shell.playButton.textContent = next === null ? '全部通关 · 再挑战' : `继续第 ${next} 关`;
  renderLevelCards(shell.levelList, levels, new Map(levels.map(level => [level.id, {
    unlocked: isLevelUnlocked(progress, level.id), solved: isLevelSolved(progress, level.id), stars: levelStars(progress, level.id),
  }])), id => { void openLevel(id); });
}

function goTo(page: 'home' | 'levels'): void {
  navigation++;
  shell.result.close();
  shell.help.close();
  showPage(shell, page);
  if (page === 'home') refreshDailyRewards();
  shell.loading.classList.add('hidden');
  if (page === 'levels') requestAnimationFrame(() => shell.levelList.querySelector('.focus')?.scrollIntoView({ block: 'nearest' }));
}

function helpSeen(): boolean {
  try { return localStorage.getItem('linelink-help-seen') === 'yes'; } catch { return false; }
}

async function openLevel(levelId: number): Promise<void> {
  const level = levelById.get(levelId);
  if (!level || !isLevelUnlocked(progress, levelId)) return;
  const request = ++navigation;
  currentLevelId = levelId;
  shell.result.close();
  showPage(shell, 'game');
  shell.levelTitle.textContent = `第 ${level.id} 关 · ${level.tierName}`;
  shell.status.textContent = '';
  shell.nextButton.classList.add('hidden');
  shell.undoButton.disabled = shell.resetButton.disabled = true;
  shell.loading.classList.remove('hidden');
  shell.loadingText.textContent = '正在准备关卡…';
  shell.retryButton.classList.add('hidden');
  try {
    const game = await ensurePhaserGame();
    if (request !== navigation) return;
    syncSize(game);
    lastPathLength = 0;
    bridge.loadLevel(level);
    shell.loading.classList.add('hidden');
    shell.resetButton.disabled = false;
    if (!helpSeen()) shell.help.showModal();
  } catch {
    if (request !== navigation) return;
    shell.loadingText.textContent = '关卡加载失败，请检查网络后重试，也可以返回选关。';
    shell.retryButton.classList.remove('hidden');
    shell.retryButton.focus();
  }
}

function nextLevel(): void {
  const next = nextUnsolvedLevel(progress, levels.length);
  if (next !== null) void openLevel(next);
  else goTo('levels');
}

shell.playButton.addEventListener('click', () => {
  const next = nextUnsolvedLevel(progress, levels.length);
  if (next === null) goTo('levels'); else void openLevel(next);
});
shell.selectButton.addEventListener('click', () => goTo('levels'));
shell.gameBackButton.addEventListener('click', () => goTo('levels'));
shell.levelBackButton.addEventListener('click', () => goTo('home'));
shell.retryButton.addEventListener('click', () => {
  if (currentLevelId === null) return;
  // A failed ESM fetch can stay cached for this document. A fresh document retries it.
  const url = new URL(window.location.href);
  url.searchParams.set('level', `${currentLevelId}`);
  window.location.assign(url.href);
});
shell.settingsButton.addEventListener('click', () => shell.settings.showModal());
shell.soundToggle.checked = soundEnabled();
shell.soundToggle.addEventListener('change', () => setSoundEnabled(shell.soundToggle.checked));
[shell.homeHelpButton, shell.helpButton].forEach(button => button.addEventListener('click', () => shell.help.showModal()));
shell.help.addEventListener('close', () => { try { localStorage.setItem('linelink-help-seen', 'yes'); } catch { /* Optional preference. */ } });
[shell.starButton, shell.levelStarButton].forEach(button => button.addEventListener('click', () => showToast(shell.toast, `已收集 ${totalStars(progress)} / ${levels.length * 3} 颗星`, 'info')));
shell.undoButton.addEventListener('click', () => bridge.undo());
shell.resetButton.addEventListener('click', () => bridge.reset());
shell.nextButton.addEventListener('click', nextLevel);
shell.resultNext.addEventListener('click', nextLevel);
shell.resultLevels.addEventListener('click', () => goTo('levels'));
shell.resultReplay.addEventListener('click', () => {
  if (currentLevelId !== null) void openLevel(currentLevelId);
});

bridge.onSnapshot(snapshot => {
  shell.status.textContent = `${snapshot.usedEdges.length} / ${snapshot.level.edges.length} 条边 · 第 ${Math.max(1, snapshot.attempts)} 次尝试`;
  shell.undoButton.disabled = snapshot.path.length === 0 || snapshot.solved;
  shell.nextButton.classList.toggle('hidden', !snapshot.solved);
  shell.nextButton.textContent = snapshot.level.id === levels.length ? '选关' : '下一关';
  if (snapshot.path.length > lastPathLength && snapshot.path.length > 1) playStepCue();
  lastPathLength = snapshot.path.length;
});
bridge.onToast((message, tone) => showToast(shell.toast, message, tone));
bridge.onSolved(snapshot => {
  progress = recordSolved(progress, snapshot.level.id, snapshot.attempts, levels.length);
  refreshProgress();
  playSolvedCue();
  const allDone = levels.every(level => isLevelSolved(progress, level.id));
  const stars = computeStars(snapshot.attempts);
  shell.resultTitle.textContent = allDone ? '48 关全部完成！' : `第 ${snapshot.level.id} 关完成`;
  shell.resultStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  shell.resultStars.setAttribute('aria-label', `本次 ${stars} 星，共 3 星`);
  shell.resultText.textContent = `本次尝试 ${snapshot.attempts} 次 · 最佳 ${levelStars(progress, snapshot.level.id)} 星${allDone ? `。共收集 ${totalStars(progress)} / 144 颗星，可以返回选关挑战满星。` : ''}`;
  shell.resultNext.textContent = allDone ? '查看全部关卡' : '继续挑战';
  shell.result.showModal();
});

showPage(shell, 'home');
refreshProgress();
const launchUrl = new URL(window.location.href);
const requestedLevel = Number(launchUrl.searchParams.get('level'));
if (launchUrl.searchParams.has('level')) {
  launchUrl.searchParams.delete('level');
  window.history.replaceState(null, '', launchUrl);
  if (Number.isInteger(requestedLevel) && levelById.has(requestedLevel)) void openLevel(requestedLevel);
}
