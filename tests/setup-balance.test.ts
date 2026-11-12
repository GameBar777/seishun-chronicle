import { describe, it, expect } from 'vitest';
import { newGame, render, playDiff, PERSONAS, DIFF } from '../src/sc/engine';
import { LAST_WEEK } from '../src/sc/time';
import { HMAP } from '../src/sc/data';
import { exportSave, importSave } from '../src/sc/save';

const mk = (diff: any = 'EASY') => newGame({ sei: '青木', mei: '湊', seiYomi: 'あおき', meiYomi: 'みなと', bm: 4, bd: 2, persona: Object.keys(PERSONAS)[0], look: '', diff } as any);

describe('v1.20.2 setup / balance / weeks', () => {
  it('LAST_WEEK is 152 (graduation week index; HUD 第1/152〜第152/152)', () => {
    expect(LAST_WEEK).toBe(152);
  });
  it('newGame always uses the standard (NORMAL) balance, even if EASY was requested', () => {
    const s = mk('EASY');
    expect(s.setup.diff).toBe('NORMAL');
    expect(playDiff()).toEqual(DIFF.NORMAL);
  });
  it('old saves with EASY/HARD still load, and play at NORMAL', () => {
    const s = mk('NORMAL');
    s.setup.diff = 'EASY' as any;
    const raw = exportSave(s);
    const loaded = importSave(raw);
    expect(loaded.setup.diff).toBe('NORMAL');
  });
  it('heroines address the player by name in text, with honorifics that change by affection', () => {
    const s = mk();
    s.hs.hinata.met = true; s.hs.hinata.callTier = 0;
    expect(render('おはよう、{C}', s, 'hinata', false)).toBe('おはよう、湊くん');
    s.hs.hinata.callTier = 2;
    expect(render('おはよう、{C}', s, 'hinata', false)).toBe('おはよう、湊');
    expect(render('{C}、待ってたよ', s, 'reika', false)).toBe('あなた、待ってたよ');
    // voice string uses readings
    expect(render('おはよう、{C}', s, 'hinata', true)).toBe('おはよう、みなと');
  });
});
