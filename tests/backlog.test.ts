import { describe, it, expect, beforeEach } from 'vitest';
import { backlog, backlogHtml, LOG_CAP } from '../src/sc/backlog';
describe('会話ログ', () => {
  beforeEach(() => backlog.clear());
  it('keeps order (latest last) and caps at 300', () => {
    for (let i = 0; i < LOG_CAP + 50; i++) backlog.line('ひなた', `line${i}`);
    const a = backlog.all(); expect(a.length).toBe(300); expect(a[0].text).toBe('line50'); expect(a[a.length - 1].text).toBe('line349');
  });
  it('marks choices and dedupes immediate repeats', () => {
    backlog.line('春日ひなた', 'おはよ'); backlog.line('春日ひなた', 'おはよ'); backlog.choice('一緒に帰る');
    const a = backlog.all(); expect(a.length).toBe(2); expect(a[1].kind).toBe('choice');
    const h = backlogHtml(a, () => false); expect(h).toContain('bl-choice'); expect(h).toContain('一緒に帰る'); expect(h.indexOf('おはよ')).toBeLessThan(h.indexOf('一緒に帰る'));
  });
  it('shows ▶ only for playable lines and escapes html', () => {
    backlog.line('澪', '<b>x</b>', { who: 'mio', vid: 'abc' }); backlog.line('', '地の文', { who: 'n', narr: true });
    const h = backlogHtml(backlog.all(), (w, v) => w === 'mio' && v === 'abc');
    expect((h.match(/bl-play/g) || []).length).toBe(1); expect(h).toContain('&lt;b&gt;'); expect(h).toContain('bl-narr');
  });
  it('empty state', () => { expect(backlogHtml([], () => true)).toContain('まだ会話'); });
});
