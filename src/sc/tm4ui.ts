// TM4系システムの画面パーツ（携帯アプリ・情報屋メモ・廊下バナー・カレンダー帯）
import type { GameState } from './types';
import { HEROINES, HMAP } from './data/index';
import { render } from './engine';
import { fmtDate } from './time';
import { tm, unread, profile, informant, heartOf, bombStage, BOMB_LABEL, hallNow, HALL_CH, calendarStrip, canConfess, BAT } from './tm4';
const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const met = (s: GameState) => HEROINES.filter(H => s.hs[H.id].met && !s.hs[H.id].withRival);
export const BOMB_ICON = ['', '💣', '💣🔥', '💣🔥🔥'];
export function heartChip(s: GameState, id: string): string { const h = s.hs[id], hc = heartOf(h), b = bombStage(h); return `<i class="hh" style="color:${hc.color}" title="ハート：${hc.word}">♥</i>${b ? `<i class="bomb b${b}">${BOMB_ICON[b]}</i>` : ''}`; }
export function batteryHtml(s: GameState): string { const b = tm(s).bat; return `<span class="bat ${b < BAT.call ? 'low' : ''}" title="携帯の電池（通話${BAT.call}%・メール${BAT.mail}%／毎週+${BAT.charge}%）"><i style="width:${b}%"></i></span><small>${b}%</small>`; }
export function phoneAppBtns(s: GameState): string {
  const u = unread(s);
  return `<div class="row phapp"><button id="ph-mail">✉ メール${u ? `<b class="badge">${u}</b>` : ''}</button><button id="ph-book">📒 プロフィール帳</button><button id="ph-send" ${tm(s).mailW === s.week ? 'disabled' : ''}>✉ 送る</button></div>${canConfess(s) ? '<div class="row"><button id="ph-conf" class="conf">💌 選んだ相手に想いを伝える</button></div>' : ''}`;
}
export function mailHtml(s: GameState): string {
  const ms = tm(s).mail.slice().reverse();
  const html = ms.length ? ms.map(m => { const from = m.from === 'news' ? '📰 星見ヶ丘通信' : HMAP[m.from] ? `${HMAP[m.from].sei}${HMAP[m.from].mei}` : m.from; const body = m.from === 'news' ? m.body : render(m.body, s, m.from, false); return `<div class="mail ${m.read ? '' : 'new'}" style="--hc:${HMAP[m.from]?.color || '#5b7cfa'}"><div class="mh"><b>${esc(from)}</b><small>${fmtDate(m.w)}</small></div><div class="mt">${esc(m.title)}</div><div class="mb">${esc(body).replace(/\n/g, '<br>')}</div></div>`; }).join('') : '<p>メールはまだない。</p>';
  for (const m of tm(s).mail) m.read = true;
  return `<div class="mails">${html}</div>`;
}
export function bookHtml(s: GameState): string {
  const hs = HEROINES.filter(H => s.hs[H.id].met);
  if (!hs.length) return '<p>まだ誰とも知り合っていない。</p>';
  return `<div class="book">${hs.map(H => { const hc = heartOf(s.hs[H.id]); return `<details class="pb" style="--hc:${H.color}"><summary><i class="hh" style="color:${hc.color}">♥</i> ${esc(H.sei + H.mei)}<small>${hc.stage}</small></summary><table>${profile(s, H.id).map(r => `<tr><th>${r.k}</th><td class="${r.v === '？？？' ? 'lk' : ''}">${esc(r.v)}</td></tr>`).join('')}</table></details>`; }).join('')}<p class="note">仲良くなるほど項目が埋まっていく。</p></div>`;
}
export function informantHtml(s: GameState): string {
  const rs = informant(s);
  return `<div class="inf"><p>@健太「よし、俺の情報網によると——」</p>${rs.map(r => `<div class="ir" style="border-color:${HMAP[r.id].color}"><b><i class="hh" style="color:${r.color}">♥</i>${esc(r.name)}</b><small>ハート：${r.heart}　📍${esc(r.where)}</small><div>「${esc(r.note)}」</div>${bombStage(s.hs[r.id]) ? `<div class="warn">${BOMB_LABEL[bombStage(s.hs[r.id])]}</div>` : ''}</div>`).join('') || '<p>まだ誰とも知り合ってないだろ、お前。</p>'}</div>`;
}
export function hallHtml(s: GameState): string {
  const id = hallNow(s); if (!id) return '';
  const H = HMAP[id];
  return `<div class="hall" style="--hc:${H.color}"><div>🚶 廊下の向こうから<b>${esc(H.sei + H.mei)}</b>が歩いてくる……</div><div class="hb">${HALL_CH.map((c, i) => `<button class="hl" data-i="${i}">${esc(c)}</button>`).join('')}</div></div>`;
}
export function calStripHtml(s: GameState): string {
  return `<div class="calstrip">${calendarStrip(s).map((c, i) => `<div class="cs ${i === 0 ? 'now' : ''}"><small>${esc(c.label)}</small>${c.marks.map(m => `<span>${esc(m)}</span>`).join('')}</div>`).join('')}</div>`;
}
export { met };
