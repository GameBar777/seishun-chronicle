import { describe, it, expect } from 'vitest';
import { DATE_TALK, DATE_OUTFIT, KENTA_REACT } from '../src/sc/data/datetalk/index';
import { EVMAP } from '../src/sc/engine';
import { HEROINES } from '../src/sc/data/index';

const SPOTS = Object.keys(DATE_TALK.hinata.spot);
describe('デート会話のバリエーション (v1.14.0)', () => {
  it('全ヒロイン × 全15スポットに好感度3段階＋中盤シーンがある', () => {
    expect(SPOTS.length).toBe(15);
    for (const H of HEROINES) {
      const T = DATE_TALK[H.id]; expect(T, H.id).toBeTruthy();
      expect(Object.keys(T.spot).sort()).toEqual([...SPOTS].sort());
      for (const k of SPOTS) for (const v of T.spot[k]) expect(v.length, `${H.id}/${k}`).toBeGreaterThan(0);
      for (const g of T.greet) expect(g.length).toBeGreaterThanOrEqual(3);
      for (const r of T.react) expect(r.length).toBeGreaterThanOrEqual(6);
      for (const e of T.end) expect(e.length).toBeGreaterThanOrEqual(3);
      for (const k of ['春', '夏', '秋', '冬'] as const) expect(T.season[k].length).toBeGreaterThan(0);
      expect(T.rain.length).toBeGreaterThan(0); expect(T.again.length).toBeGreaterThan(0); expect(T.y3.length).toBeGreaterThan(0);
      expect(T.qs.length).toBeGreaterThanOrEqual(5);
      expect(DATE_OUTFIT[H.id]).toBeTruthy(); expect(KENTA_REACT[H.id]).toBeTruthy();
    }
  });
  it('思い出コールバックは実在するイベントを参照する', () => {
    for (const H of HEROINES) for (const id of Object.keys(DATE_TALK[H.id].cb)) expect(EVMAP[id], `${H.id}:${id}`).toBeTruthy();
  });
  it('未定義のプレースホルダや不穏な語がない', () => {
    const all = JSON.stringify(DATE_TALK);
    const ph = all.match(/\{[^{}"]*\}/g) || [];
    for (const p of ph) expect(['{C}', '{S}', '{M}', '{L}']).toContain(p);
    expect(all).not.toMatch(/殺す/);
  });
});
