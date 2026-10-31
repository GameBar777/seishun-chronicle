import { describe, it, expect } from 'vitest';
import { newGame, doWeek, resolve, actions, view, EVMAP, isDated, SCHOOLDAY, transFix } from '../src/sc/engine';
import { cal, LAST_WEEK } from '../src/sc/time';

// [本文・タイトルのキーワード, 開始(月,日), 終了(月,日)]：日本の高校の年間行事に合わせた許容期間
const WIN: [RegExp, [number, number], [number, number]][] = [
  [/夏休み前日|夏休みの始まり/, [7, 10], [7, 24]],
  [/プール開き/, [6, 20], [7, 10]],
  [/花火大会|海水浴/, [7, 21], [8, 31]],
  [/二学期の始業式/, [9, 1], [9, 10]],
  [/クラス替え/, [4, 1], [4, 14]],
  [/^体育祭$|体育祭の秘策|体育祭の練習/, [9, 1], [10, 15]],
  [/^文化祭$|研究会の出し物|最後の公開講座/, [10, 1], [10, 20]],
  [/文化祭準備|模擬店/, [9, 10], [10, 14]],
  [/クリスマス|イブ/, [12, 18], [12, 25]],
];
const md = (m: number, d: number) => (m < 4 ? m + 12 : m) * 100 + d;
const VAC_OK = /部活|補習|夏期講習/;

function simulate(seeds: number) {
  const viol = new Set<string>();
  for (let seed = 1; seed <= seeds; seed++) {
    const s: any = newGame({ sei: '相沢', mei: '悠斗', seiYomi: 'あいざわ', meiYomi: 'ゆうと', bm: 4, bd: 10, persona: '優しい', look: '爽やか系', diff: 'NORMAL', seed } as any);
    let r = seed * 7919;
    for (let g = 0; g < 2500 && !s.ended && s.week <= LAST_WEEK; g++) {
      if (s.queue.length) {
        const q = s.queue[0]; const c = cal(s.week);
        if (q.kind === 'event' && EVMAP[q.id]) {
          const e = EVMAP[q.id]; let v: any; try { v = view(s); } catch { /* */ }
          if (isDated(q.id) && !e.cond(s)) viol.add(`late ${q.id} ${c.m}/${c.day}`);
          const head = e.title + ' ' + (v?.lines || []).filter((l: any) => !l.text.startsWith('――')).slice(0, 2).map((l: any) => l.text).join('');
          if (c.vacation && SCHOOLDAY.test(head) && !VAC_OK.test(head)) viol.add(`vacation ${q.id} ${c.m}/${c.day}`);
          for (const [re, a, b] of WIN) if (re.test(e.title) && (md(c.m, c.day) < md(...a) - 6 || md(c.m, c.day) > md(...b))) viol.add(`window ${q.id} ${c.m}/${c.day}`);
          const tr = v?.lines?.[0]?.text as string | undefined;
          if (tr?.startsWith('――') && (c.vacation || !SCHOOLDAY.test(head)) && /その日|翌日|放課後|昼休み|帰り道/.test(tr) && c.vacation) viol.add(`trans ${q.id} ${tr}`);
          if (tr?.startsWith('――') && /夜/.test(tr) && /プール|授業|朝/.test(head)) viol.add(`trans-night ${q.id}`);
        }
        const len = s.queue.length; try { resolve(s, 0); } catch { /* */ } if (s.queue.length === len && s.queue[0] === q) s.queue.shift();
        continue;
      }
      const acts = actions(s).filter((a: any) => a.ok); r = (r * 1103515245 + 12345) % 2147483648; const a = acts[r % acts.length];
      try { doWeek(s, a.id); } catch { s.week++; }
    }
  }
  return [...viol].sort();
}
describe('イベントの時系列', () => {
  it('全152週×多数シードで、日付の決まった行事が遅れて出ず・期間内で・休み中に学校の場面が出ない', () => {
    expect(simulate(25)).toEqual([]);
  }, 60000);
});

describe('海・休み中・学外の場面のつなぎ文', () => {
  const OLD = ['――その日の放課後。', '――翌日の昼休み。', '――その夜。', '――帰り道。', '――ある日の放課後。', '――別の日の昼休み。', '――ある日の帰り道。'];
  const ALL = Object.values(EVMAP);
  it('海の場面はすべて冒頭で夏休み・休日だとわかる', () => {
    for (const e of ALL) {
      if (!/海/.test(e.title)) continue;
      const first = (e.lines ?? []).find(l => l.startsWith('n:')) ?? '';
      if (e.lines) expect(first, e.id).toMatch(/夏休み|冬休み|日曜|土曜|休日|八月/);
    }
  });
  it('保存済みの古いつなぎ文（翌日の昼休み 等）も、海・休み中の場面の前では「別の日」に直る', () => {
    for (const e of ALL) {
      const body = e.title + ' ' + (e.lines ?? []).join(' ');
      const off = /海|夏休み|冬休み|春休み|休日|日曜|旅行|花火/.test(body.slice(0, 80));
      for (const tr of OLD) {
        const fixed = transFix(tr, body, off ? 6 : 6, 2);
        expect(fixed, `${e.id} ${tr}`).not.toMatch(/その日|翌日|その夜/);
        if (off) expect(fixed, `${e.id} ${tr}`).not.toMatch(/放課後|昼休み|帰り道/);
        expect(transFix(tr, body, 8, 2), `${e.id} ${tr} (8月)`).not.toMatch(/放課後|昼休み|帰り道|その日|翌日/);
      }
    }
    expect(transFix('――翌日の昼休み。', EVMAP.d_fr_t_beach.title + ' ' + EVMAP.d_fr_t_beach.lines!.join(' '), 8, 2)).toBe('――別の日。');
  });
});
