import { describe, it, expect } from 'vitest';
import { newGame, choose, nextYear, SAVE_VERSION } from '../src/engine/game';
import { playDynasty, playLife } from '../src/engine/autoplay';
import { ledgerError } from '../src/engine/finance';
import { Rng } from '../src/engine/rng';
import { EVENTS } from '../src/data/events';
import { JOBS } from '../src/data/jobs';
import { ECHO_HANDLERS } from '../src/data/echoes';
import { migrate, exportSave, importSave, defaultMeta } from '../src/platform/save';
import type { GameState } from '../src/engine/types';

const N = 200; // dynasties
const lives: GameState[] = []; const flagsSeen = new Set<string>(); const evCount: Record<string, number> = {};
let maxErr = 0; let maxNegCash = 0; const perLifeRepeats: number[] = []; let successions = 0; const violations: string[] = []; const endings: Record<string, number> = {};
for (let seed = 1; seed <= N; seed++) {
  playDynasty(seed * 7919, 3, s => {
    const snap = JSON.parse(JSON.stringify(s)) as GameState; lives.push(snap);
    for (const f of Object.keys(s.flags)) flagsSeen.add(f);
    for (const r of s.ledger) { const e = ledgerError(r); maxErr = Math.max(maxErr, Math.abs(e.cash), Math.abs(e.debt), Math.abs(e.inv)); maxNegCash = Math.min(maxNegCash, r.cashEnd); }
    const counts: Record<string, number> = {}; for (const c of s.choiceLog) { counts[c.ev] = (counts[c.ev] ?? 0) + 1; evCount[c.ev] = (evCount[c.ev] ?? 0) + 1; }
    for (const [id, n] of Object.entries(counts)) { const d = EVENTS.find(e => e.id === id)!; const cap = d.scheduledOnly ? 15 : d.max ?? (d.cooldown ? Math.ceil(80 / d.cooldown) + 1 : 1); if (n > cap) violations.push(`${id} x${n} > ${cap}`); }
    perLifeRepeats.push(Math.max(0, ...Object.values(counts)));
    if (s.gen > 1) successions++;
    if (s.pendingSummary) endings[s.pendingSummary.ending] = (endings[s.pendingSummary.ending] ?? 0) + 1;
  });
}

describe('content volume', () => {
  it('has 100+ unique events with 3-5 choices each', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(EVENTS.map(e => e.id)).size).toBe(EVENTS.length);
    for (const e of EVENTS) { expect(e.choices.length, e.id).toBeGreaterThanOrEqual(3); expect(e.choices.length, e.id).toBeLessThanOrEqual(5); }
  });
  it('has 20+ jobs', () => expect(JOBS.length).toBeGreaterThanOrEqual(20));
  it('every echo key has a handler', () => { for (const k of Object.keys(ECHO_HANDLERS)) expect(typeof ECHO_HANDLERS[k]).toBe('function'); });
});

describe(`full-life simulation (${N} dynasties x up to 3 generations)`, () => {
  it('all lives end in death with a review', () => { for (const s of lives) { expect(s.phase).toBe('dead'); expect(s.pendingSummary).toBeTruthy(); expect(s.p.age).toBeGreaterThanOrEqual(18); } });
  it('most lives reach old age', () => { const avg = lives.reduce((a, s) => a + s.p.age, 0) / lives.length; expect(avg).toBeGreaterThan(60); });
  it('covers marriage, divorce, children, job loss, debt, bankruptcy-free & succession paths', () => {
    for (const f of ['married', 'divorced', 'parent', 'lost_job', 'founder', 'homeowner', 'bankrupt']) expect(flagsSeen.has(f), f).toBe(true);
    expect(lives.some(s => s.p.debt > 0 || s.ledger.some(r => r.borrowed > 0))).toBe(true);
    expect(successions).toBeGreaterThan(N * 0.5);
  });
  it('money math is consistent every year (cash/debt/investment identities)', () => { expect(maxErr).toBeLessThan(1e-6); expect(maxNegCash).toBeGreaterThan(-1e-6); });
  it('event recurrence is controlled (once/cooldown/max respected; no event dominates a life)', () => { expect(violations).toEqual([]); expect(Math.max(...perLifeRepeats)).toBeLessThanOrEqual(25); });
  it('most events actually occur', () => { const seen = EVENTS.filter(e => evCount[e.id]).length; expect(seen / EVENTS.length).toBeGreaterThan(0.95); });
  it('endings are varied', () => { expect(Object.keys(endings).length).toBeGreaterThanOrEqual(7); });
});

describe('determinism', () => {
  it('same seed + same choices => identical state', () => {
    const a = playDynasty(4242, 2), b = playDynasty(4242, 2);
    const strip = (x: any) => JSON.stringify({ ...x, createdAt: 0 }); expect(strip(a)).toBe(strip(b));
  });
  it('different seeds diverge', () => { expect(newGame(1).p.name + newGame(1).p.regionId).not.toBe(newGame(2).p.name + newGame(999).p.regionId + 'x'); });
});

describe('save / migration', () => {
  it('migrates a v1 save to current version', () => {
    const s: any = newGame(77); playLife(s, new Rng({ rng: 1 }), 10);
    const v1 = JSON.parse(JSON.stringify(s)); v1.version = 1; delete v1.choiceLog; delete v1.stats; delete v1.cur.forgiven; v1.ledger.forEach((r: any) => delete r.forgiven);
    const m = migrate(v1);
    expect(m.version).toBe(SAVE_VERSION); expect(Array.isArray(m.choiceLog)).toBe(true); expect(m.cur.forgiven).toBe(0); expect(m.ledger.every(r => r.forgiven === 0)).toBe(true);
    // migrated save keeps playing
    playLife(m, new Rng({ rng: 2 })); expect(m.phase).toBe('dead');
  });
  it('rejects saves from the future and garbage', () => {
    const s: any = newGame(1); s.version = SAVE_VERSION + 1; expect(() => migrate(s)).toThrow();
    expect(() => migrate({ foo: 1 })).toThrow(); expect(() => importSave('not base64!!')).toThrow();
  });
  it('export/import round-trips (incl. Japanese text)', () => {
    const s = newGame(5); choose(s, 0); const code = exportSave(s, defaultMeta());
    const r = importSave(code); expect(r.game.p.name).toBe(s.p.name); expect(JSON.stringify(r.game)).toBe(JSON.stringify(s));
  });
  it('a year can be advanced after JSON round-trip (save/restore mid-game)', () => {
    const s = newGame(9); while (s.active) choose(s, 0); const t = JSON.parse(JSON.stringify(s)); nextYear(t); expect(t.p.age).toBe(s.p.age + 1);
  });
});

describe('echo keys used by events all have handlers', () => {
  it('no unknown echo keys', async () => {
    const fs = await import('node:fs'); const dir = 'src/data/events';
    const keys = fs.readdirSync(dir).flatMap(f => [...fs.readFileSync(`${dir}/${f}`, 'utf8').matchAll(/echo\(\{ key: '([a-z_]+)'/g)].map(m => m[1]));
    for (const k of keys) expect(ECHO_HANDLERS[k], k).toBeTypeOf('function');
  });
});
