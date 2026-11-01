import { describe, it, expect } from 'vitest';
import { newGame, doWeek, resolve, actions, view, EV_WHEN, EV_AFTER } from '../src/sc/engine';
import { cal, LAST_WEEK } from '../src/sc/time';

// ヒロイン好感度を週ごとに底上げして全個別イベントを発生させ、日付と順番を記録する
function run(seed: number) {
  const s: any = newGame({ sei: '相沢', mei: '悠斗', seiYomi: 'あいざわ', meiYomi: 'ゆうと', bm: 4, bd: 10, persona: '優しい', look: '爽やか系', diff: 'NORMAL', seed } as any);
  const log: { id: string; Y: number; m: number; w: number; text: string }[] = [];
  let r = seed * 7; let last = '';
  for (let g = 0; g < 3000 && !s.ended && s.week < LAST_WEEK + 1; g++) {
    if (s.queue.length) {
      const q = s.queue[0]; const key = q.id + s.week;
      if (key !== last && (q.step ?? 0) === 0) { const c = cal(s.week); let v: any; try { v = view(s); } catch { /* */ } log.push({ id: q.id, Y: c.Y, m: c.m, w: s.week, text: (v?.lines || []).map((l: any) => l.text).join(' ') }); last = key; }
      try { resolve(s, r % 2); } catch { s.queue.shift(); } if (s.queue[0] === q) s.queue.shift(); continue;
    }
    for (const k in s.hs) { const h = s.hs[k]; if (h.met) { const t = Math.min(100, s.week * 0.9 + (seed % 9) * 3); h.friend = Math.max(h.friend, t); h.toki = Math.max(h.toki, t * 0.95); h.trust = Math.max(h.trust, t * 0.9); } }
    for (const k of ['gei', 'bun', 'yo', 'ri']) s.stats[k] = Math.max(s.stats[k], s.week * 2);
    const acts = actions(s).filter((a: any) => a.ok); r = (r * 1103515245 + 12345) % 2147483648;
    try { doWeek(s, acts[r % acts.length].id); } catch { s.week++; }
  }
  return log;
}
const LOGS = [3, 11, 19, 27].map(run);
const KAN = '一二三';

describe('時系列', () => {
  it('季節が書かれた個別イベントは指定月にだけ起きる（予約からの繰り越しは翌月まで）', () => {
    for (const log of LOGS) for (const e of log) {
      const w = EV_WHEN[e.id]; if (!w) continue;
      expect(w.includes(e.m) || w.includes(e.m === 1 ? 12 : e.m - 1), `${e.id} @ Y${e.Y} ${e.m}月`).toBe(true);
    }
  });
  it('本文の「◯年の季節」は実際の学年・季節と一致する', () => {
    const SEA = (m: number) => (m >= 3 && m <= 5 ? '春' : m <= 8 && m >= 6 ? '夏' : m >= 9 && m <= 11 ? '秋' : '冬');
    for (const log of LOGS) for (const e of log) {
      if (e.id.startsWith('d_') || e.id === 'ruka_meet') continue;
      for (const m of e.text.matchAll(/([一二三])年の([春夏秋冬])/g)) expect(`${m[1]}${m[2]}`, `${e.id} Y${e.Y} ${e.m}月: ${m[0]}`).toBe(`${KAN[e.Y - 1]}${SEA(e.m)}`);
    }
  });
  it('続編的なイベントは前提イベントの後', () => {
    for (const log of LOGS) for (const [id, pre] of Object.entries(EV_AFTER)) {
      const a = log.findIndex(e => e.id === id); if (a < 0) continue;
      const b = log.findIndex(e => e.id === pre); expect(b >= 0 && b < a, `${id} before ${pre}`).toBe(true);
    }
  });
  it('個別イベントは1→2→3→4の順', () => {
    for (const log of LOGS) for (const h of ['hinata', 'mio', 'yura', 'kaho', 'reika', 'kotoha', 'ruka', 'rin']) {
      const ix = [1, 2, 3, 4].map(n => log.findIndex(e => e.id === `${h}_${n}`)).filter(i => i >= 0);
      expect([...ix].sort((a, b) => a - b)).toEqual(ix);
    }
  });
  it('夏帆の自主練は三年の引退後に起きない', () => {
    for (const log of LOGS) for (const e of log) if (e.id === 'kaho_s1' || e.id === 'kaho_s2') expect(e.Y === 3 && (e.m >= 10 || e.m <= 3)).toBe(false);
  });
  it('1週あたりのシーンは3件まで、学校行事は 始業→体育祭→文化祭 の順', () => {
    for (const log of LOGS) {
      const per: Record<number, number> = {}; for (const e of log) per[e.w] = (per[e.w] || 0) + 1;
      const order = ['opening', 'gw', 'summer_start', 'sports_day', 'culture_fes', 'christmas', 'valentine'].map(id => log.find(e => e.id === id && e.Y === 1)?.w ?? -1).filter(w => w >= 0);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
    }
  });
});
