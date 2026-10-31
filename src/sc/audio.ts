// BGM・主題歌・効果音：外部素材を使わず WebAudio で生成するオリジナル曲（メロディ／対旋律／パッド／アルペジオ／ベース／ドラム＋リバーブ・コンプ）
let ctx: AudioContext | null = null, bgmGain: GainNode | null = null, seGain: GainNode | null = null, timer: any = null, noise: AudioBuffer | null = null;
const hz = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
let rev: ConvolverNode | null = null, revSend: GainNode | null = null, music: GainNode | null = null;
function ensure() {
  if (ctx) return ctx; const AC = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext; if (!AC) return null;
  ctx = new AC(); const c = ctx!; bgmGain = c.createGain(); seGain = c.createGain(); music = c.createGain(); music.gain.value = 1;
  // マスター：ローシェルフ＋コンプ／リバーブ（生成したインパルス応答）
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3.5; comp.attack.value = .01; comp.release.value = .25;
  const warm = c.createBiquadFilter(); warm.type = 'lowshelf'; warm.frequency.value = 220; warm.gain.value = 2.5;
  const air = c.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 7000; air.gain.value = -3;
  rev = c.createConvolver(); const len = c.sampleRate * 2.6, ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2) * (i < c.sampleRate * .012 ? i / (c.sampleRate * .012) : 1); }
  rev.buffer = ir; revSend = c.createGain(); revSend.gain.value = .32; const revOut = c.createGain(); revOut.gain.value = .55;
  music.connect(warm); warm.connect(air); air.connect(bgmGain); music.connect(revSend); revSend.connect(rev); rev.connect(revOut); revOut.connect(bgmGain);
  bgmGain.connect(comp); comp.connect(c.destination); seGain.connect(c.destination);
  noise = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}
function panTo(p: number): AudioNode { if (!(ctx as any).createStereoPanner) return music!; const n = ctx!.createStereoPanner(); n.pan.value = p; n.connect(music!); return n; }
export function setVolumes(master: number, bgm: number, se: number) { if (!ensure()) return; bgmGain!.gain.value = master * bgm * 0.62; seGain!.gain.value = master * se * 0.25; }

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
    { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'V'], mel: ['3 - 2 3 5 - 3 2', '1 - 2 3 2 - 0 0', '3 - 2 3 5 - 6 5', '5 - - 3 2 - 0 0', '6 - 5 6 8 - 6 5', '3 - 2 3 5 - 3 -', '4 - 3 2 1 - 2 3', '2 - - - 0 0 0 5'],
      lyrics: ['桜の坂道　名前を呼ばれて', '振り向いた春が　始まりの合図', 'ぎこちない「おはよう」　まだ知らない', 'この道が　君へと続くこと'] },
    { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'ii', 'V'], mel: ['6 - 6 5 6 - 8 -', '8 - 7 6 5 - 0 0', '5 - 5 4 5 - 6 -', '5 - - 3 2 - 0 0', '6 - 6 5 6 - 8 -', '9 - 8 7 8 - 6 -', '6 - 7 8 9 - 10 -', '9 - - - - - 0 5'],
      lyrics: ['教室の窓に　映る横顔', '言えない言葉が　胸で跳ねてる', '夕焼けの屋上　風が背中押す', '「明日こそ」ってまた　空に誓った'] },
    { chords: ['IV', 'V', 'iii', 'vi', 'IV', 'V', 'I', 'I', 'IV', 'V', 'iii', 'vi', 'ii', 'V', 'IV', 'I'],
      mel: ['8 - 8 9 10 - 9 8', '9 - 8 7 5 - 0 5', '8 - 8 9 10 - 12 -', '12 - 10 9 10 - 0 0', '11 - 10 9 8 - 6 8', '9 - 8 9 7 - 5 -', '8 - - - 10 - 9 8', '8 - - - 0 0 0 5',
        '8 - 8 9 10 - 9 8', '9 - 8 7 5 - 0 5', '8 - 8 9 10 - 12 -', '12 - 10 9 10 - 0 10', '11 - 12 11 10 - 9 8', '9 - 10 11 12 - 13 -', '12 - - - 10 - 9 -', '8 - - - - - 0 0'],
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
function tone(type: OscillatorType, f: number, t: number, len: number, peak: number, dest: AudioNode, a = .01, detune = 0) { const o = ctx!.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; const g = env(t, peak, a, len); o.connect(g); g.connect(dest); o.start(t); o.stop(t + a + len + .05); }
function lead(kind: Song['lead'], n: number, t: number, len: number, vol = 1, pan = 0) {
  const f = hz(n), out = panTo(pan);
  if (kind === 'bell') { tone('sine', f, t, len * 1.2 + .4, .2 * vol, out); tone('sine', f * 2, t, .5, .05 * vol, out); tone('sine', f * 3.01, t, .18, .025 * vol, out); tone('triangle', f, t, len + .2, .05 * vol, out, .02, 7); }
  else if (kind === 'piano') { const lp = ctx!.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(900, t + len + .4); lp.connect(out);
    tone('triangle', f, t, len + .5, .2 * vol, lp, .004); tone('sawtooth', f, t, len * .6 + .2, .03 * vol, lp, .004, 4); tone('sine', f * 2, t, .3, .05 * vol, out, .004); }
  else { const o = ctx!.createOscillator(), v = ctx!.createOscillator(), vg = ctx!.createGain(); o.type = 'sine'; o.frequency.value = f; v.frequency.value = 5.2; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * .007, t + .25); v.connect(vg); vg.connect(o.frequency); const g = env(t, .17 * vol, .05, len + .15); o.connect(g); g.connect(out);
    const br = ctx!.createBufferSource(); br.buffer = noise; const bf = ctx!.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = f * 2; bf.Q.value = 3; const bg = env(t, .02 * vol, .03, .12); br.connect(bf); bf.connect(bg); bg.connect(out); br.start(t); br.stop(t + .2);
    o.start(t); v.start(t); o.stop(t + len + .4); v.stop(t + len + .4); }
}
function pad(notes: number[], t: number, len: number, bright = 1200) {
  const lp = ctx!.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(bright * .6, t); lp.frequency.linearRampToValueAtTime(bright, t + len * .5); lp.frequency.linearRampToValueAtTime(bright * .7, t + len); lp.Q.value = 1.5;
  lp.connect(music!);
  notes.forEach((n, i) => [-8, 8].forEach(dt => { const o = ctx!.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(n); o.detune.value = dt; const pn = (ctx as any).createStereoPanner ? ctx!.createStereoPanner() : null; const g = ctx!.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.013, t + .5); g.gain.setValueAtTime(.013, t + len - .3); g.gain.linearRampToValueAtTime(0.0001, t + len + .2); o.connect(g); if (pn) { pn.pan.value = (dt > 0 ? .5 : -.5) * (i % 2 ? 1 : .6); g.connect(pn); pn.connect(lp); } else g.connect(lp); o.start(t); o.stop(t + len + .3); }));
}
function bass(n: number, t: number, len: number, peak = .3) { const lp = ctx!.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.connect(music!); tone('triangle', hz(n), t, len, peak, lp, .006); tone('sine', hz(n), t, len, peak * .7, lp, .006); tone('sawtooth', hz(n), t, len * .5, peak * .12, lp, .006); }
function drum(kind: 'k' | 's' | 'h' | 'o' | 'c' | 't', t: number, vel = 1, tune = 0) {
  const c = ctx!;
  if (kind === 'k') { const o = c.createOscillator(), g = env(t, .55 * vel, .002, .3); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .18); o.connect(g); g.connect(music!); o.start(t); o.stop(t + .35); return; }
  if (kind === 't') { const o = c.createOscillator(), g = env(t, .3 * vel, .002, .25); o.frequency.setValueAtTime(220 - tune * 30, t); o.frequency.exponentialRampToValueAtTime(110 - tune * 15, t + .2); o.connect(g); g.connect(panTo(.4 - tune * .3)); o.start(t); o.stop(t + .3); return; }
  if (kind === 's') { const o = c.createOscillator(), g0 = env(t, .12 * vel, .001, .08); o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(160, t + .08); o.connect(g0); g0.connect(music!); o.start(t); o.stop(t + .12); }
  const s = c.createBufferSource(); s.buffer = noise; const f = c.createBiquadFilter();
  const cfg = { s: ['bandpass', 1900, .22, .16], h: ['highpass', 8000, .05, .04], o: ['highpass', 7000, .06, .22], c: ['highpass', 5000, .1, 1.3] }[kind as 's'] as [BiquadFilterType, number, number, number];
  f.type = cfg[0]; f.frequency.value = cfg[1]; const g = env(t, cfg[2] * vel, .001, cfg[3]); s.connect(f); f.connect(g); g.connect(kind === 'h' || kind === 'o' ? panTo(.3) : music!); s.start(t); s.stop(t + cfg[3] + .1);
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
      const sw = si % 2 === 1 && song.drums === 1 ? step * .12 : 0, t = next + sw; // 軽いスウィング
      const phrase = bi % 8, fill = phrase === 7, inChorus = song.chords.length >= 16 && bi >= song.chords.length - 16;
      if (si === 0) { if (song.pad) pad([chord[0] - 12, ...chord.slice(1).map(n => n - 12), chord[0]], next, step * 8, inChorus ? 1700 : 1200); bass(chord[0] - 24, next, step * 2.6); }
      if (si === 3 && song.drums) bass(chord[0] - 24, t, step * .8, .2);
      if (si === 4) bass(chord[song.minor ? 0 : 2] - 24 - (song.minor ? 0 : 12), next, step * 2.5, .24);
      if (si === 6 && song.drums === 2) bass(chord[1] - 24, t, step * 1.5, .2);
      if (song.arp) { const pat = [0, 1, 2, 1, 3 % chord.length, 2, 1, 2]; tone('sine', hz(chord[pat[si] % chord.length] + 12), t, step * 1.4, .042, panTo(si % 2 ? .45 : -.45)); }
      if (!song.arp && (si === 2 || si === 6)) chord.forEach((n, k) => tone('triangle', hz(n), t, step * 1.2, .04, panTo(k * .3 - .3)));
      if (song.drums) {
        if (bi === 0 && si === 0 && slot > 0 || (inChorus && bi === song.chords.length - 16 && si === 0)) drum('c', next, .8);
        if (fill && si >= 4) { if (song.drums === 2) { drum('t', t, .8, si - 4); drum('s', t + step / 2, .5); } else drum('s', t, .4 + si * .08); }
        else {
          if (si === 0 || (song.drums === 2 && (si === 3 || si === 5))) drum('k', t, si === 0 ? 1 : .7);
          if (si === 4 || (song.drums === 2 && si === 7 && phrase % 2)) drum('s', t, si === 4 ? 1 : .35);
          if (song.drums === 2 || si % 2 === 0) drum(si === 6 && phrase % 4 === 3 ? 'o' : 'h', t, si % 2 ? .6 : 1);
        }
      } else if (song.pad && si === 0 && phrase % 4 === 0) drum('c', next, .25);
      for (const nt of bars[bi % bars.length]) if (nt.at === si) {
        lead(song.lead, root + 12 + nt.semi, next, step * nt.len, 1, -.08);
        // 対旋律：3度下（スケール内）をサビ・後半のみ薄く重ねる
        if ((inChorus || phrase >= 4) && nt.len >= 2) { const d = song.minor ? MIN : MAJ; const deg = ((nt.semi % 12) + 12) % 12; const idx = d.reduce((bst, v, k) => Math.abs(v - deg) < Math.abs(d[bst] - deg) ? k : bst, 0); const low = d[(idx + 5) % 7] - (idx + 5 >= 7 ? 0 : 12); lead(song.lead === 'bell' ? 'flute' : 'bell', root + 12 + nt.semi - deg + low, next + .01, step * nt.len, .45, .35); }
      }
      slot++; next += step;
      if (slot >= total && !loop) { const end = opts.onEnd; setTimeout(() => { stopBgm(); end?.(); }, 2500); clearInterval(timer); timer = null; return; }
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
