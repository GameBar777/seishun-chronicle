import { defineConfig } from 'vite';
// BASE_PATH: e.g. "/seishun-chronicle/" for GitHub Pages project sites. VITE_SITE_URL: absolute public URL (for canonical/og).
const base = process.env.BASE_PATH || '/';
process.env.VITE_SITE_URL ||= 'https://gamebar777.github.io/seishun-chronicle/'; // canonical/og always absolute
// 古いシナリオJSがキャッシュから使われないよう、ビルドごとのIDを version.json に書き出して起動時に照合する
const BUILD = String(Date.now());
export default defineConfig({
  base,
  define: { __BUILD__: JSON.stringify(BUILD) },
  plugins: [{ name: 'build-version', generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD }) }); } }],
});
