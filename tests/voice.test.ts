import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { voiceId, newGame, view, resolve, doWeek, actions, phone, lineTap } from '../src/sc/engine';
import { HEROINES } from '../src/sc/data/index';
import { CAST_SLUG } from '../src/sc/voice';
import { spoken, VOICED } from '../scripts/voice/cast';
const MAN = 'public/voice/manifest.json';
describe('収録ボイス', () => {
  it('voiceId is deterministic and text-sensitive', () => {
    expect(voiceId('hinata', 'おはよう')).toBe(voiceId('hinata', 'おはよう'));
    expect(voiceId('hinata', 'おはよう')).not.toBe(voiceId('mio', 'おはよう'));
    expect(voiceId('hinata', 'おはよう')).toMatch(/^[0-9a-f]{16}$/);
  });
  it('cast tables agree', () => { expect(Object.keys(CAST_SLUG).sort()).toEqual(Object.keys(VOICED).sort()); });
  it('spoken take never contains the player name', () => {
    expect(spoken('hinata', 'おっはよー、{C}！ 寝ぐせ？')).toBe('おっはよー！ 寝ぐせ？');
    expect(spoken('@健太', 'おい{S}、見ろよ')).toBe('おい、見ろよ');
    expect(spoken('kotoha', '{C}くんは、わたしの読者')).toBe('あなたは、わたしの読者');
    const L = JSON.parse(readFileSync('scripts/voice/lines.json', 'utf8')) as { say: string }[];
    for (const l of L) expect(l.say).not.toMatch(/\{[CSM]\}/);
  });
  it.runIf(existsSync(MAN))('every manifest id has a file, and a fresh playthrough is mostly voiced', () => {
    const ids = new Set<string>(JSON.parse(readFileSync(MAN, 'utf8')).ids);
    const L = JSON.parse(readFileSync('scripts/voice/lines.json', 'utf8')) as { id: string; who: string }[];
    for (const l of L) if (ids.has(l.id)) expect(existsSync(`public/voice/${CAST_SLUG[l.who]}/${l.id}.mp3`)).toBe(true);
    let tot = 0, hit = 0;
    lineTap.fn = (who, tpl) => { if (!(who in CAST_SLUG) || /前に「|この前の「|と言われたこと/.test(tpl) || !/[ぁ-ゖァ-ヺ一-龯々A-Za-z0-9]/.test(spoken(who, tpl))) return; tot++; if (ids.has(voiceId(who, tpl))) hit++; };
    for (const seed of [90001, 90002, 90003]) {
      const s: any = newGame({ sei: '佐藤', mei: '翔', seiYomi: 'さとう', meiYomi: 'しょう', bm: 1, bd: 1, persona: '知的', look: '爽やか系', diff: 'NORMAL', seed } as any);
      let g = 0; const tgt = HEROINES[seed % 9].id;
      while (!s.ended && g++ < 400) { let k = 0; while (s.queue.length && k++ < 50) { const v = view(s); resolve(s, v && v.choices.length ? seed % v.choices.length : 0); } if (s.ended) break; if (s.week % 3 === 0) phone(s, tgt, 'invite'); const a = actions(s).filter(x => x.ok); doWeek(s, a[s.week % a.length].id, a[s.week % a.length].id === 'talk' ? tgt : undefined); }
    }
    lineTap.fn = undefined;
    console.log('voice coverage', hit, '/', tot);
    expect(hit / tot).toBeGreaterThan(0.97);
  });
});
