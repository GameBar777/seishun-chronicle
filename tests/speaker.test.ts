import { describe, it, expect } from 'vitest';
import { portraitAfterLine } from '../src/sc/speaker';
const isH = (id: string) => ['hinata', 'mio'].includes(id);
describe('name tag carryover', () => {
  it('narration drops an NPC tag and returns to the scene heroine', () => { expect(portraitAfterLine('kenta', 'n', undefined, 'hinata', isH)).toBe('hinata'); });
  it('narration drops an NPC tag when the scene has no heroine', () => { expect(portraitAfterLine('mei', 'n', undefined, undefined, isH)).toBeNull(); });
  it('heroine portrait stays through narration', () => { expect(portraitAfterLine('mio', 'n', undefined, 'hinata', isH)).toBe('mio'); });
  it('speaker with a portrait always wins', () => { expect(portraitAfterLine('hinata', '@健太', 'kenta', 'hinata', isH)).toBe('kenta'); });
  it('protagonist lines keep the current portrait', () => { expect(portraitAfterLine('kenta', 'me', undefined, 'hinata', isH)).toBe('kenta'); });
});
