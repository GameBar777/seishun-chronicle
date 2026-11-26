/** GitHub Pages 以外（itch / Game Jolt / portal ZIP）では A8_PR=0 または PORTAL_BUILD=1 で PR枠・広告・GoatCounter を除く。
 *  公式サイトへの案内リンクは PORTAL_LINK=1 または PORTAL_BUILD=1 で有効。 */
export const A8_PR_BLOCK = /<!--a8-pr-start-->[\s\S]*?<!--a8-pr-end-->\s*/g;
export const ADS_BLOCK = /<!--ads-start-->[\s\S]*?<!--ads-end-->\s*/g;
export const GOAT_BLOCK = /<!--goatcounter-start-->[\s\S]*?<!--goatcounter-end-->\s*/g;

export function shouldStripA8Pr(env = process.env) {
  return env.A8_PR === '0' || env.PORTAL_BUILD === '1';
}

export function shouldPortalLink(env = process.env) {
  return env.PORTAL_LINK === '1' || env.PORTAL_BUILD === '1';
}

export function stripA8Pr(html, env = process.env) {
  return shouldStripA8Pr(env) ? html.replace(A8_PR_BLOCK, '') : html;
}

/** A8 PR・AdSense / H5・GoatCounter をポータル用ビルドから除く */
export function stripPortalExtras(html, env = process.env) {
  if (!shouldStripA8Pr(env)) return html;
  return html.replace(A8_PR_BLOCK, '').replace(ADS_BLOCK, '').replace(GOAT_BLOCK, '');
}
