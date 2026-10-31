import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { parseBar, SONGS, THEME_SONG, themeLyricTimes } from '../src/sc/audio';
import { guessBg, fxFor, LOC_BG } from '../src/sc/bg';
import { HEROINES, LOCATIONS } from '../src/sc/data/index';
describe('assets & music', () => {
  it('portraits and backgrounds exist', () => {
    for (const h of HEROINES) for (const e of 'nhsoab') { expect(existsSync(`public/img/ch/${h.id}_${e}.webp`)).toBe(true); expect(existsSync(`public/img/ch/${h.id}_${e}-s.webp`)).toBe(true); }
    for (const c of ['confess', 'ending', 'fireworks']) expect(existsSync(`public/img/cg/${c}.webp`)).toBe(true);
    for (const k of Object.keys(LOCATIONS)) { const bg = LOC_BG[k]; expect(bg).toBeTruthy(); expect(existsSync(`public/img/bg/${bg}.webp`)).toBe(true); expect(existsSync(`public/img/bg/${bg}-s.webp`)).toBe(true); }
    expect(existsSync('public/thumbnail.png')).toBe(true);
  });
  it('music parses', () => {
    expect(parseBar('1 - 3 0 5 - - 8').length).toBe(4);
    for (const k of ['title', 'school', 'date', 'sad', 'confession', 'ending']) expect((SONGS as any)[k]).toBeTruthy();
    const { lines, total } = themeLyricTimes(); expect(lines.length).toBeGreaterThanOrEqual(16); expect(total).toBeGreaterThan(60);
    for (const sec of THEME_SONG.sections) { expect(sec.mel.length).toBe(sec.chords.length); for (const b of sec.mel) expect(b.split(' ').length).toBe(8); }
    expect(THEME_SONG.title).toBe('千日のプレリュード');
  });
  it('bg guessing', () => {
    expect(guessBg('屋上で風に吹かれた').bg).toBe('rooftop');
    expect(fxFor('冬', '晴れ', 'day', false)).toBe('snow');
  });
});
