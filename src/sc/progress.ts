// 週替わり演出・パラメータ変化の表示用（純粋関数）。セーブには何も足さない。
import type { GameState, StatKey } from './types';
import { STAT_LABEL } from './types';
import { cal, season } from './time';
export const SHOWN: StatKey[] = ['bun', 'ri', 'gei', 'yo', 'un', 'kon', 'hp', 'st', 'moral'];
export const CAP = (k: StatKey) => (k === 'hp' || k === 'st' || k === 'moral' ? 100 : 999);
/** バーの満タン基準（HUDと同じ。能力は300で満タン表示、上限は999） */
export const BAR = (k: StatKey) => (CAP(k) === 100 ? 100 : 300);
export interface Snap { week: number; stats: Record<string, number>; money: number; hs: Record<string, { met: boolean; v: number }> }
export function snap(s: GameState): Snap {
  return { week: s.week, stats: { ...s.stats }, money: s.money, hs: Object.fromEntries(Object.entries(s.hs).map(([k, h]) => [k, { met: h.met, v: h.friend + h.toki - h.hurt }])) };
}
export interface Delta { key: string; label: string; d: number; good: boolean }
/** 変化した項目。ストレスは「下がると良い」。小さな揺れ(|d|<0.5)は省く */
export function diffStats(a: Snap, b: Snap): Delta[] {
  const out: Delta[] = [];
  for (const k of SHOWN) { const d = Math.round((b.stats[k] - a.stats[k]) * 10) / 10; if (Math.abs(d) >= 0.5) out.push({ key: k, label: STAT_LABEL[k], d: Math.round(d), good: k === 'st' ? d < 0 : d > 0 }); }
  const m = b.money - a.money; if (m) out.push({ key: 'money', label: '所持金', d: m, good: m > 0 });
  return out;
}
/** ヒロインの印象の上下（数値は出さない）。新しく出会った子は 'new' */
export function diffHearts(a: Snap, b: Snap): { id: string; dir: 'up' | 'down' | 'new' }[] {
  const out: { id: string; dir: 'up' | 'down' | 'new' }[] = [];
  for (const [id, h] of Object.entries(b.hs)) { const o = a.hs[id]; if (!h.met) continue; if (!o?.met) { out.push({ id, dir: 'new' }); continue; } const d = h.v - o.v; if (d >= 1) out.push({ id, dir: 'up' }); else if (d <= -1) out.push({ id, dir: 'down' }); }
  return out;
}
/** ランク表示（ときメモ風の文字評価）。100上限の項目はストレスのみ逆転なし（高い=悪いのは色で表す） */
export function rank(k: StatKey, v: number): string {
  const r = v / BAR(k); const T: [number, string][] = CAP(k) === 100 ? [[0.9, 'S'], [0.75, 'A'], [0.6, 'B'], [0.4, 'C'], [0.2, 'D']] : [[0.83, 'S'], [0.6, 'A'], [0.4, 'B'], [0.27, 'C'], [0.17, 'D']];
  for (const [t, l] of T) if (r >= t) return l; return 'E';
}
export function fmtDelta(x: Delta): string { return x.key === 'money' ? `${x.d > 0 ? '+' : '−'}${Math.abs(x.d).toLocaleString()}円` : `${x.d > 0 ? '+' : '−'}${Math.abs(x.d)}`; }
export function weekCard(week: number) { const c = cal(week); const se = season(c.m); return { y: c.Y, m: c.m, day: c.day, wd: c.wd, n: c.n, week: week + 1, term: c.term, season: se, icon: ({ 春: '🌸', 夏: '🌻', 秋: '🍁', 冬: '❄️' } as Record<string, string>)[se] }; }
/** 行動ログ1行の色分け：良い出来事は pos（緑）、悪い出来事は neg（赤）、それ以外は ''（既定色） */
const NEG = /🤧|🩹|🤒|💥|🌀|📢|💔|💧|失敗|治らなかった|できない|ケガ|風邪|熱が|寝込|スランプ|落ち|下がった|減った|怒|嫌われ|振られ|ストレスが(?:溜|たま|増)|ダメ|不合格|赤点|遅刻|叱/;
const POS = /✨|🎉|💕|♥|治った|成功|合格|上がった|増えた|アップ|仲良く|喜|褒め|優勝|入賞|回復|すっきり|リフレッシュ|もらった|1位/;
export function logTone(line: string): 'pos' | 'neg' | '' { return /治った|完治|合格した|成功！/.test(line) && !/不合格|治らなかった/.test(line) ? 'pos' : NEG.test(line) ? 'neg' : POS.test(line) ? 'pos' : ''; }
