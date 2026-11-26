/** PLiCy / itch など配布版だけに出す、公式サイトへの案内。本家ビルドでは出さない。 */
export const OFFICIAL_SITE_URL = 'https://gamebar777.github.io/seishun-chronicle/';
export const PORTAL_LINK_TEXT = '公式サイト版（攻略ページ・最新版あり）はこちら';

declare const __PORTAL_LINK__: boolean;

export function portalLinkEnabled(): boolean {
  return __PORTAL_LINK__;
}

export function portalLinkHtml(kind: 'title' | 'ending'): string {
  // __PORTAL_LINK__ が false の本家ビルドでは、この分岐ごと案内文を落とす
  if (__PORTAL_LINK__) {
    const cls = kind === 'ending' ? 'portal-link portal-link-ending' : 'portal-link portal-link-title';
    return `<p class="${cls}"><a href="${OFFICIAL_SITE_URL}" target="_blank" rel="noopener">${PORTAL_LINK_TEXT}</a></p>`;
  }
  return '';
}

/** iframe（PLiCy / itch）でも新しいタブを開けるよう window.open を試す。失敗したら <a target="_blank"> に任せる。 */
export function openOfficialSite(url = OFFICIAL_SITE_URL): boolean {
  if (!__PORTAL_LINK__) return false;
  try {
    const w = window.open(url, '_blank', 'noopener');
    return !!w;
  } catch {
    return false;
  }
}

export function bindPortalLinks(root: ParentNode = document): void {
  if (!__PORTAL_LINK__) return;
  root.querySelectorAll<HTMLAnchorElement>('.portal-link a').forEach(a => {
    a.addEventListener('click', ev => {
      if (openOfficialSite(a.href)) ev.preventDefault();
    });
  });
}
