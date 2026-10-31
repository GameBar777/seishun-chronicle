// イベントCG（一枚絵）。シナリオ行に 'cg:<id>' で表示、'cg:off' で消去。画像は public/img/cg/h/<id>.webp（スマホ用 -s.webp）
export interface CgDef { id: string; h: string; title: string }
export const CG_LIST: CgDef[] = [
  { id: 'hinata_1', h: 'hinata', title: '焼きたての朝' },
  { id: 'hinata_2', h: 'hinata', title: 'アルバムの写真' },
  { id: 'hinata_3', h: 'hinata', title: '雨宿りの告白未遂' },
  { id: 'hinata_confess', h: 'hinata', title: '歩道橋の告白' },
  { id: 'hinata_kiss', h: 'hinata', title: '春風のキス' },
];
export const CG_MAP: Record<string, CgDef> = Object.fromEntries(CG_LIST.map(c => [c.id, c]));
const KEY = 'seishun:cg';
/** 一度見たCGはセーブとは別に端末へ記録（全周回共通）。セーブ側にも flags 'cg:<id>' で残す */
export const cgSeen = {
  all(): string[] { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } },
  add(id: string) { try { const a = cgSeen.all(); if (!a.includes(id)) { a.push(id); localStorage.setItem(KEY, JSON.stringify(a)); } } catch { /* private mode */ } },
  merge(ids: string[]) { for (const i of ids) cgSeen.add(i); },
};
