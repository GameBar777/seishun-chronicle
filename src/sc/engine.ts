import type { GameState, Setup, HState, StatKey, Scene, Difficulty, Club, Job, Course, Emo } from './types';
import { STAGES } from './types';
import { rand, ri, pick, chance } from './rng';
import { cal, LAST_WEEK, season, fmtDate } from './time';
import { HEROINES, HMAP, LOCATIONS, OUTFITS, CLUBS, JOBS, DATE_FLAVOR } from './data/index';
import { HEVENTS as HEV0 } from './data/hevents';
import { SIDE_EVENTS } from './data/hevents2';
import { SIDE_EVENTS2 } from './data/hevents3';
import { DAILY as DAILY1, DAILY2, DAILY3, DAILY4 } from './data/daily';
import { SISTER } from './data/sister';
import { FRIENDS } from './data/friends';
const DAILY = [...DAILY1, ...DAILY2, ...DAILY3, ...DAILY4, ...SISTER, ...FRIENDS];
const HEVENTS = [...HEV0, ...SIDE_EVENTS, ...SIDE_EVENTS2];
import { CAL } from './data/calendar';
import type { Ev, Eff, Choice } from './data/schema';

export const SAVE_VERSION = 1;
export const DIFF: Record<Difficulty, { gain: number; hurt: number; thr: number; decay: number; rival: number; label: string }> = {
  EASY: { gain: 1.3, hurt: 0.6, thr: 0.85, decay: 0.6, rival: 0.6, label: '攻略しやすい' },
  NORMAL: { gain: 1, hurt: 1, thr: 1, decay: 1, rival: 1, label: '標準' },
  HARD: { gain: 0.85, hurt: 1.35, thr: 1.08, decay: 1.3, rival: 1.3, label: '好感度管理が難しい' },
  'VERY HARD': { gain: 0.75, hurt: 1.6, thr: 1.15, decay: 1.5, rival: 1.6, label: '隠し条件・人間関係の管理が非常に難しい' },
};
export const PERSONAS: Record<string, Partial<Record<StatKey, number>>> = {
  '熱血': { un: 12, kon: 12 }, '知的': { bun: 12, ri: 12 }, '優しい': { moral: 15, kon: 5 }, 'クール': { yo: 15, ri: 5 }, '芸術家肌': { gei: 18 }, 'お調子者': { yo: 6, un: 6, moral: -5 },
};
export interface Line { who: string; name: string; emo: Emo; text: string; voice: string; color: string; vid?: string }
/** 収録ボイスのID：話者＋差し込み前の台本テキストのハッシュ（scripts/voice-*.ts と共通） */
export function voiceId(who: string, tpl: string): string {
  const str = who + '|' + tpl; let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}
/** 台本収集用フック（ゲーム本体では未使用） */
export const lineTap: { fn?: (who: string, tpl: string, emo: Emo, ctxH?: string) => void } = {};
export interface View { kind: Scene['kind']; title: string; h?: string; lines: Line[]; choices: string[] }

// ───────── 基本 ─────────
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const newH = (): HState => ({ met: false, friend: 0, toki: 0, hurt: 0, trust: 10, dates: 0, events: 0, points: 0, bomb: 0, lastContact: 0, rival: 0, withRival: false, impression: '', lastLocs: [], mem: [], flags: [], callTier: 0, gotBirthday: -1 });
export function newGame(setup: Setup): GameState {
  const stats: Record<StatKey, number> = { bun: 40, ri: 40, gei: 30, yo: 35, un: 40, kon: 40, hp: 80, st: 20, moral: 50, exp: 0 };
  for (const [k, v] of Object.entries(PERSONAS[setup.persona] || {})) stats[k as StatKey] += v as number;
  const s: GameState = {
    v: SAVE_VERSION, setup, week: 0, rng: (setup.seed ?? Math.floor(Math.random() * 1e9)) | 0, stats, money: 10000,
    club: '帰宅部', job: '', jobDays: 0, course: '', courseResult: '',
    hs: Object.fromEntries(HEROINES.map(h => [h.id, newH()])), seen: [], flags: [], diary: [], queue: [],
    sick: 0, slump: 0, injury: 0, rumor: 0, weather: '晴れ', phoneUsed: false, dateBooked: null,
    exams: [], tournaments: [], outfits: ['カジュアル'], ended: false, lastLog: [], actionCounts: {},
  };
  const hi = s.hs.hinata; Object.assign(hi, { met: true, friend: 32, trust: 30, toki: 8 });
  s.queue.push({ kind: 'event', id: 'opening' });
  diary(s, `${setup.sei}${setup.mei}、星見ヶ丘学園に入学。`);
  return s;
}
export const diary = (s: GameState, text: string) => s.diary.push({ week: s.week, text });
export const year = (s: GameState) => cal(s.week).Y;
export function stage(h: HState): typeof STAGES[number] {
  if (!h.met) return '他人';
  if (h.toki >= 85 && h.trust >= 60 && h.friend >= 55) return '夢中';
  if (h.toki >= 65 && h.friend >= 45) return '好き';
  if (h.toki >= 40) return '気になる存在';
  if (h.friend >= 55) return '親友';
  if (h.friend >= 25) return '友人';
  return '顔見知り';
}
export const tierOf = (h: HState) => { const i = STAGES.indexOf(stage(h)); return i >= 5 ? 2 : i >= 3 ? 1 : 0; };
export function render(t: string, s: GameState, hid: string | undefined, reading: boolean): string {
  const st = s.setup; const S = reading ? st.seiYomi || st.sei : st.sei; const M = reading ? st.meiYomi || st.mei : st.mei;
  let callT = '{S}くん';
  if (hid && HMAP[hid]) callT = HMAP[hid].call[s.hs[hid].callTier] ?? HMAP[hid].call[0];
  return t.replace(/\{C\}/g, callT).replace(/\{S\}/g, S).replace(/\{M\}/g, M);
}
const NPC_COLOR = '#636e72';
export function parseLine(raw: string, s: GameState, ctxH?: string): Line {
  if (raw.startsWith('cg:')) return { who: 'cg', name: '', emo: '通常', text: raw.slice(3).trim(), voice: '', color: '' };
  const m = raw.match(/^(@[^:(]+|[a-z]+)(?:\(([^)]+)\))?:([\s\S]*)$/);
  let who = 'n', emo: Emo = '通常', text = raw;
  if (m) { who = m[1]; emo = (m[2] as Emo) || '通常'; text = m[3]; }
  if (who === 'h') who = ctxH || 'n';
  const hid = HMAP[who] ? who : ctxH;
  let name = '', color = '#b2bec3';
  if (HMAP[who]) { const H = HMAP[who]; const hs = s.hs[who]; name = hs.met || who === ctxH ? `${H.sei} ${H.mei}` : '？？？'; color = H.color; }
  else if (who === 'me') { name = `${s.setup.sei} ${s.setup.mei}`; color = '#0984e3'; }
  else if (who.startsWith('@')) { name = who === '@田中' ? '井上' : who.slice(1); color = NPC_COLOR; }
  const speakerH = HMAP[who] ? who : hid;
  if (lineTap.fn) lineTap.fn(who, text, emo, ctxH);
  return { who, name, emo, text: render(text, s, speakerH, false), voice: render(text, s, speakerH, true), color, vid: voiceId(who, text) };
}

// ───────── 効果の適用 ─────────
export interface Notice { text: string; important?: boolean }
export function gainStat(s: GameState, k: StatKey, v: number) {
  let d = v;
  if (v > 0 && !['hp', 'st'].includes(k)) { if (s.slump > 0) d *= 0.5; if (s.stats.hp < 30) d *= 0.7; d *= DIFF[s.setup.diff].gain > 1 ? 1.1 : 1; }
  const cap = ['hp', 'st'].includes(k) ? 100 : k === 'moral' ? 100 : 999;
  s.stats[k] = clamp(Math.round((s.stats[k] + d) * 10) / 10, 0, cap);
}
export function applyH(s: GameState, id: string, e: { f?: number; t?: number; tr?: number; h?: number; pt?: number; rival?: number }, contact = true) {
  const H = HMAP[id], h = s.hs[id], g = DIFF[s.setup.diff].gain;
  if (!h.met) return;
  const prevStage = stage(h);
  if (e.f) h.friend = clamp(h.friend + (e.f > 0 ? e.f * H.rate.f * g : e.f), 0, 100);
  if (e.t) h.toki = clamp(h.toki + (e.t > 0 ? e.t * H.rate.t * g * attraction(s, id) : e.t), 0, 100);
  if (e.tr) h.trust = clamp(h.trust + e.tr, 0, 100);
  if (e.h) h.hurt = clamp(h.hurt + (e.h > 0 ? e.h * DIFF[s.setup.diff].hurt : e.h), 0, 100);
  if (e.pt) h.points += e.pt;
  if (e.rival) h.rival = clamp(h.rival + e.rival, 0, 100);
  if (contact) { h.lastContact = s.week; }
  if (h.bomb > 0 && h.hurt < 40) { h.bomb = 0; s.lastLog.push(`💣 ${H.sei}${H.mei}の爆弾が解除された`); }
  const ns = stage(h);
  if (ns !== prevStage) s.lastLog.push(`💗 ${H.sei}${H.mei}との関係：${prevStage} → ${ns}`);
  const nt = tierOf(h);
  if (nt > h.callTier) { h.callTier = nt; s.lastLog.push(`📣 ${H.sei}${H.mei}の呼び方が「${render(H.call[nt], s, undefined, false)}」に変わった`); diary(s, `${H.sei}${H.mei}が初めて「${render(H.call[nt], s, undefined, false)}」と呼んだ。`); }
}
/** 能力が好みの水準にどれだけ届いているか（0.5〜1.4）。時期によって要求が上がる */
export function attraction(s: GameState, id: string): number {
  const H = HMAP[id]; const prog = 0.35 + 0.65 * Math.min(1, s.week / LAST_WEEK);
  let r = 0, n = 0;
  for (const [k, need] of Object.entries(H.demand)) { r += Math.min(1.5, s.stats[k as StatKey] / ((need as number) * prog * DIFF[s.setup.diff].thr)); n++; }
  const v = n ? r / n : 1; return clamp(0.4 + v * 0.6, 0.5, 1.4) * (s.rumor > 0 ? 0.8 : 1);
}
export function applyEff(s: GameState, e: Eff | undefined, ctxH?: string) {
  if (!e) return;
  const id = e.to || ctxH;
  if (e.stats) for (const [k, v] of Object.entries(e.stats)) gainStat(s, k as StatKey, v as number);
  if (e.money) s.money = Math.max(0, s.money + e.money);
  if (e.flag) {
    if (e.flag.startsWith('club:')) { s.club = e.flag.slice(5) as Club; diary(s, `${s.club}に入部した。`); if (s.club === '陸上部') meet(s, 'kaho'); }
    else if (e.flag.startsWith('course:')) { s.course = e.flag.slice(7) as Course; diary(s, `進路を「${s.course}」に決めた。`); }
    else if (e.flag.startsWith('outfit:')) { const o = e.flag.slice(7); if (!s.outfits.includes(o)) s.outfits.push(o); }
    else if (!s.flags.includes(e.flag)) s.flags.push(e.flag);
  }
  if (id && s.hs[id]) {
    applyH(s, id, { f: e.f, t: e.t, tr: e.tr, h: e.h, pt: e.pt ?? 1, rival: e.rival }, !e.nc);
    if (e.hflag && !s.hs[id].flags.includes(e.hflag)) s.hs[id].flags.push(e.hflag);
    if (e.mem) s.hs[id].mem.push({ week: s.week, ...e.mem });
  }
  if (e.others) for (const h of HEROINES) if (h.id !== id && s.hs[h.id].met) applyH(s, h.id, { f: e.others.f, t: e.others.t }, false);
}
export function meet(s: GameState, id: string) {
  const h = s.hs[id]; if (h.met) return; h.met = true; h.friend = 8; h.trust = 10; h.lastContact = s.week;
  h.impression = HMAP[id].initialImpression; diary(s, `${HMAP[id].sei}${HMAP[id].mei}と出会った。`); s.lastLog.push(`✨ ${HMAP[id].sei}${HMAP[id].mei}と知り合った`);
}

// ───────── 行動 ─────────
export interface Action { id: string; label: string; desc: string; ok: boolean; why?: string }
export function actions(s: GameState): Action[] {
  const a: Action[] = [
    { id: 'bun', label: '文系の勉強', desc: '文系↑ ストレス↑ 体調↓', ok: true },
    { id: 'ri', label: '理系の勉強', desc: '理系↑ ストレス↑ 体調↓', ok: true },
    { id: 'art', label: '芸術活動', desc: '芸術↑', ok: true },
    { id: 'train', label: '筋力トレーニング', desc: '運動・根性↑ 体調↓↓', ok: s.injury === 0, why: 'ケガ中' },
    { id: 'run', label: 'ランニング', desc: '運動↑ ストレス↓ 体調↓', ok: s.injury === 0, why: 'ケガ中' },
    { id: 'fashion', label: 'ファッション研究', desc: '容姿↑ 所持金-3000', ok: s.money >= 3000, why: 'お金が足りない' },
    { id: 'club', label: `部活動（${s.club}）`, desc: CLUBS[s.club].note, ok: s.injury === 0 || s.club === '帰宅部', why: 'ケガ中' },
    { id: 'job', label: s.job ? `アルバイト（${s.job}）` : 'アルバイト（未登録）', desc: s.job ? `収入${JOBS[s.job].pay}円・${JOBS[s.job].note}` : '先にバイト先を決める', ok: !!s.job && s.injury === 0, why: s.job ? 'ケガ中' : 'バイト先未登録' },
    { id: 'rest', label: '休養', desc: '体調↑↑ ストレス↓↓', ok: true },
    { id: 'hobby', label: '趣味', desc: 'ストレス↓ 芸術・経験値少し↑', ok: true },
    { id: 'talk', label: 'ヒロインと交流（話しかける）', desc: '自由入力で会話できる', ok: HEROINES.some(h => s.hs[h.id].met && !s.hs[h.id].withRival) },
  ];
  return a;
}
const ACTION_GAIN: Record<string, Partial<Record<StatKey, number>>> = {
  bun: { bun: 8, st: 5, hp: -3 }, ri: { ri: 8, st: 5, hp: -3 }, art: { gei: 8, st: 1, hp: -2 },
  train: { un: 5, kon: 5, yo: 1, hp: -7, st: 1 }, run: { un: 6, kon: 3, hp: -5, st: -4 }, fashion: { yo: 7, st: -3 },
  rest: { hp: 28, st: -22 }, hobby: { st: -14, gei: 2, hp: 5 },
};
export function setJob(s: GameState, j: Job | '') { s.job = j; if (j) diary(s, `${j}でアルバイトを始めた。`); }
export function buyOutfit(s: GameState, o: string): boolean { const O = OUTFITS[o]; if (!O || s.outfits.includes(o) || s.money < O.cost) return false; s.money -= O.cost; s.outfits.push(o); diary(s, `服（${o}）を買った。`); return true; }

/** 1週間を進める。sceneがあれば UI は先に queue を処理する */
export function doWeek(s: GameState, act: string, talkTo?: string): string[] {
  if (s.ended || s.queue.length) return ['（先に進行中のイベントを終わらせてください）'];
  s.lastLog = [];
  const res: string[] = [];
  if (s.sick > 0) { act = 'rest'; res.push('🤒 体調を崩して寝込んでいる……（強制休養）'); s.sick--; }
  const A = actions(s).find(x => x.id === act);
  if (!A) return ['不明な行動'];
  if (!A.ok && s.sick === 0 && !res.length) return [`その行動はできない：${A.why}`];
  s.actionCounts[act] = (s.actionCounts[act] || 0) + 1;
  gainStat(s, 'exp', 1);
  if (ACTION_GAIN[act]) for (const [k, v] of Object.entries(ACTION_GAIN[act])) gainStat(s, k as StatKey, (v as number) + (v as number > 3 ? ri(s, -1, 2) : 0));
  if (act === 'fashion') s.money -= 3000;
  if (act === 'club') for (const [k, v] of Object.entries(CLUBS[s.club].gain)) gainStat(s, k as StatKey, v as number);
  if (act === 'job' && s.job) { const J = JOBS[s.job]; s.money += J.pay; s.jobDays += 5; for (const [k, v] of Object.entries(J.gain)) gainStat(s, k as StatKey, v as number); }
  if (act === 'talk' && talkTo && s.hs[talkTo]?.met) { s.queue.push({ kind: 'chat', id: 'chat', h: talkTo, step: 0 }); applyH(s, talkTo, { f: 2, h: -12 }); }
  res.push(`${A.label}をした。`);
  s.lastLog.unshift(act);
  // 体調・ストレス
  if (s.stats.hp < 20 && chance(s, 0.5)) { s.sick = ri(s, 1, 2); res.push('🤒 無理がたたって熱が出た。しばらく休むことになりそうだ。'); diary(s, '体調を崩して寝込んだ。'); }
  if (['train', 'run', 'club'].includes(act) && s.club !== '帰宅部' && s.stats.hp < 35 && chance(s, 0.25)) { s.injury = 3; res.push('🩹 足をひねってケガをした。3週間は運動できない。'); diary(s, 'ケガをした。'); }
  if (s.stats.st > 85 && s.slump === 0) { s.slump = 3; gainStat(s, 'st', -15); res.push('🌀 スランプに陥った……何をやっても身につかない（3週間、成長半減）'); diary(s, 'スランプに陥った。'); }
  else if (s.slump > 0) s.slump--;
  if (s.injury > 0 && act !== 'train') s.injury = Math.max(0, s.injury - 1);
  gainStat(s, 'hp', 3); // 自然回復
  weeklyHeroines(s, res);
  if (s.dateBooked) { const d = s.dateBooked; s.queue.push({ kind: 'date', id: 'date', h: d.h, step: 0, data: { loc: d.loc, score: 0, order: shuffle(s, [0, 1, 2, 3, 4]).slice(0, 3) } }); s.dateBooked = null; }
  // 次の週へ
  s.week++; s.phoneUsed = false;
  s.weather = rollWeather(s);
  if (s.week < LAST_WEEK) scheduleScenes(s);
  if (s.week >= LAST_WEEK) s.queue.push({ kind: 'ending', id: 'ending' });
  return res.concat(s.lastLog.slice(1));
}
const shuffle = <T>(s: GameState, a: T[]) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand(s) * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
function rollWeather(s: GameState) { const m = cal(s.week).m; const r = rand(s); const rainy = m === 6 ? 0.55 : m === 9 ? 0.35 : 0.22; if (r < rainy) return (m === 12 || m <= 2) && r < 0.08 ? '雪' : '雨'; return r < rainy + 0.25 ? 'くもり' : '晴れ'; }

function weeklyHeroines(s: GameState, res: string[]) {
  const D = DIFF[s.setup.diff];
  const close = HEROINES.filter(h => s.hs[h.id].met && (s.hs[h.id].toki >= 30 || s.hs[h.id].friend >= 40)).length;
  for (const H of HEROINES) {
    const h = s.hs[H.id]; if (!h.met || h.withRival) continue;
    const gap = s.week - h.lastContact;
    if (gap > 3 && chance(s, 0.5)) h.friend = clamp(h.friend - H.decay * D.decay, 0, 100);
    if (gap > 5 && h.toki > 20 && chance(s, 0.3)) h.toki = clamp(h.toki - 0.5 * D.decay, 0, 100);
    // 傷心：親しい相手ほど、知り合いが多いほど溜まりやすい
    if ((h.friend >= 25 || h.toki >= 25) && gap > 3) h.hurt = clamp(h.hurt + (1.5 + h.toki / 25) * D.hurt * (close >= 3 ? 1.6 : close >= 2 ? 1.25 : 1), 0, 100);
    else if (gap <= 2) h.hurt = clamp(h.hurt - 2, 0, 100);
    if (h.hurt >= 60 && h.bomb === 0) { h.bomb = 1; s.lastLog.push(`💣 ${H.sei}${H.mei}に爆弾が点火した……`); diary(s, `${H.sei}${H.mei}の様子がおかしい。`); }
    else if (h.bomb > 0) {
      h.bomb++;
      if (h.bomb > 4) explode(s, H.id, res);
    }
    // 能力によるときめきの自然変動（4週ごと）
    if (s.week % 4 === 0 && h.friend >= 20) { const a = attraction(s, H.id); if (a >= 1.05) h.toki = clamp(h.toki + 1, 0, 100); else if (a < 0.75 && h.toki > 25) h.toki = clamp(h.toki - 1, 0, 100); }
    // ライバル（2年目から）
    if (s.week >= 52 && H.id !== 'shizuku' && h.friend >= 15) {
      const pace = h.toki >= 60 ? -1 : (0.25 + (60 - h.toki) / 120) * D.rival * (gap > 4 ? 1.5 : 1);
      const before = h.rival; h.rival = clamp(h.rival + pace, 0, 100);
      if (before < 50 && h.rival >= 50) s.lastLog.push(`⚠ 噂：${H.rivalName}が${H.sei}${H.mei}に近づいているらしい`);
      if (before < 80 && h.rival >= 80) s.lastLog.push(`⚠⚠ ${H.sei}${H.mei}と${H.rivalName}が二人で歩いていたという噂……`);
      if (h.rival >= 100 && h.toki < 65) { h.withRival = true; h.bomb = 0; s.lastLog.push(`💔 ${H.sei}${H.mei}が${H.rivalName}と付き合い始めた`); diary(s, `${H.sei}${H.mei}が${H.rivalName}と付き合い始めたと聞いた。`); }
    }
  }
  if (s.rumor > 0) s.rumor--;
}
function explode(s: GameState, id: string, res: string[]) {
  const H = HMAP[id], h = s.hs[id];
  h.bomb = 0; h.hurt = 30; h.friend = clamp(h.friend - 30, 0, 100); h.toki = clamp(h.toki - 30, 0, 100); h.trust = clamp(h.trust - 20, 0, 100);
  h.flags.push('exploded'); s.rumor = 8; s.flags.push('explode:' + id);
  for (const o of HEROINES) if (o.id !== id && s.hs[o.id].met) { s.hs[o.id].friend = clamp(s.hs[o.id].friend - 8, 0, 100); s.hs[o.id].toki = clamp(s.hs[o.id].toki - 4, 0, 100); }
  res.push(`💥 ${H.sei}${H.mei}の爆弾が爆発した！「${render(H.explodeLine, s, id, false)}」`);
  res.push('📢 「あいつ、何人もの女子に思わせぶりなことしてるらしいよ」——悪い噂が学校中に広まった。（しばらく全員のときめきが上がりにくい）');
  diary(s, `${H.sei}${H.mei}を深く傷つけてしまった。悪い噂が広まった。`);
}

// ───────── イベントのスケジューリング ─────────
const ALL_EV: Ev[] = [...CAL, ...DAILY, ...HEVENTS];
export const EVMAP: Record<string, Ev> = Object.fromEntries(ALL_EV.map(e => [e.id, e]));
const AUTO_MEET: Record<string, (s: GameState) => boolean> = { mio: s => s.week >= 0, rin: s => s.week >= 1 };
export function scheduleScenes(s: GameState) {
  const c = cal(s.week);
  // 自動の出会い
  if (!s.seen.includes('meet_rin') && !s.queue.some(q => q.id === 'meet_rin')) { s.queue.push({ kind: 'event', id: 'meet_rin' }); }
  // カレンダー
  for (const e of [...CAL, ...DAILY]) if (!s.seen.includes(e.id) && !s.queue.some(q => q.id === e.id) && e.cond(s)) s.queue.push({ kind: 'event', id: e.id });
  // テスト
  const exam = (c.m === 5 && c.n === 3) || (c.m === 7 && c.n === 2) || (c.m === 10 && c.n === 3) || (c.m === 12 && c.n === 1) || (c.m === 2 && c.n === 4 && c.Y <= 2);
  if (exam) s.queue.push({ kind: 'msg', id: 'exam' });
  // 大会・コンクール
  if (s.club !== '帰宅部' && ((c.m === 7 && c.n === 3) || (c.m === 11 && c.n === 4)) && !s.tournaments.some(t => t.startsWith(`${s.week}:`))) s.queue.push({ kind: 'msg', id: 'tournament' });
  // 誕生日
  const wkStart = cal(s.week).date.getTime();
  for (const H of HEROINES) {
    const h = s.hs[H.id]; if (!h.met || h.withRival || h.friend < 25 || h.gotBirthday === c.Y) continue;
    const bd = new Date(c.date.getFullYear(), H.birthday[0] - 1, H.birthday[1]).getTime();
    if (bd >= wkStart && bd < wkStart + 7 * 86400000) s.queue.push({ kind: 'event', id: 'birthday', h: H.id });
  }
  // 個別イベント（1週1件。前回から3週以上）
  const lastH = Number(s.flags.find(f => f.startsWith('lastHE:'))?.slice(7) ?? -99);
  const cands = HEVENTS.filter(e => !s.seen.includes(e.id) && !s.queue.some(q => q.id === e.id) && e.cond(s) && (e.id.endsWith('_meet') || s.week - lastH >= 3) && !(e.h && s.hs[e.h].flags.includes('exploded') && /_[34]$/.test(e.id) && s.week - (s.hs[e.h].lastContact) < 6));
  cands.sort((a, b) => (b.prio || 0) - (a.prio || 0));
  if (cands.length) { s.queue.push({ kind: 'event', id: cands[0].id }); }
  // 街での偶然の遭遇
  const metH = HEROINES.filter(h => s.hs[h.id].met && !s.hs[h.id].withRival);
  if (metH.length && chance(s, 0.18) && s.queue.length === 0) s.queue.push({ kind: 'msg', id: 'encounter', h: pick(s, metH).id });
  // 健太の噂（ヒント）
  if (s.week % 9 === 4) s.queue.push({ kind: 'msg', id: 'rumor' });
  // 妹・芽衣の恋愛相談（家での好感度ヒント）
  if (s.week % 9 === 8 && s.week > 2) s.queue.push({ kind: 'msg', id: 'sister' });
}

// ───────── シーン表示 ─────────
export function view(s: GameState): View | null {
  const sc = s.queue[0]; if (!sc) return null;
  if (sc.kind === 'event') {
    if (sc.id === 'opening') return { kind: 'event', title: 'プロローグ　春、星見ヶ丘', lines: OPENING.map(l => parseLine(l, s, 'hinata')), choices: ['春日ひなたに「おはよう」と返す', '「寝ぐせなんてついてない」と言い返す'] };
    if (sc.id === 'meet_rin') return { kind: 'event', title: '隣の席の少女', h: 'rin', lines: MEET_RIN.map(l => parseLine(l, s, 'rin')), choices: ['「よろしく」と笑いかける', '黙って教科書を出す'] };
    if (sc.id === 'birthday') return birthdayView(s, sc.h!);
    const e = EVMAP[sc.id];
    if (e.h === 'mio' || e.id === 'club_select') { /* noop */ }
    const ls = (e.dynLines ? e.dynLines(s) : []).concat(e.lines);
    return { kind: 'event', title: e.title, h: e.h, lines: ls.map(l => parseLine(l, s, e.h)), choices: choicesOf(s, e).map(c => c.label) };
  }
  if (sc.kind === 'msg') return msgView(s, sc);
  if (sc.kind === 'date') return dateView(s, sc);
  if (sc.kind === 'chat') { const H = HMAP[sc.h!]; const h = s.hs[sc.h!]; return { kind: 'chat', title: `${H.sei}${H.mei}と話す`, h: sc.h, lines: [parseLine(`h(${tierOf(h) ? '嬉' : '通常'}):${pick(s, H.greet[tierOf(h)])}`, s, sc.h)], choices: ['会話を終える'] }; }
  if (sc.kind === 'ending') { const e = judgeEnding(s); return { kind: 'ending', title: e.title, h: e.h, lines: e.lines.map(l => parseLine(l, s, e.h)), choices: ['タイトルへ戻る'] }; }
  return null;
}
const OPENING = [
  'n:四月。汐見市、星見ヶ丘学園。坂の上の校舎まで、桜並木がまっすぐ続いている。',
  'n:今日から高校生。これからの三年間——およそ千日——が、どんな日々になるのかはまだ誰も知らない。',
  'h(嬉):おっはよー、{C}！ ……ちょっと、入学式の日まで寝ぐせ？',
  'n:三軒隣のパン屋の娘、春日ひなた。物心ついた頃からの幼なじみだ。',
  'h(照):同じ高校でよかったね。……ま、また三年間よろしく。',
  'n:入学式。壇上では、生徒会の新入生代表として一人の少女が挨拶をしていた。',
  'mio:新入生代表、氷室澪です。本校の伝統に恥じぬよう、規律ある学校生活を——',
  '@健太:{S}、見ろよ。あれが噂の首席入学。氷室澪だってよ。……目が合ったら凍りそう',
  'n:中学からの親友、早乙女健太。顔よし性格よしで女子にも人気なのに、本人だけがそれに気づいていない。噂話と女子の情報にはやたら詳しく、相談にも乗ってくれるいいやつだ。',
  '@健太:困ったら俺に電話しろ。誰がお前をどう思ってるか、ちょっとくらいは教えてやるよ',
];
const MEET_RIN = [
  'n:最初のホームルーム。隣の席の少女は、一度もこちらを見なかった。',
  'h(冷):……黒瀬。よろしくとか、いいから。',
  'n:ノートの隅に、小さな折り鶴の絵が描かれていた。',
];
function choicesOf(s: GameState, e: Ev): Choice[] {
  const base = e.dyn ? e.dyn(s) : e.choices;
  return base.filter(c => !c.need || c.need(s));
}
function birthdayView(s: GameState, id: string): View {
  const H = HMAP[id];
  return { kind: 'event', title: `${H.sei}${H.mei}の誕生日（${H.birthday[0]}月${H.birthday[1]}日）`, h: id,
    lines: [parseLine(`n:今週は${H.sei}${H.mei}の誕生日だ。プレゼントを渡そうか。`, s, id), parseLine(`h(${tierOf(s.hs[id]) ? '照' : '通常'}):あれ、{C}。どうしたの？`, s, id)],
    choices: [`${H.gift.good}（3000円）`, `${H.gift.bad}（8000円）`, '花束（2000円）', 'おめでとうと言うだけ'] };
}
function msgView(s: GameState, sc: Scene): View {
  const L = (x: string, h?: string) => parseLine(x, s, h);
  if (sc.id === 'exam') {
    if (!sc.data) { const tot = 240; const prog = Math.min(1, s.week / LAST_WEEK); const avg = 2 * (55 + 120 * prog); const sc2 = s.stats.bun + s.stats.ri + ri(s, -25, 25) - (s.stats.hp < 30 ? 20 : 0); const z = (sc2 - avg) / (40 + 40 * prog); const rank = clamp(Math.round(tot / 2 - z * 70), 1, tot); sc.data = { rank, tot }; s.exams.push({ week: s.week, rank, total: tot }); diary(s, `定期テスト：学年${rank}位／${tot}人。`); }
    const { rank, tot } = sc.data; const lines = [L(`n:定期テストの結果が貼り出された。学年 ${rank}位／${tot}人。`)];
    if (s.hs.mio.met) lines.push(L(rank <= 10 ? 'mio(驚):{C}……やるじゃない。次は負けないわ' : rank <= 60 ? 'mio:悪くないわね。でも、まだ上を目指せるはずよ' : 'mio(冷):……この順位で満足していないでしょうね', 'mio'));
    if (rank > 180 && s.hs.hinata.met) lines.push(L('hinata:{C}、補習だね……ドンマイ！', 'hinata'));
    return { kind: 'msg', title: '定期テスト', lines, choices: ['次へ'] };
  }
  if (sc.id === 'tournament') {
    if (!sc.data) { const c = cal(s.week); const key = ['美術部', '写真部', '吹奏楽部'].includes(s.club) ? 'gei' : 'un'; const v = s.stats[key as StatKey] + s.stats.kon * 0.4 + ri(s, -20, 20); const lvl = v > 260 ? '県大会優勝' : v > 190 ? '県大会入賞' : v > 130 ? '地区大会突破' : '初戦敗退'; sc.data = { lvl }; s.tournaments.push(`${s.week}:${c.Y}年${c.m}月 ${s.club} ${lvl}`); diary(s, `${s.club}の大会：${lvl}。`); if (lvl !== '初戦敗退') { gainStat(s, 'kon', 4); for (const h of HEROINES) if (s.hs[h.id].met) applyH(s, h.id, { t: lvl === '県大会優勝' ? 4 : 2 }, false); } else gainStat(s, 'st', 8); }
    return { kind: 'msg', title: `${s.club}　大会・コンクール`, lines: [L(`n:${s.club}の大会。結果は……${sc.data.lvl}。`), L(sc.data.lvl === '初戦敗退' ? 'n:悔しさで眠れなかった。' : 'n:仲間と肩を叩き合った。この瞬間のために練習してきたんだ。')], choices: ['次へ'] };
  }
  if (sc.id === 'encounter') {
    const H = HMAP[sc.h!], h = s.hs[sc.h!]; const c = cal(s.week);
    const place = pick(s, ['廊下で', '昇降口で', '購買の前で', '帰り道で', '図書室で', '駅前で']);
    if (!sc.data) { sc.data = { g: pick(s, H.greet[tierOf(h)]) }; applyH(s, sc.h!, { f: 1, h: -3 }); }
    const ls = [L(`n:${place}${H.sei}${H.mei}とばったり会った。（${c.m}月・${s.weather}）`), L(`h(${h.bomb ? '哀' : tierOf(h) ? '嬉' : '通常'}):${h.bomb ? H.bombLine : sc.data.g}`, sc.h)];
    return { kind: 'msg', title: '偶然の出会い', h: sc.h, lines: ls, choices: ['次へ'] };
  }
  if (sc.id === 'sister') return { kind: 'msg', title: '芽衣の恋愛相談', lines: sisterLines(s).map(x => L(x)), choices: ['次へ'] };
  if (sc.id === 'rumor') return { kind: 'msg', title: '健太の情報', lines: rumorLines(s).map(x => L(x)), choices: ['次へ'] };
  return { kind: 'msg', title: '', lines: [], choices: ['次へ'] };
}
export function sisterLines(s: GameState): string[] {
  const M = '@芽衣'; const out: string[] = [];
  const Y = cal(s.week).Y;
  out.push(pick(s, ['n:夜。リビングでテレビを見ていると、芽衣がプリンを片手に隣に座った。', 'n:夕食の後、芽衣が「で、最近どうなの」と身を乗り出してきた。', 'n:日曜の昼。芽衣が、こちらのスマホをのぞき込もうとしている。']));
  const met = HEROINES.filter(h => s.hs[h.id].met && !s.hs[h.id].withRival).sort((a, b) => s.hs[b.id].toki - s.hs[a.id].toki);
  if (!met.length) { out.push(`${M}:……お兄、女の子の知り合い、ひとりもいないの？ ……やば。まずは話しかけるとこからだよ`); return out; }
  const src = Y >= 2 ? '学校で聞いたんだけど' : '友達のお姉ちゃん情報だけど';
  for (const H of met.slice(0, 2)) {
    const h = s.hs[H.id]; const t = h.toki; const nm = H.mei;
    const mood = h.bomb > 0 ? `……${nm}さん、最近お兄の話になると黙っちゃうんだって。何かしたでしょ。早く連絡しなよ`
      : t >= 70 ? `${nm}さん、お兄の名前が出ると真っ赤になるらしいよ。……これ、もう時間の問題じゃない？`
      : t >= 50 ? `${nm}さん、お兄のこと「気になる」って言ってたらしい。……いいとこまで来てるよ`
      : t >= 30 ? `${nm}さんにとって、お兄は「仲のいい友達」くらいかな。もう一押し、デートとか誘ってみたら？`
      : t >= 15 ? `${nm}さん、お兄のこと「悪い人じゃない」くらいには思ってるみたい`
      : `${nm}さん？ ……お兄のこと、まだ顔と名前が一致してるか怪しいレベルだよ`;
    out.push(`${M}:${src}、${mood}`);
  }
  const top = met[0]; const hh = s.hs[top.id];
  if (s.week - hh.lastContact > 6) out.push(`${M}:あと、${top.mei}さんとしばらく話してないでしょ。女の子は、放っておかれるのが一番こたえるんだからね`);
  else if (s.stats.st > 120) out.push(`${M}:……てかお兄、顔疲れてるよ。たまには休みなよ`);
  else out.push(pick(s, [`${M}:……情報料は、プリン一個ね。前払いで`, `${M}:べつに応援してるわけじゃないからね。お兄がフラれて落ち込むと、家が暗くなるから`, `${M}:誕生日、ちゃんとチェックしときなよ。女の子は覚えてるからね、そういうの`]));
  return out;
}
export function rumorLines(s: GameState): string[] {
  const out: string[] = [];
  const met = HEROINES.filter(h => s.hs[h.id].met);
  const bombs = met.filter(h => s.hs[h.id].bomb > 0);
  if (bombs.length) out.push(`@健太:おい{S}、${bombs.map(h => h.sei).join('と')}の様子、最近おかしくないか？ ……お前、何かしたろ。早めに電話でもしとけ`);
  const best = met.filter(h => !s.hs[h.id].withRival).sort((a, b) => s.hs[b.id].toki - s.hs[a.id].toki)[0];
  if (best) { const t = s.hs[best.id].toki; out.push(`@健太:${best.sei}${best.mei}、${t >= 65 ? 'お前の話するとき顔赤いぞ。マジで' : t >= 40 ? 'お前のこと、ちょっと気にしてるっぽいぜ' : t >= 20 ? 'お前のこと「悪くない」って言ってたらしい' : 'お前のこと、特に何とも思ってないみたいだな'}`); }
  const rival = met.filter(h => s.hs[h.id].rival >= 40 && !s.hs[h.id].withRival)[0];
  if (rival) out.push(`@健太:そういや${rival.rivalName}が${rival.sei}${rival.mei}を狙ってるって噂だ。ぼやぼやしてると取られるぞ`);
  const hints = [
    '@健太:図書室にこもってる三つ編みの子、知ってるか？ 文系の勉強してると、たまに見かけるらしい',
    '@健太:夜の音楽室からピアノが聞こえるって話。美術室で芸術活動して遅くまで残る奴が聞いたとか',
    '@健太:駅前のブティックに、黒塗りの車で来るお嬢様がいるんだと。見た目に気を遣ってる奴なら目に留まるかもな',
    '@健太:朝の河川敷、陸上部の速水がいつも走ってる。ランニングかトレーニングしてりゃ会えるぜ',
    '@健太:来年入ってくる一年に、読者モデルやってる子がいるらしい。カフェでバイトしてるとか',
    '@健太:天文台の幽霊の噂、覚えてるか？ 星に詳しくて絵心もある奴が、眠れない夜に行くと会えるとかなんとか',
    '@健太:女子ってさ、同じデート場所ばっか連れてくと飽きるらしいぞ。あと雨の日の海とか最悪だってよ',
    '@健太:何人もの女子にいい顔してると、そのうち爆発するぞ。俺は知らねーからな',
    '@健太:誕生日、覚えてるか？ 女子は意外と覚えてるもんだぞ、誰が祝ってくれたか',
  ];
  out.push(pick(s, hints));
  return out;
}

// ───────── デート ─────────
export function dateView(s: GameState, sc: Scene): View {
  const H = HMAP[sc.h!], h = s.hs[sc.h!], loc = LOCATIONS[sc.data.loc];
  const L = (x: string) => parseLine(x, s, sc.h);
  const step = sc.step!;
  if (step === 0) return { kind: 'date', title: `デート：${loc.name}`, h: sc.h, lines: [L(`n:日曜日。${loc.name}の前で待ち合わせ。天気は${s.weather}。`), L(`h(${tierOf(h) ? '嬉' : '通常'}):お待たせ、{C}。`), ...(DATE_FLAVOR[sc.data.loc] ? [L(DATE_FLAVOR[sc.data.loc].arrive[s.week % 3])] : []), L('n:今日の服装は——')], choices: s.outfits.map(o => o) };
  if (step >= 1 && step <= 3) {
    const q = H.dateQ[sc.data.order[step - 1]];
    const lines = [L(`h:${q.q}`)];
    if (step === 2 && sc.data.enc) lines.unshift(...sc.data.enc.map((x: string) => parseLine(x, s, sc.h)));
    return { kind: 'date', title: `デート：${loc.name}（${step}/3）`, h: sc.h, lines, choices: q.a.map(a => a[0]) };
  }
  return { kind: 'date', title: 'デート終了', h: sc.h, lines: (sc.data.endLines as string[]).map(L), choices: ['帰る'] };
}
function dateStart(s: GameState, sc: Scene, outfit: string): string[] {
  const H = HMAP[sc.h!], h = s.hs[sc.h!], locId = sc.data.loc, loc = LOCATIONS[locId];
  let sc0 = (H.datePref[locId] ?? 0) * 2;
  const out: string[] = [];
  if (outfit === H.outfit) { sc0 += 3; out.push(`h(照):その服、いいね。{C}に似合ってる`); } else if (outfit === 'カジュアル' && tierOf(h) >= 1) { sc0 -= 1; out.push('h:……いつもの格好だね'); } else out.push('h:……ふうん、そういう服なんだ');
  sc0 += Math.floor((s.stats.yo + OUTFITS[outfit].yo) / 80);
  if (loc.outdoor && (s.weather === '雨' || s.weather === '雪')) { sc0 -= 3; out.push(`n:${s.weather}のせいで、${loc.name}はほとんど楽しめなかった。`); }
  if (loc.season && !loc.season.includes(cal(s.week).m)) sc0 -= 2;
  const repeat = h.lastLocs.slice(-3).filter(x => x === locId).length;
  if (repeat >= 1) { sc0 -= repeat * 2; out.push(`h:また${loc.name}？ ……まあ、いいけど`); }
  if (s.money < loc.cost) { sc0 -= 4; out.push('n:財布の中身が足りず、彼女に半分出してもらった……。'); s.money = 0; } else s.money -= loc.cost;
  if (h.bomb > 0) { sc0 -= 2; }
  sc.data.score = sc0;
  sc.data.outfit = outfit;
  // ランダム遭遇
  const others = HEROINES.filter(o => o.id !== sc.h && s.hs[o.id].met && !s.hs[o.id].withRival && s.hs[o.id].toki >= 25);
  if (chance(s, 0.25)) {
    if (others.length && chance(s, 0.6)) { const o = pick(s, others); applyH(s, o.id, { h: 12 + s.hs[o.id].toki / 5, t: -2 }, false); sc.data.enc = [`n:……あれ？ 向こうから歩いてくるのは、${o.sei}${o.mei}だ。`, `${o.id}(嫉):……{C}？ ……そっか、デート中なんだ。邪魔してごめんね`, `n:${o.sei}${o.mei}は目を合わせずに去っていった。（${o.sei}${o.mei}の傷心度が上がった）`]; }
    else sc.data.enc = ['@健太:おっ、{S}じゃん！ ……あ、デート中？ ごゆっくり〜（ニヤニヤ）', 'h(照):……今の、友達？'];
  }
  return out;
}
function dateEnd(s: GameState, sc: Scene) {
  const H = HMAP[sc.h!], h = s.hs[sc.h!]; const sc0 = sc.data.score as number; const loc = LOCATIONS[sc.data.loc];
  const grade = sc0 >= 9 ? 3 : sc0 >= 5 ? 2 : sc0 >= 1 ? 1 : 0;
  const lines: string[] = [];
  const msg = [
    [`h(冷):……今日は、もう帰るね`, 'n:気まずい沈黙のまま、駅で別れた。'],
    ['h:今日はありがと。……まあまあ楽しかったよ', 'n:悪くはない一日だった。'],
    [`h(嬉):{C}、今日すっごく楽しかった！`, 'n:帰り道、彼女はずっと笑っていた。'],
    [`h(照):……帰りたくないな、なんて。{C}、また誘ってね`, 'n:別れ際、彼女は何度も振り返って手を振った。'],
  ][grade];
  if (DATE_FLAVOR[sc.data.loc]) lines.push(DATE_FLAVOR[sc.data.loc].leave[s.week % 2]);
  lines.push(...msg);
  applyH(s, sc.h!, { f: [-3, 3, 6, 9][grade], t: [-4, 2, 6, 10][grade], tr: [-2, 1, 3, 5][grade], h: -35, pt: grade });
  h.dates++; h.lastLocs.push(sc.data.loc); if (h.lastLocs.length > 6) h.lastLocs.shift();
  diary(s, `${H.sei}${H.mei}と${loc.name}でデート（${['失敗', 'まあまあ', '楽しかった', '最高'][grade]}）。`);
  lines.push(`n:【結果】${['つまらなかった……', 'まあまあ', '楽しかった', '最高のデート！'][grade]}（評価 ${sc0}）`);
  sc.data.endLines = lines;
}

// ───────── 電話 ─────────
export function phone(s: GameState, id: string, mode: 'talk' | 'invite', loc?: string): Line[] {
  if (s.phoneUsed) return [parseLine('n:今週はもう電話した。', s)];
  s.phoneUsed = true;
  if (id === 'kenta') return rumorLines(s).map(x => parseLine(x, s));
  const H = HMAP[id], h = s.hs[id], t = tierOf(h);
  const out = [parseLine(`h(${h.bomb ? '冷' : t ? '嬉' : '通常'}):${pick(s, H.phone[t])}`, s, id)];
  if (mode === 'talk') {
    const wasBomb = h.bomb > 0;
    applyH(s, id, { f: 3, h: -25, tr: 1 });
    out.push(parseLine(wasBomb ? (h.bomb ? 'h(哀):……うん。電話くれて、ちょっとだけ、ほっとした' : 'h(嬉):……電話、ありがと。もう大丈夫') : `n:他愛ない話をして、電話を切った。`, s, id));
    return out;
  }
  const L = LOCATIONS[loc || 'park'];
  const need = 25 * DIFF[s.setup.diff].thr;
  const ok = !h.withRival && h.bomb === 0 && (h.friend >= need || h.toki >= 30) && !(L.season && !L.season.includes(cal(s.week).m) && false);
  if (ok && s.dateBooked) return [parseLine('n:もう今週末の予定が入っている。', s)];
  if (ok) { s.dateBooked = { h: id, loc: loc || 'park' }; out.push(parseLine(`h(嬉):${pick(s, H.inviteOk)}`, s, id)); out.push(parseLine(`n:今週の日曜日、${L.name}で会う約束をした。`, s)); applyH(s, id, { h: -10 }); }
  else { out.push(parseLine(`h(${h.bomb ? '冷' : '哀'}):${pick(s, H.inviteNo)}`, s, id)); h.lastContact = s.week; }
  return out;
}

// ───────── 選択の解決 ─────────
export function resolve(s: GameState, idx: number): Line[] {
  const sc = s.queue[0]; if (!sc) return [];
  const L = (x: string, h?: string) => parseLine(x, s, h);
  if (sc.kind === 'event') {
    s.queue.shift();
    if (sc.id === 'opening') { s.seen.push('opening'); meet(s, 'mio'); applyH(s, 'hinata', idx === 0 ? { f: 3, t: 1 } : { f: 2, tr: 2 }); return [L(idx === 0 ? 'h(嬉):よろしい！ じゃ、行こっか' : 'h(嬉):ついてるってば。ほら、直してあげる', 'hinata')]; }
    if (sc.id === 'meet_rin') { s.seen.push('meet_rin'); meet(s, 'rin'); applyH(s, 'rin', idx === 0 ? { f: 3 } : { tr: 3 }); return [L(idx === 0 ? 'h(冷):……ん' : 'n:彼女が、ほんの少しだけこちらを見た気がした。', 'rin')]; }
    if (sc.id === 'birthday') return birthdayResolve(s, sc.h!, idx);
    const e = EVMAP[sc.id]; const ch = choicesOf(s, e)[idx]; s.seen.push(e.id);
    if (e.h && !e.id.endsWith('_meet')) { s.flags = s.flags.filter(f => !f.startsWith('lastHE:')); s.flags.push('lastHE:' + s.week); s.hs[e.h].events++; diary(s, `【${e.title}】${HMAP[e.h].sei}${HMAP[e.h].mei}との出来事。`); }
    if (e.id.endsWith('_meet') && e.h) meet(s, e.h);
    if (!ch) return [];
    const first = ch.res[0] || '';
    if (first.startsWith('@invite:')) return inviteResolve(s, ch, first);
    if (first === '@sports:') return sportsResolve(s);
    if (first === '@valentine:') return valentine(s);
    if (first === '@exam:') return examResolve(s);
    applyEff(s, /_s[345]$/.test(e.id) && ch.eff ? { ...ch.eff, nc: true } : ch.eff, e.h);
    return ch.res.map(x => L(x, e.h || ch.eff?.to));
  }
  if (sc.kind === 'msg' || sc.kind === 'chat') { s.queue.shift(); return []; }
  if (sc.kind === 'date') {
    const H = HMAP[sc.h!];
    if (sc.step === 0) { const outs = dateStart(s, sc, s.outfits[idx] || 'カジュアル'); sc.step = 1; return outs.map(x => L(x, sc.h)); }
    if (sc.step! >= 1 && sc.step! <= 3) {
      const q = H.dateQ[sc.data.order[sc.step! - 1]]; const a = q.a[idx]; sc.data.score += a[1];
      const r = a[1] >= 3 ? 'h(嬉):……うん。そういうとこ、いいと思う' : a[1] >= 1 ? 'h:ふふ、そっか' : a[1] >= 0 ? 'h:……ふうん' : 'h(冷):……そう';
      sc.step!++; if (sc.step === 4) dateEnd(s, sc);
      return [L(r, sc.h)];
    }
    s.queue.shift(); return [];
  }
  if (sc.kind === 'ending') { s.queue.shift(); s.ended = true; return []; }
  return [];
}
function birthdayResolve(s: GameState, id: string, idx: number): Line[] {
  const H = HMAP[id], h = s.hs[id]; h.gotBirthday = cal(s.week).Y; const L = (x: string) => parseLine(x, s, id);
  const opts = [{ cost: 3000, e: { f: 6, t: 8, tr: 4 }, r: `h(嬉):え……これ、私が欲しかったやつ！ なんでわかったの、{C}`, ok: true }, { cost: 8000, e: { f: -2, t: -2 }, r: 'h(冷):……ありがとう。気持ちは、受け取っておくね' }, { cost: 2000, e: { f: 3, t: 3 }, r: 'h(照):お花……ありがと。部屋に飾るね' }, { cost: 0, e: { f: 2 }, r: 'h:覚えててくれたんだ。……それだけで、嬉しいよ' }][idx];
  if (s.money < opts.cost) return [L('n:……お金が足りなかった。おめでとうとだけ伝えた。'), L('h:ありがと、{C}')];
  s.money -= opts.cost; applyH(s, id, { ...opts.e, h: -20 }); diary(s, `${H.sei}${H.mei}の誕生日を祝った。`);
  if (opts.ok) h.mem.push({ week: s.week, kind: 'praise', text: '誕生日に欲しかったものをくれた' });
  return [L(opts.r)];
}
function inviteResolve(s: GameState, ch: Choice, marker: string): Line[] {
  const [, id, tag] = marker.split(':'); const H = HMAP[id], h = s.hs[id]; const L = (x: string) => parseLine(x, s, id);
  const ok = h.bomb === 0 && (h.friend >= 30 * DIFF[s.setup.diff].thr || h.toki >= 35);
  if (!ok) { gainStat(s, 'st', 6); h.lastContact = s.week; return [L(`h(哀):${pick(s, H.inviteNo)}`), L('n:断られてしまった……。')]; }
  applyEff(s, ch.eff, id); applyH(s, id, { h: -30 });
  const flavor: Record<string, string[]> = {
    '夏祭り': ['n:浴衣姿で現れた彼女に、思わず言葉を失った。', 'h(照):……な、なに？ 変かな'],
    '花火大会': ['n:夜空に大輪の花が咲く。光に照らされた横顔を、ずっと見ていた。', 'h(照):……今、こっち見てたでしょ。{C}'],
    '文化祭': ['n:二人で模擬店を回った。クラスの連中に冷やかされた。', 'h(照):……ね、来年も一緒に回ろうよ'],
    '修学旅行': ['n:班を抜け出して、二人で古都の小道を歩いた。', 'h(照):……先生には内緒ね、{C}'],
    'クリスマス': ['n:イルミネーションの下で、小さなプレゼントを交換した。', 'h(照):メリークリスマス、{C}。……来年も、こうしていられたらいいな'],
    '初詣': ['n:おみくじは、二人とも大吉だった。', 'h(嬉):なにお願いしたの？ ……私？ ふふ、ないしょ'],
  };
  diary(s, `${tag}を${H.sei}${H.mei}と過ごした。`);
  return [L(`h(嬉):${pick(s, H.inviteOk)}`), ...(flavor[tag] || []).map(L)];
}
function sportsResolve(s: GameState): Line[] {
  const L = (x: string, h?: string) => parseLine(x, s, h); const win = s.stats.un + ri(s, -20, 20) >= 110;
  const out = [L(win ? 'n:バトンを受け取り、全力で駆け抜けた。——一着でゴール！ クラスが沸いた。' : 'n:最後のコーナーで抜かれた。……二着。悔しくて、しばらく顔が上げられなかった。')];
  if (win) { gainStat(s, 'kon', 3); diary(s, '体育祭のリレーで一着になった。'); for (const h of HEROINES) if (s.hs[h.id].met) applyH(s, h.id, { t: h.id === 'kaho' ? 5 : 2 }, false); if (s.hs.kaho.met) out.push(L('kaho(嬉):{C}！ 今の走り、最高だった！', 'kaho')); }
  else { gainStat(s, 'st', 6); if (s.hs.kaho.met) out.push(L('kaho:惜しかったな！ でも最後まで諦めなかったの、見てたよ', 'kaho')); }
  return out;
}
function valentine(s: GameState): Line[] {
  const L = (x: string, h?: string) => parseLine(x, s, h); const out: Line[] = [];
  for (const H of HEROINES) {
    const h = s.hs[H.id]; if (!h.met || h.withRival) continue;
    if (h.toki >= 65) { out.push(L(`h(照):……{C}。これ。……手作り、だから。義理じゃ、ないから`, H.id)); h.flags.push('honmei' + cal(s.week).Y); diary(s, `バレンタイン：${H.sei}${H.mei}から本命チョコ。`); }
    else if (h.toki >= 40 || h.friend >= 55) { out.push(L(`h(嬉):はい、{C}。……一応、渡しとく`, H.id)); diary(s, `バレンタイン：${H.sei}${H.mei}からチョコ。`); }
  }
  if (!out.length) out.push(L('@健太:……元気出せよ。チョコの数で人の価値は決まんねえって'), L('n:そう言う健太の鞄から、可愛い包みがいくつも覗いていた。'), L('@田中:……早乙女、その鞄の中身、研究対象として提出しろ'), L('n:母からのチョコが、やけに沁みた。'));
  return out;
}
export function courseRequirement(s: GameState): { ok: boolean; text: string } {
  const st = s.stats, k = DIFF[s.setup.diff].thr;
  switch (s.course) {
    case '国公立大学': return { ok: st.bun + st.ri >= 420 * k, text: '文系+理系 420以上' };
    case '私立大学': return { ok: Math.max(st.bun, st.ri) >= 220 * k, text: '文系か理系 220以上' };
    case '専門学校': return { ok: Math.max(st.gei, st.yo) >= 190 * k, text: '芸術か容姿 190以上' };
    case '就職': return { ok: st.kon >= 150 * k && st.moral >= 60, text: '根性150以上・モラル60以上' };
    default: return { ok: false, text: '進路未定' };
  }
}
function examResolve(s: GameState): Line[] {
  const L = (x: string) => parseLine(x, s);
  if (!s.course) s.course = '私立大学';
  const r = courseRequirement(s); const luck = rand(s) < 0.1; const pass = r.ok || (luck && s.stats.kon >= 100);
  s.courseResult = pass ? '合格' : '不合格'; diary(s, `${s.course}：${s.courseResult}。`);
  return [L(`n:三月の初め。結果が届いた。——${s.course}、${pass ? '合格' : '不合格'}。`), L(pass ? 'n:手が震えた。三年間は、無駄じゃなかった。' : 'n:目の前が真っ白になった。……あと少し、何かが足りなかった。')];
}

// ───────── エンディング判定 ─────────
const SPECIAL: Record<string, (s: GameState) => boolean> = {
  hinata: s => s.hs.hinata.flags.includes('hinata_together') && s.stats.kon >= 100,
  mio: s => s.hs.mio.flags.includes('mio_speech') && s.course === '国公立大学' && s.courseResult === '合格' && s.stats.moral >= 70,
  yura: s => s.hs.yura.flags.includes('yura_grandma') && s.stats.gei >= 180,
  kaho: s => s.hs.kaho.flags.includes('kaho_run') && s.stats.un >= 150,
  reika: s => s.hs.reika.flags.includes('reika_own') && s.stats.yo >= 150,
  kotoha: s => s.hs.kotoha.flags.includes('kotoha_read') && s.stats.bun >= 200,
  ruka: s => s.hs.ruka.flags.includes('ruka_mask') && s.stats.yo >= 170,
  rin: s => ['rin_visit1', 'rin_visit2', 'rin_visit3'].every(f => s.hs.rin.flags.includes(f)) && s.course === '国公立大学' && s.courseResult === '合格',
  shizuku: s => ['obs1', 'obs2', 'obs3'].every(f => s.hs.shizuku.flags.includes(f)) && /大学/.test(s.course) && s.courseResult === '合格',
};
export const HIDDEN_CONDITIONS = SPECIAL;
export function evaluate(s: GameState, id: string) {
  const h = s.hs[id], k = DIFF[s.setup.diff].thr; const evs = HEVENTS.filter(e => e.h === id && !e.id.endsWith('_meet') && !/_s\d$/.test(e.id));
  const allEv = evs.every(e => s.seen.includes(e.id));
  const good = h.met && !h.withRival && h.toki >= 78 * k && h.friend >= 55 && h.trust >= 55 && allEv && SPECIAL[id](s) && h.bomb === 0;
  const normal = h.met && !h.withRival && h.toki >= 58 * k && h.friend >= 45;
  return { good, normal, allEv, special: SPECIAL[id](s) };
}
export function judgeEnding(s: GameState): { id: string; title: string; h?: string; lines: string[] } {
  if (s.ending && (s as any)._endLines) return { ...s.ending, lines: (s as any)._endLines };
  const ranked = HEROINES.filter(H => s.hs[H.id].met).sort((a, b) => (s.hs[b.id].toki + s.hs[b.id].trust * 0.5 + s.hs[b.id].points) - (s.hs[a.id].toki + s.hs[a.id].trust * 0.5 + s.hs[a.id].points));
  const goods = ranked.filter(H => evaluate(s, H.id).good);
  const normals = ranked.filter(H => evaluate(s, H.id).normal);
  let id = 'bad', title = 'バッドエンド：誰もいない校門', h: string | undefined, body: string[] = [];
  const pre = ['n:三月。星見ヶ丘学園、卒業式。', 'n:朝、いつもより三十分早く目が覚めた。制服の袖に腕を通すのも、今日が最後だ。', 'n:通学路の商店街では、顔なじみの店主たちが「おめでとう」と声をかけてくれた。', 'n:校門には「卒業証書授与式」の立て看板。その前で、家族連れが順番に写真を撮っている。', '@健太:{S}！ 遅えぞ！ ……って、俺が早すぎただけか', '@健太:……なあ。三年って、短かったな', '@田中:おーい！ 恋愛研究会、最後の活動報告だ！ ……結論！ 三年かけてわかったのは、俺らには何もわかんねえってことだ！', '@健太:それ、三年かけて言うことかよ', '@田中:……でもよ。お前らと馬鹿やった三年は、研究対象として最高だったぜ', 'n:教室に入ると、黒板いっぱいに後輩たちの寄せ書きが描かれていた。', '@担任・真鍋:全員そろったな。……今日は説教なしだ。胸張って、行ってこい', 'n:体育館に響く「仰げば尊し」。千日前に見上げた桜並木が、今日はまだ蕾だった。', 'n:名前を呼ばれ、壇上で卒業証書を受け取る。思っていたより、ずっと軽い紙だった。', 'n:けれど、その一枚の向こうに、千日分の放課後が詰まっている気がした。', 'n:昼休みの屋上。雨の日の昇降口。夏祭りの夜の、遠い太鼓の音。', 'n:テスト前の図書室。文化祭の準備で残った、夕暮れの教室。', 'n:式が終わり、最後のホームルーム。真鍋先生は、出席簿を閉じて黙ったまま窓の外を見ていた。', '@担任・真鍋:……お前らの担任で、よかったよ。以上！ 解散！', 'n:誰かが泣き出して、つられてみんなが笑った。', '@健太:{S}。……大学行っても、連絡しろよ。絶対だぞ', 'n:健太と拳をぶつけ合って、廊下に出る。', 'n:校舎の窓から、三月の光が斜めに差し込んでいた。', 'n:――そして。']
  if (goods.length) {
    const H = goods[0]; h = H.id;
    if (H.id === 'shizuku') { id = 'true'; title = '隠しトゥルーエンド：千日目の流れ星'; }
    else { id = 'good:' + H.id; title = `グッドエンド：${H.sei}${H.mei}からの告白`; }
    body = H.endings.good;
  } else if (normals.length) {
    const H = normals[0]; h = H.id; const hh = s.hs[H.id];
    if (hh.toki >= 70 && hh.trust >= 45) { id = 'confess:' + H.id; title = `告白成功エンド：${H.sei}${H.mei}`; body = [`n:式の後、${H.sei}${H.mei}を呼び止めた。`, 'me:ずっと言いたかった。……好きだ。付き合ってほしい。', `h(驚):……{C}。`, 'h(照):……はい。私で、よければ。', ...H.endings.normal]; }
    else { id = 'normal:' + H.id; title = `ノーマルエンド：${H.sei}${H.mei}`; body = H.endings.normal; }
  } else {
    const rivalH = HEROINES.filter(H => s.hs[H.id].withRival).sort((a, b) => s.hs[b.id].friend - s.hs[a.id].friend)[0];
    const friendH = HEROINES.filter(H => s.hs[H.id].met && s.hs[H.id].friend >= 65 && !s.hs[H.id].withRival).sort((a, b) => s.hs[b.id].friend - s.hs[a.id].friend)[0];
    if (rivalH && s.hs[rivalH.id].friend >= 30) { id = 'rival:' + rivalH.id; h = rivalH.id; title = `${rivalH.sei}${rivalH.mei}と${rivalH.rivalName.split('（')[0]}のエンディング`; body = rivalH.endings.rival; }
    else if (friendH) { id = 'friend:' + friendH.id; h = friendH.id; title = `友情エンド：${friendH.sei}${friendH.mei}`; body = friendH.endings.friend; }
    else if (s.courseResult === '合格') { id = 'course'; title = '進路成功エンド：新しい春へ'; body = ['n:恋は実らなかった。けれど、手の中には合格通知がある。', '@健太:{S}、お前はよくやったよ。大学で彼女作れよな！', 'n:桜はまだ咲いていない。それでも、確かに春は来ていた。']; }
    else { body = ['n:式が終わり、校門の前に一人で立った。', 'n:誰かを待っていたわけじゃない。……待っていてくれる人が、いなかっただけだ。', '@健太:……帰るか、{S}。ラーメンおごってやるよ', '@田中:俺も行く！ 替え玉は研究会の経費で落とす！ ……経費、ないけど！']; }
  }
  const courseLine = s.course ? (s.courseResult === '合格' ? `n:【進路】${s.course}に合格。春から新しい生活が始まる。` : `n:【進路】${s.course}は不合格。……一年、もう一度挑戦することにした。`) : '';
  if (id.startsWith('good') || id === 'true' || id.startsWith('confess') || id.startsWith('normal')) { if (s.courseResult === '不合格') title += '／進路失敗'; }
  const sis = id === 'bad' ? ['n:家に帰ると、芽衣が玄関で待っていた。', '@芽衣:……おかえり、お兄。卒業おめでと。……今日は、お兄の好きなハンバーグだって'] : id === 'course' ? ['@芽衣:お兄、合格おめでと。……送辞、ちゃんと聞いてた？ ……泣いてないし'] : (id.startsWith('good') || id === 'true' || id.startsWith('confess')) ? ['n:その夜。家に帰ると、芽衣がにやにやしながら待ち構えていた。', '@芽衣:……で？ ……その顔、うまくいったんでしょ。……おめでと、お兄。情報料、高くつくからね'] : [];
  const lines = [...pre, ...body, ...sis, ...(courseLine ? [courseLine] : []), ...recap(s)];
  s.ending = { id, title, h }; (s as any)._endLines = lines;
  diary(s, `卒業。エンディング「${title}」。`);
  return { id, title, h, lines };
}
export function recap(s: GameState): string[] {
  const out = ['n:―― 三年間の記録 ――'];
  const met = HEROINES.filter(H => s.hs[H.id].met);
  const totalDates = met.reduce((a, H) => a + s.hs[H.id].dates, 0);
  const fav = met.slice().sort((a, b) => s.hs[b.id].dates - s.hs[a.id].dates)[0];
  out.push(`n:出会った人：${met.map(H => H.sei + H.mei).join('、')}（${met.length}人）`);
  out.push(`n:デート：${totalDates}回${fav && s.hs[fav.id].dates ? `（いちばん多かったのは${fav.sei}${fav.mei}、${s.hs[fav.id].dates}回）` : ''}`);
  const best = s.exams.length ? Math.min(...s.exams.map(e => e.rank)) : 0; if (best) out.push(`n:テスト最高順位：学年${best}位`);
  out.push(`n:部活：${s.club}${s.tournaments.length ? `（${s.tournaments.map(t => t.split(' ').pop()).join('、')}）` : ''}／バイト：${s.job || 'なし'}（${s.jobDays}日）`);
  const ex = s.flags.filter(f => f.startsWith('explode:')).length; if (ex) out.push(`n:傷つけてしまった回数：${ex}回`);
  const memories = s.diary.filter(d => /【|誕生日|本命|一着|合格|祭り|花火|クリスマス|呼んだ/.test(d.text)).slice(-8);
  for (const d of memories) out.push(`n:・${fmtDate(d.week).replace(/（.）/, '')}　${d.text}`);
  out.push(`n:——${s.setup.sei}${s.setup.mei}の、千日間の物語。　おわり`);
  return out;
}
export { STAGES, season };
