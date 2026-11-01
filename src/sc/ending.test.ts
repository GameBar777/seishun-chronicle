import { describe, it, expect } from 'vitest';
// @ts-ignore node types are not installed; vitest runs on node
import { existsSync } from 'node:fs';
import { tierOfEnding, buildCredits, buildEndingMovie, monologue } from './ending';
import { newGame, judgeEnding, PERSONAS } from './engine';
import { HEROINES } from './data';
import { CG_LIST } from './data/cg';

const mk = () => newGame({ sei: '青木', mei: '湊', seiYomi: 'あおき', meiYomi: 'みなと', bm: 4, bd: 2, persona: Object.keys(PERSONAS)[0], look: '', diff: 'NORMAL' } as any);

describe('ending movie', () => {
  it('tiers', () => {
    expect(tierOfEnding('good:hinata')).toBe('good');
    expect(tierOfEnding('bad')).toBe('bad');
  });
  it('credits include asset credits', () => {
    const t = JSON.stringify(buildCredits(mk()));
    for (const k of ['魔王魂', 'OtoLogic', 'ElevenLabs']) expect(t).toContain(k);
  });
  it('monologue uses run data', () => {
    const s = mk(); s.club = '陸上部'; s.hs.hinata.met = true; s.hs.hinata.dates = 6;
    const t = monologue(s, 'good:hinata', 'hinata').join('\n');
    expect(t).toContain('陸上部');
  });
  it('builds slides for every ending kind', () => {
    const s = mk(); const e = judgeEnding(s);
    const m = buildEndingMovie(s, e, '/');
    expect(m.slides.length).toBeGreaterThan(1); expect(m.credits.length).toBeGreaterThan(3);
  });
});
describe('confession illustrations', () => {
  it('every heroine has an _ask CG with files', () => {
    for (const H of HEROINES) {
      expect(CG_LIST.some(c => c.id === `${H.id}_ask`)).toBe(true);
      expect(existsSync(`public/img/cg/h/${H.id}_ask.webp`)).toBe(true);
      expect(existsSync(`public/img/cg/h/${H.id}_ask-s.webp`)).toBe(true);
    }
  });
});
