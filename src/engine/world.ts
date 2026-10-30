import type { GameState, World } from './types';
import { Ctx } from './ctx';
import { REGIONS, regionById } from '../data/regions';
import { JOBS } from '../data/jobs';

export function newWorld(year: number): World {
  const regions: World['regions'] = {};
  for (const r of REGIONS) regions[r.id] = { id: r.id, dev: 50 + (r.urban - 50) / 3, pop: Math.round(r.urban * 1.2 + 20), jobsBonus: 0, disasterRisk: r.disaster };
  return { year, phase: 'normal', growth: 1.2, inflation: 0.015, priceLevel: 1, unemployment: 3.5, interest: 0.01, tech: 20, tension: 30, welfare: 50, population: 1200,
    regions, unlockedJobs: [], history: [], echoes: [], townFacts: {} };
}

const PHASE_NEXT: Record<World['phase'], [World['phase'], number][]> = {
  boom: [['boom', 0.55], ['normal', 0.4], ['recession', 0.05]],
  normal: [['normal', 0.7], ['boom', 0.15], ['recession', 0.13], ['crisis', 0.02]],
  recession: [['recession', 0.45], ['normal', 0.5], ['crisis', 0.05]],
  crisis: [['crisis', 0.3], ['recession', 0.6], ['normal', 0.1]],
};
const PHASE_NAME = { boom: '好景気', normal: '安定期', recession: '景気後退', crisis: '金融危機' };

// Advance the fictional national economy & society by one year.
export function tickWorld(s: GameState) {
  const w = s.world; const c = new Ctx(s); const prev = w.phase;
  const tensionPush = w.tension > 70 ? 0.08 : 0;
  const opts = PHASE_NEXT[w.phase].map(([ph, p]) => [ph, ph === 'recession' || ph === 'crisis' ? p + tensionPush : p] as [World['phase'], number]);
  w.phase = c.rng.weighted(opts, o => o[1])![0];
  const g = { boom: 3, normal: 1.2, recession: -1, crisis: -3.5 }[w.phase];
  w.growth = +(g + c.rng.normal(0, 0.6)).toFixed(1);
  w.inflation = +Math.max(-0.01, Math.min(0.07, 0.012 + (w.phase === 'boom' ? 0.012 : 0) - (w.phase === 'crisis' ? 0.015 : 0) + (w.tension > 60 ? 0.01 : 0) + c.rng.normal(0, 0.005))).toFixed(3);
  w.priceLevel = +(w.priceLevel * (1 + w.inflation)).toFixed(4);
  const target = { boom: 2.5, normal: 3.6, recession: 5.2, crisis: 7.5 }[w.phase] + Math.max(0, w.tech - 50) * 0.03;
  w.unemployment = +(w.unemployment + (target - w.unemployment) * 0.5).toFixed(1);
  w.interest = +Math.max(0, Math.min(0.06, w.interest + (w.inflation > 0.025 ? 0.004 : -0.002))).toFixed(3);
  w.tech = +(w.tech + 0.8 + c.rng.next() * 1.4 + (w.phase === 'boom' ? 0.5 : 0)).toFixed(1);
  w.tension = Math.max(5, Math.min(95, w.tension + c.rng.int(-6, 6)));
  w.population = Math.round(w.population * (1 - 0.003 + (w.phase === 'boom' ? 0.002 : 0)));
  if (prev !== w.phase) c.news(`経済は「${PHASE_NAME[w.phase]}」へ。成長率${w.growth}%、失業率${w.unemployment}%。`, 'economy');
  for (const j of JOBS) if (j.techMin && w.tech >= j.techMin && !w.unlockedJobs.includes(j.id)) {
    w.unlockedJobs.push(j.id); c.news(`新しい職業「${j.name}」が生まれ、求人が出始めた。`, 'tech');
  }
  if (w.tech > 40 && !w.townFacts['auto_wave1']) { w.townFacts['auto_wave1'] = w.year; c.news('自動化の波：事務・窓口業務の多くがAIに置き換わり始めた。', 'tech'); }
  if (w.tech > 65 && !w.townFacts['auto_wave2']) { w.townFacts['auto_wave2'] = w.year; c.news('無人配送と自動工場が当たり前に。働き方の再編が進む。', 'tech'); }
  if (w.tension > 75 && c.rng.chance(0.3)) c.news('近隣諸国との緊張が高まり、輸入品の価格が上がっている。', 'intl');
  for (const r of Object.values(w.regions)) {
    const def = regionById(r.id); const drift = def.urban > 60 ? 0.3 : -0.4;
    r.dev = Math.max(0, Math.min(100, r.dev + drift + r.jobsBonus * 0.1 + (w.phase === 'boom' ? 0.3 : w.phase === 'crisis' ? -0.5 : 0)));
    r.pop = Math.max(5, Math.round(r.pop * (1 + (r.dev - 50) / 3000)));
  }
}
export const phaseName = (w: World) => PHASE_NAME[w.phase];
