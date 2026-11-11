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
    for (const k of ['魔王魂', 'OtoLogic', 'ElevenLabs', 'Shine Again', 'MIRAi', 'Zen Maru Gothic']) expect(t).toContain(k);
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
describe('wada climax hook', () => {
  const setup = (flag: 'win' | 'lose') => {
    const s = mk(); const h = s.hs.hinata; h.met = true; h.toki = 80; h.trust = 60; h.friend = 70; h.dates = 8;
    s.flags.push('cg:hinata_ask', `wadaClimax:${flag}:hinata`);
    if (flag === 'lose') { h.withRival = true; s.wada = s.wada || ({ m: {}, won: [], out: [] } as any); s.wada!.won.push('hinata'); }
    return s;
  };
  it('lost to wada → bitter rival ending, no confession CGs', () => {
    const s = setup('lose'); const e = judgeEnding(s);
    expect(e.id.startsWith('good') || e.id.startsWith('confess')).toBe(false);
    const m = buildEndingMovie(s, { ...e, h: 'hinata' }, '/');
    expect(m.tier).toBe('rival');
    expect(m.slides.some(x => /_ask|_confess|_kiss/.test(x.img))).toBe(false);
    expect(m.slides.map(x => x.text).join()).toContain('和田');
  });
  it('lose flag forces rival tier even if ending id was good', () => {
    const s = setup('lose'); expect(buildEndingMovie(s, { id: 'good:hinata', title: 'x', h: 'hinata' }, '/').tier).toBe('rival');
  });
  it('won vs wada → keeps good tier and mentions the fight', () => {
    const s = setup('win'); const m = buildEndingMovie(s, { id: 'good:hinata', title: 'x', h: 'hinata' }, '/');
    expect(m.tier).toBe('good'); expect(m.slides.map(x => x.text).join()).toContain('和田との勝負');
  });
});

describe('v1.19.0 theme song credit', () => {
  it('end roll credits the theme song', () => { const t = buildCredits().find(c => c.role === '主題歌')!; expect(t.names[0]).toBe('「Shine Again」 歌：MIRAi'); expect(t.names).toContain('youtube.com/@mirai_official19'); expect(t.names.join()).not.toContain('si='); });
});
