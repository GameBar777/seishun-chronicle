// 会話ログ（バックログ）。このセッション中だけメモリに保持（セーブには含めない）。
export interface LogEntry { kind: 'line' | 'choice'; name: string; text: string; color?: string; who?: string; vid?: string; narr?: boolean }
export const LOG_CAP = 300;
let buf: LogEntry[] = [];
export const backlog = {
  push(e: LogEntry) { if (!e.text) return; const last = buf[buf.length - 1]; if (last && last.kind === e.kind && last.text === e.text && last.name === e.name) return; buf.push(e); if (buf.length > LOG_CAP) buf = buf.slice(buf.length - LOG_CAP); },
  line(name: string, text: string, opt: Omit<LogEntry, 'kind' | 'name' | 'text'> = {}) { backlog.push({ kind: 'line', name, text, ...opt }); },
  choice(text: string) { backlog.push({ kind: 'choice', name: '', text }); },
  all(): readonly LogEntry[] { return buf; },
  clear() { buf = []; },
};
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);
/** ログ一覧のHTML（古い順、最新が一番下）。canPlay(who,vid) が真の行に ▶ を付ける */
export function backlogHtml(entries: readonly LogEntry[], canPlay: (who?: string, vid?: string) => boolean): string {
  if (!entries.length) return '<p class="bl-empty">まだ会話はありません。</p>';
  return entries.map((e, i) => e.kind === 'choice'
    ? `<div class="bl-row bl-choice"><span class="bl-mark">▷ 選択</span><span class="bl-text">${esc(e.text)}</span></div>`
    : `<div class="bl-row${e.narr ? ' bl-narr' : ''}">${e.name ? `<div class="bl-name" style="color:${esc(e.color || '#fff')}">${esc(e.name)}</div>` : ''}<div class="bl-line"><span class="bl-text">${esc(e.text)}</span>${canPlay(e.who, e.vid) ? `<button class="bl-play" data-bi="${i}" aria-label="もう一度聞く">▶</button>` : ''}</div></div>`).join('');
}
