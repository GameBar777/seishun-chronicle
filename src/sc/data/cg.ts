// イベントCG（一枚絵）。シナリオ行に 'cg:<id>' で表示、'cg:off' で消去。画像は public/img/cg/h/<id>.webp（スマホ用 -s.webp）
export interface CgDef { id: string; h: string; title: string }
export const CG_LIST: CgDef[] = [
  { id: 'hinata_1', h: 'hinata', title: '焼きたての朝' },
  { id: 'hinata_2', h: 'hinata', title: 'アルバムの写真' },
  { id: 'hinata_3', h: 'hinata', title: '雨宿りの告白未遂' },
  { id: 'hinata_confess', h: 'hinata', title: '歩道橋の告白' },
  { id: 'hinata_kiss', h: 'hinata', title: '春風のキス' },
  { id: 'mio_1', h: 'mio', title: '校則違反の現場' },
  { id: 'mio_3', h: 'mio', title: '生徒会選挙' },
  { id: 'mio_4', h: 'mio', title: '母との対話' },
  { id: 'mio_confess', h: 'mio', title: '生徒会室の告白' },
  { id: 'mio_kiss', h: 'mio', title: '桜色の窓辺' },
  { id: 'yura_1', h: 'yura', title: '音が見える' },
  { id: 'yura_2', h: 'yura', title: '冬の海' },
  { id: 'yura_4', h: 'yura', title: 'わたしの音' },
  { id: 'yura_confess', h: 'yura', title: '夕暮れの音楽室' },
  { id: 'yura_kiss', h: 'yura', title: '重なる手と音' },
  { id: 'kaho_1', h: 'kaho', title: 'はやみ食堂' },
  { id: 'kaho_3', h: 'kaho', title: '止まった脚' },
  { id: 'kaho_4', h: 'kaho', title: '最後の県大会' },
  { id: 'kaho_confess', h: 'kaho', title: 'ゴールの先' },
  { id: 'kaho_kiss', h: 'kaho', title: '誰もいないグラウンド' },
  { id: 'reika_2', h: 'reika', title: '秘密のゲームセンター' },
  { id: 'reika_3', h: 'reika', title: '姉の影' },
  { id: 'reika_4', h: 'reika', title: '縁談' },
  { id: 'reika_confess', h: 'reika', title: '歩いて帰る道' },
  { id: 'reika_kiss', h: 'reika', title: 'ただの麗華として' },
];
export const CG_MAP: Record<string, CgDef> = Object.fromEntries(CG_LIST.map(c => [c.id, c]));
const KEY = 'seishun:cg';
/** 一度見たCGはセーブとは別に端末へ記録（全周回共通）。セーブ側にも flags 'cg:<id>' で残す */
export const cgSeen = {
  all(): string[] { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } },
  add(id: string) { try { const a = cgSeen.all(); if (!a.includes(id)) { a.push(id); localStorage.setItem(KEY, JSON.stringify(a)); } } catch { /* private mode */ } },
  merge(ids: string[]) { for (const i of ids) cgSeen.add(i); },
};
