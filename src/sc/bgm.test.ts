import { describe, it, expect } from 'vitest';
// @ts-ignore node types are not installed; vitest runs on node
import { existsSync, statSync } from 'node:fs';
import { bgmForAct, bgmForScene, BGM_KEYS, SE_KEYS } from './bgm';
const base = { title: '', text: '', sadN: 0, confess: false };
describe('scene → BGM', () => {
  it('actions', () => {
    expect(bgmForAct('bun', 0)).toBe('study'); expect(bgmForAct('club', 0)).toBe('club'); expect(bgmForAct('rest', 0)).toBe('night'); expect(bgmForAct('job', 0)).toBe('evening'); expect(bgmForAct(undefined, 0)).toBe('school');
  });
  it('scenes', () => {
    expect(bgmForScene({ ...base, kind: 'ending', endingId: 'bad' })).toBe('bad_end');
    expect(bgmForScene({ ...base, kind: 'ending', endingId: 'good' })).toBe('good_end');
    expect(bgmForScene({ ...base, kind: 'event', confess: true })).toBe('confession');
    expect(bgmForScene({ ...base, kind: 'event', sadN: 2 })).toBe('sad');
    expect(bgmForScene({ ...base, kind: 'event', rival: true })).toBe('rival');
    expect(bgmForScene({ ...base, kind: 'date', loc: 'amuse' })).toBe('date');
    expect(bgmForScene({ ...base, kind: 'date', loc: 'festival', season: '夏' })).toBe('festival');
    expect(bgmForScene({ ...base, kind: 'date', loc: 'shrine', season: '冬' })).toBe('winter');
    expect(bgmForScene({ ...base, kind: 'date', loc: 'cafe' })).toBe('cafe');
    expect(bgmForScene({ ...base, kind: 'event', title: '文化祭' })).toBe('festival');
    expect(bgmForScene({ ...base, kind: 'event', tod: 'evening' })).toBe('tender');
    expect(bgmForScene({ ...base, kind: 'story', bg: 'room', tod: 'night' })).toBe('night');
    expect(bgmForScene({ ...base, kind: 'story', bg: 'gym' })).toBe('club');
    expect(bgmForScene({ ...base, kind: 'story', bg: 'classroom', tod: 'day' })).toBe('school');
  });
  it('every track and SE file exists and is reasonably small', () => {
    for (const k of BGM_KEYS) { const f = `public/audio/bgm/${k}.mp3`; expect(existsSync(f), f).toBe(true); expect(statSync(f).size).toBeLessThan(4_200_000); }
    for (const k of SE_KEYS) { const f = `public/audio/se/${k}.mp3`; expect(existsSync(f), f).toBe(true); expect(statSync(f).size).toBeLessThan(200_000); }
  });
});
