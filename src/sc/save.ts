import type { GameState } from './types';
import { SAVE_VERSION } from './engine';
const PREFIX = 'SEISHUN1:';
const sum = (t: string) => { let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h.toString(36); };
const b64e = (t: string) => { const b = new TextEncoder().encode(t); let x = ''; b.forEach(c => (x += String.fromCharCode(c))); return btoa(x); };
const b64d = (t: string) => new TextDecoder().decode(Uint8Array.from(atob(t), c => c.charCodeAt(0)));
/** 別の端末・別の会話に貼り付けても復元できる文字列 */
export function exportSave(s: GameState): string { const j = JSON.stringify({ ...s, _endLines: undefined }); return `${PREFIX}${sum(j)}:${b64e(j)}`; }
export function importSave(str: string): GameState {
  const t = str.trim(); if (!t.startsWith(PREFIX)) throw new Error('セーブデータの形式が違います（SEISHUN1: で始まる文字列を貼り付けてください）');
  const [, ck, body] = t.split(':'); const j = b64d(body); if (sum(j) !== ck) throw new Error('セーブデータが壊れています（チェックサム不一致）');
  const s = JSON.parse(j) as GameState; if (s.v !== SAVE_VERSION || !s.hs || !s.stats) throw new Error('対応していないバージョンのセーブです'); s.cold ??= 0; s.injury = s.injury ? 1 : 0; return s;
}
const KEY = 'seishun:slot';
export const store = {
  save(slot: string, s: GameState) { try { localStorage.setItem(KEY + slot, exportSave(s)); } catch { /* private mode */ } },
  load(slot: string): GameState | null { try { const v = localStorage.getItem(KEY + slot); return v ? importSave(v) : null; } catch { return null; } },
  has(slot: string) { try { return !!localStorage.getItem(KEY + slot); } catch { return false; } },
};
