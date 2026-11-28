/** A8 PR枠の表示状態。CSS は body/html のクラスで切り替える（:has() 非依存、古い iOS Safari 向け）。
 *  計測用 0.gif は <template> に置き、枠が画面内に入ったときだけ DOM に差し込む（広告タグ自体は書き換えない）。 */
export type PrMode = 'off' | 'title' | 'ending';

const CLS = ['pr-title', 'pr-ending'] as const;

declare const __PORTAL_BUILD__: boolean;

type GoatCounter = { count: (opts: { path: string; title?: string; event?: boolean }) => void };
declare global {
  interface Window { goatcounter?: GoatCounter }
}

let prLinksMounted = false;
let prObserver: IntersectionObserver | null = null;

export function setPrMode(mode: PrMode) {
  if (typeof document === 'undefined') return;
  const title = mode === 'title';
  const ending = mode === 'ending';
  for (const el of [document.documentElement, document.body]) {
    if (!el) continue;
    el.classList.toggle('pr-title', title);
    el.classList.toggle('pr-ending', ending);
  }
  if (!__PORTAL_BUILD__) schedulePrFooter();
}

/** PR 枠が実際に見えたとき、template の li を 1 回だけ差し込む。失敗したら枠のリンクが出ないだけ。 */
function schedulePrFooter(): void {
  try {
    if (prLinksMounted) return;
    if (typeof document.querySelector !== 'function') return;
    const aside = document.querySelector('aside.fnb');
    if (!aside) return;
    if (!document.body.classList.contains('pr-title') && !document.body.classList.contains('pr-ending')) return;
    if (typeof IntersectionObserver !== 'function') return;
    prObserver?.disconnect();
    prObserver = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) mountPrLinks();
    }, { threshold: 0, root: null });
    prObserver.observe(aside);
    requestAnimationFrame(() => {
      try {
        const r = aside.getBoundingClientRect();
        const cs = getComputedStyle(aside);
        if (cs.display !== 'none' && r.height > 0 && r.bottom > 0 && r.top < (window.innerHeight || 0)) {
          mountPrLinks();
        }
      } catch { /* 枠が出ないだけ */ }
    });
  } catch { /* 枠が出ないだけ */ }
}

function mountPrLinks(): void {
  if (prLinksMounted) return;
  const tpl = document.getElementById('fnb-links');
  const ul = document.querySelector('aside.fnb ul.fnl');
  if (!tpl || !ul || !(tpl instanceof HTMLTemplateElement)) return;
  ul.appendChild(tpl.content.cloneNode(true));
  prLinksMounted = true;
  prObserver?.disconnect();
  prObserver = null;
  bindPrClicks();
}

/** リンク先も画面遷移も止めない。親で click / 中クリックを拾って GoatCounter に送る。 */
export function campaignOf(a: HTMLAnchorElement): string | null {
  if (a.closest('.end-guide')) return 'guide-endings';
  const href = a.getAttribute('href') || '';
  if (href.includes('4BGQGS+4P34KY+4AHY+5YRHE')) return 'gamers';
  if (href.includes('4BGJFP+UYK8I+6HW+3SY4KI')) return 'dmm';
  if (href.includes('4BGOWO+87WGFM+4EKC+60OXE')) return 'abema';
  if (href.includes('4BGJFP+XCANM+41ZK+60WN6')) return 'amnibus';
  return null;
}

export function prEventPath(name: string, mode: PrMode): string {
  if (name === 'guide-endings') return 'guide-endings';
  return `a8-${name}-${mode === 'ending' ? 'ending' : 'title'}`;
}

function bindPrClicks(): void {
  const aside = document.querySelector('aside.fnb');
  const root = aside?.parentElement;
  if (!root) return;
  const onClick = (e: Event) => {
    const ev = e as MouseEvent;
    if (ev.type === 'auxclick' && ev.button !== 1) return;
    const t = ev.target as Element | null;
    const a = t?.closest?.('a') as HTMLAnchorElement | null;
    if (!a || !root.contains(a)) return;
    const name = campaignOf(a);
    if (!name) return;
    const mode = prMode() === 'ending' ? 'ending' : 'title';
    const path = prEventPath(name, mode);
    try { window.goatcounter?.count({ path, title: path, event: true }); } catch { /* 計測だけ */ }
  };
  root.addEventListener('click', onClick);
  root.addEventListener('auxclick', onClick);
}

export function prMode(): PrMode {
  if (typeof document === 'undefined') return 'off';
  if (document.body.classList.contains('pr-ending')) return 'ending';
  if (document.body.classList.contains('pr-title')) return 'title';
  return 'off';
}

/** テスト用 */
export const _prClasses = CLS;
