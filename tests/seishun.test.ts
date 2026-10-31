import { describe, it, expect } from 'vitest';
import { newGame, view, resolve, doWeek, actions, phone, stage, judgeEnding, parseLine } from '../src/sc/engine';
import { LAST_WEEK, cal } from '../src/sc/time';
import { HEROINES, HMAP, LOCATIONS } from '../src/sc/data/index';
import { chatReply, classify } from '../src/sc/chat';
import { exportSave, importSave } from '../src/sc/save';
import { voiceParams, defaultSettings } from '../src/sc/voice';
import { ALL_LINES_COUNT } from './helpers';
const base = { sei: '相沢', mei: '悠斗', seiYomi: 'あいざわ', meiYomi: 'ゆうと', bm: 4, bd: 10, persona: '優しい', look: '爽やか系', diff: 'NORMAL' as const };
function drain(s: any, pickFn = (n: number, v: any) => 0) { let g = 0; while (s.queue.length && g++ < 50) { const v = view(s)!; tally.lines += v.lines.length; tally.chars += v.lines.reduce((a: number, l: any) => a + l.text.length, 0); if (v.choices.length) tally.choices++; expect(v.lines.length + v.choices.length).toBeGreaterThan(0); resolve(s, Math.min(v.choices.length - 1, pickFn(v.choices.length, v))); } }
export const tally = { chars: 0, lines: 0, choices: 0, chats: 0 };
function play(seed: number, strategy: 'focus' | 'idle', diff: any = 'NORMAL') {
  const s = newGame({ ...base, seed, diff }); let guard = 0; const target = 'hinata';
  while (!s.ended && guard++ < 400) {
    drain(s, (n, v) => v.kind === 'date' && s.queue[0]?.step ? 0 : strategy === 'focus' ? 0 : n - 1);
    if (s.ended) break;
    if (strategy === 'focus') {
      if (s.week % 3 === 0) phone(s, target, 'invite', Object.keys(LOCATIONS)[s.week % 15]);
      else { const b = HEROINES.find(h => s.hs[h.id].bomb > 0); if (b) phone(s, b.id, 'talk'); }
    }
    const acts = actions(s).filter(a => a.ok);
    const plan = strategy === 'idle' ? 'rest' : s.stats.hp < 40 ? 'rest' : s.stats.st > 70 ? 'hobby' : ['bun', 'ri', 'talk', 'train', 'bun', 'ri', 'art', 'fashion'][s.week % 8];
    const a = acts.find(x => x.id === plan) ? plan : 'rest';
    doWeek(s, a, a === 'talk' ? target : undefined);
    if (a === 'talk') { while (s.queue[0]?.kind !== 'chat' && s.queue.length) drain1(s); if (s.queue[0]?.kind === 'chat') { tally.chats++; chatReply(s, target, '今日もかわいいね'); chatReply(s, target, 'パン'); resolve(s, 0); } }
  }
  return s;
}
function drain1(s: any) { const v = view(s)!; resolve(s, 0); void v; }

describe('青春クロニクル engine', () => {
  it('playtime model: one focused run ≈ 2.5–5h', () => {
    Object.assign(tally, { chars: 0, lines: 0, choices: 0, chats: 0 }); const s = play(11, 'focus');
    // 読む速度 400字/分＋1行1.2秒のクリック、選択1回8秒、週メニュー10秒、会話1回60秒（3往復の入力）
    const sec = tally.chars / 400 * 60 + tally.lines * 1.2 + tally.choices * 8 + LAST_WEEK * 10 + tally.chats * 60;
    console.log('playtime', JSON.stringify({ ...tally, weeks: s.week, hours: +(sec / 3600).toFixed(2) }));
    expect(sec / 3600).toBeGreaterThan(2); expect(sec / 3600).toBeLessThan(6);
  });
  it('8+1 heroines with full profiles and ≥5 date questions', () => {
    expect(HEROINES.length).toBe(9);
    for (const H of HEROINES) { expect(H.dateQ.length).toBeGreaterThanOrEqual(5); expect(H.call.length).toBe(3); expect(H.endings.good.length).toBeGreaterThan(1); }
    expect(Object.keys(LOCATIONS).length).toBe(15);
  });
  it('3 years = LAST_WEEK weeks ending in graduation March', () => { expect(LAST_WEEK).toBeGreaterThanOrEqual(150); expect(cal(LAST_WEEK).m).toBe(3); expect(cal(LAST_WEEK).Y).toBe(3); });
  it('name placeholders render text and yomi separately', () => {
    const s = newGame({ ...base, seed: 1 });
    const L = parseLine('h(嬉):おはよう、{C}！', s, 'hinata');
    expect(L.text).toContain('悠斗くん'); expect(L.voice).toContain('ゆうとくん'); expect(L.emo).toBe('嬉');
  });
  it('headless playthrough reaches an ending (focus strategy)', () => {
    const s = play(42, 'focus');
    expect(s.ended).toBe(true); expect(s.ending?.title).toBeTruthy();
    expect(s.hs.hinata.dates).toBeGreaterThan(5);
    console.log('focus ending:', s.ending?.title, 'hinata', stage(s.hs.hinata), Math.round(s.hs.hinata.toki), 'met', HEROINES.filter(h => s.hs[h.id].met).length, 'events', s.seen.length);
  });
  it('idle playthrough ends without crash and is not a good ending', () => {
    const s = play(7, 'idle', 'HARD'); expect(s.ended).toBe(true); expect(s.ending!.id.startsWith('good')).toBe(false);
  });
  it('many seeds finish', () => { for (let i = 0; i < 6; i++) expect(play(100 + i, 'focus', ['EASY', 'NORMAL', 'HARD', 'VERY HARD'][i % 4]).ended).toBe(true); });
  it('neglect lights a bomb', () => {
    const s = newGame({ ...base, seed: 3 }); drain(s); Object.assign(s.hs.hinata, { toki: 60, friend: 60, lastContact: 0 });
    let lit = false;
    for (let i = 0; i < 40 && !lit; i++) { drain(s, n => n - 1); doWeek(s, 'rest'); lit = s.hs.hinata.bomb > 0 || s.hs.hinata.flags.includes('exploded'); }
    expect(lit).toBe(true);
  });
  it('save string roundtrip', () => {
    const s = play(5, 'focus'); const str = exportSave(s); expect(str.startsWith('SEISHUN1:')).toBe(true);
    expect(importSave(str).week).toBe(s.week); expect(() => importSave(str.slice(0, -4) + 'AAAA')).toThrow();
  });
});
describe('local chat', () => {
  it('classifies intents', () => {
    expect(classify('かわいいね', 'hinata').intent).toBe('praise');
    expect(classify('ごめん', 'hinata').intent).toBe('sorry');
    expect(classify('うざい', 'hinata').intent).toBe('insult');
    expect(classify('誕生日いつ？', 'hinata').intent).toBe('ask');
    expect(classify('氷室さんってさ', 'hinata')).toMatchObject({ intent: 'other', other: 'mio' });
  });
  it('insult hurts and is remembered', () => {
    const s = newGame({ ...base, seed: 9 }); const before = s.hs.hinata.hurt;
    chatReply(s, 'hinata', 'うざい'); expect(s.hs.hinata.hurt).toBeGreaterThan(before); expect(s.hs.hinata.mem.some(m => m.kind === 'hurt')).toBe(true);
    chatReply(s, 'hinata', 'ごめん'); expect(s.hs.hinata.mem.every(m => m.kind !== 'hurt' || m.done)).toBe(true);
  });
  it('answers profile questions', () => { const s = newGame({ ...base, seed: 2 }); const r = chatReply(s, 'hinata', '誕生日はいつ？'); expect(r.map(x => x.text).join()).toContain(`${HMAP.hinata.birthday[0]}月`); });
});
describe('voice', () => {
  it('per-heroine pitch differs and emotion modulates', () => {
    const set = defaultSettings(); const a = voiceParams('hinata', '通常', 0, set), b = voiceParams('mio', '通常', 0, set);
    expect(a.pitch).not.toBe(b.pitch); expect(voiceParams('hinata', '哀', 0, set).rate).toBeLessThan(a.rate);
  });
  it('content volume', () => { console.log('content', ALL_LINES_COUNT()); expect(ALL_LINES_COUNT().events).toBeGreaterThan(50); });
});
