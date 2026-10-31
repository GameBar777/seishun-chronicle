import { describe, it, expect } from 'vitest';
import { stressMult, statMult, newGame, gainStat } from '../src/sc/engine';
describe('成長バランス', () => {
  it('stress sharply cuts gains', () => { expect(stressMult(30)).toBe(1); expect(stressMult(80)).toBeLessThan(0.6); expect(stressMult(100)).toBe(0.25); });
  it('diminishing returns at high values', () => {
    const s: any = newGame({ sei: '山田', mei: '太郎', seiYomi: 'やまだ', meiYomi: 'たろう', persona: '知的', diff: 'NORMAL', seed: 1 } as any); s.stats.st = 0;
    expect(statMult(s, 250)).toBeLessThan(statMult(s, 50) / 4);
    s.stats.bun = 50; gainStat(s, 'bun', 10); const lo = s.stats.bun - 50; s.stats.bun = 250; gainStat(s, 'bun', 10); expect(s.stats.bun - 250).toBeLessThan(lo / 4);
  });
});
