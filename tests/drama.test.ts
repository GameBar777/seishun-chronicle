import { describe, it, expect } from 'vitest';
import { newGame, choose, nextYear } from '../src/engine/game';
import { Rng } from '../src/engine/rng';
import { EVENTS } from '../src/data/events';
import { migrate } from '../src/platform/save';
import type { GameState } from '../src/engine/types';

// Plays like the UI does: moments are consumed (dismissed) as they appear.
function playUI(seed: number) {
  const s = newGame(seed); const rng = new Rng({ rng: seed ^ 0x51 }); const kinds: Record<string, number> = {};
  let years = 0, guard = 0, choices = 0; const healthAtYearStart: number[] = [];
  while (s.phase !== 'dead' && guard++ < 2000) {
    for (const m of s.moments.splice(0)) kinds[m.kind] = (kinds[m.kind] ?? 0) + 1;
    if (s.active) { choose(s, rng.int(0, s.active.choices.length - 1)); choices++; }
    else if (s.phase === 'yearEnd') { healthAtYearStart.push(s.p.health); nextYear(s); years++; }
    else break;
  }
  return { s, kinds, years, choices, lastHealth: healthAtYearStart[healthAtYearStart.length - 1] ?? 100 };
}
const runs = Array.from({ length: 300 }, (_, i) => playUI(1000 + i * 37));

describe('drama & feel (v3)', () => {
  it('echo flashbacks fire in typical lives', () => {
    const withEcho = runs.filter(r => (r.kinds.echo ?? 0) > 0).length;
    expect(withEcho / runs.length).toBeGreaterThan(0.8);
  });
  it('something notable happens in most years', () => {
    const frac = runs.map(r => r.s.stats.notableYears / Math.max(1, r.s.stats.yearsPlayed));
    expect(frac.reduce((a, b) => a + b, 0) / frac.length).toBeGreaterThan(0.7);
    expect(frac.filter(f => f < 0.5).length / frac.length).toBeLessThan(0.1);
  });
  it('no unfair deaths: healthy people never die before 40, early deaths are rare', () => {
    const early = runs.filter(r => r.s.p.age < 40);
    for (const r of early) expect(r.lastHealth, `seed death at ${r.s.p.age}`).toBeLessThan(40);
    expect(runs.filter(r => r.s.p.age < 50).length / runs.length).toBeLessThan(0.03);
  });
  it('drama events never hurt health or kill anyone', () => {
    for (const e of EVENTS.filter(e => e.drama || e.id === 'dream_pick')) for (const ch of e.choices) {
      expect((ch.fx?.health ?? 0) >= 0, e.id).toBe(true);
      const src = String(ch.run ?? ''); expect(/killNpc|health\(-|deathCause/.test(src), e.id).toBe(false);
    }
  });
  it('every life picks a dream and it shows up in the review', () => {
    for (const r of runs) { expect(r.s.dream, 'dream').toBeTruthy(); expect(r.s.pendingSummary?.dream?.name).toBeTruthy(); }
    expect(runs.filter(r => r.s.dream?.done).length).toBeGreaterThan(10);
  });
  it('headlines pop when the world changes, and rival / first-love / stranger arcs complete', () => {
    expect(runs.filter(r => (r.kinds.headline ?? 0) > 0).length / runs.length).toBeGreaterThan(0.9);
    for (const id of ['drama_rival_3', 'drama_first_love_2', 'drama_stranger_returns', 'drama_letter_3', 'drama_lottery'])
      expect(runs.some(r => r.s.evHist[id]), id).toBe(true);
  });
  it('tempo: about 1-2 choices per year (a life is ~10-15 minutes)', () => {
    const cpy = runs.reduce((a, r) => a + r.choices / Math.max(1, r.years), 0) / runs.length;
    expect(cpy).toBeGreaterThan(1); expect(cpy).toBeLessThan(2.4);
  });
  it('v2 saves migrate to v3', () => {
    const s: any = JSON.parse(JSON.stringify(newGame(5))); delete s.moments; delete s.dream; delete s.yearMark; delete s.stats.notableYears; s.version = 2;
    const m = migrate(s) as GameState; expect(m.version).toBe(3); expect(m.moments).toEqual([]); expect(m.dream).toBeNull(); expect(m.stats.notableYears).toBe(0);
  });
});
