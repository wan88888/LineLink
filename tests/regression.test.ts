import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLevelCatalog, difficultyScore } from '../src/game/simulation/levels';
import { OneStrokeSession } from '../src/game/simulation/session';
import { loadProgress, recordSolved, nextUnsolvedLevel } from '../src/game/simulation/progress';
import { SceneBridge } from '../src/phaser/adapters/sceneBridge';
import { runtimeLoader } from '../src/phaser/runtimeLoader';

const levels = createLevelCatalog();

describe('catalog progression', () => {
  it('contains 48 puzzles distinct even under rotation or reflection', () => {
    const signatures = levels.map(level => {
      const n = level.nodes.length;
      const edges = level.edges.map(([a,b]) => [level.nodes.indexOf(a), level.nodes.indexOf(b)]);
      const variants: string[] = [];
      for (let offset=0; offset<n; offset++) for (const direction of [1,-1]) {
        variants.push(edges.map(edge => edge.map(i => (i*direction+offset+n)%n).sort((a,b)=>a-b).join('-')).sort().join('|'));
      }
      return `${n}:${variants.sort()[0]}`;
    });
    expect(new Set(signatures).size).toBe(48);
    expect(levels.map(difficultyScore)).toEqual(levels.map(difficultyScore).sort((a,b)=>a-b));
    for (const level of levels.slice(36)) expect(difficultyScore(level)).toBeGreaterThan(100);
  });

  it('solves every puzzle using an independently constructed Euler trail', () => {
    for (const level of levels) {
      const adj = level.nodes.map(node => level.edges.flatMap(([a,b],i) => a === node ? [{ next:level.nodes.indexOf(b), edge:i }] : b === node ? [{ next:level.nodes.indexOf(a), edge:i }] : []));
      const odd = adj.findIndex(neighbors => neighbors.length%2===1);
      const stack = [Math.max(0, odd)];
      const trail: number[] = [];
      const used = new Set<number>();
      while (stack.length) {
        const node = stack.at(-1)!;
        const step = adj[node].find(candidate => !used.has(candidate.edge));
        if (step) { used.add(step.edge); stack.push(step.next); }
        else trail.push(stack.pop()!);
      }
      const session = new OneStrokeSession(level);
      for (const node of trail.reverse()) expect(session.extend(level.nodes[node]).ok, `Level ${level.id}`).toBe(true);
      expect(session.snapshot().solved, `Level ${level.id}`).toBe(true);
    }
  });
});

describe('initialization', () => {
  it('delivers a queued level before signaling ready', async () => {
    const bridge = new SceneBridge();
    const loadLevel = vi.fn();
    bridge.loadLevel(levels[0]);
    bridge.attachSceneHandlers({ loadLevel, reset:vi.fn(), undo:vi.fn() });
    await bridge.ready;
    expect(loadLevel).toHaveBeenCalledTimes(1);
    expect(loadLevel).toHaveBeenCalledWith(levels[0]);
  });
  it('shares concurrent work and permits retry after rejection', async () => {
    const init = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ canvas:1 });
    const load = runtimeLoader(init);
    const a=load(); const b=load();
    expect(a).toBe(b);
    await expect(a).rejects.toThrow('offline');
    const game=await load();
    expect(await load()).toBe(game);
    expect(init).toHaveBeenCalledTimes(2);
  });
});

describe('save and migration', () => {
  afterEach(() => vi.unstubAllGlobals());
  function storage(initial: Record<string,string> = {}) {
    const data = new Map(Object.entries(initial));
    vi.stubGlobal('localStorage', { getItem:(k:string)=>data.get(k)??null, setItem:(k:string,v:string)=>data.set(k,v) });
    return data;
  }
  it('restores stars, best attempt and next unlock', () => {
    storage();
    let p=recordSolved(loadProgress(48),1,4,48);
    p=recordSolved(p,1,1,48);
    expect(loadProgress(48)).toEqual(p);
    expect(p.records[1]).toEqual({ solved:true, bestAttempts:1, stars:3 });
    expect(nextUnsolvedLevel(p,48)).toBe(2);
  });
  it('preserves old storage and unlocked access without attributing old stars to new puzzles', () => {
    const old=JSON.stringify({version:2,unlockedLevel:25,records:{1:{solved:true,bestAttempts:1,stars:3}}});
    const data=storage({'linelink-progress-v2':old});
    const p=loadProgress(48);
    expect(p.unlockedLevel).toBe(25);
    expect(p.records).toEqual({});
    expect(data.get('linelink-progress-v2')).toBe(old);
  });
  it('continues playing even when storage is unavailable', () => {
    vi.stubGlobal('localStorage',{getItem:()=>{throw new Error('blocked')},setItem:()=>{throw new Error('blocked')}});
    expect(recordSolved(loadProgress(48),1,1,48).unlockedLevel).toBe(2);
  });
  it('returns no next level once the catalog is complete', () => {
    storage(); let p=loadProgress(48);
    for (let id=1;id<=48;id++) p=recordSolved(p,id,1,48);
    expect(nextUnsolvedLevel(p,48)).toBeNull();
  });
});
