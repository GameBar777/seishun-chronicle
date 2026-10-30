// Renders icon PNGs and promo thumbnails from SVG/HTML using headless Chromium.
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
const svg = readFileSync('public/icon.svg', 'utf8'); mkdirSync('docs/assets', { recursive: true });
const b = await chromium.launch(); const p = await b.newPage();
for (const s of [192, 512]) { await p.setViewportSize({ width: s, height: s }); await p.setContent(`<style>body{margin:0}</style>${svg.replace('<svg ', `<svg width="${s}" height="${s}" `)}`); await p.screenshot({ path: `public/icon-${s}.png`, omitBackground: true }); }
const thumb = (w, h, big) => `<style>body{margin:0;width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center;gap:${w * 0.05}px;background:radial-gradient(circle at 30% 40%,#fbe0cc,#f6f1e9 60%);font-family:"Noto Serif JP","Hiragino Mincho ProN",serif;color:#2b2622;overflow:hidden}
.r{position:relative;width:${h * 0.62}px;height:${h * 0.62}px}.r i{position:absolute;inset:0;border:${h * 0.012}px solid #c0563a;border-radius:50%}.r i:nth-child(2){transform:scale(.66);opacity:.8}.r i:nth-child(3){transform:scale(.33)}.r b{position:absolute;inset:44%;background:#2f6f73;border-radius:50%}
h1{font-size:${big}px;margin:0;letter-spacing:.08em}small{display:block;font:700 ${big * 0.28}px system-ui;letter-spacing:.45em;color:#2f6f73;margin-top:.4em}p{font:500 ${big * 0.26}px "Noto Sans JP",system-ui;color:#7b7067;margin:.8em 0 0}</style>
<div class="r"><i></i><i></i><i></i><b></b></div><div><h1>人生の残響</h1><small>RIPPLE YEARS</small><p>選んだ道は、何年後かに響いてくる。</p></div>`;
for (const [name, w, h, big] of [['public/thumbnail.png', 1200, 630, 96], ['docs/assets/thumbnail-512x384.png', 512, 384, 48], ['docs/assets/cover-1920x1080.png', 1920, 1080, 150]]) {
  await p.setViewportSize({ width: w, height: h }); await p.setContent(thumb(w, h, big)); await p.waitForTimeout(200); await p.screenshot({ path: name }); }
await b.close(); console.log('assets ok');
