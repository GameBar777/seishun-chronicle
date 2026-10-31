import { defineConfig } from 'vite';
// BASE_PATH: e.g. "/seishun-chronicle/" for GitHub Pages project sites. VITE_SITE_URL: absolute public URL (for canonical/og).
const base = process.env.BASE_PATH || '/';
process.env.VITE_SITE_URL ||= 'https://gamebar777.github.io/seishun-chronicle/'; // canonical/og always absolute
export default defineConfig({ base });
