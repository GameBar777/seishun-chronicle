/** PLiCy / itch など配布版だけに出す、公式サイトへの案内。本家ビルドでは出さない。
 *  PLiCy では iframe の sandbox に allow-popups が無く、window.open が届かないことがある。
 *  そのため PLiCy（__PORTAL_PANEL__）では最初からゲーム内パネルを開き、URL のコピーや QR で案内する。
 *  itch は従来どおり 1 回のクリックで新しいタブを開き、開けなかったときだけ同じパネルを出す。 */
export const OFFICIAL_SITE_URL = 'https://gamebar777.github.io/seishun-chronicle/';
/** ボタン用の短い文言（「はこちら」は付けない） */
export const PORTAL_BTN_TEXT = '公式サイト版（攻略ページ・最新版）';
export const PORTAL_BTN_ID_TITLE = 't-official';
export const PORTAL_BTN_ID_ENDING = 'e-official';
export const OFFICIAL_PANEL_ID = 'official-panel';
export const PORTAL_PANEL_LEAD = '公式サイトでは最新版と攻略ページが見られます';
export const PORTAL_COPY_OK = 'コピーしました';
export const PORTAL_COPY_FALLBACK = '長押しでコピーしてください';
export const PORTAL_OPEN_FALLBACK = '開けない場合はURLをコピーしてブラウザに貼り付けてください';

declare const __PORTAL_LINK__: boolean;
declare const __PORTAL_PANEL__: boolean;

const BASE = (import.meta as any).env?.BASE_URL ?? './';

export function portalLinkEnabled(): boolean {
  return __PORTAL_LINK__;
}

/** PLiCy 配布だけ true。itch や本家では false。 */
export function portalPanelFirst(): boolean {
  return __PORTAL_LINK__ && __PORTAL_PANEL__;
}

export function portalLinkHtml(kind: 'title' | 'ending'): string {
  // __PORTAL_LINK__ が false の本家ビルドでは、この分岐ごと案内を落とす
  if (__PORTAL_LINK__) {
    if (kind === 'ending') {
      return `<button type="button" class="portal-link-btn" id="${PORTAL_BTN_ID_ENDING}">${PORTAL_BTN_TEXT}</button>`;
    }
    return `<button type="button" class="menu-btn portal-link-btn" id="${PORTAL_BTN_ID_TITLE}">${PORTAL_BTN_TEXT}</button>`;
  }
  return '';
}

/** メニューボタンと同じく、ユーザー操作から window.open する。枠が止めたら null。 */
export function openOfficialSite(): boolean {
  if (!__PORTAL_LINK__) return false;
  try {
    // 'noopener' を第3引数に付けると、開いても戻り値が必ず null になり、itch で成功判定できない
    const w = window.open(OFFICIAL_SITE_URL, '_blank');
    if (w) {
      try { w.opener = null; } catch { /* ignore */ }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function setPanelMsg(text: string): void {
  const el = document.getElementById('opanel-msg');
  if (el) el.textContent = text;
}

export function closeOfficialPanel(): void {
  document.getElementById(OFFICIAL_PANEL_ID)?.remove();
  window.removeEventListener('keydown', onPanelKey);
}

function onPanelKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeOfficialPanel();
  }
}

export async function copyOfficialUrl(): Promise<'ok' | 'select'> {
  const url = OFFICIAL_SITE_URL;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      return 'ok';
    }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    if (ok) return 'ok';
  } catch { /* fall through */ }
  const el = document.getElementById('opanel-url');
  if (el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }
  return 'select';
}

export function showOfficialPanel(): void {
  if (!__PORTAL_LINK__) return;
  closeOfficialPanel();
  const d = document.createElement('div');
  d.id = OFFICIAL_PANEL_ID;
  d.className = 'opanel';
  d.setAttribute('role', 'dialog');
  d.setAttribute('aria-modal', 'true');
  d.setAttribute('aria-labelledby', 'opanel-title');
  d.innerHTML = `<div class="opanel-card panel">
    <div class="mh"><b id="opanel-title">公式サイト</b><button type="button" id="opanel-close" aria-label="閉じる">×</button></div>
    <div class="mb">
      <p class="opanel-lead">${PORTAL_PANEL_LEAD}</p>
      <a id="opanel-url" class="opanel-url" href="${OFFICIAL_SITE_URL}" target="_blank" rel="noopener">${OFFICIAL_SITE_URL}</a>
      <img class="opanel-qr" src="${BASE}img/official-qr.png" width="112" height="112" alt="公式サイトのQRコード">
      <div class="opanel-row">
        <button type="button" id="opanel-copy">URLをコピー</button>
        <button type="button" id="opanel-open" class="primary">新しいタブで開く</button>
      </div>
      <p class="opanel-msg" id="opanel-msg" aria-live="polite"></p>
    </div>
  </div>`;
  // body に PLiCyFit の transform が掛かっているため、html 直下に置いて viewport 基準の fixed にする
  document.documentElement.appendChild(d);
  window.addEventListener('keydown', onPanelKey);
  const qr = d.querySelector<HTMLImageElement>('.opanel-qr');
  if (qr) qr.onerror = () => { qr.style.display = 'none'; };
  // 開いた直後の同じジェスチャ（pointerup / click）がパネルに当たって閉じたり、中のボタンを押したりしない
  d.style.pointerEvents = 'none';
  const arm = () => { d.style.pointerEvents = ''; };
  window.setTimeout(arm, 400);
  document.getElementById('opanel-close')!.onclick = () => closeOfficialPanel();
  d.onclick = e => { if (e.target === d && d.style.pointerEvents !== 'none') closeOfficialPanel(); };
  document.getElementById('opanel-copy')!.onclick = () => {
    void copyOfficialUrl().then(r => setPanelMsg(r === 'ok' ? PORTAL_COPY_OK : PORTAL_COPY_FALLBACK));
  };
  document.getElementById('opanel-open')!.onclick = () => {
    if (!openOfficialSite()) setPanelMsg(PORTAL_OPEN_FALLBACK);
  };
  document.getElementById('opanel-close')!.focus();
}

export function bindPortalLinks(): void {
  if (!__PORTAL_LINK__) return;
  let last = 0;
  const go = (ev?: Event) => {
    ev?.stopPropagation();
    const now = Date.now();
    if (now - last < 400) return;
    last = now;
    // PLiCy は最初からパネル。itch はまず新しいタブ、止まれば同じパネル。
    if (__PORTAL_PANEL__ || !openOfficialSite()) showOfficialPanel();
  };
  const onKey = (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      ev.stopPropagation();
      go(ev);
    }
  };
  const bind = (el: HTMLElement | null) => {
    if (!el) return;
    // PLiCy の親ページ #windowCanvas が最初の pointerdown を奪い、ゲーム側には pointerup / mouseup だけが届く。
    // click は発火しないので、pointerup でも開く。pointerdown / mousedown / click / Enter / Space も受けて保险にする。
    // preventDefault はポインタには掛けない（以前 itch の判定を壊したため）。
    el.addEventListener('pointerdown', go);
    el.addEventListener('mousedown', go);
    el.addEventListener('pointerup', go);
    el.addEventListener('click', go);
    el.addEventListener('keydown', onKey);
  };
  bind(document.getElementById(PORTAL_BTN_ID_TITLE));
  bind(document.getElementById(PORTAL_BTN_ID_ENDING));
}
