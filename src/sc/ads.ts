/** AdSense H5 Games Ads (Ad Placement API) の安全ラッパー。
 *  広告スクリプトが無い／ブロック／未承認でも、必ず done を呼んでゲームを止めない。 */
export type AdHooks = { pause: () => void; resume: () => void; lock: (on: boolean) => void };
type W = { adBreak?: (o: any) => void; adConfig?: (o: any) => void; adsbygoogle?: any };
/** 広告ライブラリ本体が読み込まれたか（ブロック・読み込み失敗なら false → 即スキップ） */
export const adsReady = () => { const a = win().adsbygoogle; return !!a && !Array.isArray(a) || !!a?.loaded; };
const win = (): W => (typeof window === 'undefined' ? {} : (window as any));
let configured = false;

export function initAds() {
  if (configured) return; configured = true;
  try { win().adConfig?.({ preloadAdBreaks: 'on', sound: 'on' }); } catch { /* ignore */ }
}

/** 週送りのインタースティシャル。done は一度だけ必ず呼ばれる（timeoutMs で強制終了） */
export function weekBreak(h: AdHooks, done: () => void = () => { }, timeoutMs = 4000, adMaxMs = 120000) {
  let fin = false, paused = false, timer: any = null;
  const finish = () => {
    if (fin) return; fin = true; clearTimeout(timer);
    try { if (paused) h.resume(); } catch { }
    try { h.lock(false); } catch { }
    done();
  };
  const ab = win().adBreak;
  if (typeof ab !== 'function' || !adsReady()) return finish();
  timer = setTimeout(finish, timeoutMs);
  try {
    ab({
      type: 'next', name: 'week_break',
      beforeAd: () => { if (fin) return; paused = true; clearTimeout(timer); timer = setTimeout(finish, adMaxMs); try { h.lock(true); h.pause(); } catch { } },
      afterAd: () => { try { if (paused) { paused = false; h.resume(); } h.lock(false); } catch { } },
      adBreakDone: () => finish(),
    });
  } catch { finish(); }
}
export const _resetForTest = () => { configured = false; };
