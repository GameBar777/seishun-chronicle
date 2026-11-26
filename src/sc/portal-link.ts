/** PLiCy / itch など配布版だけに出す、公式サイトへの案内。本家ビルドでは出さない。
 *  PLiCy では <a> ではなく、タイトルメニューと同じ <button type="button"> + onclick で開く。
 *  公開ページ（https://plicy.net/GamePlay/241983）では、ゲームは iframe（scrolling=no、実測サイズ目安 958×600）に入り、
 *  本体 HTML には overflow:hidden と PLiCyFit.js が挿入される。下端付近のテキストリンクは、
 *  プレイヤー側の重ね層でクリックが届かないことがある。メニューボタンは届くため、同じ列・同じイベント経路にする。 */
export const OFFICIAL_SITE_URL = 'https://gamebar777.github.io/seishun-chronicle/';
/** ボタン用の短い文言（「はこちら」は付けない） */
export const PORTAL_BTN_TEXT = '公式サイト版（攻略ページ・最新版）';
export const PORTAL_BTN_ID_TITLE = 't-official';
export const PORTAL_BTN_ID_ENDING = 'e-official';

declare const __PORTAL_LINK__: boolean;

export function portalLinkEnabled(): boolean {
  return __PORTAL_LINK__;
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

/** メニューボタンと同じく、ユーザー操作の onclick から window.open する（iframe でも新しいタブを開く） */
export function openOfficialSite(): boolean {
  if (!__PORTAL_LINK__) return false;
  try {
    const w = window.open(OFFICIAL_SITE_URL, '_blank', 'noopener');
    return !!w;
  } catch {
    return false;
  }
}

export function bindPortalLinks(): void {
  if (!__PORTAL_LINK__) return;
  const go = () => { openOfficialSite(); };
  const titleBtn = document.getElementById(PORTAL_BTN_ID_TITLE) as HTMLButtonElement | null;
  const endBtn = document.getElementById(PORTAL_BTN_ID_ENDING) as HTMLButtonElement | null;
  if (titleBtn) titleBtn.onclick = go;
  if (endBtn) endBtn.onclick = go;
}
