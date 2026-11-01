import { describe, it, expect } from 'vitest';
import { newGame, view, resolve, dateOrder } from '../src/sc/engine';
import { SPOT_EV, EV_REACT, MID_TALK } from '../src/sc/data/datetalk/index';
import { LOCATIONS, HEROINES } from '../src/sc/data/index';

describe('デートの多段構成（v1.15）', () => {
  it('全スポットにミニイベントがあり、全ヒロインに反応と雑談がある', () => {
    for (const k of Object.keys(LOCATIONS)) expect(SPOT_EV[k]?.length, k).toBeGreaterThanOrEqual(2);
    for (const H of HEROINES) { expect(EV_REACT[H.id].every(t => t.length >= 2), H.id).toBe(true); expect(MID_TALK[H.id].length).toBeGreaterThanOrEqual(6); }
  });
  it('待ち合わせ→質問→ミニイベント→質問→別れ の流れで、ミニイベントが起きる', () => {
    let evSeen = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const s: any = newGame({ sei: '相沢', mei: '悠斗', seiYomi: 'あいざわ', meiYomi: 'ゆうと', bm: 4, bd: 10, persona: '優しい', look: '爽やか系', diff: 'NORMAL', seed } as any);
      s.hs.hinata.met = true; s.money = 1e6; const loc = Object.keys(LOCATIONS)[seed % 15];
      s.queue = [{ kind: 'date', id: 'date', h: 'hinata', step: 0, data: { loc, score: 0, order: dateOrder(s, 'hinata') } }];
      const titles: string[] = [];
      for (let g = 0; g < 8 && s.queue.length; g++) { const v = view(s); titles.push(v.title); if (g === 2 && SPOT_EV[loc].some(e => e.ch[0][0] === v.choices[0])) evSeen++; resolve(s, 0); }
      expect(titles[0]).toMatch(/デート/); expect(titles[1]).toMatch(/1\/3/); expect(titles[2]).toMatch(/2\/3/); expect(titles[3]).toMatch(/3\/3/); expect(titles[4]).toBe('デート終了');
    }
    expect(evSeen).toBeGreaterThanOrEqual(5);
  });
});
