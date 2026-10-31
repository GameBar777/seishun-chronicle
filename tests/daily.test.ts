import { describe, it, expect } from 'vitest';
import { cal, LAST_WEEK } from '../src/sc/time';
import { DAILY, DAILY2, DAILY3, DAILY4 } from '../src/sc/data/daily';
import { SISTER } from '../src/sc/data/sister';
describe('daily scenes', () => {
  it('every daily scene has exactly one week slot, and no two share a week', () => {
    const all = [...DAILY, ...DAILY2, ...DAILY3, ...DAILY4, ...SISTER]; const used = new Map<number, string>();
    for (const e of all) {
      const ws: number[] = []; for (let w = 0; w <= LAST_WEEK; w++) if (e.cond({ week: w } as any)) ws.push(w);
      expect(ws.length, e.id).toBe(1);
      expect(used.get(ws[0]), `${e.id} vs ${used.get(ws[0])} @${JSON.stringify(cal(ws[0]))}`).toBeUndefined(); used.set(ws[0], e.id);
    }
  });
});
import { FRIENDS } from '../src/sc/data/friends';
describe('friend scenes (健太・田中)', () => {
  it('each has one week slot and no two friend scenes share a week', () => {
    const used = new Map<number, string>();
    for (const e of FRIENDS) {
      const ws: number[] = []; for (let w = 0; w <= LAST_WEEK; w++) if (e.cond({ week: w } as any)) ws.push(w);
      expect(ws.length, e.id).toBe(1); expect(used.get(ws[0]), e.id).toBeUndefined(); used.set(ws[0], e.id);
    }
    expect(FRIENDS.filter(e => e.id.startsWith('d_fr_t_')).length).toBeGreaterThanOrEqual(25);
  });
  it('田中 lines are original and non-creepy', () => {
    const txt = JSON.stringify(FRIENDS.map(e => [e.lines, e.choices.map(c => c.res)]));
    expect(txt).not.toMatch(/のぞ[きく]|覗き|盗撮|つけ回|尾行|銀時|万事屋|新八|神楽/);
  });
});
