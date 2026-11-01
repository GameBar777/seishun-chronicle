// 好感度指数（ときメモ風）：出会ったヒロインだけ、指数・ハート・段階・ひとことを表示する
import type { GameState, HState } from './types';
import { HEROINES } from './data/index';
import { stage } from './engine';
import { heartOf, bombStage, BOMB_LABEL } from './tm4';

export const STAGE_NOTE: Record<string, string> = {
  顔見知り: '名前と顔は覚えてもらえた。', 友人: '気軽に話せる友達。', 親友: '何でも話せる仲。……でも、恋とは少し違うかも。',
  気になる存在: 'あなたのことを、ちょっと意識しはじめている。', 好き: 'はっきり好意を持っている。', 夢中: 'あなたしか見えていない。',
};
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
export const affIndex = (h: HState) => clamp(h.friend * 0.35 + h.toki * 0.45 + h.trust * 0.2);
export const hearts = (n: number) => Math.min(5, Math.floor(n / 20) + (n >= 10 ? 1 : 0) - (n >= 100 ? 1 : 0));
export interface AffRow { id: string; name: string; color: string; index: number; hearts: number; stage: string; note: string; warn: string[]; hc: string; hw: string }

export function affinityRows(s: GameState): { rows: AffRow[]; unmet: number } {
  const rows: AffRow[] = [];
  for (const H of HEROINES) {
    const h = s.hs[H.id]; if (!h?.met) continue;
    const st = stage(h); const warn: string[] = [];
    { const b = bombStage(h); if (b) warn.push(BOMB_LABEL[b] + (b >= 2 ? '（放っておくと噂が広がる。電話かデートで解除）' : '……まだ間に合う')); }
    if (h.hurt >= 40) warn.push('💧 傷ついている');
    if (h.withRival) warn.push('💔 和田と付き合いはじめた');
    else { const w = (s as any).wada; if (w && !w.done && w.t === H.id && (w.st?.[H.id] ?? 0) >= 1) { const m = Math.round(w.m?.[H.id] ?? 0); const lv = m >= 75 ? '危険' : m >= 50 ? '本気' : m >= 25 ? '接近' : '様子見'; warn.push(`⚠ 和田が接近中（${lv}・本気度 ${m}）`); } }
    rows.push({ id: H.id, name: H.sei + H.mei, color: H.color, index: affIndex(h), hearts: hearts(affIndex(h)), stage: st, note: STAGE_NOTE[st] || '', warn, hc: heartOf(h).color, hw: heartOf(h).word });
  }
  rows.sort((a, b) => b.index - a.index);
  return { rows, unmet: HEROINES.filter(H => !s.hs[H.id]?.met).length };
}

const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);
export function affinityHtml(s: GameState): string {
  const { rows, unmet } = affinityRows(s);
  const card = (r: AffRow) => `<div style="border:2px solid ${r.color};border-radius:12px;padding:8px 10px;margin:8px 0;background:linear-gradient(90deg,${r.color}22,#fff0)">
<div style="display:flex;justify-content:space-between;align-items:baseline;gap:6px"><b style="color:${r.color};font-size:1.05em">${esc(r.name)}</b><span style="font-size:.85em;padding:1px 8px;border-radius:9px;background:${r.color};color:#fff">${esc(r.stage)}</span></div>
<div style="font-size:1.25em;letter-spacing:2px;margin:2px 0" aria-label="ハート${r.hearts}個">${`<span style="color:${r.hc}">♥</span>`.repeat(r.hearts)}${'<span style="color:#ccc">♡</span>'.repeat(5 - r.hearts)}</div>
<div style="height:10px;border-radius:5px;background:#eee;overflow:hidden"><div style="height:100%;width:${r.index}%;background:linear-gradient(90deg,#ffb3c6,#ff4f81)"></div></div>
<div style="display:flex;justify-content:space-between;font-size:.8em;color:#666"><span>${esc(r.note)}</span><span>好感度指数 <b>${r.index}</b></span></div>
${r.warn.map(w => `<div style="font-size:.82em;color:#c0392b">${esc(w)}</div>`).join('')}</div>`;
  return `${rows.length ? rows.map(card).join('') : '<p>まだ誰とも知り合っていない。</p>'}${unmet ? `<p class="note">？？？ ×${unmet}　まだ出会っていない人がいるようだ……</p>` : ''}<p class="note">指数は友好・ときめき・信頼の合計の目安。ハートが増えるほど、告白の成功に近づく。</p>`;
}
