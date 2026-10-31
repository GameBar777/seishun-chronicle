import { describe, it, expect } from 'vitest';
import { snap, diffStats, diffHearts, rank, fmtDelta, weekCard } from '../src/sc/progress';
import { newGame, doWeek } from '../src/sc/engine';
const g = () => newGame({ sei: '佐藤', mei: '翔', seiYomi: 'さとう', meiYomi: 'しょう', bm: 1, bd: 1, persona: '知的', look: '爽やか系', diff: 'NORMAL', seed: 7 } as any);
describe('週替わり・パラメータ変化', () => {
  it('a weekly action yields visible deltas and advances the week', () => {
    const s: any = g(); s.queue = []; const a = snap(s); doWeek(s, 'bun', undefined); s.queue = []; const b = snap(s);
    expect(b.week).toBe(a.week + 1);
    const d = diffStats(a, b); expect(d.length).toBeGreaterThan(0); expect(d.every(x => x.d !== 0)).toBe(true);
  });
  it('stress down is good, money formats', () => {
    const a: any = { week: 0, stats: { bun: 10, ri: 0, gei: 0, yo: 0, un: 0, kon: 0, hp: 50, st: 40, moral: 50 }, money: 1000, hs: { x: { met: true, v: 5 }, y: { met: false, v: 0 } } };
    const b: any = { ...a, stats: { ...a.stats, bun: 13, st: 35 }, money: -2000 + 1000, hs: { x: { met: true, v: 2 }, y: { met: true, v: 1 } } };
    const d = diffStats(a, b); const st = d.find(x => x.key === 'st')!; expect(st.good).toBe(true); expect(fmtDelta(d.find(x => x.key === 'bun')!)).toBe('+3');
    expect(fmtDelta(d.find(x => x.key === 'money')!)).toBe('−2,000円');
    expect(diffHearts(a, b)).toEqual([{ id: 'x', dir: 'down' }, { id: 'y', dir: 'new' }]);
  });
  it('ranks are monotonic', () => { expect(rank('bun', 0)).toBe('E'); expect(rank('bun', 600)).toBe('S'); expect(rank('hp', 95)).toBe('S'); expect(rank('bun', 130)).toBe('B'); });
  it('week card', () => { const c = weekCard(0); expect([c.m, c.day, c.week, c.season]).toEqual([4, 5, 1, '春']); });
});
