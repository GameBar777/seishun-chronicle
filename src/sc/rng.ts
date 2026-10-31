// mulberry32, state kept in GameState.rng for reproducible saves
export function rand(s: { rng: number }): number {
  let t = (s.rng = (s.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const ri = (s: { rng: number }, a: number, b: number) => a + Math.floor(rand(s) * (b - a + 1));
export const pick = <T>(s: { rng: number }, arr: T[]): T => arr[Math.floor(rand(s) * arr.length)];
export const chance = (s: { rng: number }, p: number) => rand(s) < p;
