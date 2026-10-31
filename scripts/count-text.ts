// 台本の文字数集計（npx vite-node scripts/count-text.ts）
// voiced = ヒロインが喋る文字（音声化の対象）/ other = ナレーション・NPC・主人公・選択肢
import { EVMAP } from '../src/sc/engine';
import { HEROINES, DATE_FLAVOR } from '../src/sc/data/index';
const HID = new Set([...HEROINES.map(h => h.id), 'h']);
const clean = (s: string) => [...s.replace(/\{[A-Z]\}/g, '').replace(/@invite:[^\s]*/g, '')].length;
let voiced = 0, other = 0;
const line = (raw: string, defaultHero = false) => {
  const m = raw.match(/^(@[^:(]+|[a-z]+)(?:\([^)]+\))?:([\s\S]*)$/);
  if (!m) { (defaultHero ? (voiced += clean(raw)) : (other += clean(raw))); return; }
  if (HID.has(m[1])) voiced += clean(m[2]); else other += clean(m[2]);
};
for (const e of Object.values(EVMAP)) { e.lines.forEach(l => line(l)); for (const c of e.choices || []) { other += clean(c.label); c.res.forEach(l => line(l)); } }
for (const H of HEROINES) {
  [...H.greet.flat(), ...H.phone.flat(), ...H.inviteOk, ...H.inviteNo, H.bombLine, H.explodeLine, ...H.dateQ.map(q => q.q), ...Object.values(H.chat).flat()].forEach(l => line(l, true));
  H.dateQ.forEach(q => q.a.forEach(a => other += clean(a[0])));
  Object.values(H.endings).flat().forEach(l => line(l));
}
for (const f of Object.values(DATE_FLAVOR)) [...f.arrive, ...f.leave].forEach(l => line(l));
console.log(JSON.stringify({ voiced, other, total: voiced + other }));
