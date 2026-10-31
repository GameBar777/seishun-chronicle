import { describe, it, expect } from 'vitest';
import { newGame, doWeek, actions, staCost, riskAt, riskOf, STA } from '../src/sc/engine';
const base = { sei: '相沢', mei: '悠斗', seiYomi: 'あいざわ', meiYomi: 'ゆうと', bm: 4, bd: 10, persona: '優しい', look: '爽やか系', diff: 'NORMAL' as const };
const g = (seed = 1) => newGame({ ...base, seed });
describe('体力システム', () => {
  it('行動で約20消費、休養で回復', () => {
    const s = g(); expect(staCost(s, 'bun')).toBe(20); expect(staCost(s, 'train')).toBe(25); expect(staCost(s, 'rest')).toBe(-STA.rest);
  });
  it('故障率は体力が低いほど上がる', () => {
    expect(riskAt(60)).toBe(0); expect(riskAt(40)).toBeCloseTo(0.05); expect(riskAt(30)).toBeCloseTo(0.1); expect(riskAt(10)).toBeGreaterThan(riskAt(20));
    const s = g(); s.stats.hp = 100; expect(riskOf(s, 'bun')).toBe(0); s.stats.hp = 30; expect(riskOf(s, 'bun')).toBeGreaterThan(0.2);
  });
  it('病院は風邪かケガの時だけ選べる', () => {
    const s = g(); expect(actions(s).find(a => a.id === 'hospital')!.ok).toBe(false);
    s.cold = 1; expect(actions(s).find(a => a.id === 'hospital')!.ok).toBe(true);
  });
  it('ケガは自然治癒せず、運動系が選べない', () => {
    const s = g(); s.injury = 1; for (let i = 0; i < 6; i++) { s.queue = []; doWeek(s, 'rest'); }
    expect(s.injury).toBe(1); expect(actions(s).find(a => a.id === 'train')!.ok).toBe(false);
  });
  it('病院の成功率はおよそ70%', () => {
    let ok = 0; for (let i = 0; i < 300; i++) { const s = g(i + 1); s.cold = 1; s.queue = []; doWeek(s, 'hospital'); if (!s.cold) ok++; }
    expect(ok / 300).toBeGreaterThan(0.6); expect(ok / 300).toBeLessThan(0.8);
  });
});
