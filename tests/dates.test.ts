import { describe, it, expect } from 'vitest';
import { newGame, dateOrder, dqs } from '../src/sc/engine';
import { HEROINES } from '../src/sc/data/index';
describe('date questions', () => {
  it('15-24 per heroine (deep questions after 友人), unasked first', () => {
    for (const H of HEROINES) { const n = dqs(H).length; expect(n).toBeGreaterThanOrEqual(15); expect(n).toBeLessThanOrEqual(24); }
    const s: any = newGame({ sei: 'a', mei: 'b', seiYomi: '', meiYomi: '', persona: '熱血', diff: 'NORMAL', seed: 5 } as any);
    const seen = new Set<number>();
    for (let i = 0; i < 5; i++) for (const x of dateOrder(s, 'mio')) { expect(seen.has(x)).toBe(false); seen.add(x); s.hs.mio.flags.push('dq:' + x); }
  });
});
