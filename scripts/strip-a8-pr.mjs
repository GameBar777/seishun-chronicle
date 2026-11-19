/** GitHub Pages 以外（itch / Game Jolt / portal ZIP）では A8_PR=0 または PORTAL_BUILD=1 で PR枠を除く */
export const A8_PR_BLOCK = /<!--a8-pr-start-->[\s\S]*?<!--a8-pr-end-->\s*/g;
export function shouldStripA8Pr(env = process.env) {
  return env.A8_PR === '0' || env.PORTAL_BUILD === '1';
}
export function stripA8Pr(html, env = process.env) {
  return shouldStripA8Pr(env) ? html.replace(A8_PR_BLOCK, '') : html;
}
