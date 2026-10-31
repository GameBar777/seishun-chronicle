// BGM・主題歌・効果音：外部素材を使わず WebAudio で生成するオリジナル曲（多重トラック：メロディ／コード／ベース／ドラム）
let ctx: AudioContext | null = null, bgmGain: GainNode | null = null, seGain: GainNode | null = null, timer: any = null, noise: AudioBuffer | null = null;
const hz = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
function ensure() {
  if (ctx) return ctx; const AC = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext; if (!AC) return null;
  ctx = new AC(); bgmGain = ctx!.createGain(); seGain = ctx!.createGain();
  const comp = ctx!.createDynamicsCompressor(); bgmGain.connect(comp); comp.connect(ctx!.destination); seGain.connect(ctx!.destination);
  noise = ctx!.createBuffer(1, ctx!.sampleRate * .5, ctx!.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}
export function setVolumes(master: number, bgm: number, se: number) { if (!ensure()) return; bgmGain!.gain.value = master * bgm * 0.5; seGain!.gain.value = master * se * 0.25; }

// ── 曲データ：度数（長音階 1=主音, 8=1オクターブ上, b=半音下げ）、'-'=伸ばす、0=休符。1小節＝8分音符8つ
type Song = { bpm: number; root: number; minor?: boolean; chords: string[]; mel: string[]; drums: 0 | 1 | 2; lead: 'bell' | 'piano' | 'flute'; pad?: boolean; arp?: boolean };
const CH: Record<string, number[]> = { I: [0, 4, 7], ii: [2, 5, 9], iii: [4, 7, 11], IV: [5, 9, 12], V: [7, 11, 14], vi: [9, 12, 16], i: [0, 3, 7], iv: [5, 8, 12], v: [7, 10, 14], bVI: [8, 12, 15], bVII: [10, 14, 17], bIII: [3, 7, 10], V7: [7, 11, 14, 17], IVM7: [5, 9, 12, 16], Imaj: [0, 4, 7, 11] };
export const SONGS: Record<string, Song> = {
  title: { bpm: 96, root: 60, drums: 1, lead: 'bell', pad: true, arp: true, chords: ['IVM7', 'V', 'iii', 'vi', 'ii', 'V', 'I', 'I'],
    mel: ['6 - 5 - 3 - 5 -', '7 - 6 5 5 - 0 0', '5 - 3 - 2 - 3 -', '6 - 5 3 3 - 0 0', '4 - 3 2 6 - 5 -', '5 - 6 7 9 - 8 7', '8 - - - 5 - 3 -', '1 - - - 0 0 0 0'] },
  school: { bpm: 116, root: 65, drums: 2, lead: 'piano', arp: false, chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'V'],
    mel: ['1 3 5 - 5 6 5 3', '2 - 2 3 4 - 3 2', '3 5 8 - 8 7 6 5', '4 - 3 4 6 - 0 0', '1 3 5 - 5 6 8 6', '5 - 4 3 2 - 3 4', '6 5 4 3 2 3 4 6', '5 - - - 0 0 0 0'] },
  date: { bpm: 104, root: 67, drums: 1, lead: 'flute', arp: true, chords: ['Imaj', 'vi', 'ii', 'V7', 'iii', 'vi', 'IVM7', 'V7'],
    mel: ['3 - 5 6 5 - 3 -', '1 - 3 5 6 - 0 0', '4 - 6 8 7 - 6 -', '5 - - 4 3 2 0 0', '7 - 5 - 3 - 7 -', '8 - 7 6 5 - 3 -', '6 - 8 - 9 - 8 6', '5 - - - 0 0 0 0'] },
  sad: { bpm: 68, root: 57, minor: true, drums: 0, lead: 'piano', pad: true, arp: true, chords: ['i', 'bVI', 'bIII', 'bVII', 'iv', 'i', 'bVI', 'v'],
    mel: ['5 - - 4 3 - 2 -', '1 - - - 0 0 0 0', '3 - - 4 5 - b7 -', '5 - - - 0 0 0 0', '4 - 5 6 5 - 4 3', '3 - 2 - 1 - 0 0', '6 - 5 - 4 - 3 -', '2 - - - - - 0 0'] },
  confession: { bpm: 76, root: 63, drums: 0, lead: 'bell', pad: true, arp: true, chords: ['I', 'iii', 'IV', 'V', 'vi', 'iii', 'IV', 'V7'],
    mel: ['3 - - 2 3 - 5 -', '5 - - 4 3 - 0 0', '6 - - 5 6 - 8 -', '7 - - 6 5 - 0 0', '8 - 7 6 7 - 5 -', '7 - 6 5 6 - 3 -', '4 - 5 6 8 - 9 -', '8 - - - - - 0 0'] },
  ending: { bpm: 84, root: 62, drums: 1, lead: 'bell', pad: true, arp: true, chords: ['IV', 'V', 'iii', 'vi', 'IV', 'V', 'I', 'I', 'IV', 'V', 'iii', 'vi', 'ii', 'V', 'I', 'I'],
    mel: ['8 - 8 7 8 - 9 -', '10 - 9 8 6 - 0 0', '8 - 8 7 8 - 10 -', '12 - 10 9 8 - - 0', '6 - 6 8 9 - 10 -', '9 - 8 6 5 - 0 0', '6 - 8 9 10 - 9 8', '8 - - - - - 0 0', '8 - 8 7 8 - 9 -', '10 - 9 8 6 - 0 0', '8 - 8 7 8 - 10 -', '12 - 10 9 8 - - 0', '6 - 6 8 9 - 10 -', '9 - 8 6 5 - 0 0', '6 - 8 9 10 - 9 8', '8 - - - - - 0 0'] },
};
// 主題歌「千日のプレリュード」（作詞・作曲：本作オリジナル）。歌声は付けず、メロディを楽器で演奏し歌詞を表示する
export const THEME_SONG = {
  title: '千日のプレリュード', bpm: 92, root: 62,
  sections: [
    { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'IV'], mel: ['3 - 3 4 5 - 3 -', '2 - 2 3 4 - 0 0', '3 - 3 4 5 - 8 -', '7 - 6 5 5 - 0 0', '3 - 3 4 5 - 3 -', '2 - 2 3 4 - 3 2', '1 - 2 3 4 - 5 -', '5 - - - 0 0 0 0'],
      lyrics: ['桜の坂道　名前を呼ばれて', '振り向いた春が　始まりの合図', 'ぎこちない「おはよう」　まだ知らない', 'この道が　君へと続くこと'] },
    { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'ii', 'V'], mel: ['6 - 6 5 4 - 3 -', '2 - 3 4 3 - 0 0', '6 - 6 5 4 - 3 2', '2 - - - 0 0 0 0', '6 - 6 8 7 - 6 -', '5 - 6 5 4 - 3 -', '4 - 5 6 7 - 8 -', '9 - - - - - 0 0'],
      lyrics: ['教室の窓に　映る横顔', '言えない言葉が　胸で跳ねてる', '夕焼けの屋上　風が背中押す', '「明日こそ」ってまた　空に誓った'] },
    { chords: ['IV', 'V', 'iii', 'vi', 'IV', 'V', 'I', 'I', 'IV', 'V', 'iii', 'vi', 'ii', 'V', 'I', 'I'], mel: SONGS.ending.mel,
      lyrics: ['君と過ごした　千日の空', '晴れの日も　雨の日も　忘れない', 'いつかこの想い　届くまで', '何度でも　明日へ　走り出す', '君と笑った　千日の夢', '泣いた日も　ケンカも　宝物', '桜がまた咲く　その坂で', 'ありがとう　大好き　言わせてね'] },
  ],
};
function songOfTheme(): Song { const s = THEME_SONG.sections; return { bpm: THEME_SONG.bpm, root: THEME_SONG.root, drums: 2, lead: 'bell', pad: true, arp: true, chords: s.flatMap(x => x.chords), mel: s.flatMap(x => x.mel) }; }
export const themeLyricTimes = () => { const out: { t: number; text: string }[] = []; const bar = 60 / THEME_SONG.bpm * 4; let b = 0; for (const s of THEME_SONG.sections) { const per = s.chords.length / s.lyrics.length; s.lyrics.forEach((l, i) => out.push({ t: (b + i * per) * bar, text: l })); b += s.chords.length; } return { lines: out, total: b * bar }; };

const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
export function degree(tok: string, minor = false): number | null {
  if (tok === '0' || tok === '-') return null; const flat = tok.startsWith('b'); const n = parseInt(flat ? tok.slice(1) : tok, 10); if (!n) return null;
  const sc = minor ? MIN : MAJ; const i = n - 1; return 12 * Math.floor(i / 7) + sc[i % 7] - (flat ? 1 : 0);
}
export function parseBar(bar: string, minor = false) { const toks = bar.trim().split(/\s+/); const notes: { at: number; len: number; semi: number }[] = []; toks.forEach((t, i) => { const d = degree(t, minor); if (d !== null) notes.push({ at: i, len: 1, semi: d }); else if (t === '-' && notes.length) notes[notes.length - 1].len++; }); return notes; }

function env(t: number, peak: number, a: number, d: number) { const g = ctx!.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); return g; }
function tone(type: OscillatorType, f: number, t: number, len: number, peak: number, dest: AudioNode, a = .01) { const o = ctx!.createOscillator(); o.type = type; o.frequency.value = f; const g = env(t, peak, a, len); o.connect(g); g.connect(dest); o.start(t); o.stop(t + a + len + .05); }
function lead(kind: Song['lead'], n: number, t: number, len: number) {
  const f = hz(n);
  if (kind === 'bell') { tone('sine', f, t, len * 1.2 + .3, .22, bgmGain!); tone('sine', f * 2, t, .4, .06, bgmGain!); }
  else if (kind === 'piano') { tone('triangle', f, t, len + .4, .2, bgmGain!); tone('sine', f * 2, t, .25, .05, bgmGain!); }
  else { const o = ctx!.createOscillator(), v = ctx!.createOscillator(), vg = ctx!.createGain(); o.type = 'sine'; o.frequency.value = f; v.frequency.value = 5; vg.gain.value = f * .006; v.connect(vg); vg.connect(o.frequency); const g = env(t, .18, .06, len + .1); o.connect(g); g.connect(bgmGain!); o.start(t); v.start(t); o.stop(t + len + .3); v.stop(t + len + .3); }
}
function pad(notes: number[], t: number, len: number) {
  const lp = ctx!.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200; lp.connect(bgmGain!);
  notes.forEach(n => [-6, 6].forEach(dt => { const o = ctx!.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(n); o.detune.value = dt; const g = ctx!.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.018, t + .4); g.gain.linearRampToValueAtTime(0.0001, t + len); o.connect(g); g.connect(lp); o.start(t); o.stop(t + len + .1); }));
}
function drum(kind: 'k' | 's' | 'h', t: number) {
  if (kind === 'k') { const o = ctx!.createOscillator(), g = env(t, .5, .002, .25); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + .2); o.connect(g); g.connect(bgmGain!); o.start(t); o.stop(t + .3); return; }
  const s = ctx!.createBufferSource(); s.buffer = noise; const f = ctx!.createBiquadFilter(); f.type = kind === 'h' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'h' ? 7000 : 1800; const g = env(t, kind === 'h' ? .07 : .2, .001, kind === 'h' ? .05 : .15); s.connect(f); f.connect(g); g.connect(bgmGain!); s.start(t); s.stop(t + .25);
}
let playing = '', startAt = 0;
export function playBgm(name: string, transpose = 0, opts: { loop?: boolean; onEnd?: () => void } = {}) {
  if (!ensure()) return; const key = name + transpose; if (playing === key && timer) return; stopBgm(); playing = key;
  const song = name === 'theme' ? songOfTheme() : (SONGS[name] || SONGS.school);
  const c = ctx!, step = 60 / song.bpm / 2; let slot = 0, next = c.currentTime + .08; startAt = next; const total = song.chords.length * 8; const loop = opts.loop ?? name !== 'theme';
  const bars = song.mel.map(b => parseBar(b, song.minor));
  const sched = () => {
    while (next < c.currentTime + .15) {
      const bi = Math.floor(slot / 8) % song.chords.length, si = slot % 8, root = song.root + transpose, chord = (CH[song.chords[bi]] || CH.I).map(x => x + root);
      if (si === 0) { if (song.pad) pad(chord.map(n => n - 12), next, step * 8); tone('triangle', hz(chord[0] - 24), next, step * 3.5, .28, bgmGain!); }
      if (si === 4) tone('triangle', hz(chord[song.minor ? 0 : 2] - 24 - (song.minor ? 0 : 12)), next, step * 3, .22, bgmGain!);
      if (song.arp && si % 2 === 1) tone('sine', hz(chord[(si >> 1) % chord.length]), next, step * 1.5, .05, bgmGain!);
      if (!song.arp && (si === 2 || si === 6)) chord.forEach(n => tone('triangle', hz(n), next, step * 1.2, .045, bgmGain!));
      if (song.drums) { if (si === 0 || (song.drums === 2 && si === 5)) drum('k', next); if (si === 4) drum('s', next); if (song.drums === 2 || si % 2 === 0) drum('h', next); }
      for (const nt of bars[bi % bars.length]) if (nt.at === si) lead(song.lead, root + 12 + nt.semi, next, step * nt.len);
      slot++; next += step;
      if (slot >= total && !loop) { const end = opts.onEnd; setTimeout(() => { stopBgm(); end?.(); }, 1500); clearInterval(timer); timer = null; return; }
    }
  };
  sched(); timer = setInterval(sched, 25);
}
export const bgmTime = () => ctx ? ctx.currentTime - startAt : 0;
export const nowPlaying = () => playing;
export function stopBgm() { if (timer) clearInterval(timer); timer = null; playing = ''; }
export function se(kind: 'select' | 'good' | 'bad' | 'bomb' | 'heart' | 'page') {
  if (!ensure()) return; const c = ctx!, t = c.currentTime; const seq = { select: [76], good: [72, 76, 79], bad: [64, 60], bomb: [40, 36], heart: [79, 84, 88], page: [88] }[kind];
  seq.forEach((n, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = kind === 'bomb' ? 'sawtooth' : 'sine'; o.frequency.value = hz(n); g.gain.setValueAtTime(kind === 'page' ? .1 : .4, t + i * 0.09); g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.3); o.connect(g); g.connect(seGain!); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.32); });
}
export function resume() { ensure()?.resume?.(); }
