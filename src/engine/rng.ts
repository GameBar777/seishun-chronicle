// Deterministic mulberry32 RNG whose state lives in the save file.
export function nextRand(state: number): [number, number] {
  let t = (state + 0x6d2b79f5) | 0;
  const ns = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, ns];
}
export class Rng {
  constructor(public s: { rng: number }) {}
  next(): number { const [v, ns] = nextRand(this.s.rng); this.s.rng = ns; return v; }
  int(a: number, b: number) { return a + Math.floor(this.next() * (b - a + 1)); }
  chance(p: number) { return this.next() < p; }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  normal(mean = 0, sd = 1) { const u = Math.max(1e-9, this.next()), v = this.next(); return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  weighted<T>(items: T[], w: (t: T) => number): T | null {
    const ws = items.map(w).map(x => (x > 0 && isFinite(x) ? x : 0)); const tot = ws.reduce((a, b) => a + b, 0);
    if (tot <= 0) return null; let r = this.next() * tot;
    for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  }
}
export const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));
