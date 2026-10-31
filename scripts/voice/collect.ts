// 収録対象セリフの収集（npx vite-node scripts/voice/collect.ts）
// 1) データ定義の静的走査 2) 多数の自動プレイで parseLine を通った台詞を記録
// 出力: scripts/voice/lines.json  { id, who, tpl, emo, src }
import { writeFileSync } from 'node:fs';
import { newGame, view, resolve, doWeek, actions, phone, lineTap, voiceId, setJob, buyOutfit } from '../../src/sc/engine';
import { HEROINES, HMAP, LOCATIONS, DATE_FLAVOR, JOBS, OUTFITS, CLUBS } from '../../src/sc/data/index';
import { EVMAP } from '../../src/sc/engine';
import { chatReply } from '../../src/sc/chat';
import { VOICED, spoken } from './cast';
const out = new Map<string, { id: string; who: string; tpl: string; emo: string; src: string; n: number }>();
// プレイヤーの入力文が混ざる台詞（「〜」の引用・悪口の記憶）は収録しない＝文字のみ
export const UNVOICEABLE = /前に「|この前の「|と言われたこと/;
const add = (who: string, tpl: string, emo: string, src: string) => {
  if (!VOICED[who]) return; const t = tpl.trim(); if (!t || UNVOICEABLE.test(t)) return;
  const id = voiceId(who, tpl); const e = out.get(id); if (e) { e.n++; return; }
  out.set(id, { id, who, tpl, emo, src, n: 1, say: spoken(who, tpl) } as any);
};
const RX = /^(@[^:(]+|[a-z]+)(?:\(([^)]+)\))?:([\s\S]*)$/;
const raw = (r: string, ctx: string | undefined, src: string, dflt?: string, demo = '通常') => {
  const m = r.match(RX); if (!m) { if (dflt) add(dflt, r, demo, src); return; }
  let who = m[1]; if (who === 'h') who = ctx || 'n'; add(who, m[3], m[2] || '通常', src);
};
// static
for (const e of Object.values(EVMAP)) { const hs = e.h ? [e.h] : [undefined]; for (const c of hs) { e.lines.forEach(l => raw(l, c, 'ev:' + e.id)); (e.choices || []).forEach(ch => ch.res.forEach(l => raw(l, c, 'ev:' + e.id))); } }
for (const H of HEROINES) {
  H.greet.forEach((a, t) => a.forEach(l => raw(l, H.id, 'greet', H.id, t ? '嬉' : '通常')));
  H.phone.forEach((a, t) => a.forEach(l => raw(l, H.id, 'phone', H.id, t ? '嬉' : '通常')));
  H.inviteOk.forEach(l => raw(l, H.id, 'inviteOk', H.id, '嬉')); H.inviteNo.forEach(l => raw(l, H.id, 'inviteNo', H.id, '哀'));
  raw(H.bombLine, H.id, 'bomb', H.id, '哀'); raw(H.explodeLine, H.id, 'explode', H.id, '怒');
  H.dateQ.forEach(q => raw(q.q, H.id, 'dateQ', H.id));
  Object.entries(H.chat).forEach(([k, [a, b]]) => { raw(a, H.id, 'chat:' + k, H.id, '通常'); raw(b, H.id, 'chat:' + k, H.id, '嬉'); });
  Object.values(H.endings).flat().forEach(l => raw(l, H.id, 'ending'));
  for (const f of Object.values(DATE_FLAVOR)) [...f.arrive, ...f.leave].forEach(l => raw(l, H.id, 'dateflavor'));
}
const nStatic = out.size;
// simulation
let cur = 'sim';
lineTap.fn = (who, tpl, emo) => add(who, tpl, emo, cur);
let seed = 1; const R = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pickA = <T,>(a: T[]) => a[Math.floor(R() * a.length)];
const WORDS = ['おはよう', 'かわいいね', '勉強教えて', '約束する、今度一緒に行こう', '好きだ', 'ごめん', 'うるさい', '誕生日はいつ？', '趣味は？', '夢は？', '部活は？', '好きな食べ物は？', '家族は？', '好きな場所は？', 'パン', '星', '音楽', 'ピアノ', '走る', '本', 'ファッション', '猫', 'ゲーム'];
const base = { sei: '相沢', mei: '悠斗', seiYomi: 'あいざわ', meiYomi: 'ゆうと', bm: 4, bd: 10, persona: '優しい', look: '爽やか系' };
const DIFFS = ['EASY', 'NORMAL', 'HARD', 'VERY HARD'] as const;
function drain(s: any, mode: string) { let g = 0; while (s.queue.length && g++ < 60) { const v = view(s); if (!v) { s.queue.shift(); continue; } const n = v.choices.length; resolve(s, n ? (mode === 'first' ? 0 : mode === 'last' ? n - 1 : Math.floor(R() * n)) : 0); } }
const runs = Number(process.env.RUNS || 400);
for (let r = 0; r < runs; r++) {
  seed = r * 7919 + 13; const target = HEROINES[r % 9].id; const mode = ['rand', 'first', 'last', 'rand'][r % 4];
  const s: any = newGame({ ...base, persona: pickA(Object.keys({ '熱血': 1, '知的': 1, '優しい': 1, 'クール': 1, '芸術家肌': 1, 'お調子者': 1 })), seed: r + 1, diff: DIFFS[r % 4] } as any);
  if (R() < 0.6) s.club = pickA(Object.keys(CLUBS));
  let guard = 0;
  while (!s.ended && guard++ < 500) {
    drain(s, mode); if (s.ended) break;
    if (R() < 0.15 && !s.job) setJob(s, pickA(Object.keys(JOBS)) as any);
    if (R() < 0.05) buyOutfit(s, pickA(Object.keys(OUTFITS)));
    const met = HEROINES.filter(h => s.hs[h.id].met).map(h => h.id);
    const focus = R() < 0.7 ? target : pickA(met.length ? met : [target]);
    const pr = R();
    if (pr < 0.35) phone(s, focus, 'invite', pickA(Object.keys(LOCATIONS)));
    else if (pr < 0.6) phone(s, R() < 0.5 ? focus : pickA([...met, 'kenta']), 'talk');
    const acts = actions(s).filter(a => a.ok).map(a => a.id);
    const a = s.stats.hp < 35 ? 'rest' : R() < 0.35 && acts.includes('talk') ? 'talk' : pickA(acts);
    const tt = s.hs[focus]?.met ? focus : pickA(met.length ? met : ['hinata']);
    doWeek(s, a, a === 'talk' ? tt : undefined);
    if (a === 'talk') { let g = 0; while (s.queue.length && s.queue[0]?.kind !== 'chat' && g++ < 30) drain(s, mode); if (s.queue[0]?.kind === 'chat') { view(s); for (let k = 0; k < 3; k++) chatReply(s, s.queue[0].h || tt, pickA(WORDS) + (R() < 0.2 ? HMAP[pickA(HEROINES.map(h => h.id))].mei : '')); resolve(s, 0); } }
  }
  drain(s, mode);
}
const arr = [...out.values()].sort((a, b) => a.who.localeCompare(b.who) || a.id.localeCompare(b.id));
writeFileSync(new URL('./lines.json', import.meta.url), JSON.stringify(arr, null, 1));
const per: Record<string, { n: number; chars: number }> = {};
for (const l of arr) { const p = per[l.who] ||= { n: 0, chars: 0 }; p.n++; p.chars += [...l.tpl].length; }
console.log(JSON.stringify({ static: nStatic, total: arr.length, per, chars: arr.reduce((a, l) => a + [...l.tpl].length, 0) }, null, 1));
