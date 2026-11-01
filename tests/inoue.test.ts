import { describe, it, expect } from 'vitest';
import { newGame, doWeek, resolve, actions, EVMAP } from '../src/sc/engine';
import { LAST_WEEK } from '../src/sc/time';
describe('井上の場面 (v1.14.0)', () => {
  it('1周で井上の場面がすべて出る（行事と重なっても消えない）', () => {
    const ids = Object.keys(EVMAP).filter(id => id.startsWith('d_fr_t_'));
    expect(ids.length).toBeGreaterThanOrEqual(36);
    for (const seed of [1, 9]) {
      const s: any = newGame({ sei: 'a', mei: 'b', seiYomi: '', meiYomi: '', bm: 4, bd: 10, persona: '優しい', look: '爽やか系', diff: 'NORMAL', seed } as any); let r = seed;
      for (let g = 0; g < 2500 && !s.ended && s.week < LAST_WEEK + 1; g++) {
        if (s.queue.length) { const q = s.queue[0]; try { resolve(s, 0); } catch { s.queue.shift(); } if (s.queue[0] === q) s.queue.shift(); continue; }
        const acts = actions(s).filter((a: any) => a.ok); r = (r * 1103515245 + 12345) % 2147483648; try { doWeek(s, acts[r % acts.length].id); } catch { s.week++; }
      }
      expect(ids.filter(i => !s.seen.includes(i))).toEqual([]);
    }
  });
});
