import type { GameState } from '../engine/types';
import { SAVE_VERSION } from '../engine/game';

export const SAVE_KEY = 'ripple_years_save';
export const META_KEY = 'ripple_years_meta';

export interface Meta {
  version: number;
  achievements: Record<string, number>; // id -> unlock timestamp
  settings: { textSpeed: 'normal' | 'fast'; showHints: boolean; ads: boolean; analytics: boolean; lang: string; tutorialDone: boolean; reduceMotion: boolean; sound: boolean };
  lifetime: { lives: number; years: number; endings: Record<string, number>; maxGen: number; maxNetWorth: number };
}
export const defaultMeta = (): Meta => ({ version: 1, achievements: {}, settings: { textSpeed: 'normal', showHints: true, ads: true, analytics: false, lang: 'ja', tutorialDone: false, reduceMotion: false, sound: false }, lifetime: { lives: 0, years: 0, endings: {}, maxGen: 1, maxNetWorth: 0 } });

type Migr = (s: any) => any;
/** Schema migrations: key = version being migrated FROM. */
export const MIGRATIONS: Record<number, Migr> = {
  1: s => {
    // v1 had no debt-forgiveness tracking, choice log or play stats.
    s.cur = { oneoff: 0, loans: 0, invDeposit: 0, invWithdraw: 0, education: 0, forgiven: 0, ...(s.cur ?? {}) };
    s.ledger = (s.ledger ?? []).map((r: any) => ({ forgiven: 0, ...r }));
    s.choiceLog = s.choiceLog ?? []; s.stats = s.stats ?? { yearsPlayed: (s.hist ?? []).length, eventsSeen: 0 };
    s.version = 2; return s;
  },
  2: s => {
    // v3 added drama moments, the per-life dream and notable-year tracking.
    s.moments = s.moments ?? []; s.dream = s.dream ?? null; s.yearMark = s.yearMark ?? null;
    s.stats = { notableYears: 0, ...(s.stats ?? {}) };
    s.version = 3; return s;
  },
};
export function migrate(raw: any): GameState {
  if (!raw || typeof raw !== 'object' || !raw.p || !raw.world) throw new Error('invalid save');
  let s = raw; let v = typeof s.version === 'number' ? s.version : 1;
  if (v > SAVE_VERSION) throw new Error(`save version ${v} is newer than this app (${SAVE_VERSION})`);
  while (v < SAVE_VERSION) { const m = MIGRATIONS[v]; if (!m) throw new Error('no migration from v' + v); s = m(s); v = s.version; }
  return s as GameState;
}

const ls = (): Storage | null => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; } };
export function saveGame(s: GameState) { try { ls()?.setItem(SAVE_KEY, JSON.stringify(s)); return true; } catch { return false; } }
export function loadGame(): GameState | null { try { const t = ls()?.getItem(SAVE_KEY); return t ? migrate(JSON.parse(t)) : null; } catch (e) { console.warn('load failed', e); return null; } }
export function clearGame() { ls()?.removeItem(SAVE_KEY); }
export function loadMeta(): Meta { try { const t = ls()?.getItem(META_KEY); if (!t) return defaultMeta(); const m = JSON.parse(t); const d = defaultMeta(); return { ...d, ...m, settings: { ...d.settings, ...m.settings }, lifetime: { ...d.lifetime, ...m.lifetime } }; } catch { return defaultMeta(); } }
export function saveMeta(m: Meta) { try { ls()?.setItem(META_KEY, JSON.stringify(m)); } catch { /* storage full or disabled */ } }

/** Export = base64 of JSON with a small header, so players can back up / move saves. */
export function exportSave(s: GameState, m: Meta): string {
  const json = JSON.stringify({ app: 'ripple-years', exported: new Date().toISOString(), game: s, meta: m });
  return btoa(unescape(encodeURIComponent(json)));
}
export function importSave(code: string): { game: GameState; meta?: Meta } {
  const json = decodeURIComponent(escape(atob(code.trim())));
  const o = JSON.parse(json); if (o.app !== 'ripple-years') throw new Error('not a RIPPLE YEARS save');
  return { game: migrate(o.game), meta: o.meta };
}
