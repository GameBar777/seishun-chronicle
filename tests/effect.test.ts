import { describe, it, expect } from 'vitest';
import { effectParts, effectTone } from '../src/sc/progress';
const tone = (d: string, w: string) => effectParts(d).find(x => x.t === w)?.tone;
describe('行動効果の色分け', () => {
  it('ストレス増は赤・減は緑', () => { expect(effectTone('ストレス↑')).toBe('neg'); expect(effectTone('ストレス↓↓')).toBe('pos'); });
  it('体力消費・故障率・出費は赤、回復は緑', () => {
    const d = '文系↑ ストレス↑｜体力-20・故障率55%';
    expect(tone(d, '文系↑')).toBe('pos'); expect(tone(d, '体力-20')).toBe('neg'); expect(tone(d, '故障率55%')).toBe('neg');
    expect(effectTone('故障率0%')).toBe(''); expect(effectTone('体力+50')).toBe('pos'); expect(effectTone('所持金-3000')).toBe('neg');
  });
  it('「運動・根性↑」は両方緑', () => { expect(tone('運動・根性↑', '運動')).toBe('pos'); });
  it('元の文字列を失わない', () => { const d = '収入900円・安定収入'; expect(effectParts(d).map(x => x.t).join('')).toBe(d); });
});
