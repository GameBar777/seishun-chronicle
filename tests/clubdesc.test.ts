import { describe, it, expect } from 'vitest';
import { gainDesc, actions, newGame } from '../src/sc/engine';
import { CLUBS, JOBS } from '../src/sc/data';
import { effectParts } from '../src/sc/progress';
const base = { sei: '相沢', mei: '悠斗', seiYomi: 'あいざわ', meiYomi: 'ゆうと', bm: 4, bd: 10, persona: '優しい', look: '爽やか系', diff: 'NORMAL' as const, seed: 1 };
describe('部活・バイトの効果表示', () => {
  it('実数値から生成', () => {
    expect(gainDesc(CLUBS['野球部'].gain, CLUBS['野球部'].note)).toBe('運動↑↑ 根性↑ ストレス↓（夏の大会あり）');
    expect(gainDesc(JOBS['コンビニ'].gain, JOBS['コンビニ'].note, JOBS['コンビニ'].pay)).toBe('収入6,000円 根性↑ ストレス↑');
  });
  it('帰宅部は体力+15（緑）', () => {
    const s = newGame(base); s.club = '帰宅部'; const d = actions(s).find(a => a.id === 'club')!.desc;
    expect(d).toContain('体力+15'); expect(effectParts(d).find(x => x.t === '体力+15')!.tone).toBe('pos');
  });
  it('バイトの収入は緑・ストレス増は赤', () => {
    const s = newGame(base); s.job = 'コンビニ'; const p = effectParts(actions(s).find(a => a.id === 'job')!.desc);
    expect(p.find(x => x.t.startsWith('収入'))!.tone).toBe('pos'); expect(p.find(x => x.t === 'ストレス↑')!.tone).toBe('neg');
  });
});
