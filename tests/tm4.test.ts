import { describe, it, expect } from 'vitest';
import { newGame, doWeek, resolve, view, phone, meet, judgeEnding } from '../src/sc/engine';
import { tm, bombStage, bombWeek, heartOf, profile, informant, rollHall, hallNow, hallTalk, sendMail, startConfess, canConfess, legendPrelude, newsletter, calendarStrip, BAT } from '../src/sc/tm4';
import { LAST_WEEK } from '../src/sc/time';
const G = (seed = 3): any => newGame({ sei: '相沢', mei: '悠斗', seiYomi: 'あいざわ', meiYomi: 'ゆうと', bm: 4, bd: 10, persona: '優しい', look: '爽やか系', diff: 'NORMAL', seed } as any);
const clear = (s: any) => { let g = 0; while (s.queue.length && g++ < 50) resolve(s, 0); };

describe('TM4 systems', () => {
  it('bomb has 3 stages: appear → lit → about to explode, with rumor spread', () => {
    const s = G(); clear(s); meet(s, 'hinata'); meet(s, 'mio'); s.hs.mio.friend = 40;
    const h = s.hs.hinata; h.hurt = 50; s.lastLog = [];
    bombWeek(s, 'hinata'); expect(bombStage(h)).toBe(1); expect(s.lastLog.join()).toContain('爆弾が現れた');
    h.bomb = 1; expect(bombStage(h)).toBe(2);
    h.bomb = 3; const hurt0 = s.hs.mio.hurt; bombWeek(s, 'hinata'); expect(bombStage(h)).toBe(3); expect(s.hs.mio.hurt).toBeGreaterThan(hurt0); expect(s.lastLog.join()).toContain('耳にも入った');
  });
  it('heart colours follow the stage', () => { const s = G(); meet(s, 'hinata'); s.hs.hinata.friend = 0; s.hs.hinata.toki = 0; const a = heartOf(s.hs.hinata).color; s.hs.hinata.toki = 95; s.hs.hinata.friend = 90; s.hs.hinata.trust = 90; expect(heartOf(s.hs.hinata).color).not.toBe(a); });
  it('phone battery limits calls and recharges weekly', () => {
    const s = G(); clear(s); meet(s, 'hinata'); tm(s).bat = 10;
    const l = phone(s, 'hinata', 'talk'); expect(l[0].text).toContain('電池'); expect(s.phoneUsed).toBe(false);
    tm(s).bat = 100; phone(s, 'hinata', 'talk'); expect(tm(s).bat).toBe(100 - BAT.call);
    s.phoneUsed = false; doWeek(s, 'rest'); expect(tm(s).bat).toBe(Math.min(100, 100 - BAT.call + BAT.charge));
    expect(sendMail(s, 'hinata').length).toBeGreaterThan(0); expect(sendMail(s, 'hinata')[0].text).toContain('もう');
  });
  it('profile book unlocks progressively; newsletter and informant work', () => {
    const s = G(); meet(s, 'hinata'); const h = s.hs.hinata; h.friend = 0; h.toki = 0;
    const lock = profile(s, 'hinata').filter(r => r.v === '？？？').length; h.friend = 60; h.toki = 50;
    expect(profile(s, 'hinata').filter(r => r.v === '？？？').length).toBeLessThan(lock);
    newsletter(s, 5); expect(tm(s).mail.at(-1)!.from).toBe('news');
    expect(informant(s)[0].where.length).toBeGreaterThan(0);
    expect(calendarStrip(s).length).toBe(8);
  });
  it('hallway encounter resolves once per week', () => {
    const s = G(); clear(s); meet(s, 'hinata'); let tries = 0; while (!tm(s).hall && tries++ < 50) rollHall(s);
    s.week = tm(s).hall!.w; expect(hallNow(s)).toBeTruthy(); expect(hallTalk(s, 0).length).toBe(2); expect(hallNow(s)).toBeNull();
  });
  it('double-booking: inviting a second heroine creates a dbl scene before the date', () => {
    const s = G(); clear(s); meet(s, 'hinata'); meet(s, 'mio');
    for (const id of ['hinata', 'mio']) { s.hs[id].friend = 60; s.hs[id].toki = 40; s.hs[id].hurt = 0; }
    phone(s, 'hinata', 'invite', 'park'); s.phoneUsed = false; const l = phone(s, 'mio', 'invite', 'cafe');
    expect(l.map(x => x.text).join()).toContain('ダブルブッキング');
    doWeek(s, 'rest'); clear0(s); expect(s.queue.some((q: any) => q.id === 'tm4' && q.data.t === 'dbl') || (s as any)._sawDbl).toBe(true);
  });
  it('self-confession variants and the cherry-tree prelude', () => {
    const s = G(); s.queue = []; meet(s, 'hinata'); s.week = LAST_WEEK - 6; expect(canConfess(s)).toBe(true);
    const h = s.hs.hinata; h.toki = 90; h.trust = 80; h.bomb = 0; startConfess(s, 'hinata');
    const v = view(s)!; expect(v.title).toContain('想い'); const r = resolve(s, 0); expect(r.map(x => x.text).join()).toContain('卒業式');
    expect(tm(s).conf).toBe('held:hinata'); expect(canConfess(s)).toBe(false);
    expect(legendPrelude(s, 'hinata').join()).toContain('星見の桜');
    const s2 = G(); s2.queue = []; meet(s2, 'mio'); s2.week = LAST_WEEK - 6; s2.hs.mio.toki = 50; startConfess(s2, 'mio'); resolve(s2, 0); expect(tm(s2).conf).toBe('uneasy:mio');
    void judgeEnding;
  });
});
// clears scenes until a dbl scene shows up (kept in queue for assertion)
function clear0(s: any) { let g = 0; while (s.queue.length && g++ < 50) { if (s.queue[0].id === 'tm4' && s.queue[0].data.t === 'dbl') { s._sawDbl = true; return; } resolve(s, 0); } }
