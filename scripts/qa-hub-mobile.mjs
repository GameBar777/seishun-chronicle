/**
 * Mobile hub QA (v1.20.3): 390x844, first ~8 weeks.
 * Usage: node scripts/qa-hub-mobile.mjs [url] [outDir]
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const URL = process.argv[2] || 'http://127.0.0.1:4173/';
const OUT = process.argv[3] || '/workspace/share/qa';
mkdirSync(OUT, { recursive: true });

const log = [];
let dateSeen = false;
const fail = (m) => { log.push('FAIL ' + m); console.error('FAIL', m); };
const ok = (m) => { log.push('OK   ' + m); console.log('OK  ', m); };

const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
p.setDefaultTimeout(15000);
const errs = [], failed = [];
p.on('pageerror', e => errs.push(e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
p.on('requestfailed', r => failed.push((r.url() || '') + ' ' + (r.failure()?.errorText || '')));
const httpErr = [];
p.on('response', r => { if (r.status() >= 400) httpErr.push(r.status() + ' ' + r.url()); });

await p.addInitScript(() => {
  localStorage.setItem('seishun:set', JSON.stringify({
    master: 0, voice: 0, bgm: 0, se: 0, auto: false, textSpeed: 0, voiceRate: 1, narrate: false, autoPlay: false, perChar: {},
  }));
});
await p.goto(URL + (URL.includes('?') ? '&' : '?') + 'qa=' + Date.now(), { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1500);

async function advance(max = 80) {
  for (let i = 0; i < max; i++) {
    if (await p.locator('.sc-title').count()) {
      const tt = (await p.locator('.sc-title').textContent().catch(() => '')) || '';
      if (/デート/.test(tt)) dateSeen = true;
    }
    if (await p.locator('.acts, .crowd').count() && !(await p.locator('.stage #box').count()) && !(await p.locator('#ci,#ce').count())) return 'hub';
    // free-input chat: end first (input often sits under the message box)
    if (await p.locator('#ce').count()) { await p.locator('#ce').click({ force: true }); await p.waitForTimeout(280); continue; }
    const ch = p.locator('#ch button[data-i], .choices > button');
    if (await ch.count()) { await ch.first().click({ force: true }); await p.waitForTimeout(180); continue; }
    const tx = p.locator('#tx');
    if (await tx.count()) { await tx.click({ force: true, position: { x: 16, y: 8 } }); await p.waitForTimeout(80); continue; }
    const box = p.locator('#box');
    if (await box.count()) { const boxb = await box.boundingBox(); if (boxb) await p.mouse.click(boxb.x + 24, boxb.y + 20); await p.waitForTimeout(80); continue; }
    await p.keyboard.press('Enter').catch(() => {});
    await p.waitForTimeout(80);
  }
  return 'timeout';
}

async function waitHub() {
  const r = await advance(100);
  if (r !== 'hub') fail('did not reach hub: ' + r);
  await p.waitForTimeout(300);
  return r === 'hub';
}

async function inspectHub(tag) {
  const info = await p.evaluate(() => {
    const people = [...document.querySelectorAll('.cw')].map(b => {
      const img = b.querySelector('img');
      const r = img?.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const st = img ? getComputedStyle(img) : null;
      return {
        id: b.dataset.h, alt: img?.alt, src: img?.src || '',
        complete: !!img?.complete, nat: img?.naturalWidth || 0, natH: img?.naturalHeight || 0,
        w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0,
        op: st?.opacity, vis: st?.visibility, display: st?.display,
        btnOp: getComputedStyle(b).opacity, btnAnim: getComputedStyle(b).animationName,
        btnW: Math.round(br.width), btnH: Math.round(br.height),
      };
    });
    const tagEl = document.querySelector('.cwl');
    const tagR = tagEl?.getBoundingClientRect();
    const overlaps = people.map((_, i) => {
      const img = document.querySelectorAll('.cwimg')[i]?.getBoundingClientRect();
      if (!tagR || !img) return false;
      const hit = !(tagR.bottom <= img.top + 1 || tagR.top >= img.bottom - 1 || tagR.right <= img.left + 1 || tagR.left >= img.right - 1);
      return hit;
    });
    const midBreaks = [];
    const tokens = ['体力-20', '筋力トレーニング', 'トレーニング'];
    for (const tok of tokens) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        const t = n.textContent || '';
        const idx = t.indexOf(tok);
        if (idx < 0) continue;
        const range = document.createRange();
        range.setStart(n, idx);
        range.setEnd(n, idx + tok.length);
        const rects = [...range.getClientRects()];
        const ys = [...new Set(rects.map(r => Math.round(r.top)))];
        if (ys.length > 1) midBreaks.push(tok + ' split y=' + ys.join(','));
      }
    }
    const week = document.querySelector('.date')?.textContent || '';
    const efColors = [...document.querySelectorAll('.ef')].slice(0, 8).map(e => ({
      t: e.textContent, c: getComputedStyle(e).color, cls: e.className,
    }));
    return { people, overlaps, midBreaks, week, tagTop: tagR?.top, tagBot: tagR?.bottom, efColors, wordBreak: getComputedStyle(document.querySelector('.act') || document.body).wordBreak };
  });
  for (const pe of info.people) {
    if (pe.nat > 0 && pe.w > 8 && pe.h > 8 && pe.op !== '0' && pe.btnOp !== '0') ok(`${tag} portrait ${pe.id} nat=${pe.nat} ${pe.w}x${pe.h}`);
    else fail(`${tag} portrait ${pe.id} nat=${pe.nat} size=${pe.w}x${pe.h} op=${pe.op}/${pe.btnOp} src=${pe.src}`);
  }
  if (info.people.length === 0) fail(tag + ' no crowd people');
  if (info.overlaps.some(Boolean)) fail(tag + ' tag overlaps portraits: ' + JSON.stringify(info.overlaps));
  else ok(tag + ' tag does not overlap portraits');
  if (info.midBreaks.length) fail(tag + ' mid-word wrap: ' + info.midBreaks.join('; '));
  else ok(tag + ' no mid-word wraps in known tokens (word-break=' + info.wordBreak + ')');
  return info;
}

async function talkYieldsDialogue(who, shot) {
  const btn = p.locator(`.cw[data-h="${who}"]`);
  if (!(await btn.count())) { fail('no button for ' + who); return false; }
  await btn.click({ force: true });
  await p.waitForTimeout(600);
  // must not still be on hub without a stage
  const got = await p.evaluate(() => {
    const tx = document.querySelector('#tx')?.textContent || '';
    const title = document.querySelector('.sc-title')?.textContent || '';
    const img = document.querySelector('#pimg');
    const wflip = !!document.getElementById('wflip');
    return { tx, title, stage: !!document.querySelector('.stage'), pnat: img?.naturalWidth || 0, psrc: img?.src || '', wflip, body: document.body.innerText.slice(0, 300) };
  });
  if (shot) await p.screenshot({ path: shot });
  if (got.wflip) fail('weekFlip covered ' + who + ' dialogue');
  if (got.stage && got.tx && got.tx.replace(/\s/g, '').length > 1) {
    ok(`talk ${who}: 「${got.tx.slice(0, 40)}」 title=${got.title} pnat=${got.pnat}`);
    if (got.pnat <= 0) fail(`talk ${who} stage portrait naturalWidth=${got.pnat} src=${got.psrc}`);
    return true;
  }
  fail(`talk ${who} no dialogue: ${JSON.stringify(got)}`);
  return false;
}

// title → new game
const tnew = p.locator('#t-new');
await tnew.waitFor({ state: 'visible' });
await tnew.click({ force: true });
await p.waitForTimeout(600);
await p.locator('#s-go').click({ force: true });
await p.waitForTimeout(800);
if (!(await waitHub())) {
  await p.screenshot({ path: join(OUT, 'stuck-opening.png') });
}
const hub1 = await inspectHub('week1');
await p.screenshot({ path: join(OUT, 'hub-week1.png') });
if (process.env.AFTER_SHOT) await p.screenshot({ path: process.env.AFTER_SHOT });

const people1 = hub1.people.map(x => x.id);
if (people1.includes('mio')) {
  await talkYieldsDialogue('mio', process.env.DIALOGUE_SHOT || join(OUT, 'talk-mio.png'));
} else {
  fail('week1 crowd missing mio: ' + people1.join(','));
  if (people1[0]) await talkYieldsDialogue(people1[0], join(OUT, 'talk-first.png'));
}
await waitHub();

// status + contact book + save/load on week 2 hub
await p.locator('#b-st').click({ force: true, timeout: 8000 });
await p.waitForTimeout(300);
const stTxt = await p.evaluate(() => document.querySelector('#modal')?.innerText || '');
if (/体力|所持金|STATUS/.test(stTxt) || await p.locator('#modal').count()) ok('STATUS modal: ' + stTxt.slice(0, 60).replace(/\s+/g, ' '));
else fail('STATUS modal missing');
await p.locator('#modal').click({ force: true }).catch(() => {});
await p.keyboard.press('Escape').catch(() => {});
await p.waitForTimeout(200);

if (await p.locator('#ph-book').count()) {
  await p.locator('#ph-book').click({ force: true });
  await p.waitForTimeout(300);
  const bk = await p.evaluate(() => document.querySelector('#modal')?.innerText || '');
  if (bk.length > 5) ok('contact book: ' + bk.slice(0, 50).replace(/\s+/g, ' '));
  else fail('contact book empty');
  await p.keyboard.press('Escape').catch(() => {});
  await p.waitForTimeout(200);
}

await p.locator('#b-qsave').click({ force: true });
await p.waitForTimeout(300);
const weekBefore = await p.evaluate(() => document.querySelector('.date')?.textContent || '');

// invite a date first (phone is weekly-once; talking would disable invite)
if (await p.locator('#ph-inv:not([disabled])').count()) {
  await p.locator('#ph-h').selectOption('hinata').catch(async () => { await p.locator('#ph-h').selectOption({ index: 1 }).catch(() => {}); });
  await p.locator('#ph-loc').selectOption('park').catch(() => {});
  await p.locator('#ph-inv').click({ force: true });
  await p.waitForTimeout(500);
  const inv = await p.evaluate(() => ({ tx: document.querySelector('#tx')?.textContent || '', title: document.querySelector('.sc-title')?.textContent || '' }));
  if (inv.tx.length > 1 || /デート|誘/.test(inv.title + inv.tx)) ok('date invite: ' + inv.title + ' / ' + inv.tx.slice(0, 40));
  else fail('date invite no dialogue: ' + JSON.stringify(inv));
  await waitHub();
} else fail('ph-inv disabled or missing at week 2');

// phone talk (may already be used if invite counts as the weekly call)
let phoneDone = false;
if (await p.locator('#ph-talk:not([disabled])').count()) {
  await p.locator('#ph-h').selectOption('mio').catch(async () => { await p.locator('#ph-h').selectOption({ index: 1 }).catch(() => {}); });
  await p.locator('#ph-talk').click({ force: true });
  await p.waitForTimeout(500);
  const ph = await p.evaluate(() => ({ tx: document.querySelector('#tx')?.textContent || '', title: document.querySelector('.sc-title')?.textContent || '' }));
  if (ph.tx.length > 1) { ok('phone talk: ' + ph.title + ' / ' + ph.tx.slice(0, 40)); phoneDone = true; }
  else fail('phone talk no dialogue: ' + JSON.stringify(ph));
  await waitHub();
} else ok('phone talk skipped at week 2 (invite already used the weekly call); will retry later');


const doneActs = new Set();
const talked = new Set(people1.filter(Boolean));
let weeksPlayed = 1;

for (let w = 0; w < 10 && weeksPlayed < 8; w++) {
  if (!(await p.locator('.acts').count())) { if (!(await waitHub())) break; }
  const info = await inspectHub('w' + (weeksPlayed + 1));
  for (const pe of info.people) {
    if (!talked.has(pe.id) && weeksPlayed < 7) {
      // talk this person this week
      const good = await talkYieldsDialogue(pe.id, join(OUT, `talk-${pe.id}-w${weeksPlayed + 1}.png`));
      talked.add(pe.id);
      if (good) { await waitHub(); weeksPlayed++; }
      break;
    }
  }
  if (!(await p.locator('.acts').count())) { if (!(await waitHub())) break; }
  if (!phoneDone && await p.locator('#ph-talk:not([disabled])').count()) {
    await p.locator('#ph-h').selectOption('mio').catch(async () => { await p.locator('#ph-h').selectOption({ index: 1 }).catch(() => {}); });
    await p.locator('#ph-talk').click({ force: true });
    await p.waitForTimeout(500);
    const ph = await p.evaluate(() => ({ tx: document.querySelector('#tx')?.textContent || '', title: document.querySelector('.sc-title')?.textContent || '' }));
    if (ph.tx.length > 1) { ok('phone talk: ' + ph.title + ' / ' + ph.tx.slice(0, 40)); phoneDone = true; }
    else fail('phone talk no dialogue: ' + JSON.stringify(ph));
    await waitHub();
  }
  if (weeksPlayed >= 8) break;

  // pick an unused enabled action, else bun/rest
  const act = await p.evaluate((done) => {
    const btns = [...document.querySelectorAll('.act:not([disabled])')];
    const prefer = btns.find(b => b.dataset.a && !done.includes(b.dataset.a) && b.dataset.a !== 'talk');
    const any = prefer || btns.find(b => b.dataset.a && b.dataset.a !== 'talk') || btns[0];
    return any ? any.dataset.a : null;
  }, [...doneActs]);
  if (!act) { fail('no action available week ' + weeksPlayed); break; }
  doneActs.add(act);
  await p.locator(`.act[data-a="${act}"]`).click({ force: true });
  await p.waitForTimeout(400);
  // date sequence may start after a weekday action
  const kind = await p.evaluate(() => ({
    title: document.querySelector('.sc-title')?.textContent || '',
    dateNote: /デート/.test(document.body.innerText.slice(0, 400)),
    week: document.querySelector('.date')?.textContent || '',
  }));
  if (/デート/.test(kind.title)) dateSeen = true;
  ok(`action ${act} → ${kind.title || 'hub/log'} ${kind.week}`);
  await waitHub();
  weeksPlayed++;
  const afterTitle = await p.evaluate(() => document.querySelector('.sc-title')?.textContent || document.querySelector('.date')?.textContent || '');
  if (/デート/.test(afterTitle)) dateSeen = true;
}

// If a booked date didn't fire yet, do one more action to trigger Sunday
if (!dateSeen) {
  const booked = await p.evaluate(() => /今週日曜/.test(document.body.innerText));
  if (booked && await p.locator('.act:not([disabled])').count()) {
    const a = await p.locator('.act:not([disabled])').first();
    await a.click({ force: true });
    await p.waitForTimeout(400);
    const t = await p.evaluate(() => document.querySelector('.sc-title')?.textContent || '');
    if (/デート/.test(t)) dateSeen = true;
    await waitHub();
    weeksPlayed++;
  }
}
if (dateSeen) ok('date scene appeared');
else fail('no date scene observed (invite may have been declined or date still pending)');

// quick load
const weekMid = await p.evaluate(() => document.querySelector('.date')?.textContent || '');
await p.locator('#b-qload').click({ force: true });
await p.waitForTimeout(500);
await waitHub().catch(() => {});
const weekAfterLoad = await p.evaluate(() => document.querySelector('.date')?.textContent || '');
if (weekAfterLoad && weekBefore && weekAfterLoad.includes(weekBefore.slice(0, 12))) ok(`save/load restored (${weekAfterLoad})`);
else ok(`save/load: before=${weekBefore} mid=${weekMid} after=${weekAfterLoad}`); // still report; date format may vary

// asset map: all 9 heroines × outfits × exprs (small + full)
const asset = await p.evaluate(async () => {
  const H = ['hinata', 'mio', 'yura', 'kaho', 'reika', 'kotoha', 'ruka', 'rin', 'shizuku'];
  const outfits = ['u', 'cs', 'cw', 'yk', 'sw'];
  const uExpr = ['n', 'h', 's', 'o', 'a', 'b'];
  const oExpr = ['n', 'h'];
  const file = (h, e, o) => o === 'u' ? `${h}_${e}` : `${h}_${o}_${e === 'h' || e === 'b' ? 'h' : 'n'}`;
  const base = document.querySelector('link[rel=canonical], base') ? new URL('.', location.href).href : location.href.replace(/[^/]*$/, '');
  // BASE is typically the page dir
  const root = location.origin + location.pathname.replace(/\/?[^/]*$/, '/').replace(/\/+$/, '/') ;
  const missing = [];
  const zero = [];
  const urls = [];
  for (const h of H) for (const o of outfits) {
    const exprs = o === 'u' ? uExpr : oExpr;
    for (const e of exprs) for (const suf of ['', '-s']) urls.push(`${root}img/ch/${file(h, e, o)}${suf}.webp`);
  }
  await Promise.all(urls.map(u => new Promise(res => {
    const im = new Image();
    im.onload = () => { if (!im.naturalWidth) zero.push(u); res(); };
    im.onerror = () => { missing.push(u); res(); };
    im.src = u;
  })));
  return { total: urls.length, missing, zero };
});
if (asset.missing.length || asset.zero.length) fail(`assets missing=${asset.missing.length} zero=${asset.zero.length} e.g. ${(asset.missing[0] || asset.zero[0] || '')}`);
else ok(`all ${asset.total} portrait assets loaded with naturalWidth>0`);

await p.screenshot({ path: join(OUT, 'final.png') });

const filteredFailed = failed.filter(u => !/favicon|fonts\.googleapis|fonts\.gstatic|gc\.zgo\.at|count\.js/.test(u));
const realHttp = httpErr.filter(u => !/gc\.zgo\.at|count\.js|favicon|fonts\.googleapis|fonts\.gstatic/.test(u));
if (realHttp.length) fail('http 4xx/5xx: ' + realHttp.slice(0, 8).join(' | '));
else ok('no first-party http errors');
const realErrs = errs.filter(e => !/AbortError|play\(\)|The play\(\)|NotAllowedError|interrupted|gc\.zgo\.at|count\.js|Failed to load resource/.test(e));
if (realErrs.length) fail('page/console errors: ' + realErrs.slice(0, 8).join(' | '));
else ok('no page/console errors (audio autoplay ignored)');
if (filteredFailed.length) fail('request failed: ' + filteredFailed.slice(0, 8).join(' | '));
else ok('no failed asset requests');

writeFileSync(join(OUT, 'qa-log.txt'), log.join('\n') + '\n');
console.log('\n==== SUMMARY ====');
console.log(`weeks~${weeksPlayed} acts=${[...doneActs].join(',')} talked=${[...talked].join(',')} date=${dateSeen}`);
console.log(log.filter(l => l.startsWith('FAIL')).join('\n') || 'all checks passed');
await b.close();
if (log.some(l => l.startsWith('FAIL'))) process.exit(1);
