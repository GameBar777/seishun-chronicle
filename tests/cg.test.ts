import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { parseLine, newGame, lineTap } from '../src/sc/engine';
import { CG_LIST, CG_MAP } from '../src/sc/data/cg';
const g = () => newGame({ sei: '佐藤', mei: '翔', seiYomi: 'さとう', meiYomi: 'しょう', bm: 1, bd: 1, persona: '知的', look: '爽やか系', diff: 'NORMAL', seed: 1 } as any);
describe('イベントCG', () => {
  it('cg: lines parse as commands and are never voiced', () => {
    let tapped = 0; lineTap.fn = () => { tapped++; };
    const L = parseLine('cg:hinata_1', g(), 'hinata'); lineTap.fn = undefined;
    expect(L.who).toBe('cg'); expect(L.text).toBe('hinata_1'); expect(L.vid).toBeUndefined(); expect(tapped).toBe(0);
  });
  it('every CG has desktop + mobile webp', () => {
    for (const c of CG_LIST) { expect(existsSync(`public/img/cg/h/${c.id}.webp`)).toBe(true); expect(existsSync(`public/img/cg/h/${c.id}-s.webp`)).toBe(true); }
  });
  it('every cg: reference in scenario data is registered, and every CG is used', () => {
    const used = new Set<string>();
    for (const f of readdirSync('src/sc/data')) for (const m of readFileSync(`src/sc/data/${f}`, 'utf8').matchAll(/'cg:([a-z0-9_]+)'/g)) used.add(m[1]);
    for (const id of used) if (id !== 'off') expect(CG_MAP[id], id).toBeTruthy();
    for (const c of CG_LIST) expect(used.has(c.id), c.id).toBe(true);
  });
});
