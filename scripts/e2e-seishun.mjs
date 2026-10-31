// ブラウザ通しの簡易スモーク：npm run build 後に実行（vite preview を起動して操作）
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const srv = spawn('npx', ['vite', 'preview', '--port', '4637', '--strictPort'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 2500));
const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
p.on('pageerror', e => errs.push(e.message));
try {
  await p.goto('http://localhost:4637' + (process.env.BASE_PATH || '/')); await p.click('#t-new'); await p.click('#s-go');
  const adv = async () => { for (let i = 0; i < 80; i++) { if (await p.$('.acts')) return; const c = await p.$('#ch button[data-i]'); if (c) { await c.click(); continue; } const ce = await p.$('#ce'); if (ce) { await ce.click(); continue; } await p.click('#box'); await p.waitForTimeout(20); } };
  await p.evaluate(() => { localStorage.setItem('seishun:set', JSON.stringify({ textSpeed: 0, auto: false })); });
  for (let w = 0; w < 6; w++) { await adv(); await p.click('.act[data-a="bun"]'); }
  await adv();
  // 自由入力会話
  await p.click('.act[data-a="talk"]'); await p.click('.tp >> nth=0'); await adv0(p);
  await p.fill('#cmd', 'STATUS'); await p.press('#cmd', 'Enter'); await p.waitForSelector('.modal');
  await p.screenshot({ path: '/tmp/seishun.png', fullPage: true });
  console.log('title:', await p.title(), 'errors:', errs.length ? errs : 'none');
  if (errs.length) process.exitCode = 1;
} finally { await b.close(); srv.kill(); }
async function adv0(p) { for (let i = 0; i < 40; i++) { if (await p.$('#ci')) { await p.fill('#ci', '今日もかわいいね'); await p.click('#cs'); for (let k = 0; k < 10 && !(await p.$('#ci')) && !(await p.$('.acts')); k++) await p.click('#box').catch(() => {}); return; } const c = await p.$('#ch button[data-i]'); if (c) { await c.click(); continue; } await p.click('#box').catch(() => {}); } }
