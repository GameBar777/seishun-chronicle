import { chromium } from 'playwright';
const mode = process.argv[2];
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errs = []; p.on('pageerror', e => errs.push(e.message));
let gReq = 0; await p.route(/googlesyndication|doubleclick|googleads/, r => { gReq++; return mode === 'blocked' ? r.abort() : r.continue(); });
await p.addInitScript(() => {
  localStorage.setItem('seishun:set', JSON.stringify({ master: .5, voice: 0, bgm: .5, se: 0, auto: false, textSpeed: 0, voiceRate: 1, narrate: false, autoPlay: false, perChar: {} }));
  window.__ctxs = []; const AC = window.AudioContext; window.AudioContext = class extends AC { constructor(...a) { super(...a); window.__ctxs.push(this); } };
  window.__ads = []; const arr = []; const orig = arr.push.bind(arr);
  Object.defineProperty(window, 'adsbygoogle', { configurable: true, get: () => window.__ag || arr, set: v => { window.__ag = v; } });
  arr.push = o => { window.__ads.push({ type: o.type || 'config', name: o.name, stage: !!document.querySelector('.stage'), choices: !!document.querySelector('#ch button'), acts: !!document.querySelector('.acts') }); return orig(o); };
});
await p.goto('process.argv[3] || 'http://127.0.0.1:4180/'', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500);
await p.click('#t-new', { force: true }); await p.waitForTimeout(600); await p.click('#s-go', { force: true }); await p.waitForTimeout(800);
let adStates = [], adCloses = 0;
async function adv() { for (let i = 0; i < 120; i++) {
  if (await p.locator('#adlock').count()) {
    const s = await p.evaluate(() => window.__ctxs.map(c => c.state).join(',')); adStates.push(s);
    await p.waitForTimeout(1500); await p.mouse.click(362, 34); await p.waitForTimeout(800); adCloses++; continue; }
  if (await p.locator('.acts').count() && !(await p.locator('.stage').count()) && !(await p.locator('#wflip').count())) return true;
  if (await p.locator('#wflip').count()) { await p.waitForTimeout(400); continue; }
  if (await p.locator('#ce').count()) { await p.click('#ce', { force: true }); continue; }
  const c = p.locator('#ch button[data-i], .choices > button'); if (await c.count()) { await c.first().click({ force: true }); continue; }
  if (await p.locator('#tx').count()) { await p.locator('#tx').click({ force: true, position: { x: 10, y: 5 } }); await p.waitForTimeout(60); continue; }
  await p.waitForTimeout(150); } return false; }
let weeks = 0, hang = false;
for (let w = 0; w < 8; w++) {
  if (!(await adv())) { hang = true; await p.screenshot({path:'/tmp/adhang-'+mode+'.png'}); break; } console.log('wk', w, await p.evaluate(()=>({n:window.__ads.length, ld: !!(window.adsbygoogle && window.adsbygoogle.loaded), lock: !!document.getElementById('adlock')})));
  await p.locator('.act:not([disabled])').first().click({ force: true }); weeks++; await p.waitForTimeout(300); console.log('after', await p.evaluate(()=>({stage:!!document.querySelector('.stage'),wf:!!document.getElementById('wflip'),t:document.querySelector('.sc-title')?.textContent})));
}
if (!hang && !(await adv())) hang = true; if (hang) await p.screenshot({path:'/tmp/adhang-'+mode+'.png'});
const st = await p.evaluate(() => ({ ctx: window.__ctxs.map(c => c.state).join(','), ads: window.__ads, lock: !!document.getElementById('adlock'), week: document.querySelector('.date')?.textContent, adFn: typeof window.adBreak }));
const bad = st.ads.filter(a => a.type === 'next' && (a.stage || a.choices || !a.acts));
console.log(JSON.stringify({ adStates, adCloses, ctxAfter: st.ctx, mode, weeks, hang, gReq, lockLeft: st.lock, week: st.week, adFn: st.adFn, breaks: st.ads.filter(a => a.type === 'next').length, config: st.ads.filter(a => a.type === 'config').length, badPlacement: bad.length, errs }));
await b.close();
