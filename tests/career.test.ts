import { describe, it, expect } from 'vitest';
import { career } from '../src/sc/engine';
import M from '../public/voice/manifest.json';
import { voiceId } from '../src/sc/engine';
describe('career', () => {
  it('rewrites 大学 lines for 就職/専門', () => {
    expect(career('@健太:{S}。……大学行っても、連絡しろよ。絶対だぞ', '就職')).toContain('働き始めても');
    expect(career('h:{C}、大学でも走るからさ', '専門学校')).toContain('春からも');
    expect(career('h:{C}、大学でも走るからさ', '国公立大学')).toContain('大学でも');
  });
  it('variants have voice clips', () => {
    const ids = JSON.stringify(M);
    expect(ids).toContain(voiceId('@健太', career('@健太:{S}。……大学行っても、連絡しろよ。絶対だぞ', '就職').slice(4)));
  });
});
