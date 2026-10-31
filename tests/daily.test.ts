import { describe, it, expect } from 'vitest';
import { cal, LAST_WEEK } from '../src/sc/time';
import { DAILY, DAILY2, DAILY3, DAILY4 } from '../src/sc/data/daily';
describe('daily scenes', () => {
  it('every daily scene has exactly one week slot, and no two share a week', () => {
    const all = [...DAILY, ...DAILY2, ...DAILY3, ...DAILY4]; const used = new Map<number, string>();
    for (const e of all) {
      const ws: number[] = []; for (let w = 0; w <= LAST_WEEK; w++) if (e.cond({ week: w } as any)) ws.push(w);
      expect(ws.length, e.id).toBe(1);
      expect(used.get(ws[0]), `${e.id} vs ${used.get(ws[0])} @${JSON.stringify(cal(ws[0]))}`).toBeUndefined(); used.set(ws[0], e.id);
    }
  });
});
