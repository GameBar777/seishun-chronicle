/**
 * Ad abstraction. DISABLED unless VITE_ADS_PROVIDER is set at build time.
 * Supported provider: 'h5' = Google H5 Games Ads (Ad Placement API: adBreak / adConfig).
 * The ad script is only injected when enabled; ads are only requested at natural breaks
 * (between lives / after a life review), never during a decision, and failures never block play.
 */
type AdBreakOpts = { type: string; name: string; beforeAd?: () => void; afterAd?: () => void; adBreakDone?: (info: any) => void };
declare global { interface Window { adsbygoogle?: any[]; adBreak?: (o: AdBreakOpts) => void; adConfig?: (o: any) => void } }

const env = (import.meta as any).env ?? {};
const PROVIDER: string = env.VITE_ADS_PROVIDER ?? '';
const CLIENT: string = env.VITE_ADSENSE_CLIENT ?? ''; // ca-pub-XXXX (set in Cloudflare Pages env, not in code)
const TEST: boolean = env.VITE_ADS_TEST === '1';
let ready = false; let userAllowed = true; let lastBreak = 0;

export const adsConfigured = () => PROVIDER === 'h5' && /^ca-pub-\d+$/.test(CLIENT);
export function setAdsAllowed(v: boolean) { userAllowed = v; }

export function initAds() {
  if (!adsConfigured() || ready || typeof document === 'undefined') return;
  const sc = document.createElement('script'); sc.async = true;
  sc.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;
  sc.crossOrigin = 'anonymous'; sc.setAttribute('data-ad-frequency-hint', '120s'); if (TEST) sc.setAttribute('data-adbreak-test', 'on');
  document.head.appendChild(sc);
  window.adsbygoogle = window.adsbygoogle || [];
  window.adBreak = window.adConfig = function (o: any) { window.adsbygoogle!.push(o); };
  window.adConfig({ preloadAdBreaks: 'on', sound: 'off' });
  ready = true;
}

/** Request an interstitial at a natural break. Always calls done() (ad or not). */
export function naturalBreak(name: string, done: () => void, hooks: { pause?: () => void; resume?: () => void } = {}) {
  const now = Date.now();
  if (!ready || !userAllowed || !window.adBreak || now - lastBreak < 90_000) { done(); return; }
  lastBreak = now; let finished = false; const fin = () => { if (!finished) { finished = true; done(); } };
  const timer = setTimeout(fin, 8000); // never let an ad stall the game
  try { window.adBreak({ type: 'next', name, beforeAd: hooks.pause, afterAd: hooks.resume, adBreakDone: () => { clearTimeout(timer); fin(); } }); } catch { clearTimeout(timer); fin(); }
}
