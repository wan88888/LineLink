import type { LevelDefinition } from '../game/simulation/types';
import { AMBER_COST, DAILY_AMOUNTS, dailyView, type DailyState } from '../game/simulation/dailyRewards';
import { dropIcon, gearIcon } from './icons';

export interface LevelCardMeta {
  unlocked: boolean;
  solved: boolean;
  stars?: 0 | 1 | 2 | 3;
}

export interface ShellElements {
  homePage: HTMLElement;
  levelPage: HTMLElement;
  gamePage: HTMLElement;
  levelList: HTMLElement;
  gameBackButton: HTMLButtonElement;
  levelTitle: HTMLElement;
  toast: HTMLElement;
  solvedBanner: HTMLElement;
  settingsButton: HTMLButtonElement;
  starButton: HTMLButtonElement;
  starValue: HTMLElement;
  levelBackButton: HTMLButtonElement;
  levelStarButton: HTMLButtonElement;
  levelStarValue: HTMLElement;
  playButton: HTMLButtonElement;
  undoButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  canvasHost: HTMLElement;
  selectButton: HTMLButtonElement;
  helpButton: HTMLButtonElement;
  homeHelpButton: HTMLButtonElement;
  loading: HTMLElement;
  loadingText: HTMLElement;
  retryButton: HTMLButtonElement;
  status: HTMLElement;
  settings: HTMLDialogElement;
  help: HTMLDialogElement;
  result: HTMLDialogElement;
  soundToggle: HTMLInputElement;
  resultTitle: HTMLElement;
  resultStars: HTMLElement;
  resultText: HTMLElement;
  resultNext: HTMLButtonElement;
  resultReplay: HTMLButtonElement;
  resultLevels: HTMLButtonElement;
  claimButton: HTMLButtonElement;
  rewardDays: HTMLElement;
  rewardStatus: HTMLElement;
  rewardNote: HTMLElement;
  inkBalance: HTMLElement;
  homeProgress: HTMLElement;
  homeProgressBar: HTMLProgressElement;
  mintButton: HTMLButtonElement;
  amberButton: HTMLButtonElement;
}

export function createMobileShell(root: HTMLElement): ShellElements {
  root.innerHTML = `
  <div class="ambient-bg" aria-hidden="true">
    <span class="blob blob-a"></span>
    <span class="blob blob-b"></span>
    <span class="blob blob-c"></span>
  </div>
  <main class="phone-shell">
    <div class="phone-notch" aria-hidden="true"></div>
    <section class="screen-layer">
      <section class="page home-page" id="home-page">
        <header class="home-topbar">
          <button id="settings-btn" type="button" class="home-icon-btn" aria-label="设置">${gearIcon}</button>
          <button id="star-btn" type="button" class="home-star-btn" aria-label="星星">
            <span aria-hidden="true">⭐</span>
            <strong id="star-value">0</strong>
          </button>
        </header>
        <div class="home-center">
          <svg class="home-line-art" viewBox="0 0 160 72" aria-hidden="true"><path d="M18 55 55 16 104 55 142 16 55 16 55 55 104 55" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><g fill="currentColor"><circle cx="18" cy="55" r="5"/><circle cx="55" cy="16" r="5"/><circle cx="55" cy="55" r="5"/><circle cx="104" cy="55" r="5"/></g><circle cx="142" cy="16" r="6" fill="#ffbd54"/></svg>
          <h1>LineLink</h1><p class="home-subtitle">一笔之间，找到答案</p><p class="home-description">48 道连线谜题 · 从入门到大师</p>
        </div>
        <section class="daily-card" aria-labelledby="daily-title">
          <div class="daily-heading"><div><p class="daily-eyebrow">每天一笔 · 灵感不息</p><h2 id="daily-title">每日奖励</h2></div><span class="ink-wallet" aria-label="墨滴余额">${dropIcon}<strong id="ink-balance">0</strong><small>墨滴</small></span></div>
          <p id="reward-status" class="reward-status" aria-live="polite"></p>
          <ol id="reward-days" class="reward-days" aria-label="七日签到奖励"></ol>
          <button id="claim-btn" class="claim-btn" type="button">领取今日奖励</button>
          <p class="reward-purpose">攒满 100 墨滴，在设置解锁「日落琥珀」配色</p>
          <p id="reward-note" class="reward-note">本地每日 0 点刷新 · 漏签从第 1 天重新开始</p>
        </section>
        <div class="home-journey"><span>我的连线旅程</span><strong id="home-progress">0 / 48 关</strong><progress id="home-progress-bar" max="48" value="0" aria-label="已通关进度"></progress></div>
        <div class="home-bottom">
          <button id="play-btn" type="button" class="play-btn">继续挑战</button><button id="select-btn" class="secondary-btn" type="button">选择关卡</button><button id="home-help-btn" class="text-btn" type="button">怎么玩</button>
        </div>
      </section>
      <section class="page level-page hidden" id="level-page">
        <header class="level-topbar">
          <button id="level-back-btn" type="button" class="back-btn" aria-label="返回主页">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button id="level-star-btn" type="button" class="home-star-btn level-star-btn" aria-label="星星">
            <span aria-hidden="true">⭐</span>
            <strong id="level-star-value">0</strong>
          </button>
        </header>
        <div class="level-list" id="level-list" aria-label="关卡列表"></div>
      </section>
      <section class="page game-page hidden" id="game-page">
        <header class="game-header">
          <div class="game-header-main">
            <button id="game-back-btn" type="button" class="back-btn" aria-label="返回关卡页">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <p class="eyebrow" id="level-title">第 1 关</p><button id="help-btn" class="text-btn" type="button" aria-label="玩法帮助">?</button>
          </div>
        </header>
        <p id="game-status" class="game-status" role="status"></p>
        <div class="board-wrap">
          <div class="canvas-host" id="game-canvas-host"></div>
          <div id="loading" class="loading hidden" role="status"><p id="loading-text">正在准备关卡…</p><button id="retry-btn" class="secondary-btn hidden" type="button">重试加载</button></div>
        </div>
        <p class="board-hint">金色圆环提示起点；松手后可从路径末端继续。</p>
        <footer class="game-footer">
          <div class="actions-row">
            <button id="undo-btn" type="button" class="circle-btn" aria-label="撤销">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M8 5 L3 10 L8 15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 10 H14 a6 6 0 0 1 0 12 H9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button id="reset-btn" type="button" class="circle-btn" aria-label="重置">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M20 12a8 8 0 1 1-2.34-5.66" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button id="next-btn" type="button" class="circle-btn next-btn hidden">下一关</button>
          </div>
        </footer>
      </section>
    </section>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <div class="solved-banner hidden" id="solved-banner">完美通关</div>
    <dialog id="settings-dialog" aria-labelledby="settings-title">
      <h2 id="settings-title">设置</h2><label class="setting-row">游戏音效<input id="sound-toggle" type="checkbox" /></label>
      <section class="theme-shop" aria-labelledby="theme-title"><h3 id="theme-title">首页配色</h3><p>每日签到收集墨滴，兑换后永久解锁。关卡星级不受影响。</p><button id="mint-theme-btn" type="button" class="theme-choice" aria-pressed="true"><span class="theme-swatch mint-swatch" aria-hidden="true"></span>薄荷晨光<span>使用中</span></button><button id="amber-theme-btn" type="button" class="theme-choice" aria-pressed="false"><span class="theme-swatch amber-swatch" aria-hidden="true"></span>日落琥珀<span>100 墨滴兑换</span></button><p class="theme-shop-note">墨滴与已解锁配色保存在当前浏览器。</p></section>
      <p>动画会跟随设备的“减少动态效果”设置。</p><form method="dialog"><button class="secondary-btn">完成</button></form>
    </dialog>
    <dialog id="help-dialog" aria-labelledby="help-title">
      <p class="eyebrow">ONE STROKE</p><h2 id="help-title">一笔走完每条线</h2>
      <ol><li>从金色圆环节点按住拖动。</li><li>每条边只能走一次，节点可以重复经过。</li><li>只有圆点是连接点；没有圆点的交叉处不能转弯。</li><li>松手不会丢进度，从亮色末端继续即可。</li></ol>
      <p>遇到两枚起点圆环时，任选其一开始；所有节点都带圆环时，可以任选起点。</p>
      <p>首次完成得 3 星，2–3 次得 2 星，4 次起得 1 星。撤销可修正路线；全部撤销或重置后重画，计为新尝试。</p>
      <form method="dialog"><button class="secondary-btn">开始画吧</button></form>
    </dialog>
    <dialog id="result-dialog" aria-labelledby="result-title">
      <p class="eyebrow">LINE COMPLETE</p><h2 id="result-title">关卡完成</h2><p id="result-stars" class="result-stars"></p><p id="result-text"></p>
      <div class="result-actions"><button id="result-next" class="secondary-btn" type="button">下一关</button><button id="result-replay" class="text-btn" type="button">再挑战一次</button><button id="result-levels" class="text-btn" type="button">返回选关</button></div>
    </dialog>
  </main>
  `;

  return {
    homePage: mustElement<HTMLElement>('home-page'),
    levelPage: mustElement<HTMLElement>('level-page'),
    gamePage: mustElement<HTMLElement>('game-page'),
    levelList: mustElement<HTMLElement>('level-list'),
    gameBackButton: mustElement<HTMLButtonElement>('game-back-btn'),
    levelTitle: mustElement<HTMLElement>('level-title'),
    toast: mustElement<HTMLElement>('toast'),
    solvedBanner: mustElement<HTMLElement>('solved-banner'),
    settingsButton: mustElement<HTMLButtonElement>('settings-btn'),
    starButton: mustElement<HTMLButtonElement>('star-btn'),
    starValue: mustElement<HTMLElement>('star-value'),
    levelBackButton: mustElement<HTMLButtonElement>('level-back-btn'),
    levelStarButton: mustElement<HTMLButtonElement>('level-star-btn'),
    levelStarValue: mustElement<HTMLElement>('level-star-value'),
    playButton: mustElement<HTMLButtonElement>('play-btn'),
    undoButton: mustElement<HTMLButtonElement>('undo-btn'),
    resetButton: mustElement<HTMLButtonElement>('reset-btn'),
    nextButton: mustElement<HTMLButtonElement>('next-btn'),
    canvasHost: mustElement<HTMLElement>('game-canvas-host'),
    selectButton: mustElement<HTMLButtonElement>('select-btn'),
    homeHelpButton: mustElement<HTMLButtonElement>('home-help-btn'),
    helpButton: mustElement<HTMLButtonElement>('help-btn'),
    loading: mustElement<HTMLElement>('loading'),
    loadingText: mustElement<HTMLElement>('loading-text'),
    retryButton: mustElement<HTMLButtonElement>('retry-btn'),
    status: mustElement<HTMLElement>('game-status'),
    settings: mustElement<HTMLDialogElement>('settings-dialog'),
    help: mustElement<HTMLDialogElement>('help-dialog'),
    result: mustElement<HTMLDialogElement>('result-dialog'),
    soundToggle: mustElement<HTMLInputElement>('sound-toggle'),
    resultTitle: mustElement<HTMLElement>('result-title'),
    resultStars: mustElement<HTMLElement>('result-stars'),
    resultText: mustElement<HTMLElement>('result-text'),
    resultNext: mustElement<HTMLButtonElement>('result-next'),
    resultReplay: mustElement<HTMLButtonElement>('result-replay'),
    resultLevels: mustElement<HTMLButtonElement>('result-levels'),
    claimButton: mustElement<HTMLButtonElement>('claim-btn'),
    rewardDays: mustElement<HTMLElement>('reward-days'),
    rewardStatus: mustElement<HTMLElement>('reward-status'),
    rewardNote: mustElement<HTMLElement>('reward-note'),
    inkBalance: mustElement<HTMLElement>('ink-balance'),
    homeProgress: mustElement<HTMLElement>('home-progress'),
    homeProgressBar: mustElement<HTMLProgressElement>('home-progress-bar'),
    mintButton: mustElement<HTMLButtonElement>('mint-theme-btn'),
    amberButton: mustElement<HTMLButtonElement>('amber-theme-btn'),
  };
}

export function renderDailyRewards(shell: ShellElements, state: DailyState, persistent: boolean): void {
  const view = dailyView(state);
  shell.inkBalance.textContent = `${state.balance}`;
  shell.rewardStatus.textContent = view.claimed ? `已连续签到 ${state.streak} 天，明天再来续一笔` : `签到第 ${view.day} 天，今天有 ${view.amount} 墨滴等你领取`;
  shell.claimButton.disabled = view.claimed;
  shell.claimButton.textContent = view.claimed ? '今日已领取 · 明天再来' : `领取今日奖励 +${view.amount} 墨滴`;
  shell.rewardDays.innerHTML = DAILY_AMOUNTS.map((amount, index) => {
    const day = index + 1;
    const done = day < view.day || (view.claimed && day === view.day);
    return `<li class="reward-day ${done ? 'collected' : ''} ${day === view.day ? 'current' : ''}" ${day === view.day ? 'aria-current="step"' : ''} aria-label="第 ${day} 天，${amount} 墨滴${done ? '，已领取' : ''}"><span>${day} 天</span>${dropIcon}<strong>+${amount}</strong><small>${done ? '已领' : day === view.day ? '今日' : '待领'}</small></li>`;
  }).join('');
  shell.rewardNote.textContent = persistent ? '本地每日 0 点刷新 · 漏签从第 1 天重新开始' : '浏览器存储不可用，奖励仅在本次打开期间保留';
  document.documentElement.dataset.homeTheme = state.theme;
  shell.mintButton.setAttribute('aria-pressed', `${state.theme === 'mint'}`);
  shell.amberButton.setAttribute('aria-pressed', `${state.theme === 'amber'}`);
  shell.mintButton.lastElementChild!.textContent = state.theme === 'mint' ? '使用中' : '免费切换';
  shell.amberButton.lastElementChild!.textContent = state.theme === 'amber' ? '使用中' : state.amberUnlocked ? '已解锁 · 切换' : `${AMBER_COST} 墨滴兑换 · 现有 ${state.balance}`;
  shell.amberButton.disabled = !state.amberUnlocked && state.balance < AMBER_COST;
}

export function renderLevelCards(
  container: HTMLElement,
  levels: LevelDefinition[],
  stateByLevelId: Map<number, LevelCardMeta>,
  onSelect: (levelId: number) => void,
): void {
  container.innerHTML = '';

  const recommendedLevel =
    levels.find((level) => {
      const state = stateByLevelId.get(level.id);
      return state?.unlocked && !state.solved;
    }) ??
    levels.find((level) => stateByLevelId.get(level.id)?.unlocked);

  levels.forEach((level, index) => {
    const card = document.createElement('button');
    card.type = 'button';

    const levelState =
      stateByLevelId.get(level.id) ?? {
        unlocked: false,
        solved: false,
        stars: 0 as const,
      };

    card.className = 'level-card';

    if (!levelState.unlocked) {
      card.classList.add('locked');
      card.disabled = true;
    }

    if (levelState.solved) {
      card.classList.add('solved');
    }

    if (recommendedLevel && recommendedLevel.id === level.id) {
      card.classList.add('focus');
    }

    card.style.setProperty('--delay-index', `${Math.min(index, 5)}`);

    const stars = levelState.stars ?? 0;
    const starMarkup = levelState.solved
      ? `<span class="stars" aria-label="星级 ${stars} / 3">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>`
      : levelState.unlocked
      ? '<span class="lock-badge" aria-hidden="true">▶</span>'
      : '<span class="lock-badge locked" aria-hidden="true">🔒</span>';

    card.innerHTML = `
      <div class="level-row">
        <div><p class="level-name">第 ${level.id} 关</p><small>${level.tierName} · ${level.edges.length} 条边</small></div>
        ${starMarkup}
      </div>
    `;

    card.addEventListener('click', () => {
      onSelect(level.id);
    });

    container.append(card);
  });
}

export function showPage(elements: ShellElements, page: 'home' | 'levels' | 'game'): void {
  const showHome = page === 'home';
  const showLevels = page === 'levels';
  elements.homePage.classList.toggle('hidden', !showHome);
  elements.levelPage.classList.toggle('hidden', !showLevels);
  elements.gamePage.classList.toggle('hidden', showHome || showLevels);
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function showToast(
  toastElement: HTMLElement,
  message: string,
  tone: 'info' | 'warn' | 'success',
): void {
  clearTimeout(toastTimer);
  toastElement.textContent = message;
  toastElement.classList.remove('visible', 'warn', 'success');

  if (tone === 'warn') {
    toastElement.classList.add('warn');
  }

  if (tone === 'success') {
    toastElement.classList.add('success');
  }

  requestAnimationFrame(() => {
    toastElement.classList.add('visible');
  });

  toastTimer = window.setTimeout(() => {
    toastElement.classList.remove('visible');
  }, 1700);
}

function mustElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`缺少 DOM 节点: #${id}`);
  }

  return element as T;
}
