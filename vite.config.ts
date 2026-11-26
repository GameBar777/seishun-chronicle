import { defineConfig } from 'vite';
import { stripPortalExtras, shouldPortalLink, shouldStripA8Pr } from './scripts/strip-a8-pr.mjs';
// BASE_PATH: e.g. "/seishun-chronicle/" for GitHub Pages project sites. VITE_SITE_URL: absolute public URL (for canonical/og).
const base = process.env.BASE_PATH || '/';
process.env.VITE_SITE_URL ||= 'https://gamebar777.github.io/seishun-chronicle/'; // canonical/og always absolute
// 古いシナリオJSがキャッシュから使われないよう、ビルドごとのIDを version.json に書き出して起動時に照合する
const BUILD = String(Date.now());
const portal = shouldStripA8Pr();
export default defineConfig({
  base,
  build: portal ? {
    // PLiCy はアップロード直後に、ハッシュ付き CSS/JS がまだファイル表に無いことがある。
    // 配布ZIPでは名前を固定し、index.html と資産の組み合わせがずれないようにする。
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (info) => {
          const name = (info.names && info.names[0]) || info.name || '';
          if (String(name).endsWith('.css')) return 'assets/index.css';
          return 'assets/[name][extname]';
        },
      },
    },
  } : undefined,
  define: {
    __BUILD__: JSON.stringify(BUILD),
    // PLiCy / itch など配布ZIPのみ公式サイト案内を出す。GitHub Pages の通常ビルドでは false。
    __PORTAL_LINK__: JSON.stringify(shouldPortalLink()),
    // A8_PR=0 または PORTAL_BUILD=1。広告ラッパーをバンドルから落とす。
    __PORTAL_BUILD__: JSON.stringify(shouldStripA8Pr()),
  },
  plugins: [
    { name: 'build-version', generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD }) }); } },
    // itch / Game Jolt / portal ZIP: A8_PR=0 または PORTAL_BUILD=1 で PR枠・広告・GoatCounter を除く。GitHub Pages の通常ビルドでは残す。
    { name: 'a8-pr-gate', transformIndexHtml(html) { return stripPortalExtras(html); } },
  ],
});
