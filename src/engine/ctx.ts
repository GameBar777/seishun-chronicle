import type { GameState, NPC, Role, Stat, Feelings, Echo } from './types';
import { Rng, clamp } from './rng';
import { jobById, JOBS, EDU_RANK } from '../data/jobs';
import { regionById } from '../data/regions';
import { SURNAMES, MALE, FEMALE, VALUES, GOALS } from '../data/people';

export const money = (n: number) => {
  const a = Math.round(Math.abs(n));
  const s = a >= 10000 ? `${(a / 10000).toFixed(a >= 100000 ? 0 : 1)}億` : `${a.toLocaleString('ja-JP')}万`;
  return (n < 0 ? '−' : '') + s + '円';
};

// Context object handed to event conditions/effects. All state mutation goes through here.
export class Ctx {
  rng: Rng; npc?: NPC; data: any;
  constructor(public s: GameState, npc?: NPC, data?: any) { this.rng = new Rng(s); this.npc = npc; this.data = data ?? {}; }
  get p() { return this.s.p; } get w() { return this.s.world; }
  get age() { return this.s.p.age; } get year() { return this.s.world.year; }
  get job() { return jobById(this.s.p.jobId); }
  get region() { return regionById(this.s.p.regionId); }
  get home() { return regionById(this.s.p.homeRegionId); }
  get spouse() { return this.s.npcs.find(n => n.id === this.s.p.spouseId && n.alive); }
  get partner() { return this.s.npcs.find(n => n.id === this.s.p.partnerId && n.alive); }
  get parents() { return this.s.npcs.filter(n => n.role === 'parent' && n.alive); }
  get children() { return this.s.npcs.filter(n => n.role === 'child' && n.alive && n.gen === this.s.gen); }
  get friends() { return this.s.npcs.filter(n => n.role === 'friend' && n.alive); }
  get netWorth() { const p = this.p; return p.cash + p.invest - p.debt + (p.house ? p.house.value - p.house.mortgage : 0) + (p.business ? p.business.value : 0); }
  get employed() { return !!this.p.jobId || !!this.p.business; }
  get boom() { return this.w.phase === 'boom'; } get slump() { return this.w.phase === 'recession' || this.w.phase === 'crisis'; }
  npcAge(n: NPC) { return this.year - n.birthYear; }
  by(role: Role) { return this.s.npcs.filter(n => n.role === role && n.alive); }
  pickBy(role: Role, f: (n: NPC) => boolean = () => true) { const l = this.by(role).filter(f); return l.length ? this.rng.pick(l) : undefined; }
  has(k: string) { return k in this.s.flags; }
  since(k: string) { return k in this.s.flags ? this.year - this.s.flags[k] : 999; }
  flag(k: string) { this.s.flags[k] = this.year; }
  unflag(k: string) { delete this.s.flags[k]; }
  chance(p: number) { return this.rng.chance(p); }
  fact(k: string) { return this.w.townFacts[k]; }
  setFact(k: string, v: string | number | boolean) { this.w.townFacts[k] = v; }

  cash(n: number) { this.p.cash += n; this.s.cur.oneoff += n; }
  loan(n: number, rate = 0.05) { // borrow money: increases cash and debt
    const p = this.p; const tot = p.debt + n; p.debtRate = tot > 0 ? (p.debt * p.debtRate + n * rate) / tot : rate; p.debt = tot; p.cash += n; this.s.cur.loans += n;
  }
  repay(n: number) { n = Math.min(n, this.p.debt, Math.max(0, this.p.cash)); if (n <= 0) return 0; this.p.debt -= n; this.p.cash -= n; this.s.cur.loans -= n; return n; }
  buyHouse(price: number, down: number, years = 30) { const m = price - down; const r = Math.max(0.008, this.w.interest + 0.007); this.cash(-down);
    this.p.house = { value: price, mortgage: m, rate: r, payment: m > 0 ? (m * r) / (1 - Math.pow(1 + r, -years)) : 0, bought: this.year }; this.flag('homeowner'); this.log(`${money(price)}の家を買った（頭金${money(down)}）。`, true, 'money'); }
  sellHouse() { const h = this.p.house; if (!h) return 0; const net = h.value * 0.94 - h.mortgage; this.cash(net); this.p.house = null; this.log(`家を売却した（手残り${money(net)}）。`, true, 'money'); return net; }
  investMove(n: number) { // + deposit into investments, - withdraw
    const p = this.p; if (n > 0) { n = Math.min(n, Math.max(0, p.cash)); p.cash -= n; p.invest += n; this.s.cur.invDeposit += n; }
    else { n = Math.min(-n, p.invest); p.invest -= n; p.cash += n; this.s.cur.invWithdraw += n; }
  }
  stat(k: Stat, d: number) { this.p.stats[k] = clamp(this.p.stats[k] + d); }
  health(d: number) { this.p.health = clamp(this.p.health + d); }
  happy(d: number) { this.p.happy = clamp(this.p.happy + d); }
  stress(d: number) { this.p.stress = clamp(this.p.stress + d); }
  rep(d: number) { this.p.rep = clamp(this.p.rep + d, -100, 100); }
  feel(n: NPC | undefined, f: Partial<Feelings>) { if (!n) return; for (const k in f) (n.f as any)[k] = clamp((n.f as any)[k] + (f as any)[k]); }
  note(n: NPC | undefined, t: string) { if (n) { n.notes.push(`${this.year}年: ${t}`); if (n.notes.length > 12) n.notes.shift(); } }
  log(text: string, important = false, kind = 'life') { this.s.log.push({ year: this.year, age: this.age, kind, text, important }); }
  news(text: string, kind = 'society', echoId?: string) { this.w.history.push({ year: this.year, kind, text, echoId }); }
  later(id: string, min: number, max: number, npcId?: string, data?: any) { this.s.scheduled.push({ year: this.year + this.rng.int(min, max), id, npcId: npcId ?? this.npc?.id, data }); }
  echo(e: { key: string; cause: string; effect: string; target: Echo['target']; delay: [number, number]; magnitude?: number; npcId?: string }) {
    const ec: Echo = { id: `e${this.s.world.echoes.length + 1}_${this.year}`, year: this.year, gen: this.s.gen, cause: e.cause, effect: e.effect, target: e.target, key: e.key,
      surfaceYear: this.year + this.rng.int(e.delay[0], e.delay[1]), surfaced: false, magnitude: e.magnitude ?? 1, npcId: e.npcId };
    this.w.echoes.push(ec); return ec;
  }
  // careers
  availableJobs(): string[] {
    const p = this.p, w = this.w;
    return JOBS.filter(j => EDU_RANK[p.edu] >= EDU_RANK[j.edu] && p.stats[j.stat] + 10 >= j.min && (!j.techMin || w.tech >= j.techMin) && j.id !== p.jobId && (j.id !== 'doctor' || p.certs.includes('medical')) && (j.id !== 'lawyer' || p.certs.includes('bar')) && (j.id !== 'nurse' || p.certs.includes('nursing') || p.edu !== 'hs'))
      .filter(j => regionById(p.regionId).industries.includes(j.industry) || ['service', 'care', 'education', 'manufacturing', 'logistics'].includes(j.industry) || this.rng.chance(0.35))
      .map(j => j.id);
  }
  setJob(id: string) { const p = this.p; p.jobId = id; p.jobYears = 0; p.rank = 0; p.unemployedYears = 0; p.retired = false; this.flag('job_' + id);
    for (const n of this.s.npcs) if (n.role === 'boss') n.role = 'stranger';
    if (id !== 'gig') this.addNpc('boss', { birthYear: this.year - this.rng.int(38, 56), jobId: id }); this.log(`${jobById(id)!.name}として働き始めた。`, true, 'career'); }
  loseJob(reason: string) { const j = this.job; if (!j) return; this.flag('lost_job'); this.s.flags['last_salary'] = Math.round(this.salary()); this.p.jobId = null; this.p.rank = 0; this.p.jobYears = 0; this.log(`${j.name}の職を失った（${reason}）。`, true, 'career'); }
  salary(): number {
    const p = this.p, j = this.job; if (!j) return 0;
    const econ = { boom: 1.06, normal: 1, recession: 0.95, crisis: 0.9 }[this.w.phase];
    return j.base * (1 + 0.2 * p.rank) * (1 + Math.min(p.jobYears, 30) * 0.012) * econ * Math.pow(this.w.priceLevel, 0.9) * (0.85 + p.stats[j.stat] / 300) * (j.id === 'musician' ? 0.6 + p.rep / 60 + p.rank * 0.4 : 1);
  }
  startBusiness(name: string, capital: number) {
    this.p.business = { name, value: capital, employees: 1, founded: this.year, profitRate: 0.1 + this.p.stats.soc / 1000 + this.p.stats.cre / 1000 };
    this.p.jobId = null; this.flag('founder'); this.log(`「${name}」を立ち上げた。元手は${money(capital)}。`, true, 'career');
  }
  study(kind: 'voc' | 'uni' | 'grad', years: number, cost: number) { this.p.studying = { kind, yearsLeft: years, cost }; this.log(`${{ voc: '専門学校', uni: '大学', grad: '大学院' }[kind]}で学ぶ日々が始まった。`, true, 'education'); }
  move(regionId: string) { if (regionId === this.p.regionId) return; this.p.regionId = regionId; this.log(`${regionById(regionId).name}へ引っ越した。`, true, 'life'); this.flag('moved'); }
  // people
  newName(sex: 'm' | 'f', surname?: string) { return `${surname ?? this.rng.pick(SURNAMES)} ${this.rng.pick(sex === 'm' ? MALE : FEMALE)}`; }
  addNpc(role: Role, o: Partial<NPC> = {}): NPC {
    const sex = o.sex ?? (this.rng.chance(0.5) ? 'm' : 'f');
    const n: NPC = { id: `n${this.s.npcs.length + 1}_${this.rng.int(100, 999)}`, name: o.name ?? this.newName(sex), sex, birthYear: o.birthYear ?? this.year - this.age + this.rng.int(-3, 3), role,
      traits: o.traits ?? { warmth: this.rng.int(15, 95), ambition: this.rng.int(15, 95), stability: this.rng.int(15, 95) },
      value: o.value ?? this.rng.pick(Object.keys(VALUES)), goal: o.goal ?? this.rng.pick(Object.keys(GOALS)), goalProgress: this.rng.int(0, 40),
      jobId: o.jobId !== undefined ? o.jobId : this.rng.pick(JOBS.filter(j => !j.techMin && (this.year - (o.birthYear ?? this.year - this.age) >= 23 || j.edu === 'hs'))).id, income: 0, health: o.health ?? this.rng.int(65, 95), alive: true,
      regionId: o.regionId ?? this.p.regionId, f: o.f ?? { trust: 40, affection: 40, anger: 0, respect: 40, disappointment: 0 }, notes: [], gen: this.s.gen, ...Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) } as NPC;
    n.role = role; if (!n.income) n.income = n.jobId ? Math.round((jobById(n.jobId)!.base) * (0.8 + this.rng.next() * 0.5)) : 0;
    this.s.npcs.push(n); return n;
  }
  marry(n: NPC) { const p = this.p; n.role = 'spouse'; p.spouseId = n.id; p.partnerId = null; this.flag('married'); this.s.flags['marriages'] = (this.s.flags['marriages'] ?? 0); this.log(`${n.name}と結婚した。`, true, 'love'); this.note(n, '結婚'); }
  divorce(reason: string) { const n = this.spouse; if (!n) return; n.role = 'ex'; this.p.spouseId = null; this.flag('divorced'); this.log(`${n.name}と離婚した（${reason}）。`, true, 'love'); this.feel(n, { affection: -30, anger: 15 }); }
  haveChild(): NPC {
    const sp = this.spouse ?? this.partner; const sex = this.rng.chance(0.5) ? 'm' : 'f'; const sur = this.p.name.split(' ')[0];
    const c = this.addNpc('child', { sex, name: `${sur} ${this.rng.pick(sex === 'm' ? MALE : FEMALE)}`, birthYear: this.year, jobId: null, regionId: this.p.regionId, parentIds: ['player', sp?.id ?? ''], eduPts: 0, health: 90, stats: { int: 40, soc: 40, phy: 50, cre: 40, dis: 40 },
      traits: { warmth: clamp(Math.round(((sp?.traits.warmth ?? 50) + this.p.stats.soc) / 2 + this.rng.int(-15, 15))), ambition: clamp(Math.round(((sp?.traits.ambition ?? 50) + this.p.stats.dis) / 2 + this.rng.int(-15, 15))), stability: this.rng.int(25, 85) },
      f: { trust: 60, affection: 70, anger: 0, respect: 50, disappointment: 0 } });
    this.p.childIds.push(c.id); this.flag('parent'); this.log(`子どもが生まれた。名前は${c.name.split(' ')[1]}。`, true, 'family'); return c;
  }
  killNpc(n: NPC, why: string) { n.alive = false; n.deathYear = this.year; this.note(n, '逝去'); this.log(`${n.name}が亡くなった（${why}）。`, true, 'family'); if (n.id === this.p.spouseId) { this.p.spouseId = null; this.flag('widowed'); } }
}
