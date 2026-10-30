// E2E: run against `vite preview` (default http://localhost:4173). Usage: node scripts/e2e.mjs [baseUrl]
import { chromium } from '@playwright/test';
const BASE = process.argv[2] || 'http://localhost:4173';
const OUT = process.env.E2E_OUT || 'docs/screenshots'; import('node:fs').then(fs => fs.mkdirSync(OUT, { recursive: true }));
const results = []; const errors = [];
const ok = (name, cond, extra = '') => { results.push({ name, pass: !!cond, extra }); console.log(`${cond ? 'PASS' : 'FAIL'} ${name} ${extra}`); };
async function playUntil(page, n) { // make n actions (choices or next-year)
  for (let i = 0; i < n; i++) {
    const c = page.getByTestId('choice'); const ny = page.getByTestId('next-year');
    if (await c.count()) await c.nth(i % (await c.count())).click();
    else if (await ny.count()) await ny.click();
    else break;
  }
}
async function artLoaded(page, sel) { return page.evaluate(async (sel) => { const im = document.querySelector(sel); if (!im) return 0; if (!im.complete) await new Promise(r => { im.onload = im.onerror = r; }); return im.naturalWidth; }, sel); }
async function choicesFit(page) { return page.evaluate(() => { const cs = [...document.querySelectorAll('[data-testid=choice]')]; const nav = document.querySelector('nav'); const lim = nav ? nav.getBoundingClientRect().top : innerHeight; if (!cs.length) return { first: -1 }; return { first: Math.round(cs[0].getBoundingClientRect().bottom), lim: Math.round(lim), n: cs.length, last: Math.round(cs[cs.length - 1].getBoundingClientRect().bottom) }; }); }
async function run(label, viewport, isMobile) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: isMobile ? 2 : 1, isMobile, hasTouch: isMobile, locale: 'ja-JP', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${label}: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`${label} console: ${m.text()}`); });
  await page.goto(BASE); await page.waitForSelector('[data-testid=new-life]');
  ok(`${label}: title art loaded`, await artLoaded(page, '[data-art=title]'), 'w=' + await artLoaded(page, '[data-art=title]'));
  await page.screenshot({ path: `${OUT}/${label}-01-title.png` });
  await page.getByTestId('new-life').click();
  await page.fill('#su-seed', '20261030'); await page.getByTestId('start').click();
  const tut = page.getByTestId('tutorial'); ok(`${label}: tutorial shown`, await tut.count());
  await page.screenshot({ path: `${OUT}/${label}-02-tutorial.png` });
  for (let i = 0; i < 4; i++) await page.getByTestId('tut-next').click();
  ok(`${label}: game started`, await page.getByTestId('event').count() || await page.getByTestId('year-end').count());
  { const w = await artLoaded(page, '.ev-art img'); ok(`${label}: event art loaded`, w > 0, `w=${w} key=${await page.locator('.ev-art img').getAttribute('data-art').catch(() => '-')}`);
    const f = await choicesFit(page); ok(`${label}: first choice visible without scroll`, f.first > 0 && f.first <= f.lim, JSON.stringify(f));
    ok(`${label}: event art has ja alt`, /[\u3040-\u9fff]/.test(await page.locator('.ev-art img').getAttribute('alt') ?? '')); }
  await page.screenshot({ path: `${OUT}/${label}-03-event.png` });
  const ev1 = await page.getByTestId('event').getAttribute('data-event').catch(() => null);
  await page.getByTestId('choice').first().click();
  ok(`${label}: choice shows result`, await page.getByTestId('result').count(), `(event ${ev1})`);
  const shots = new Set(); const firstArt = await page.locator('.ev-art img').getAttribute('data-art').catch(() => null);
  for (let g = 0; g < 400 && shots.size < 2; g++) { const ev = page.locator('.ev-art img'); if (await ev.count()) { const k = await ev.getAttribute('data-art'); if (!shots.has(k) && k !== firstArt) { await artLoaded(page, '.ev-art img'); shots.add(k); await page.screenshot({ path: `${OUT}/${label}-03${'bc'[shots.size - 1]}-event-${k}.png` }); } } await playUntil(page, 1); }
  await playUntil(page, 25);
  const ageBefore = await page.getByTestId('player-age').textContent();
  const nameBefore = await page.getByTestId('player-name').textContent();
  ok(`${label}: years progress`, parseInt(ageBefore) > 18, ageBefore);
  if (await page.getByTestId('year-end').count() === 0) await playUntil(page, 1);
  const ye = page.getByTestId('year-end'); if (await ye.count()) await page.screenshot({ path: `${OUT}/${label}-04-yearend.png`, fullPage: false });
  const saved = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('ripple')).length);
  ok(`${label}: saved to localStorage`, saved >= 1, `keys=${saved}`);
  const ageNow = await page.getByTestId('player-age').textContent();
  await page.reload(); await page.waitForSelector('[data-testid=continue]');
  await page.getByTestId('continue').click();
  ok(`${label}: restore after reload`, (await page.getByTestId('player-name').textContent()) === nameBefore && (await page.getByTestId('player-age').textContent()) === ageNow, `${nameBefore} ${ageNow}`);
  for (const tab of ['timeline', 'money', 'people', 'news']) {
    await page.getByTestId(`tab-${tab}`).click(); await page.waitForTimeout(100);
    await page.screenshot({ path: `${OUT}/${label}-05-${tab}.png`, fullPage: false });
  }
  ok(`${label}: chart rendered`, await (async () => { await page.getByTestId('tab-timeline').click(); return page.locator('svg.chart').count(); })());
  await page.getByTestId('tab-more').click(); await page.getByTestId('tab-family').click(); await page.screenshot({ path: `${OUT}/${label}-06-family.png` });
  await page.getByTestId('tab-more').click(); await page.getByTestId('tab-awards').click(); await page.screenshot({ path: `${OUT}/${label}-07-awards.png` });
  await page.getByTestId('tab-more').click(); await page.getByTestId('tab-settings').click();
  await page.getByTestId('export').click(); const code = await page.getByTestId('io').inputValue();
  ok(`${label}: export produces code`, code.length > 100, `len=${code.length}`);
  await page.screenshot({ path: `${OUT}/${label}-08-settings.png` });
  // play to death
  await page.getByTestId('tab-life').click();
  let guard = 0; while (!(await page.getByTestId('review').count()) && guard++ < 1500) await playUntil(page, 1);
  ok(`${label}: life reaches review`, await page.getByTestId('review').count(), `actions=${guard}`);
  ok(`${label}: review art loaded`, await (async () => { await page.locator('[data-art=review]').scrollIntoViewIfNeeded(); return artLoaded(page, '[data-art=review]'); })());
  await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: `${OUT}/${label}-09b-review-top.png` });
  await page.screenshot({ path: `${OUT}/${label}-09-review.png`, fullPage: true });
  const heir = page.getByTestId('heir'); const next = (await heir.count()) ? heir.first() : page.getByTestId('stranger');
  await next.click(); await page.waitForTimeout(300);
  ok(`${label}: next generation starts`, await page.getByTestId('event').count() || await page.getByTestId('year-end').count());
  await page.screenshot({ path: `${OUT}/${label}-10-nextgen.png` });
  // import into fresh context
  const p2 = await (await browser.newContext({ viewport, reducedMotion: 'reduce' })).newPage(); await p2.goto(BASE);
  await p2.evaluate(() => localStorage.clear()); await p2.reload(); await p2.getByTestId('new-life').click(); await p2.getByTestId('start').click();
  for (let i = 0; i < 4; i++) await p2.getByTestId('tut-next').click();
  await p2.getByTestId('tab-more').click(); await p2.getByTestId('tab-settings').click(); await p2.getByTestId('io').fill(code); await p2.getByTestId('import').click();
  ok(`${label}: import restores`, (await p2.getByTestId('player-name').textContent()) === nameBefore);
  // horizontal overflow check
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); ok(`${label}: no horizontal overflow`, ov <= 1, `overflow=${ov}`);
  for (const pg of ['privacy', 'terms', 'about', 'how-to-play', 'faq', 'changelog']) { const r = await page.goto(`${BASE}/${pg}.html`); ok(`${label}: /${pg}.html`, r.ok() && (await page.locator('h1').count()) > 0); }
  await browser.close();
}
await run('mobile', { width: 390, height: 844 }, true);
await run('desktop', { width: 1280, height: 800 }, false);
ok('no JS errors', errors.length === 0, errors.slice(0, 5).join(' | '));
const fail = results.filter(r => !r.pass).length;
console.log(`\n${results.length - fail}/${results.length} passed`);
import('node:fs').then(fs => fs.writeFileSync((process.env.E2E_RESULTS || 'docs/e2e-results.json'), JSON.stringify({ at: new Date().toISOString(), base: BASE, results, errors }, null, 2)));
process.exitCode = fail ? 1 : 0;
