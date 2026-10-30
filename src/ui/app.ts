import type { GameState, NPC } from '../engine/types';
import { newGame, choose, nextYear, heirs, succeed, FAMILY_TYPES, familyName } from '../engine/game';
import { Ctx, money } from '../engine/ctx';
import { AXES } from '../engine/review';
import { phaseName } from '../engine/world';
import { REGIONS, regionById } from '../data/regions';
import { jobById, EDU_NAME } from '../data/jobs';
import { GOALS, VALUES } from '../data/people';
import { ACHIEVEMENTS, checkAchievements } from '../engine/achievements';
import { loadGame, saveGame, clearGame, loadMeta, saveMeta, exportSave, importSave, type Meta } from '../platform/save';
import { initAds, naturalBreak, setAdsAllowed, adsConfigured } from '../platform/ads';
import { track, setAnalytics, analyticsConfigured } from '../platform/analytics';
import { t, setLang, LANGS } from '../i18n';
import { BRAND } from '../brand';
import { lineChart, bars } from './chart';
import { EVENTS } from '../data/events';
import { artForEvent, artImg } from '../data/illustrations';
const EV_CAT: Record<string, string> = Object.fromEntries(EVENTS.map(e => [e.id, e.cat]));

type Tab = 'life' | 'timeline' | 'money' | 'people' | 'news' | 'more' | 'family' | 'awards' | 'settings';
const esc = (s: string) => s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
const ROLE: Record<string, string> = { parent: '親', sibling: 'きょうだい', friend: '友人', partner: '恋人', spouse: '配偶者', ex: '元パートナー', child: '子ども', boss: '上司', coworker: '同僚', mentor: '恩師', neighbor: 'ご近所', stranger: '知人' };
const ICON: Record<string, string> = { life: '◉', timeline: '☰', money: '¥', people: '♡', news: '▤', more: '⋯' };

export class App {
  s: GameState | null = null; meta: Meta = loadMeta(); tab: Tab = 'life'; screen: 'title' | 'setup' | 'game' = 'title';
  lastResult = ''; toastTimer: any = 0; tutStep = -1;
  constructor(public root: HTMLElement) {}

  boot() {
    setLang(this.meta.settings.lang); setAdsAllowed(this.meta.settings.ads); setAnalytics(this.meta.settings.analytics);
    document.body.classList.toggle('reduce-motion', this.meta.settings.reduceMotion);
    initAds(); this.s = loadGame(); this.screen = 'title';
    this.root.addEventListener('click', e => this.onClick(e));
    this.render(); track('boot');
  }
  persist() { if (this.s) saveGame(this.s); saveMeta(this.meta); }
  toast(msg: string) { let el = document.getElementById('toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); } el.textContent = msg; el.className = 'show'; clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => el!.className = '', 2200); }
  unlock() { if (!this.s) return; const n = checkAchievements(this.s, this.meta); for (const a of n) this.toast(`🏅 実績解除：${a.name}`); }

  // ---------- events ----------
  onClick(e: Event) {
    const el = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null; if (!el) return;
    const act = el.dataset.act!, arg = el.dataset.arg ?? '';
    const s = this.s;
    switch (act) {
      case 'continue': this.screen = 'game'; this.tab = 'life'; break;
      case 'setup': this.screen = 'setup'; break;
      case 'back-title': this.screen = 'title'; break;
      case 'start': {
        const region = (this.root.querySelector('#su-region') as HTMLSelectElement).value || undefined;
        const family = (this.root.querySelector('#su-family') as HTMLSelectElement).value || undefined;
        const seedTxt = (this.root.querySelector('#su-seed') as HTMLInputElement).value.trim();
        const seed = seedTxt && /^\d+$/.test(seedTxt) ? Number(seedTxt) % 2 ** 31 : Math.floor(Math.random() * 2 ** 31);
        this.s = newGame(seed, { regionId: region, family }); this.screen = 'game'; this.tab = 'life'; this.lastResult = '';
        if (!this.meta.settings.tutorialDone) this.tutStep = 0;
        track('start', { region: region ?? 'random' }); this.persist(); break;
      }
      case 'choose': if (s?.active) { const r = choose(s, Number(arg)); this.lastResult = r; this.afterAction(); window.scrollTo(0, 0); } break;
      case 'next-year': if (s && s.phase === 'yearEnd') { this.lastResult = ''; nextYear(s); this.afterAction(); window.scrollTo(0, 0); } break;
      case 'tab': this.tab = arg as Tab; window.scrollTo(0, 0); break;
      case 'heir': case 'stranger': case 'newworld': if (s && s.phase === 'dead') {
        const go = () => { if (act === 'newworld') { this.s = newGame(); } else succeed(s, act === 'heir' ? arg : undefined); this.lastResult = ''; this.tab = 'life'; this.afterAction(); this.render(); window.scrollTo(0, 0); };
        naturalBreak('between_lives', go); return; }
        break;
      case 'tut-next': this.tutStep++; if (this.tutStep > 3) { this.tutStep = -1; this.meta.settings.tutorialDone = true; this.persist(); } break;
      case 'tut-again': this.tutStep = 0; this.screen = this.s ? 'game' : 'title'; this.tab = 'life'; break;
      case 'setting': { const k = arg as keyof Meta['settings']; (this.meta.settings as any)[k] = !(this.meta.settings as any)[k];
        setAdsAllowed(this.meta.settings.ads); setAnalytics(this.meta.settings.analytics); document.body.classList.toggle('reduce-motion', this.meta.settings.reduceMotion); this.persist(); break; }
      case 'export': if (s) { const code = exportSave(s, this.meta); const ta = this.root.querySelector('#io') as HTMLTextAreaElement; ta.value = code; ta.select(); navigator.clipboard?.writeText(code).then(() => this.toast(t('save.copy') + ' ✓'), () => {}); } return;
      case 'import': { const ta = this.root.querySelector('#io') as HTMLTextAreaElement; try { const r = importSave(ta.value); this.s = r.game; if (r.meta) this.meta = { ...this.meta, achievements: { ...r.meta.achievements, ...this.meta.achievements } }; this.persist(); this.toast(t('save.importDone')); this.screen = 'game'; this.tab = 'life'; } catch (err: any) { this.toast(t('save.importFail', { msg: err?.message ?? '' })); return; } break; }
      case 'reset': if (confirm(t('save.resetConfirm'))) { clearGame(); this.s = null; this.screen = 'title'; } break;
    }
    this.render();
  }
  afterAction() {
    const s = this.s!; if (s.phase === 'dead' && s.pendingSummary) { const l = this.meta.lifetime; const e = s.pendingSummary.ending; if (!s.flags['__counted']) { s.flags['__counted'] = 1; l.lives++; l.endings[e] = (l.endings[e] ?? 0) + 1; l.maxGen = Math.max(l.maxGen, s.gen); track('death', { age: s.p.age, ending: e, gen: s.gen }); } }
    this.meta.lifetime.maxNetWorth = Math.max(this.meta.lifetime.maxNetWorth, Math.round(new Ctx(s).netWorth));
    this.unlock(); this.persist();
  }

  // ---------- rendering ----------
  render() {
    if (this.screen === 'title') this.root.innerHTML = this.vTitle();
    else if (this.screen === 'setup') this.root.innerHTML = this.vSetup();
    else this.root.innerHTML = this.vGame();
    if (this.tutStep >= 0 && this.screen === 'game') this.root.insertAdjacentHTML('beforeend', this.vTutorial());
  }
  vTitle() {
    const s = this.s; const cont = s ? `<button class="btn primary" data-act="continue" data-testid="continue">${t('title.continue')}<small>${esc(s.p.name)}・${s.p.age}歳・${s.world.year}年・${s.gen}代目</small></button>` : '';
    return `<main class="title"><figure class="title-art">${artImg('title', 'key', true)}</figure>
      <h1>${BRAND.name}<small>${BRAND.sub}</small></h1><p class="lead">${t('title.lead')}</p>
      <div class="stack">${cont}<button class="btn ${s ? '' : 'primary'}" data-act="setup" data-testid="new-life">${t('title.start')}</button>
      <a class="btn ghost" href="/how-to-play.html">${t('title.how')}</a></div>
      <footer class="foot"><a href="/about.html">このゲームについて</a>・<a href="/faq.html">FAQ</a>・<a href="/privacy.html">プライバシー</a>・<a href="/terms.html">利用規約</a></footer></main>`;
  }
  vSetup() {
    return `<main class="setup"><h2>${t('title.start')}</h2>
      <label>${t('start.region')}<select id="su-region"><option value="">${t('start.random')}</option>${REGIONS.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}</select></label>
      <div class="regions">${REGIONS.map(r => `<div class="rcard"><b>${r.name}</b><span>${r.desc}</span></div>`).join('')}</div>
      <label>${t('start.family')}<select id="su-family"><option value="">${t('start.random')}</option>${FAMILY_TYPES.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}</select></label>
      <label>${t('start.seed')}<input id="su-seed" inputmode="numeric" placeholder="空欄でランダム" /></label>
      <div class="stack"><button class="btn primary" data-act="start" data-testid="start">${t('start.go')}</button><button class="btn ghost" data-act="back-title">戻る</button></div></main>`;
  }
  vGame() {
    const s = this.s!; const c = new Ctx(s); const p = s.p;
    const head = `<header class="hud"><div class="who"><b data-testid="player-name">${esc(p.name)}</b><span data-testid="player-age">${p.age}歳</span><span class="muted">${s.world.year}年・${regionById(p.regionId).name}${s.gen > 1 ? `・${s.gen}代目` : ''}</span></div>
      <div class="meters">${this.meter('健康', p.health, 'h')}${this.meter('幸福', p.happy, 'j')}${this.meter('ストレス', p.stress, 's')}<div class="nw"><small>純資産</small><b data-testid="networth">${money(c.netWorth)}</b></div></div></header>`;
    const tabs: Tab[] = ['life', 'timeline', 'money', 'people', 'news', 'more'];
    const tn: Record<string, string> = { life: t('tab.life'), timeline: t('tab.timeline'), money: t('tab.money'), people: t('tab.people'), news: t('tab.news'), more: 'その他' };
    const moreActive = ['more', 'family', 'awards', 'settings'].includes(this.tab);
    const nav = `<nav class="tabs" aria-label="画面切り替え">${tabs.map(k => `<button data-act="tab" data-arg="${k}" data-testid="tab-${k}" class="${this.tab === k || (k === 'more' && moreActive) ? 'on' : ''}" aria-current="${this.tab === k}"><i>${ICON[k]}</i>${tn[k]}</button>`).join('')}</nav>`;
    const body = ({ life: () => this.vLife(), timeline: () => this.vTimeline(), money: () => this.vMoney(), people: () => this.vPeople(), news: () => `<figure class="news-art">${artImg('news', 'nw')}</figure>` + this.vNews(), more: () => this.vMore(), family: () => this.vFamily(), awards: () => this.vAwards(), settings: () => this.vSettings() } as Record<Tab, () => string>)[this.tab]();
    return `${head}<main class="content">${body}</main>${nav}`;
  }
  meter(label: string, v: number, k: string) { return `<div class="m m-${k}" title="${label} ${Math.round(v)}"><small>${label}</small><span><i style="width:${Math.round(v)}%"></i></span></div>`; }

  vLife() {
    const s = this.s!; const c = new Ctx(s);
    if (s.phase === 'dead') return this.vReview();
    const res = this.lastResult ? `<div class="result" data-testid="result">${esc(this.lastResult)}</div>` : '';
    if (s.active) { const a = s.active; const n = a.npcId ? s.npcs.find(x => x.id === a.npcId) : undefined;
      return `${res}<article class="card event" data-testid="event" data-event="${a.id}">${(() => { const k = artForEvent(a.id, EV_CAT[a.id] ?? ''); return k ? `<figure class="ev-art">${artImg(k, 'ev')}</figure>` : ''; })()}<div class="ev-meta">${s.world.year}年・${s.p.age}歳${n ? `<span class="chip">${esc(n.name)}（${ROLE[n.role] ?? ''}）</span>` : ''}</div>
        <h2>${esc(a.title)}</h2><p class="ev-text">${esc(a.text)}</p>
        <div class="choices">${a.choices.map((ch, i) => `<button class="choice" data-act="choose" data-arg="${i}" data-testid="choice"><span>${esc(ch.label)}</span>${this.meta.settings.showHints && ch.hint ? `<small>${esc(ch.hint)}</small>` : ''}</button>`).join('')}</div></article>`; }
    if (s.phase === 'yearEnd') { const r = s.ledger[s.ledger.length - 1]; const news = s.world.history.filter(h => h.year === s.world.year).slice(-4);
      const echoes = s.log.filter(l => l.year === s.world.year && l.kind === 'echo');
      return `${res}<article class="card yearend" data-testid="year-end"><h2>${t('year.end', { year: s.world.year })}</h2>
        ${echoes.map(e => `<div class="echo">${esc(e.text)}</div>`).join('')}
        <ul class="results">${s.yearResults.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        ${r ? `<div class="mini-ledger"><div><small>収入</small><b>${money(r.income + r.spouseIncome)}</b></div><div><small>税・社保</small><b>${money(-r.tax)}</b></div><div><small>生活・住居・教育</small><b>${money(-(r.living + r.housing + r.education))}</b></div><div><small>年末の現金</small><b>${money(r.cashEnd)}</b></div></div>` : ''}
        ${news.length ? `<div class="news-mini"><h3>今年のニュース</h3>${news.map(n => `<p>${esc(n.text)}</p>`).join('')}</div>` : ''}
        <div class="econ muted small">景気：${phaseName(s.world)}・物価指数 ${s.world.priceLevel.toFixed(2)}・失業率 ${s.world.unemployment}%</div>
        <button class="btn primary" data-act="next-year" data-testid="next-year">${t('year.next')}</button></article>${this.vStatus(c)}`; }
    return `<div class="card">…</div>`;
  }
  vStatus(c: Ctx) {
    const p = c.p; const j = c.job;
    return `<section class="card status"><h3>いまのあなた</h3><dl>
      <dt>仕事</dt><dd>${p.studying ? '在学中' : j ? `${j.name}（${j.ranks[p.rank]}）` : p.business ? `経営：${esc(p.business.name)}` : p.retired ? '引退' : '無職'}</dd>
      <dt>学歴</dt><dd>${EDU_NAME[p.edu]}</dd><dt>住まい</dt><dd>${p.house ? `持ち家（評価${money(p.house.value)}／残ローン${money(p.house.mortgage)}）` : '賃貸'}</dd>
      <dt>家族</dt><dd>${c.spouse ? `配偶者：${esc(c.spouse.name)}` : c.partner ? `恋人：${esc(c.partner.name)}` : '独身'}${c.children.length ? `・子${c.children.length}人` : ''}</dd>
      <dt>性格</dt><dd>${p.traits.join('・')}</dd></dl>
      <div class="statgrid">${(['int', 'soc', 'phy', 'cre', 'dis'] as const).map(k => `<div><small>${t(('stat.' + k) as any)}</small><b>${Math.round(p.stats[k])}</b></div>`).join('')}</div></section>`;
  }
  vReview() {
    const s = this.s!; const sum = s.pendingSummary!; const hs = heirs(s);
    return `<article class="card review" data-testid="review"><figure class="rv-art">${artImg('review', 'rv')}</figure><div class="ending-badge">${esc(sum.endingTitle)}</div>
      <h2>${t('dead.title', { name: esc(sum.name) })}</h2><p class="muted">${sum.birthYear}年 – ${sum.deathYear}年（${sum.age}歳）・${esc(sum.cause)}</p>
      <p class="obit">${esc(sum.obituary)}</p>${bars(sum.scores, AXES)}
      <h3>人生のハイライト</h3><ul class="results">${sum.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
      <h3>この人生が残した残響</h3><ul class="results">${[...new Map(s.world.echoes.filter(e => e.gen === s.gen).map(e => [e.cause + (e.surfaced ? e.effect : ''), e])).values()].slice(-6).map(e => `<li>${esc(e.cause)} → ${e.surfaced ? esc(e.effect) : '<span class="muted">（まだ表れていない…）</span>'}</li>`).join('') || `<li class="muted">${t('empty.none')}</li>`}</ul>
      <div class="stack">${hs.map(k => `<button class="btn primary" data-act="heir" data-arg="${k.id}" data-testid="heir">${esc(k.name)}として生きる<small>${k.outcome ? '' : '（成人まで時が進みます）'}</small></button>`).join('')}
      <button class="btn" data-act="stranger" data-testid="stranger">${t('dead.stranger')}</button><button class="btn ghost" data-act="newworld">${t('dead.new')}</button></div></article>`;
  }
  vTimeline() {
    const s = this.s!; const imp = [...s.log].reverse();
    return `<section class="card"><h2>${t('tab.timeline')}</h2>${lineChart(s.hist)}</section>
      <section class="card"><ol class="timeline" data-testid="timeline">${imp.slice(0, 200).map(l => `<li class="${l.important ? 'imp' : ''} k-${l.kind}"><span class="ty">${l.year}<small>${l.age}歳</small></span><span>${esc(l.text)}</span></li>`).join('')}</ol></section>`;
  }
  vMoney() {
    const s = this.s!; const c = new Ctx(s); const p = s.p; const rows = [...s.ledger].reverse().slice(0, 12);
    return `<section class="card"><h2>${t('tab.money')}</h2><div class="statgrid money">
      <div><small>${t('stat.cash')}</small><b>${money(p.cash)}</b></div><div><small>${t('stat.invest')}</small><b>${money(p.invest)}</b></div>
      <div><small>${t('stat.debt')}</small><b>${money(-p.debt)}</b></div><div><small>住宅（純）</small><b>${money(p.house ? p.house.value - p.house.mortgage : 0)}</b></div>
      <div><small>事業</small><b>${money(p.business?.value ?? 0)}</b></div><div><small>${t('stat.net')}</small><b>${money(c.netWorth)}</b></div></div>
      <p class="small muted">投資への自動積立：余剰の${Math.round(p.investRate * 100)}%・借入金利 ${(p.debtRate * 100).toFixed(1)}%・物価指数 ${s.world.priceLevel.toFixed(2)}</p></section>
      <section class="card"><h3>家計簿（年次）</h3><div class="tablewrap"><table class="ledger" data-testid="ledger"><thead><tr><th>年</th><th>収入</th><th>税</th><th>生活</th><th>住居</th><th>教育</th><th>臨時</th><th>返済</th><th>借入</th><th>投資損益</th><th>年末現金</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${r.year}</td><td>${Math.round(r.income + r.spouseIncome)}</td><td>${Math.round(r.tax)}</td><td>${Math.round(r.living)}</td><td>${Math.round(r.housing)}</td><td>${Math.round(r.education)}</td><td>${Math.round(r.oneoff + r.loans)}</td><td>${Math.round(r.debtRepay)}</td><td>${Math.round(r.borrowed)}</td><td>${Math.round(r.invReturn)}</td><td>${Math.round(r.cashEnd)}</td></tr>`).join('') || `<tr><td colspan="11">${t('empty.none')}</td></tr>`}</tbody></table></div>
      <p class="small muted">単位：万円。年末現金＝年初現金＋臨時収支＋借入＋収入−税−生活−住居−教育−返済±投資の出し入れ。</p></section>`;
  }
  npcCard(n: NPC, c: Ctx) {
    const f = n.f; const mood = f.anger > 40 ? '怒っている' : f.disappointment > 40 ? '失望している' : f.affection > 70 ? 'とても好意的' : f.trust > 65 ? '信頼している' : f.affection < 30 ? 'よそよそしい' : 'ふつう';
    return `<div class="npc ${n.alive ? '' : 'dead'}"><div class="nh"><b>${esc(n.name)}</b><span class="chip">${ROLE[n.role] ?? n.role}</span><span class="muted small">${n.alive ? c.npcAge(n) + '歳' : '故人'}${n.jobId ? '・' + (jobById(n.jobId)?.name ?? '') : ''}</span></div>
      <div class="feel"><span>信頼 ${Math.round(f.trust)}</span><span>好意 ${Math.round(f.affection)}</span><span>敬意 ${Math.round(f.respect)}</span>${f.anger > 10 ? `<span class="bad">怒り ${Math.round(f.anger)}</span>` : ''}${f.disappointment > 10 ? `<span class="bad">失望 ${Math.round(f.disappointment)}</span>` : ''}<span class="mood">${mood}</span></div>
      ${n.role !== 'child' ? `<div class="small">価値観：${VALUES[n.value] ?? ''}／夢：${GOALS[n.goal] ?? ''}<span class="prog"><i style="width:${Math.min(100, n.goalProgress)}%"></i></span></div>` : `<div class="small">${n.outcome ? `進路：${esc(n.notes.find(x => /進学|専門|働き|くすぶ/.test(x)) ?? '')}` : `学びの蓄積 ${Math.round(n.eduPts ?? 0)}`}</div>`}
      ${n.notes.length ? `<div class="notes small muted">${n.notes.slice(-3).map(esc).join('／')}</div>` : ''}</div>`;
  }
  vPeople() {
    const s = this.s!; const c = new Ctx(s); const order = ['spouse', 'partner', 'child', 'parent', 'sibling', 'friend', 'mentor', 'boss', 'coworker', 'neighbor', 'ex'];
    const list = s.npcs.filter(n => order.includes(n.role)).sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role) || Number(b.alive) - Number(a.alive));
    return `<section class="card"><h2>${t('tab.people')}</h2><p class="small muted">周りの人はそれぞれの夢に向かって生きています。あなたの選択は、彼らの気持ちと人生を動かします。</p><div data-testid="people">${list.map(n => this.npcCard(n, c)).join('') || t('empty.none')}</div></section>`;
  }
  vNews() {
    const s = this.s!; const items = [...s.world.history].reverse().slice(0, 80);
    const byYear = new Map<number, typeof items>(); for (const h of items) { if (!byYear.has(h.year)) byYear.set(h.year, []); byYear.get(h.year)!.push(h); }
    const regions = REGIONS.map(r => { const st = s.world.regions[r.id]; return `<div class="rg"><b>${r.name}</b><span class="prog"><i style="width:${Math.round(st.dev)}%"></i></span><small>発展度 ${Math.round(st.dev)}</small></div>`; }).join('');
    return `<section class="card paper"><h2 class="masthead">青嶺新報<small>${s.world.year}年・${phaseName(s.world)}</small></h2>
      <div class="econ small">成長率 ${s.world.growth}%・インフレ ${(s.world.inflation * 100).toFixed(1)}%・失業率 ${s.world.unemployment}%・政策金利 ${(s.world.interest * 100).toFixed(1)}%・技術水準 ${Math.round(s.world.tech)}</div>
      ${[...byYear].map(([y, hs]) => `<h3>${y}年</h3>${hs.map(h => `<p class="${h.echoId ? 'echo' : ''}">${h.echoId ? '〔残響〕' : ''}${esc(h.text)}</p>`).join('')}`).join('') || `<p class="muted">${t('empty.none')}</p>`}</section>
      <section class="card"><h3>地域の様子</h3>${regions}</section>`;
  }
  vMore() {
    return `<section class="card"><h2>その他</h2><div class="stack">
      <button class="btn" data-act="tab" data-arg="family" data-testid="tab-family">${t('tab.family')}</button>
      <button class="btn" data-act="tab" data-arg="awards" data-testid="tab-awards">${t('tab.awards')}</button>
      <button class="btn" data-act="tab" data-arg="settings" data-testid="tab-settings">${t('tab.settings')}</button>
      <a class="btn ghost" href="/how-to-play.html">遊び方</a><a class="btn ghost" href="/about.html">このゲームについて</a></div></section>`;
  }
  vFamily() {
    const s = this.s!; const c = new Ctx(s);
    const anc = s.lineage.map(l => `<li class="anc"><b>${l.gen}代目 ${esc(l.name)}</b><span>${l.birthYear}–${l.deathYear}（${l.age}歳）「${esc(l.endingTitle)}」</span></li>`).join('');
    const par = c.parents.map(n => `<span class="node ${n.alive ? '' : 'dead'}">${esc(n.name)}</span>`).join('');
    const sib = c.by('sibling').map(n => `<span class="node small">${esc(n.name)}</span>`).join('');
    const kids = c.children.map(n => `<span class="node ${n.alive ? '' : 'dead'}">${esc(n.name)}<small>${c.npcAge(n)}歳</small></span>`).join('');
    return `<section class="card"><h2>${t('tab.family')}</h2><ol class="lineage">${anc}</ol>
      <div class="tree" data-testid="tree"><div class="row">${par || '<span class="muted small">（親の記録なし）</span>'}</div><div class="link"></div>
      <div class="row"><span class="node me">${esc(s.p.name)}<small>${s.gen}代目</small></span>${c.spouse ? `<span class="node">${esc(c.spouse.name)}<small>配偶者</small></span>` : ''}${sib}</div>
      ${kids ? `<div class="link"></div><div class="row">${kids}</div>` : ''}</div>
      <p class="small muted">出身：${regionById(s.p.origin.regionId).name}の${familyName(s.p.origin.family)}${s.p.origin.familyBusiness ? `（家業：${esc(s.p.origin.familyBusiness)}）` : ''}</p></section>`;
  }
  vAwards() {
    const m = this.meta; const got = ACHIEVEMENTS.filter(a => m.achievements[a.id]).length;
    return `<section class="card"><h2>${t('tab.awards')}<small> ${got}/${ACHIEVEMENTS.length}</small></h2><div class="awards">${ACHIEVEMENTS.map(a => `<div class="aw ${m.achievements[a.id] ? 'got' : ''}"><b>${m.achievements[a.id] ? '🏅' : '・'} ${a.name}</b><small>${a.desc}</small></div>`).join('')}</div>
      <h3>通算記録</h3><dl><dt>生きた人生</dt><dd>${m.lifetime.lives}</dd><dt>最大世代</dt><dd>${m.lifetime.maxGen}</dd><dt>最高純資産</dt><dd>${money(m.lifetime.maxNetWorth)}</dd><dt>見たエンディング</dt><dd>${Object.keys(m.lifetime.endings).length}種類</dd></dl></section>`;
  }
  vSettings() {
    const st = this.meta.settings; const tg = (k: keyof Meta['settings'], label: string, note = '') => `<button class="toggle ${st[k] ? 'on' : ''}" data-act="setting" data-arg="${k}" role="switch" aria-checked="${!!st[k]}"><span>${label}${note ? `<small>${note}</small>` : ''}</span><i></i></button>`;
    return `<section class="card"><h2>${t('tab.settings')}</h2>
      ${tg('showHints', t('set.hints'))}${tg('reduceMotion', t('set.motion'))}
      ${tg('ads', t('set.ads'), adsConfigured() ? '' : '現在、広告は設定されていません')}${tg('analytics', t('set.analytics'), analyticsConfigured() ? '' : '現在、統計の送信先は設定されていません')}
      <label class="small">${t('set.lang')}：<select disabled>${LANGS.map(l => `<option>${l.name}</option>`).join('')}</select></label>
      <button class="btn ghost" data-act="tut-again">${t('set.tutorial')}</button></section>
      <section class="card"><h3>セーブデータ</h3><p class="small muted">セーブはこの端末のブラウザ（localStorage）に自動保存されます。機種変更やバックアップにはエクスポートを使ってください。</p>
      <textarea id="io" rows="4" placeholder="ここにエクスポートしたコードを貼り付けてインポート" data-testid="io"></textarea>
      <div class="row2"><button class="btn" data-act="export" data-testid="export">${t('save.export')}</button><button class="btn" data-act="import" data-testid="import">${t('save.import')}</button></div>
      <button class="btn danger" data-act="reset">${t('save.reset')}</button></section>
      <section class="card small"><a href="/about.html">このゲームについて</a>・<a href="/faq.html">FAQ</a>・<a href="/changelog.html">更新履歴</a>・<a href="/privacy.html">プライバシーポリシー</a>・<a href="/terms.html">利用規約</a></section>`;
  }
  vTutorial() {
    const k = (['tut.1', 'tut.2', 'tut.3', 'tut.4'] as const)[this.tutStep];
    return `<div class="overlay" role="dialog" aria-modal="true" data-testid="tutorial"><div class="tut"><div class="dots">${[0, 1, 2, 3].map(i => `<i class="${i === this.tutStep ? 'on' : ''}"></i>`).join('')}</div><p>${t(k)}</p><button class="btn primary" data-act="tut-next" data-testid="tut-next">${this.tutStep < 3 ? t('tut.next') : t('tut.done')}</button></div></div>`;
  }
}
