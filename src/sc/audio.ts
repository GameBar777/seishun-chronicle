// BGM・効果音：外部素材を使わず WebAudio で生成（著作権フリー）
let ctx: AudioContext | null = null, bgmGain: GainNode | null = null, seGain: GainNode | null = null, timer: any = null;
const CHORDS: Record<string, number[][]> = { 春: [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]], 夏: [[62, 66, 69, 73], [59, 62, 66, 69], [64, 67, 71, 74], [57, 61, 64, 69]], 秋: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 64]], 冬: [[59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 67], [54, 57, 61, 64]] };
const hz = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
function ensure() { if (ctx) return ctx; const AC = (window as any).AudioContext || (window as any).webkitAudioContext; if (!AC) return null; ctx = new AC(); bgmGain = ctx!.createGain(); seGain = ctx!.createGain(); bgmGain.connect(ctx!.destination); seGain.connect(ctx!.destination); return ctx; }
export function setVolumes(master: number, bgm: number, se: number) { if (!ensure()) return; bgmGain!.gain.value = master * bgm * 0.12; seGain!.gain.value = master * se * 0.25; }
export function playBgm(season: string) {
  if (!ensure()) return; stopBgm(); let i = 0; const ch = CHORDS[season] || CHORDS['春'];
  const tick = () => { const c = ctx!; const t = c.currentTime; ch[i % ch.length].forEach((n, k) => { const o = c.createOscillator(), g = c.createGain(); o.type = k === 0 ? 'sine' : 'triangle'; o.frequency.value = hz(n - (k === 0 ? 12 : 0)); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.3, t + 0.8); g.gain.linearRampToValueAtTime(0, t + 3.8); o.connect(g); g.connect(bgmGain!); o.start(t); o.stop(t + 4); }); i++; };
  tick(); timer = setInterval(tick, 4000);
}
export function stopBgm() { if (timer) clearInterval(timer); timer = null; }
export function se(kind: 'select' | 'good' | 'bad' | 'bomb') {
  if (!ensure()) return; const c = ctx!, t = c.currentTime; const seq = { select: [76], good: [72, 76, 79], bad: [64, 60], bomb: [40, 36] }[kind];
  seq.forEach((n, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = kind === 'bomb' ? 'sawtooth' : 'sine'; o.frequency.value = hz(n); g.gain.setValueAtTime(0.4, t + i * 0.09); g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.3); o.connect(g); g.connect(seGain!); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.32); });
}
export function resume() { ensure()?.resume?.(); }
