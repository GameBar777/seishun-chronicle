// 実プレイ導線の立ち絵確認：週画面・会話・デート・イベントをデスクトップ/iPhone14で撮影
import { chromium, devices } from 'playwright';
const URL = process.env.URL || 'http://localhost:4637/';
const b = await chromium.launch(); const issues = [];
for (const [id, vp, mob] of [['desktop', { width: 1280, height: 800 }, false], ['iphone14', { width: 390, height: 664 }, true]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob, userAgent: mob ? devices['iPhone 14'].userAgent : undefined });
  const p = await ctx.newPage(); p.on('pageerror', e => issues.push(id + ' pageerror ' + e.message));
  const shot = n => p.screenshot({ path: `docs/screenshots/play/${id}-${n}.png` });
  const visible = async (sel, n) => { const r = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return 'missing'; const r = e.getBoundingClientRect(); return r.height > 60 && r.bottom > 0 && r.top < innerHeight ? 'ok' : `bad h${Math.round(r.height)} top${Math.round(r.top)}`; }, sel); if (r !== 'ok') issues.push(`${id}/${n}: ${sel} ${r}`); };
  await p.goto(URL); await p.evaluate(() => localStorage.setItem('seishun:set', JSON.stringify({ textSpeed: 0, auto: false }))); await p.reload(); await p.waitForTimeout(1200);
  await p.click('#t-new'); await p.waitForTimeout(300); await p.$eval('#s-go', e => e.click());
  const adv = async (stop) => { for (let i = 0; i < 300; i++) { if (await stop()) return true; const c = await p.$('#ch button[data-i]'); if (c) { await c.click(); continue; } const ce = await p.$('#ce'); if (ce) { await ce.click(); continue; } if (await p.$('#box')) await p.$eval('#box', e => e.click()); await p.waitForTimeout(25); } return false; };
  await p.waitForTimeout(800); for (let k = 0; k < 3; k++) await p.$eval('#box', e => e.click()); await p.waitForTimeout(700);
  await shot('event'); await visible('#pimg', 'event');
  await adv(async () => !!(await p.$('.acts'))); await p.waitForTimeout(900); await shot('week'); await visible('.cw img', 'week');
  const cw = await p.$('.cw'); if (cw) { await cw.click(); await adv(async () => !!(await p.$('#ci'))); await p.waitForTimeout(700); await shot('chat'); await visible('#pimg', 'chat'); await p.fill('#ci', '好きな食べ物は？'); await p.click('#cs'); await p.waitForTimeout(800); await shot('chat-reply'); await p.click('#ce').catch(() => { }); }
  await adv(async () => !!(await p.$('.acts')));
  // 撮影用：好感度を上げたセーブに差し替えて再開
  await p.evaluate(() => { const k = 'seishun:slotauto'; const t = localStorage.getItem(k); const [, , body] = t.split(':'); const j = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(body), c => c.charCodeAt(0)))); for (const h of Object.values(j.hs)) if (h.met) h.friend = 60; j.phoneUsed = false; const js = JSON.stringify(j); let x = 0; for (let i = 0; i < js.length; i++) x = (x * 31 + js.charCodeAt(i)) >>> 0; const bb = new TextEncoder().encode(js); let q = ''; bb.forEach(c => q += String.fromCharCode(c)); localStorage.setItem(k, `SEISHUN1:${x.toString(36)}:${btoa(q)}`); });
  await p.reload(); await p.waitForTimeout(1000); await p.click('#t-cont'); await p.waitForTimeout(500);
  let dated = false;
  for (let w = 0; w < 12 && !dated; w++) {
    await p.evaluate(() => { const s = document.querySelector('#ph-h'); s.selectedIndex = 1; }); await p.$eval('#ph-inv', e => e.click()).catch(() => { }); await adv(async () => !!(await p.$('.acts')));
    await p.$eval('.act', e => e.click());
    for (let i = 0; i < 300; i++) { const t = await p.$('.stage .sc-title'); if (t && /デート/.test(await t.textContent())) { dated = true; break; } if (await p.$('.acts')) break; const c = await p.$('#ch button[data-i]'); if (c) { await c.click(); continue; } const ce = await p.$('#ce'); if (ce) { await ce.click(); continue; } if (await p.$('#box')) await p.$eval('#box', e => e.click()); await p.waitForTimeout(25); }
  }
  if (dated) { await p.$eval('#box', e => e.click()); await p.waitForTimeout(800); await shot('date'); await visible('#pimg', 'date'); } else issues.push(id + ' date not reached');
  await ctx.close();
}
await b.close(); console.log(issues.length ? issues.join('\n') : 'no issues');
