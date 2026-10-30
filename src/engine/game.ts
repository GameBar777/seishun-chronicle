import type { GameState, NPC, LifeSummary } from './types';
import { Ctx, money } from './ctx';
import { clamp } from './rng';
import { newWorld, tickWorld } from './world';
import { settleYear } from './finance';
import { EVENTS, eventById } from '../data/events';
import { ECHO_HANDLERS } from '../data/echoes';
import { REGIONS, regionById } from '../data/regions';
import { JOBS, jobById } from '../data/jobs';
import { computeReview } from './review';
import type { EventDef } from './eventTypes';

export const SAVE_VERSION = 2;
export const FAMILY_TYPES = [
  { id: 'shop', name: '商店を営む家', wealth: 50, biz: true }, { id: 'office', name: '共働きの会社員家庭', wealth: 55 }, { id: 'single', name: 'ひとり親の家庭', wealth: 25 },
  { id: 'farm', name: '代々の農家', wealth: 40, biz: true }, { id: 'wealthy', name: '裕福な家庭', wealth: 85 }, { id: 'struggle', name: '借金を抱えた家庭', wealth: 12 },
  { id: 'teacher', name: '教師の家庭', wealth: 60 }, { id: 'large', name: '大家族', wealth: 35 },
];
export const familyName = (id: string) => FAMILY_TYPES.find(f => f.id === id)?.name ?? id;
const TRAITS = ['楽天家', '慎重派', '負けず嫌い', 'お人好し', '一匹狼', '好奇心旺盛', '努力家', '気分屋', '聞き上手', '頑固'];

function blankState(seed: number, year: number): GameState {
  return { version: SAVE_VERSION, seed, rng: seed, gen: 1, createdAt: Date.now(), world: newWorld(year), p: null as any, npcs: [], queue: [], active: null, yearResults: [],
    log: [], ledger: [], hist: [], flags: {}, evHist: {}, scheduled: [], phase: 'play', lineage: [], pendingSummary: null,
    cur: { oneoff: 0, loans: 0, invDeposit: 0, invWithdraw: 0, education: 0, forgiven: 0 }, choiceLog: [], stats: { yearsPlayed: 0, eventsSeen: 0 } };
}

// Create a fresh life in a (possibly existing) world.
export function newGame(seed = Math.floor(Math.random() * 2 ** 31), opts: { regionId?: string; family?: string } = {}): GameState {
  const s = blankState(seed, 2026); startLife(s, opts); return s;
}
function startLife(s: GameState, opts: { regionId?: string; family?: string } = {}) {
  const c = new Ctx(s);
  const reg = opts.regionId ?? c.rng.pick(REGIONS).id; const fam = FAMILY_TYPES.find(f => f.id === opts.family) ?? c.rng.pick(FAMILY_TYPES);
  const sex = c.rng.chance(0.5) ? 'm' : 'f'; const name = c.newName(sex);
  const w = fam.wealth; const st = () => clamp(Math.round(c.rng.normal(40, 12)));
  const stats = { int: st(), soc: st(), phy: st(), cre: st(), dis: st() };
  if (fam.id === 'teacher') stats.int += 8; if (fam.id === 'struggle' || fam.id === 'single') stats.dis += 8; if (fam.id === 'wealthy') stats.cre += 5; if (fam.id === 'large') stats.soc += 8;
  const traits = [c.rng.pick(TRAITS)]; let t2 = c.rng.pick(TRAITS); if (t2 !== traits[0]) traits.push(t2);
  const parentJobs = [fam.id === 'farm' ? 'farmer' : fam.id === 'teacher' ? 'teacher' : c.rng.pick(JOBS.filter(j => !j.techMin && j.edu !== 'grad')).id, c.rng.pick(JOBS.filter(j => !j.techMin)).id];
  const health = clamp(Math.round(c.rng.normal(80, 9)), 45, 98);
  s.p = { name, sex, birthYear: s.world.year - 18, age: 18, regionId: reg, homeRegionId: reg, edu: 'hs', studying: null, certs: [], jobId: null, jobYears: 0, rank: 0, unemployedYears: 0, retired: false,
    business: null, house: null, cash: Math.round(5 + w * 1.2 + c.rng.int(0, 20)), invest: 0, debt: fam.id === 'struggle' ? 30 : 0, debtRate: 0.08, investRate: 0.2,
    health, happy: 55 + Math.round((w - 50) / 10), stress: 25, rep: 0, stats, traits,
    origin: { regionId: reg, family: fam.id, wealth: w, parentJobs, familyBusiness: fam.biz ? (fam.id === 'farm' ? '果樹園' : `${name.split(' ')[0]}商店`) : null }, spouseId: null, partnerId: null, childIds: [], illness: null };
  const sur = name.split(' ')[0];
  const dad = c.addNpc('parent', { sex: 'm', name: `${sur} ${c.rng.pick(['正義', '隆', '昭彦', '浩二', '和夫', '勝', '茂'])}`, birthYear: s.world.year - c.rng.int(44, 56), jobId: parentJobs[0], value: fam.biz ? 'duty' : undefined, f: { trust: 55, affection: 60, anger: 5, respect: 50, disappointment: 0 } });
  if (fam.id !== 'single') c.addNpc('parent', { sex: 'f', name: `${sur} ${c.rng.pick(['洋子', '恵美', '久美子', '由美', '幸子', '直美', '和子'])}`, birthYear: s.world.year - c.rng.int(42, 54), jobId: parentJobs[1], f: { trust: 60, affection: 65, anger: 0, respect: 50, disappointment: 0 } });
  if (fam.id === 'large' || c.rng.chance(0.45)) c.addNpc('sibling', { name: `${sur} ${c.rng.pick(c.rng.chance(0.5) ? ['航', '健太', '翔', '大地'] : ['美咲', '彩', '舞', '遥'])}`, birthYear: s.p.birthYear + c.rng.pick([-3, -2, 2, 3]), jobId: null });
  c.addNpc('friend', { name: c.newName(c.rng.chance(0.5) ? 'm' : 'f'), birthYear: s.p.birthYear, jobId: null, regionId: reg, f: { trust: 65, affection: 60, anger: 0, respect: 45, disappointment: 0 } });
  if (fam.id === 'wealthy') s.p.cash += 150; if (fam.id === 'single') dad.sex = 'f';
  if (fam.id === 'single') dad.name = `${sur} ${c.rng.pick(['洋子', '恵美', '直美'])}`;
  s.flags = {}; s.evHist = {}; s.scheduled = []; s.log = []; s.ledger = []; s.hist = []; s.phase = 'play'; s.active = null; s.queue = []; s.yearResults = []; s.choiceLog = [];
  // Echoes from previous lives that shape this childhood
  const inherited = s.world.echoes.filter(e => e.surfaced && e.target !== 'npc').slice(-3);
  c.log(`${regionById(reg).name}の${fam.name}に生まれ、18歳の春を迎えた。`, true, 'life');
  for (const e of inherited) c.log(`（この町には、かつての選択の残響が残っている：${e.effect}）`, false, 'echo');
  s.queue = [{ id: 'edu_crossroads' }];
  s.hist.push({ year: s.world.year, age: 18, netWorth: c.netWorth, happy: s.p.happy, health: s.p.health, income: 0 });
  nextEvent(s);
}

function eligible(c: Ctx, e: EventDef, scheduled: boolean): boolean {
  const h = c.s.evHist[e.id];
  if (!scheduled && e.scheduledOnly) return false;
  // Consequence-only events may recur once per cause; everything else obeys once/max even when queued.
  if (!e.scheduledOnly) {
    if (h && e.once !== false && (e.once || (!e.cooldown && !e.max))) return false;
    if (h && e.max && h.n >= e.max) return false;
    if (!scheduled && h && e.cooldown && c.year - h.last < e.cooldown) return false;
  }
  try { return e.when(c); } catch { return false; }
}

// Prepare the next event in the queue, or finish the year.
export function nextEvent(s: GameState) {
  while (s.queue.length) {
    const q = s.queue.shift()!; const e = eventById(q.id); if (!e) continue;
    const npc = q.npcId ? s.npcs.find(n => n.id === q.npcId) : undefined;
    const c = new Ctx(s, npc, q.data);
    if (!c.npc && e.bind) c.npc = e.bind(c);
    if (e.bind && !c.npc) continue;
    if (c.npc && !c.npc.alive && e.bind) continue;
    if (!eligible(c, e, true)) continue;
    if (e.prepare) { c.data = { ...(c.data ?? {}), ...(e.prepare(c) ?? {}) }; q.data = c.data; }
    const choices = e.choices.map((ch, i) => ({ ch, i })).filter(x => !x.ch.req || safe(() => x.ch.req!(c)));
    if (!choices.length) continue;
    const tx = (t: any) => fill(typeof t === 'function' ? t(c) : t, c);
    s.active = { id: e.id, npcId: c.npc?.id, data: q.data, title: tx(e.title), text: tx(e.text),
      choices: choices.map(x => ({ label: tx(x.ch.label), hint: x.ch.hint ? tx(x.ch.hint) : fxHint(x.ch.fx) })), choiceMap: choices.map(x => x.i) };
    const h = s.evHist[e.id] ?? { n: 0, last: 0 }; h.n++; h.last = s.world.year; s.evHist[e.id] = h; s.stats.eventsSeen++;
    return;
  }
  s.active = null; endYear(s);
}
const safe = (f: () => boolean) => { try { return f(); } catch { return false; } };
export function fill(t: string, c: Ctx) {
  return t.replace(/\{(\w+)\}/g, (_, k) => {
    switch (k) {
      case 'npc': return c.npc?.name ?? '誰か'; case 'npcFirst': return c.npc?.name.split(' ')[1] ?? '誰か';
      case 'town': return c.region.name; case 'home': return c.home.name; case 'job': return c.job?.name ?? '無職';
      case 'spouse': return c.spouse?.name.split(' ')[1] ?? '相手'; case 'partner': return c.partner?.name.split(' ')[1] ?? '恋人';
      case 'biz': return c.p.business?.name ?? c.p.origin.familyBusiness ?? '店'; case 'family_biz': return c.p.origin.familyBusiness ?? '家業';
      case 'npcAge': return c.npc ? String(c.npcAge(c.npc)) : ''; case 'year': return String(c.year); case 'age': return String(c.age);
      case 'name': return c.p.name.split(' ')[1];
      default: return c.data?.[k] !== undefined ? String(c.data[k]) : `{${k}}`;
    }
  });
}
const SN: Record<string, string> = { int: '知力', soc: '社交', phy: '体力', cre: '創造', dis: '根気' };
function fxHint(fx: any): string {
  if (!fx) return ''; const out: string[] = [];
  if (fx.cash) out.push(fx.cash > 0 ? `お金＋` : `出費 ${money(-fx.cash)}`);
  if (fx.health) out.push(fx.health > 0 ? '健康↑' : '健康↓'); if (fx.happy) out.push(fx.happy > 0 ? '幸福↑' : '幸福↓');
  if (fx.stress) out.push(fx.stress > 0 ? 'ストレス↑' : 'ストレス↓');
  if (fx.stats) for (const k in fx.stats) out.push(`${SN[k]}${fx.stats[k] > 0 ? '↑' : '↓'}`);
  if (fx.feel) { const f = fx.feel; const v = (f.trust ?? 0) + (f.affection ?? 0) + (f.respect ?? 0) - (f.anger ?? 0) - (f.disappointment ?? 0); if (v) out.push(v > 0 ? '関係↑' : '関係↓'); }
  if (fx.later) out.push('…いつか何かが返ってくるかも');
  return out.join(' / ');
}

export function choose(s: GameState, idx: number): string {
  const a = s.active; if (!a) return '';
  const e = eventById(a.id)!; const ch = e.choices[a.choiceMap[idx]]; if (!ch) return '';
  const npc = a.npcId ? s.npcs.find(n => n.id === a.npcId) : undefined; const c = new Ctx(s, npc, a.data);
  const fx = ch.fx;
  if (fx) {
    if (fx.cash) c.cash(fx.cash); if (fx.health) c.health(fx.health); if (fx.happy) c.happy(fx.happy); if (fx.stress) c.stress(fx.stress); if (fx.rep) c.rep(fx.rep);
    if (fx.stats) for (const k in fx.stats) c.stat(k as any, (fx.stats as any)[k]);
    if (fx.feel) c.feel(npc, fx.feel);
    for (const f of [fx.flag ?? []].flat()) c.flag(f); for (const f of [fx.unflag ?? []].flat()) c.unflag(f);
    if (fx.later) c.later(fx.later[0], fx.later[1], fx.later[2]);
  }
  let res = ''; if (ch.run) res = (ch.run(c) as string) || '';
  const r = ch.result ? (typeof ch.result === 'function' ? ch.result(c) : ch.result) : '';
  const text = fill([r, res].filter(Boolean).join(' '), c);
  s.choiceLog.push({ year: s.world.year, ev: a.id, c: a.choiceMap[idx] }); if (s.choiceLog.length > 400) s.choiceLog.shift();
  c.log(`【${a.title}】${fill(typeof ch.label === 'function' ? ch.label(c) : ch.label, c)}${text ? ' — ' + text : ''}`, false, e.cat);
  s.yearResults.push(text || '選んだ道を歩き出した。');
  s.active = null; nextEvent(s); return text;
}

function endYear(s: GameState) {
  if (s.phase !== 'play') return;
  const c = new Ctx(s); const p = s.p;
  // studies
  if (p.studying) { p.studying.yearsLeft--; c.stat('int', 3); if (p.studying.yearsLeft <= 0) { p.edu = p.studying.kind; c.log(`${{ voc: '専門学校', uni: '大学', grad: '大学院' }[p.studying.kind]}を卒業した。`, true, 'education'); p.studying = null; s.queue.push({ id: 'career_job_hunt' }); c.flag('graduated'); } }
  // career progression
  if (p.jobId) { p.jobYears++; const j = jobById(p.jobId)!; const promo = 0.06 + p.stats[j.stat] / 600 + p.stats.dis / 900 + (c.boom ? 0.03 : 0) - p.rank * 0.025;
    if (p.rank < 4 && p.jobYears >= 2 && c.chance(promo)) { p.rank++; c.log(`${j.ranks[p.rank]}に昇進した。`, true, 'career'); c.happy(4); c.rep(2); }
    c.stress(j.stress - 3); c.stat(j.stat, 0.8); } else if (!p.retired && !p.studying && !p.business) { p.unemployedYears++; c.stress(3); c.happy(-2); }
  const row = settleYear(s);
  // health & mood drift
  const age = p.age; let dh = age > 40 ? -(age - 40) * 0.06 - 0.2 : 0.3; dh += (p.stats.phy - 40) / 60; if (p.stress > 70) dh -= 2; if (p.illness) dh -= 3;
  c.health(dh);
  const rel = (c.spouse ? c.spouse.f.affection / 25 : 0) + c.friends.reduce((a, f) => a + f.f.affection / 120, 0) + c.children.reduce((a, k) => a + k.f.affection / 100, 0);
  const moneyStress = p.debt > Math.max(200, row.income) ? 6 : 0; const target = 45 + rel * 2 - p.stress / 6 - moneyStress + (p.health - 60) / 5;
  p.happy = clamp(p.happy + (target - p.happy) * 0.25); p.stress = clamp(p.stress - 4);
  tickNpcs(s);
  s.hist.push({ year: s.world.year, age: p.age, netWorth: Math.round(c.netWorth), happy: Math.round(p.happy), health: Math.round(p.health), income: Math.round(row.income + row.spouseIncome) });
  s.stats.yearsPlayed++;
  // mortality: gentle before 50, unavoidable eventually; low health raises risk
  const base = 0.00025 * Math.exp(0.088 * (age - 18)); const hf = p.health < 10 ? 6 : p.health < 25 ? 2.5 : p.health < 45 ? 1.4 : p.health > 75 ? 0.7 : 1;
  let pd = base * hf; if (age < 50) pd = Math.min(pd, p.health < 10 ? 0.05 : 0.002); if (age >= 105) pd = 1;
  if (c.chance(pd)) { p.deathCause = p.illness ? `${p.illness}の悪化` : age > 75 ? '老衰' : p.health < 30 ? '長年の無理がたたった病' : '突然の心臓発作'; die(s); return; }
  s.phase = 'yearEnd';
}

function tickNpcs(s: GameState) {
  const c = new Ctx(s);
  for (const n of s.npcs) {
    if (!n.alive) continue; const a = c.npcAge(n);
    if (a > 45) n.health = clamp(n.health - (a - 45) * 0.06 - c.rng.next());
    n.f.anger = Math.round(n.f.anger * 0.75); n.f.disappointment = Math.round(n.f.disappointment * 0.9);
    if (n.role === 'friend' && c.since('saw_' + n.id) > 3) n.f.affection = clamp(n.f.affection - 2);
    if (n.role === 'spouse') n.f.affection = clamp(n.f.affection + (n.f.trust - 50) / 25 - s.p.stress / 60);
    // independent life goals
    if (n.role !== 'child' && n.role !== 'parent' && a < 70) { n.goalProgress += n.traits.ambition / 40 + c.rng.next() * 2; if (n.goalProgress >= 100 && !n.notes.some(x => x.includes('夢をかなえた'))) { c.note(n, '夢をかなえた'); s.queue.push({ id: 'social_npc_goal', npcId: n.id }); n.goalProgress = 100; } }
    const pd = 0.0003 * Math.exp(0.088 * (a - 18)) * (n.health < 25 ? 3 : 1);
    if (a > 20 && c.chance(Math.min(pd, a < 55 ? 0.002 : 1))) { c.killNpc(n, a > 80 ? '老衰' : '病気'); if (n.role === 'parent') s.scheduled.push({ year: s.world.year + 1, id: 'family_parent_funeral', npcId: n.id }); if (n.id === s.p.spouseId || n.role === 'spouse') s.scheduled.push({ year: s.world.year + 1, id: 'family_widowed', npcId: n.id }); }
    if (n.role === 'child' && n.gen === s.gen && a === 18 && !n.outcome) childComesOfAge(s, n);
  }
}
function childComesOfAge(s: GameState, n: NPC) {
  const c = new Ctx(s); const pts = n.eduPts ?? 0; const bond = n.f.affection + n.f.trust - n.f.anger - n.f.disappointment; const wealth = c.netWorth;
  const score = pts * 1.2 + bond / 4 + n.traits.ambition / 3 + Math.min(wealth, 3000) / 150 + c.rng.int(-10, 10);
  n.outcome = score > 75 ? 'uni' : score > 50 ? 'voc' : score > 30 ? 'work' : 'drift';
  n.stats = { int: clamp(30 + pts * 0.7 + c.rng.int(-8, 8)), soc: clamp(n.traits.warmth * 0.6 + c.rng.int(0, 15)), phy: clamp(c.rng.int(30, 60)), cre: clamp(c.rng.int(25, 60) + (s.flags['kid_arts'] ? 10 : 0)), dis: clamp(n.traits.ambition * 0.6 + c.rng.int(0, 15)) };
  const txt = { uni: '大学へ進学した', voc: '専門学校へ進んだ', work: '働き始めた', drift: '進路が決まらず、しばらく家でくすぶっている' }[n.outcome];
  c.log(`${n.name.split(' ')[1]}が18歳になり、${txt}。`, true, 'family'); c.note(n, txt ?? '');
  if (n.outcome === 'drift') c.echo({ key: 'child_drift', cause: `${n.name}との関係や家庭環境`, effect: `${n.name.split(' ')[1]}は長い回り道をすることになる`, target: 'family', delay: [3, 6], npcId: n.id });
}

export function nextYear(s: GameState) {
  if (s.phase !== 'yearEnd') return;
  const c = new Ctx(s); s.yearResults = [];
  s.world.year++; s.p.age++; tickWorld(s); s.phase = 'play';
  // Surface echoes whose time has come
  for (const e of s.world.echoes) if (!e.surfaced && e.surfaceYear <= s.world.year) { e.surfaced = true; const h = ECHO_HANDLERS[e.key]; if (h) h(new Ctx(s, e.npcId ? s.npcs.find(n => n.id === e.npcId) : undefined), e); }
  // Disasters
  const rg = s.world.regions[s.p.regionId]; if (c.chance(rg.disasterRisk * 0.6)) s.queue.push({ id: 'world_disaster' });
  // Build this year's event queue: scheduled first, then conditional weighted draws
  const due = s.scheduled.filter(x => x.year <= s.world.year); s.scheduled = s.scheduled.filter(x => x.year > s.world.year);
  for (const d of due.slice(0, 3)) s.queue.push({ id: d.id, npcId: d.npcId, data: d.data, scheduled: true });
  for (const d of due.slice(3)) { d.year = s.world.year + 1; s.scheduled.push(d); }
  const n = Math.max(0, (c.chance(0.45) ? 3 : 2) - Math.min(1, s.queue.length));
  const used = new Set(s.queue.map(q => q.id)); const usedCats = new Set<string>();
  for (let i = 0; i < n; i++) {
    const pool = EVENTS.filter(e => !used.has(e.id)).filter(e => { const cc = new Ctx(s); if (e.bind) { cc.npc = e.bind(cc); if (!cc.npc) return false; } return eligible(cc, e, false); });
    const pick = c.rng.weighted(pool, e => { const cc = new Ctx(s); if (e.bind) cc.npc = e.bind(cc); const w = typeof e.weight === 'function' ? safeN(() => (e.weight as any)(cc)) : e.weight ?? 1; return w * (usedCats.has(e.cat) ? 0.35 : 1); });
    if (!pick) break; used.add(pick.id); usedCats.add(pick.cat); s.queue.push({ id: pick.id });
  }
  nextEvent(s);
}
const safeN = (f: () => number) => { try { return f(); } catch { return 0; } };

function die(s: GameState) {
  const c = new Ctx(s); s.phase = 'dead'; s.active = null; s.queue = [];
  c.log(`${s.p.name}、${s.p.age}歳で永眠。死因：${s.p.deathCause}。`, true, 'life');
  const sum: LifeSummary = computeReview(s); s.pendingSummary = sum; s.lineage.push(sum);
  c.news(`【訃報】${s.p.name}さん（${s.p.age}）死去。${sum.obituary}`, 'obituary');
}

export function heirs(s: GameState) { const c = new Ctx(s); return c.children.filter(k => k.alive); }

// Continue as a child (generational succession), or a stranger in the same world.
export function succeed(s: GameState, heirId?: string) {
  const c = new Ctx(s); const old = s.p; const heir = heirId ? s.npcs.find(n => n.id === heirId) : undefined;
  const estate = Math.max(0, old.cash + old.invest - old.debt); const kids = heirs(s).length || 1;
  const tax = estate > 3000 ? (estate - 3000) * 0.2 : 0; const share = (estate - tax) / kids;
  const bizInherit = old.business && heir ? old.business : null;
  if (old.business && !heir) c.echo({ key: 'biz_orphaned', cause: `${old.name}の死`, effect: `${old.business.name}は後継者がおらず閉じられた`, target: 'town', delay: [1, 2], magnitude: old.business.employees });
  s.gen++;
  if (!heir) { // unrelated new life in the same (changed) world
    const prevNpcs = s.npcs; s.npcs = []; startLife(s); s.npcs.push(...prevNpcs.filter(n => n.role === 'stranger')); return;
  }
  // advance time until the heir is at least 18
  while (s.world.year - heir.birthYear < 18) { s.world.year++; tickWorld(s); }
  const sp = s.npcs.find(n => n.id === old.spouseId);
  const siblings = heirs(s).filter(k => k.id !== heir.id);
  const st = heir.stats ?? { int: 40, soc: 40, phy: 45, cre: 40, dis: 40 };
  s.p = { name: heir.name, sex: heir.sex, birthYear: heir.birthYear, age: s.world.year - heir.birthYear, regionId: heir.regionId || old.regionId, homeRegionId: old.regionId, edu: heir.outcome === 'uni' ? 'hs' : 'hs', studying: null, certs: [],
    jobId: null, jobYears: 0, rank: 0, unemployedYears: 0, retired: false, business: bizInherit ? { ...bizInherit } : null, house: old.house ? { ...old.house } : null,
    cash: Math.round(share) + 20, invest: 0, debt: 0, debtRate: 0.05, investRate: 0.2, health: clamp(heir.health), happy: clamp(45 + heir.f.affection / 5), stress: 30, rep: Math.round(old.rep / 4),
    stats: { ...st }, traits: [heir.traits.ambition > 60 ? '負けず嫌い' : '慎重派', heir.traits.warmth > 60 ? 'お人好し' : '一匹狼'],
    origin: { regionId: old.regionId, family: old.origin.family, wealth: clamp(Math.round(estate / 40)), parentJobs: [old.jobId ?? 'gig', sp?.jobId ?? 'gig'], familyBusiness: old.business?.name ?? old.origin.familyBusiness }, spouseId: null, partnerId: null, childIds: [], illness: null };
  const parentNpc = c.addNpc('parent', { name: old.name, sex: old.sex, birthYear: old.birthYear, jobId: old.jobId, f: { trust: heir.f.trust, affection: heir.f.affection, anger: heir.f.anger, respect: heir.f.respect, disappointment: heir.f.disappointment } });
  parentNpc.alive = false; parentNpc.deathYear = s.world.year;
  const keep = new Set([sp?.id, ...siblings.map(x => x.id)]);
  s.npcs = s.npcs.filter(n => keep.has(n.id) || n === parentNpc).map(n => { if (n.id === sp?.id) n.role = 'parent'; else if (siblings.includes(n)) n.role = 'sibling'; return n; });
  const nc = new Ctx(s); nc.addNpc('friend', { birthYear: heir.birthYear, jobId: null });
  s.flags = { legacy: s.world.year, ['heir_' + (heir.outcome ?? 'x')]: s.world.year }; s.evHist = {}; s.scheduled = []; s.log = []; s.ledger = []; s.hist = []; s.queue = []; s.yearResults = []; s.choiceLog = [];
  s.phase = 'play'; s.pendingSummary = null;
  nc.log(`${old.name}の子として、${s.p.name}の人生が始まる。相続した財産は${money(share)}（相続税${money(tax / kids)}）。`, true, 'life');
  if (bizInherit) nc.log(`${bizInherit.name}も受け継いだ。`, true, 'career');
  if (heir.outcome === 'uni') nc.study('uni', 4, 90); else if (heir.outcome === 'voc') nc.study('voc', 2, 70);
  s.queue = heir.outcome === 'uni' || heir.outcome === 'voc' ? [{ id: 'legacy_letter' }] : [{ id: 'legacy_letter' }, { id: 'career_job_hunt' }];
  s.hist.push({ year: s.world.year, age: s.p.age, netWorth: Math.round(nc.netWorth), happy: s.p.happy, health: s.p.health, income: 0 });
  nextEvent(s);
}
export { EVENTS };
