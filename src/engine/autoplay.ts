import type { GameState } from './types';
import { newGame, choose, nextYear, heirs, succeed } from './game';
import { Rng } from './rng';
/** Plays a state forward with a policy (random by default). Used by tests and the balancing script. */
export function playLife(s: GameState, rng: Rng, maxYears = 120, pick?: (s: GameState) => number) {
  let guard = 0;
  while (s.phase !== 'dead' && guard++ < maxYears * 8) {
    if (s.active) { const n = s.active.choices.length; choose(s, pick ? pick(s) : rng.int(0, n - 1)); }
    else if (s.phase === 'yearEnd') nextYear(s);
    else break;
  }
  return s;
}
export function playDynasty(seed: number, gens = 3, onLife?: (s: GameState) => void) {
  const rng = new Rng({ rng: seed ^ 0x9e37 }); const s = newGame(seed);
  for (let g = 0; g < gens; g++) { playLife(s, rng); onLife?.(s); if (s.phase !== 'dead') break; if (g === gens - 1) break; const h = heirs(s); succeed(s, h.length ? rng.pick(h).id : undefined); }
  return s;
}
