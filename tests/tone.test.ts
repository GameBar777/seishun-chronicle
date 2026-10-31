import { describe, it, expect } from 'vitest';
import { logTone, diffStats } from '../src/sc/progress';
describe('行動ログの色分け', () => {
  it('良い/悪い/中立', () => {
    expect(logTone('🏥 病院で診てもらった。風邪が治った！')).toBe('pos');
    expect(logTone('🤧 疲れがたまって風邪をひいた……')).toBe('neg');
    expect(logTone('文系の勉強をした。')).toBe('');
  });
  it('ストレス増は悪い、所持金増は良い', () => {
    const a: any = { stats: { bun: 40, ri: 40, gei: 30, yo: 35, un: 40, kon: 40, hp: 80, st: 20 }, money: 1000, hs: {} };
    const b: any = { ...a, stats: { ...a.stats, st: 30, hp: 60 }, money: 2000 };
    const d = diffStats(a, b);
    expect(d.find(x => x.key === 'st')!.good).toBe(false);
    expect(d.find(x => x.key === 'hp')!.good).toBe(false);
    expect(d.find(x => x.key === 'money')!.good).toBe(true);
  });
});
