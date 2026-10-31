// iPhone 表示監査：WebKit（不可なら Chromium）で SE/14/Pro Max、Safari の上下バー分を差し引いた表示領域で撮影＋はみ出し検査
import { webkit, chromium, devices } from 'playwright';
const URL = process.env.URL || 'http://localhost:4637/';
let engine = webkit, name = 'webkit'; try { const t = await webkit.launch(); await t.close(); } catch (e) { engine = chromium; name = 'chromium'; console.log('webkit unavailable:', e.message.split('\n')[0]); }
// Safari（下部タブバー表示時）の表示領域の目安
const VPS = [['se', 375, 667 - 120], ['14', 390, 844 - 180], ['promax', 430, 932 - 190]];
const b = await engine.launch(); const issues = [];
for (const [id, w, h] of VPS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: name === 'chromium', hasTouch: true, userAgent: devices['iPhone 14'].userAgent });
  const p = await ctx.newPage(); const shot = n => p.screenshot({ path: `docs/screenshots/mobile/${id}-${n}.png` });
  const check = async n => { const r = await p.evaluate(() => { const W = innerWidth, H = innerHeight, out = []; const sx = document.scrollingElement.scrollWidth > W + 1 ? ['横スクロール発生 ' + document.scrollingElement.scrollWidth] : [];
      for (const el of document.querySelectorAll('button,input,select,textarea')) { const r = el.getBoundingClientRect(); if (!r.width || getComputedStyle(el).visibility === 'hidden') continue; if (r.right > W + 1 || r.left < -1) out.push('横はみ出し:' + (el.id || el.textContent.trim().slice(0, 12))); }
      return [...sx, ...out]; }); if (r.length) issues.push(`${id}/${n}: ${r.join(', ')}`); };
  const reachable = async (sel, n) => { const ok = await p.evaluate(s => { const el = document.querySelector(s); if (!el) return 'none'; el.scrollIntoView({ block: 'nearest' }); const r = el.getBoundingClientRect(); return r.bottom <= innerHeight + 1 && r.top >= 0 ? 'ok' : 'ng ' + Math.round(r.bottom) + '/' + innerHeight; }, sel); if (ok !== 'ok') issues.push(`${id}/${n}: ${sel} ${ok}`); };
  await p.goto(URL); await p.evaluate(() => localStorage.setItem('seishun:set', JSON.stringify({ textSpeed: 0, auto: false }))); await p.reload(); await p.waitForTimeout(1500);
  await shot('title'); await check('title');
  const vis = await p.evaluate(() => [...document.querySelectorAll('.title .menu button')].map(e => e.getBoundingClientRect().bottom <= innerHeight)); if (vis.includes(false)) issues.push(`${id}/title: メニューが画面外 ${vis}`);
  await p.click('#t-song'); await p.waitForTimeout(500); await shot('theme'); await check('theme'); await reachable('#sg-stop', 'theme'); await p.click('#m-x');
  await p.click('#t-set'); await p.waitForTimeout(400); await shot('settings'); await check('settings'); await reachable('.modal .mb > :last-child', 'settings'); await p.click('#m-x');
  await p.click('#t-new'); await p.waitForTimeout(300); await shot('setup'); await check('setup'); await reachable('#s-go', 'setup'); await p.click('#s-go');
  let ev = 0; for (let i = 0; i < 200; i++) { if (await p.$('.acts')) break; if (ev < 1 && await p.$('.pimg')) { await p.waitForTimeout(900); await shot('event'); await check('event'); await reachable('#box', 'event'); ev++; } const c = await p.$('#ch button[data-i]'); if (c) { await shot('choice'); await reachable('#ch button[data-i]:last-of-type', 'choice'); await c.click(); continue; } const ce = await p.$('#ce'); if (ce) { await ce.click(); continue; } if (await p.$('#box')) await p.click('#box'); await p.waitForTimeout(20); }
  await p.waitForTimeout(600); await shot('main'); await check('main'); await reachable('.act:last-of-type', 'main');
  await ctx.close();
}
await b.close(); console.log('engine', name); console.log(issues.length ? issues.join('\n') : 'no issues');
