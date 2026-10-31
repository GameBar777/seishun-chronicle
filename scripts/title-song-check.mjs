// タイトル主題歌：自動再生ブロック→タップで開始、二重再生なし、ゲーム開始でフェード、タイトル復帰で再開、404時は合成BGM
import { chromium } from 'playwright';
const URL = process.env.URL || 'http://localhost:4637/'; const out = [];
const b = await chromium.launch();
async function run(name, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
  await p.addInitScript(() => { window.__au = []; const pl = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { if (!window.__au.includes(this)) window.__au.push(this); return pl.call(this); }; });
  if (opts.block) await p.route(/audio\/theme\./, r => r.fulfill({ status: 404, body: '' }));
  const st = () => p.evaluate(() => window.__au.filter(a => !a.paused && a.volume > 0.01).map(a => a.src.split('/').pop()));
  await p.goto(URL); await p.waitForTimeout(1200); out.push(`${name} load: playing=${JSON.stringify(await st())} tap=${!!(await p.$('.tapstart'))}`);
  await p.mouse.click(30, 300); await p.waitForTimeout(1500); out.push(`${name} after tap: ${JSON.stringify(await st())}`);
  if (opts.block) { out.push(`${name} fallback synth: ${await p.evaluate(() => !document.querySelector('.tapstart'))}`); await ctx.close(); return; }
  await p.click('#t-song'); await p.waitForTimeout(800); out.push(`${name} theme modal: ${JSON.stringify(await st())} lyric-on=${!!(await p.$('.lyrics p.on'))}`); await p.click('#m-x'); await p.waitForTimeout(500);
  out.push(`${name} after modal close: ${JSON.stringify(await st())}`);
  await p.click('#t-new'); await p.waitForTimeout(300); out.push(`${name} setup: ${JSON.stringify(await st())}`);
  await p.$eval('#s-go', e => e.click()); await p.waitForTimeout(2000); out.push(`${name} in game: ${JSON.stringify(await st())}`);
  p.on('dialog', d => d.accept()); await p.$eval('#b-title', e => e.click()); await p.waitForTimeout(1500); out.push(`${name} back to title: ${JSON.stringify(await st())}`);
  await ctx.close();
}
await run('normal'); await run('404', { block: true }); await b.close(); console.log(out.join('\n'));
