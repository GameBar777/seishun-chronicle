import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { weekBreak, initAds, _resetForTest } from './ads';
const hooks = () => ({ pause: vi.fn(), resume: vi.fn(), lock: vi.fn() });
beforeEach(() => { (globalThis as any).window = {}; _resetForTest(); vi.useFakeTimers(); });
afterEach(() => { delete (globalThis as any).window; vi.useRealTimers(); });
describe('ads wrapper', () => {
  it('no adsbygoogle → done immediately, nothing paused', () => {
    const h = hooks(), done = vi.fn(); weekBreak(h, done);
    expect(done).toHaveBeenCalledTimes(1); expect(h.pause).not.toHaveBeenCalled(); expect(h.lock).toHaveBeenCalledWith(false);
  });
  it('ad shown: beforeAd pauses+locks, afterAd resumes, adBreakDone finishes once', () => {
    let o: any; (globalThis as any).window.adsbygoogle = { loaded: true }; (globalThis as any).window.adBreak = (x: any) => { o = x; };
    const h = hooks(), done = vi.fn(); weekBreak(h, done);
    expect(o.type).toBe('next'); expect(o.name).toBe('week_break'); expect(done).not.toHaveBeenCalled();
    o.beforeAd(); expect(h.pause).toHaveBeenCalled(); expect(h.lock).toHaveBeenCalledWith(true);
    o.afterAd(); expect(h.resume).toHaveBeenCalledTimes(1);
    o.adBreakDone({ breakStatus: 'viewed' }); o.adBreakDone({}); expect(done).toHaveBeenCalledTimes(1);
    expect(h.resume).toHaveBeenCalledTimes(1);
  });
  it('no ad (frequency capped): adBreakDone only → done, no pause', () => {
    (globalThis as any).window.adsbygoogle = { loaded: true }; (globalThis as any).window.adBreak = (x: any) => x.adBreakDone({ breakStatus: 'frequencyCapped' });
    const h = hooks(), done = vi.fn(); weekBreak(h, done); expect(done).toHaveBeenCalledTimes(1); expect(h.pause).not.toHaveBeenCalled();
  });
  it('adBreak never calls back → timeout resumes and unlocks', () => {
    let o: any; (globalThis as any).window.adsbygoogle = { loaded: true }; (globalThis as any).window.adBreak = (x: any) => { o = x; };
    const h = hooks(), done = vi.fn(); weekBreak(h, done, 1000, 5000); o.beforeAd();
    vi.advanceTimersByTime(1001); expect(done).not.toHaveBeenCalled(); vi.advanceTimersByTime(4000); expect(done).toHaveBeenCalledTimes(1); expect(h.resume).toHaveBeenCalled(); expect(h.lock).toHaveBeenLastCalledWith(false);
  });
  it('adBreak throws → done', () => {
    (globalThis as any).window.adsbygoogle = { loaded: true }; (globalThis as any).window.adBreak = () => { throw new Error('x'); };
    const done = vi.fn(); weekBreak(hooks(), done); expect(done).toHaveBeenCalledTimes(1);
  });
  it('script blocked (adsbygoogle still a plain array) → skip immediately', () => {
    const w = (globalThis as any).window; w.adsbygoogle = []; w.adBreak = vi.fn();
    const done = vi.fn(); weekBreak(hooks(), done); expect(done).toHaveBeenCalledTimes(1); expect(w.adBreak).not.toHaveBeenCalled();
  });
  it('no beforeAd within timeout → done', () => {
    const w = (globalThis as any).window; w.adsbygoogle = { loaded: true }; w.adBreak = () => { };
    const done = vi.fn(); weekBreak(hooks(), done, 4000); vi.advanceTimersByTime(4001); expect(done).toHaveBeenCalledTimes(1);
  });
  it('initAds calls adConfig once with preload+sound', () => {
    const c = vi.fn(); (globalThis as any).window.adConfig = c; initAds(); initAds();
    expect(c).toHaveBeenCalledTimes(1); expect(c).toHaveBeenCalledWith({ preloadAdBreaks: 'on', sound: 'on' });
  });
});
