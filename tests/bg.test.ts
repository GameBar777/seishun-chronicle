import { describe, it, expect } from 'vitest';
import { pickBg } from '../src/sc/bg';
describe('pickBg', () => {
  it('explicit, keyword, action', () => {
    expect(pickBg('rin_1', '', [], 'bun', false).bg).toBe('hospital');
    expect(pickBg('x', '夕方の生徒会室。澪が一人で書類の山と格闘していた。', [], 'bun', false).bg).not.toBe('mountain');
    expect(pickBg('x', '早朝の河川敷。', [], 'bun', false).bg).toBe('river');
    expect(pickBg('x', '山田は机に向かった。', ['山田'], 'bun', false).bg).toBe('room');
    expect(pickBg('x', '山田は机に向かった。', ['山田'], 'club', false).bg).toBe('ground');
    expect(pickBg('d_sis_a', '芽衣がこちらを見ている。', [], 'job', true).bg).toBe('living');
  });
});
