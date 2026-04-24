import type { LevelDefinition } from '../game/simulation/types';

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
          <button id="settings-btn" type="button" class="home-icon-btn" aria-label="设置">⚙</button>
          <button id="star-btn" type="button" class="home-star-btn" aria-label="星星">
            <span aria-hidden="true">⭐</span>
            <strong id="star-value">0</strong>
          </button>
        </header>
        <div class="home-center">
          <h1>LineLink</h1>
        </div>
        <div class="home-bottom">
          <button id="play-btn" type="button" class="play-btn">Play</button>
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
            <p class="eyebrow" id="level-title">Level 1</p>
          </div>
        </header>
        <div class="canvas-host" id="game-canvas-host"></div>
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
            <button id="next-btn" type="button" class="circle-btn next-btn hidden">Next</button>
          </div>
        </footer>
      </section>
    </section>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <div class="solved-banner hidden" id="solved-banner">完美通关</div>
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
  };
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

    card.style.setProperty('--delay-index', `${index}`);

    const stars = levelState.stars ?? 0;
    const starMarkup = levelState.solved
      ? `<span class="stars" aria-label="星级 ${stars} / 3">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>`
      : levelState.unlocked
      ? '<span class="lock-badge" aria-hidden="true">▶</span>'
      : '<span class="lock-badge locked" aria-hidden="true">🔒</span>';

    card.innerHTML = `
      <div class="level-row">
        <p class="level-name">Level ${level.id}</p>
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

export function showToast(
  toastElement: HTMLElement,
  message: string,
  tone: 'info' | 'warn' | 'success',
): void {
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

  window.setTimeout(() => {
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
