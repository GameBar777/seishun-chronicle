// Tiny feedback layer: generated WebAudio SFX (off by default) + DOM micro-animations.
let ac: AudioContext | null = null;
export type Sfx = 'tap' | 'good' | 'bad' | 'echo' | 'year' | 'news' | 'ach';
const SEQ: Record<Sfx, [number, number, number][]> = { // [freq Hz, start s, dur s]
  tap: [[660, 0, 0.05]], good: [[523, 0, 0.09], [784, 0.08, 0.14]], bad: [[330, 0, 0.12], [247, 0.1, 0.2]],
  echo: [[392, 0, 0.5], [587, 0.18, 0.5], [880, 0.36, 0.7]], year: [[440, 0, 0.08], [660, 0.07, 0.12]], news: [[880, 0, 0.04], [880, 0.08, 0.04], [660, 0.16, 0.08]],
  ach: [[659, 0, 0.1], [784, 0.09, 0.1], [1047, 0.18, 0.22]],
};
export function sfx(kind: Sfx, on: boolean) {
  if (!on) return;
  try {
    ac = ac ?? new (window.AudioContext || (window as any).webkitAudioContext)(); const t0 = ac.currentTime + 0.01;
    for (const [f, st, d] of SEQ[kind]) { const o = ac.createOscillator(), g = ac.createGain(); o.type = kind === 'echo' ? 'sine' : 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + st); g.gain.exponentialRampToValueAtTime(0.12, t0 + st + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + st + d);
      o.connect(g).connect(ac.destination); o.start(t0 + st); o.stop(t0 + st + d + 0.05); }
  } catch { /* audio unavailable */ }
}
export const prefersReduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
export function floatDelta(host: Element | null, d: number, fmt: (n: number) => string = n => (n > 0 ? '+' : '') + Math.round(n)) {
  if (!host || !Math.round(d)) return; const el = document.createElement('span'); el.className = 'float ' + (d > 0 ? 'up' : 'down'); el.textContent = fmt(d);
  host.appendChild(el); setTimeout(() => el.remove(), 1300);
}
export function flash(host: Element | null, good: boolean) { if (!host) return; host.classList.remove('fl-up', 'fl-down'); void (host as HTMLElement).offsetWidth; host.classList.add(good ? 'fl-up' : 'fl-down'); }
export function rollNumber(el: HTMLElement | null, from: number, to: number, fmt: (n: number) => string, ms = 700) {
  if (!el || from === to) return; const t0 = performance.now();
  const step = (t: number) => { const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); };
  el.textContent = fmt(from); requestAnimationFrame(step);
}
export function bump(el: Element | null, cls: 'shake' | 'glow') { if (!el) return; el.classList.remove(cls); void (el as HTMLElement).offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 900); }
export function splash(html: string, ms = 1300) {
  const el = document.createElement('div'); el.className = 'ysplash'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = html; document.body.appendChild(el); setTimeout(() => el.remove(), ms);
}
