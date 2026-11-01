import { describe, it, expect } from 'vitest';
// @ts-ignore node types are not installed; vitest runs on node
import { readFileSync, existsSync } from 'node:fs';
import { outfitFor, OUTFITS, OUTFIT_HEROINES } from './outfit';
import { cal } from './time';
import { LOC_BG } from './bg';

describe('outfitFor', () => {
  it('classroom/school scenes are always uniform, never swimsuit', () => {
    for (let m = 1; m <= 12; m++) for (const bg of ['classroom', 'gate', 'gym', 'ground', 'rooftop'])
      for (const vacation of [false, true]) expect(outfitFor({ bg, month: m, vacation, text: '海で泳ぎたいね' })).toBe('u');
  });
  it('summer festival / fireworks dates → yukata, never uniform', () => {
    expect(outfitFor({ kind: 'date', loc: 'festival', month: 8 })).toBe('yk');
    expect(outfitFor({ kind: 'event', bg: 'festival', month: 7, vacation: true, text: '夏祭りの夜' })).toBe('yk');
    expect(outfitFor({ kind: 'event', bg: 'town', month: 8, vacation: true, text: '花火大会に行こう' })).toBe('yk');
  });
  it('初詣 (shrine in winter) → winter casual', () => {
    expect(outfitFor({ kind: 'date', loc: 'shrine', month: 1, text: '初詣' })).toBe('cw');
  });
  it('sea in summer → swimsuit; sea in winter → casual', () => {
    expect(outfitFor({ kind: 'date', loc: 'sea', month: 8 })).toBe('sw');
    expect(outfitFor({ kind: 'date', loc: 'sea', month: 11 })).toBe('cw');
  });
  it('school pool class → uniform (no school-swimsuit art); vacation pool → swimsuit', () => {
    expect(outfitFor({ bg: 'pool', month: 7, vacation: false, text: 'プールの授業' })).toBe('u');
    expect(outfitFor({ bg: 'pool', month: 8, vacation: true, text: 'プールに遊びに' })).toBe('sw');
  });
  it('dates use season-matched casual for every loc and month', () => {
    for (const loc of Object.keys(LOC_BG)) for (let m = 1; m <= 12; m++) {
      const o = outfitFor({ kind: 'date', loc, month: m });
      expect(o).not.toBe('u');
      if (o === 'cs' || o === 'cw') expect(o).toBe(m >= 4 && m <= 9 ? 'cs' : 'cw');
      if (o === 'sw' || o === 'yk') expect(m >= 6 && m <= 9).toBe(true);
    }
  });
  it('endings and ordinary weekdays → uniform; vacation days → casual', () => {
    expect(outfitFor({ kind: 'ending', month: 3 })).toBe('u');
    expect(outfitFor({ kind: 'event', bg: 'town', month: 5, text: '放課後' })).toBe('u');
    expect(outfitFor({ kind: 'event', bg: 'town', month: 12, vacation: true })).toBe('cw');
  });
  it('all weeks: swimsuit only in summer, never in school term at school', () => {
    for (let w = 0; w < 156; w++) { const c = cal(w);
      expect(outfitFor({ bg: 'classroom', month: c.m, vacation: c.vacation })).toBe('u'); }
  });
  it('every heroine has all outfit files (+small)', () => {
    for (const h of OUTFIT_HEROINES) for (const o of OUTFITS.filter(o => o !== 'u')) for (const e of ['n', 'h']) for (const s of ['', '-s'])
      expect(existsSync(`public/img/ch/${h}_${o}_${e}${s}.webp`), `${h}_${o}_${e}${s}`).toBe(true);
    expect(readFileSync('src/sc/ui.ts', 'utf8')).toContain('sceneOutfit(');
  });
});

import { newGame, view, resolve, PERSONAS } from './engine';
import { mkDate, afterDate } from './tm4';
import { sceneOutfit } from './outfit';
describe('date sequence keeps one outfit end-to-end (v1.18.1)', () => {
  const mk = (seed: number) => newGame({ sei: '青木', mei: '湊', seiYomi: 'あおき', meiYomi: 'みなと', bm: 4, bd: 2, persona: Object.keys(PERSONAS)[0], look: '', diff: 'NORMAL', seed } as any);
  const cases: [string, number, string][] = [['cafe', 5, 'cs'], ['cafe', 31, 'cw'], ['sea', 18, 'sw'], ['festival', 18, 'yk'], ['shrine', 39, 'cw']];
  for (const [loc, week, want] of cases) it(`${loc} week ${week} → ${want} for date, mini-events, walk home, hand-hold, nanpa, extra`, () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const s = mk(seed); s.week = week; Object.assign(s.hs.hinata, { met: true, friend: 90, toki: 95, trust: 90 });
      s.queue = [mkDate(s, 'hinata', loc)];
      let lastLoc: string | undefined;
      for (let i = 0; i < 40 && s.queue.length; i++) {
        const q = s.queue[0]; const v = view(s); if (!v) break;
        if (q.kind === 'date') lastLoc = q.data.loc;
        if (q.kind !== 'date' && !(q.id === 'tm4')) break; // デート関連の場面が終わった
        seen.add(q.kind === 'date' ? 'date' : q.data.t);
        // 背景推定が学校になっても（最悪ケース）デート服を維持すること
        const o = sceneOutfit(q, { kind: v.kind, loc: q.data?.loc, bg: 'classroom', text: '放課後 授業', month: cal(s.week).m, vacation: false }, s.queue.find(x => x.kind === 'date')?.data?.loc || lastLoc);
        expect(o, `${seed} ${q.kind}/${q.data?.t}`).toBe(want);
        resolve(s, 0);
      }
    }
    expect(seen.has('date')).toBe(true); expect(seen.has('hand')).toBe(true);
  });
  it('follow-up scenes carry the date location (afterDate stamps dloc)', () => {
    const s = mk(3); s.week = 18; Object.assign(s.hs.hinata, { met: true, friend: 90, toki: 95 }); const d = mkDate(s, 'hinata', 'sea'); s.queue = [d];
    afterDate(s, d, 3); for (const q of s.queue.slice(1)) expect(q.data.dloc).toBe('sea');
  });
  it('old saves without dloc fall back to the last date, never uniform', () => {
    expect(sceneOutfit({ kind: 'event', id: 'tm4', data: { t: 'hand' } }, { bg: 'classroom', month: 8 }, 'festival')).toBe('yk');
    expect(sceneOutfit({ kind: 'event', id: 'tm4', data: { t: 'hand' } }, { bg: 'classroom', month: 11 })).toBe('cw');
    expect(sceneOutfit({ kind: 'event', id: 'tm4', data: { t: 'confess' } }, { bg: 'rooftop', month: 2 })).toBe('u');
  });
});

import { tm4Bg } from './tm4';
describe('post-date scene backgrounds (v1.18.2)', () => {
  const SCHOOL = /classroom|gate|gym|ground|rooftop|pool/;
  const locs = ['movie', 'amuse', 'aquarium', 'zoo', 'mall', 'cafe', 'restaurant', 'park', 'sea', 'mountain', 'arcade', 'museum', 'karaoke', 'shrine', 'festival'];
  it('dbl / nanpa / extra / hand never use a school background, and the walk home is evening or night', () => {
    for (const loc of locs) for (const t of ['dbl', 'nanpa', 'extra', 'hand']) {
      const r = tm4Bg({ kind: 'event', id: 'tm4', data: { t, dloc: loc } })!;
      expect(r.bg, `${t}@${loc}`).not.toMatch(SCHOOL);
      if (t !== 'dbl') expect(['evening', 'night']).toContain(r.tod);
    }
    expect(tm4Bg({ kind: 'event', id: 'tm4', data: { t: 'hand' } })!.bg).toBe('river');
    expect(tm4Bg({ kind: 'event', id: 'tm4', data: { t: 'nanpa', dloc: 'sea' } })!.bg).toBe('sea');
    expect(tm4Bg({ kind: 'event', id: 'tm4', data: { t: 'hand', dloc: 'festival' } })!.tod).toBe('night');
    expect(tm4Bg({ kind: 'event', id: 'tm4', data: { t: 'confess' } })!.bg).toBe('rooftop');
    expect(tm4Bg({ kind: 'event', id: 'x', data: {} })).toBeUndefined();
  });
  it('every tm4 scene in an engine-driven date sequence gets a non-school background', () => {
    const s = newGame({ sei: '青木', mei: '湊', seiYomi: 'あおき', meiYomi: 'みなと', bm: 4, bd: 2, persona: Object.keys(PERSONAS)[0], look: '', diff: 'NORMAL' } as any);
    s.week = 60; Object.assign(s.hs.hinata, { met: true, friend: 90, toki: 95 }); const d = mkDate(s, 'hinata', 'cafe'); s.queue = [d];
    afterDate(s, d, 3); const fu = s.queue.filter(q => q.id === 'tm4'); expect(fu.length).toBeGreaterThan(0);
    for (const q of fu) expect(tm4Bg(q)!.bg).not.toMatch(SCHOOL);
  });
});
