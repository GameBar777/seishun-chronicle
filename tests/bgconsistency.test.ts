import { describe, it, expect } from 'vitest';
import { pickBg, sceneWeather } from '../src/sc/bg';
import { bgmForScene } from '../src/sc/bgm';
import { CAL } from '../src/sc/data/calendar';
import { DAILY, DAILY2, DAILY3, DAILY4 } from '../src/sc/data/daily';
import { FRIENDS } from '../src/sc/data/friends';
import { HEVENTS } from '../src/sc/data/hevents';
import { SIDE_EVENTS } from '../src/sc/data/hevents2';
import { SIDE_EVENTS2 } from '../src/sc/data/hevents3';
import { SISTER } from '../src/sc/data/sister';
import { newGame, transOk } from '../src/sc/engine';

const ALLOW = new Set(['d_fr_t_fireworks', 'rin_s2']); // 花火大会「前日」の昼の電話／「雨上がり」
const OUT = new Set(['ground', 'river', 'festival', 'sea', 'rooftop', 'park', 'mountain', 'station', 'gate', 'town', 'amuse', 'observatory']);
function audit() {
  const s: any = newGame({ sei: '相沢', mei: '悠斗', seiYomi: 'あいざわ', meiYomi: 'ゆうと', bm: 4, bd: 10, persona: '優しい', look: '爽やか系', diff: 'NORMAL', seed: 1 } as any);
  const all = [...CAL, ...DAILY, ...DAILY2, ...DAILY3, ...DAILY4, ...FRIENDS, ...HEVENTS, ...SIDE_EVENTS, ...SIDE_EVENTS2, ...SISTER];
  const bad: string[] = [];
  for (const e of all) {
    if (ALLOW.has(e.id)) continue;
    let lines = e.lines;
    if (e.dynLines) { for (let w = 0; w < 152; w++) { s.week = w; try { if (e.cond(s)) break; } catch { /* */ } } try { lines = e.dynLines(s); } catch { /* */ } }
    const fn = lines.filter(l => l.startsWith('n:')).map(l => l.slice(2)).find(t => !t.startsWith('――')) || e.title;
    const txt = e.title + ' ' + lines.join(' ');
    const g = pickBg(e.id, fn, ['相沢', '悠斗'], undefined, /^sis|^d_sis/.test(e.id));
    const tod = g.tod || (/夜/.test(txt) ? 'night' : /夕/.test(txt) ? 'evening' : 'day');
    if (g.bg === 'festival' && !/祭り|夏祭|秋祭|花火|浴衣|神社|初詣|縁日|屋台/.test(txt)) bad.push(e.id + ':festival');
    if (/体育祭|グラウンド|校庭|リレー/.test(fn) && g.bg !== 'ground') bad.push(e.id + ':sports');
    if (/(朝|昼休み|昼|午後|放課後|快晴|日差し)/.test(fn) && tod === 'night') bad.push(e.id + ':day-night');
    if (/(夜|星空|花火|月が)/.test(fn) && tod === 'day') bad.push(e.id + ':night-day');
    if (/教室|図書室|部屋|体育館|保健室|職員室|廊下|昇降口/.test(fn) && OUT.has(g.bg)) bad.push(e.id + ':indoor');
    if (/海|浜辺|公園|河川敷|屋上|校庭|神社/.test(fn) && ['classroom', 'room', 'living'].includes(g.bg)) bad.push(e.id + ':outdoor');
    if (/プール/.test(fn) && (g.bg !== 'pool' || tod !== 'day')) bad.push(e.id + ':pool');
    const body = txt;
    if (transOk('――その夜。', body) && tod === 'day') bad.push(e.id + ':trans-night');
    for (const tr of ['――その日の放課後。', '――翌日の昼休み。', '――帰り道。']) if (transOk(tr, body) && tod === 'night') bad.push(e.id + ':trans-' + tr);
    if (/雨/.test(fn) && sceneWeather(fn + ' ' + txt, '晴れ', true) !== '雨') bad.push(e.id + ':rain');
    if (/快晴|晴れ渡|青空/.test(fn) && sceneWeather(fn + ' ' + txt, '雨', true) === '雨') bad.push(e.id + ':sunny-rain');
  }
  return bad;
}
describe('背景・天気の整合性', () => {
  it('体育祭は昼のグラウンド・快晴なら雨なし・BGMは部活系', () => {
    const sd = CAL.find(e => e.id === 'sports_day')!;
    expect(pickBg('sports_day', '1年目の体育祭。快晴。', [], undefined, false)).toEqual({ bg: 'ground', tod: 'day' });
    expect(pickBg('x', '体育祭の朝。', [], undefined, false).bg).toBe('ground');
    expect(sceneWeather('1年目の体育祭。快晴。', '雨', true)).toBe('晴れ');
    expect(bgmForScene({ title: sd.title } as any)).toBe('club');
  });
  it('固定イベントは本文に記述がなければランダムの雨を出さない', () => {
    expect(sceneWeather('教室で話した。', '雨', true)).not.toBe('雨');
    expect(sceneWeather('雨の中を歩いた。', '晴れ', true)).toBe('雨');
    expect(sceneWeather('雨上がり。', '晴れ', true)).toBe('晴れ');
  });
  it('プール開きは昼のプール、「その夜。」は付かない', () => {
    expect(pickBg('d_y1_pool', 'プール開き。男子はプール、女子は隣のコートで体育だ。', [], undefined, false)).toEqual({ bg: 'pool', tod: 'day' });
    expect(transOk('――その夜。', 'プール開き。男子はプール、女子は隣のコートで体育だ。')).toBe(false);
    expect(transOk('――その夜。', '夜、星を見上げた。')).toBe(true);
  });
  it('全イベントの背景・時間帯・屋内外・天気が本文と矛盾しない', () => { expect(audit()).toEqual([]); });
});
