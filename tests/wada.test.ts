import { describe, it, expect } from 'vitest';
import { newGame, doWeek, resolve, actions, view, WADA_CLIMAX_W } from '../src/sc/engine';
import { LAST_WEEK, cal } from '../src/sc/time';
import { affinityRows } from '../src/sc/affinity';

function play(seed: number, B: number, pick: 'first' | 'last') {
  const s: any = newGame({ sei: '相沢', mei: '悠斗', seiYomi: 'あいざわ', meiYomi: 'ゆうと', bm: 4, bd: 10, persona: '優しい', look: '爽やか系', diff: 'NORMAL', seed } as any);
  const titles: { w: number; t: string }[] = []; let r = seed * 13; let threat = false;
  for (let g = 0; g < 3000 && !s.ended && s.week < LAST_WEEK + 1; g++) {
    if (s.queue.length) { const q = s.queue[0]; let v: any; try { v = view(s); } catch { /* */ }
      if (q.id === 'wada') { titles.push({ w: s.week, t: v.title }); if (affinityRows(s).rows.some(x => x.warn.some(w => w.includes('和田')))) threat = true; }
      r = (r * 1103515245 + 12345) % 2147483648; const n = v?.choices?.length || 1;
      try { resolve(s, q.id === 'wada' ? (pick === 'first' ? 0 : n - 1) : r % n); } catch { s.queue.shift(); } if (s.queue[0] === q) s.queue.shift(); continue; }
    if (B) for (const k in s.hs) { const h = s.hs[k]; if (h.met) { const t = Math.min(100, s.week * B); h.friend = Math.max(h.friend, t); h.toki = Math.max(h.toki, t * 0.95); h.trust = Math.max(h.trust, t * 0.9); h.lastContact = s.week; } }
    const acts = actions(s).filter((a: any) => a.ok); r = (r * 1103515245 + 12345) % 2147483648;
    try { doWeek(s, acts[r % acts.length].id); } catch { s.week++; }
  }
  return { s, titles, threat, res: (s.flags.find((f: string) => f.startsWith('wadaClimax')) || '').split(':')[1] };
}

describe('ライバル和田編', () => {
  it('接近→誘い→目撃→宣戦布告→前夜→告白 の順で、告白は三年の12月', () => {
    const { titles } = play(1, 0.6, 'first');
    expect(titles.map(t => t.t.split('――')[0])).toEqual(['和田の接近', '和田の誘い', '目撃', '宣戦布告', '告白前夜', '和田の告白']);
    const c = cal(titles[5].w); expect(c.Y).toBe(3); expect([11, 12]).toContain(c.m);
    expect(titles[5].w).toBeGreaterThanOrEqual(WADA_CLIMAX_W);
  });
  it('本気で向き合えば勝てる／放っておくと和田が本当に勝つ（彼女は和田と付き合う）', () => {
    const good = [1, 2, 3, 4].map(sd => play(sd, 0.7, 'first'));
    expect(good.filter(g => g.res === 'win').length).toBeGreaterThanOrEqual(3);
    const bad = [1, 2, 3].map(sd => play(sd, 0, 'last'));
    for (const b of bad) { expect(b.res).toBe('lose'); expect(Object.values(b.s.hs).some((h: any) => h.withRival)).toBe(true); }
  });
  it('勝った後は和田は退場し、好感度画面に脅威が表示されていた', () => {
    const g = play(2, 0.7, 'first'); expect(g.res).toBe('win'); expect(g.s.wada.done).toBe(true); expect(g.threat).toBe(true);
  });
});

describe('好感度画面', () => {
  it('出会っていないヒロインの名前は出さない', () => {
    const s: any = newGame({ sei: '相沢', mei: '悠斗', seiYomi: 'あいざわ', meiYomi: 'ゆうと', bm: 4, bd: 10, persona: '優しい', look: '爽やか系', diff: 'NORMAL', seed: 5 } as any);
    s.hs.hinata.met = true; s.hs.hinata.toki = 50; s.hs.hinata.friend = 60;
    const { rows, unmet } = affinityRows(s); expect(rows.map(r => r.id)).toEqual(['hinata']); expect(unmet).toBe(8);
    expect(rows[0].hearts).toBeGreaterThan(0); expect(rows[0].stage).toBe('気になる存在');
  });
});
