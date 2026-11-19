import { defineConfig } from 'vite';
import { stripA8Pr } from './scripts/strip-a8-pr.mjs';
// BASE_PATH: e.g. "/seishun-chronicle/" for GitHub Pages project sites. VITE_SITE_URL: absolute public URL (for canonical/og).
const base = process.env.BASE_PATH || '/';
process.env.VITE_SITE_URL ||= 'https://gamebar777.github.io/seishun-chronicle/'; // canonical/og always absolute
// 古いシナリオJSがキャッシュから使われないよう、ビルドごとのIDを version.json に書き出して起動時に照合する
const BUILD = String(Date.now());
export default defineConfig({
  base,
  define: { __BUILD__: JSON.stringify(BUILD) },
  plugins: [
    { name: 'build-version', generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD }) }); } },
    // itch / Game Jolt / portal ZIP: A8_PR=0 または PORTAL_BUILD=1 で PR枠を除く。GitHub Pages の通常ビルドでは残す。
    { name: 'a8-pr-gate', transformIndexHtml(html) { return stripA8Pr(html); } },
  ],
});
