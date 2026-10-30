import type { GameState, LifeSummary } from './types';
import { Ctx, money } from './ctx';
import { clamp } from './rng';
import { jobById } from '../data/jobs';

export const AXES: Record<string, string> = { wealth: '財産', family: '家族', bonds: '友情', contribution: '社会への貢献', work: '仕事', legacy: '後世への影響', happiness: '幸福', experience: '経験' };
export const ENDINGS: Record<string, { title: string; text: string }> = {
  quiet_joy: { title: '静かな幸福', text: '大きな財産も名声もなかった。けれど、毎朝の湯気と誰かの笑い声があった。' },
  lonely_rich: { title: '孤独な富', text: '数字は積み上がった。最後に枕元にいたのは、弁護士と通帳だけだった。' },
  town_changer: { title: '町を変えた人', text: 'あなたの名前は知らなくても、あなたが作ったものの上で人々は暮らしている。' },
  guardian: { title: '家族の守り手', text: '嵐の年も、凪の年も、家族の屋根であり続けた。' },
  dreamer: { title: '夢を追い続けた人', text: '届かなかったかもしれない。それでも最後まで、前を向いていた。' },
  turbulent: { title: '波乱の生涯', text: '転んで、起きて、また転んだ。誰よりも濃い時間を生きた。' },
  craftsman: { title: '一筋の道', text: '一つの仕事に人生を預けた。その手は、最後まで迷いがなかった。' },
  wanderer: { title: '旅する魂', text: '一つの場所にはとどまらなかった。行く先々に、小さな足跡を残した。' },
  comeback: { title: '再起の人', text: 'どん底を知っているから、人に優しくなれた。' },
  ordinary: { title: '普通という奇跡', text: '特別なことは何もない、と本人は言うだろう。それがどれほど難しいかを、周りは知っている。' },
  short_bright: { title: '早すぎた灯', text: '短い時間だった。けれど灯は、確かに誰かを照らした。' },
};

export function computeReview(s: GameState): LifeSummary {
  const c = new Ctx(s); const p = s.p; const nw = c.netWorth; const pl = s.world.priceLevel;
  const kids = s.npcs.filter(n => n.role === 'child' && n.gen === s.gen);
  const myEchoes = s.world.echoes.filter(e => e.gen === s.gen);
  const avgHappy = s.hist.reduce((a, h) => a + h.happy, 0) / Math.max(1, s.hist.length);
  const cats = new Set(s.log.map(l => l.kind));
  const sc: Record<string, number> = {
    wealth: clamp(Math.round(Math.log10(Math.max(1, nw / pl)) * 25)),
    family: clamp(Math.round((c.spouse ? c.spouse.f.affection * 0.4 : s.flags.married !== undefined ? 10 : 0) + kids.reduce((a, k) => a + (k.f.affection + k.f.trust) / 6, 0) + (s.flags.cared_parent !== undefined ? 15 : 0))),
    bonds: clamp(Math.round(s.npcs.filter(n => (n.role === 'friend' || n.role === 'mentor' || n.role === 'coworker') && n.f.trust > 55).length * 18)),
    contribution: clamp(Math.round(Math.max(0, p.rep - 20) * 0.6 + myEchoes.filter(e => e.magnitude > 0).length * 6 + (p.business?.employees ?? 0) * 2)),
    work: clamp(Math.round(p.rank * 15 + (s.flags.founder !== undefined ? 20 : 0) + (p.business ? Math.min(30, p.business.value / 100) : 0) + (s.flags.craft_master !== undefined ? 25 : 0))),
    legacy: clamp(Math.round(myEchoes.length * 5 + kids.filter(k => k.outcome === 'uni' || k.outcome === 'voc' || k.outcome === 'work').length * 12 + (p.business ? 15 : 0))),
    happiness: clamp(Math.round(avgHappy)),
    experience: clamp(Math.round(cats.size * 7 + Object.keys(s.evHist).length * 0.8)),
  };
  const regrets = Object.keys(s.flags).filter(f => f.startsWith('regret_')).length;
  let ending = 'ordinary';
  if (p.age < 45) ending = 'short_bright';
  else if (sc.contribution >= 70) ending = 'town_changer';
  else if (sc.wealth >= 75 && sc.family + sc.bonds < 50) ending = 'lonely_rich';
  else if (sc.family >= 65) ending = 'guardian';
  else if (s.flags.dream_pursued !== undefined && sc.happiness >= 55) ending = 'dreamer';
  else if ((s.flags.bankrupt !== undefined || s.flags.lost_job !== undefined) && sc.wealth >= 60 && sc.happiness >= 45) ending = 'comeback';
  else if (Object.keys(s.flags).filter(f => f.startsWith('job_')).length <= 1 && p.rank >= 3) ending = 'craftsman';
  else if (s.log.filter(l => l.text.includes('引っ越した')).length >= 4) ending = 'wanderer';
  else if (cats.size >= 9 && sc.experience >= 70) ending = 'turbulent';
  else if (sc.happiness >= 45) ending = 'quiet_joy';
  const job = jobById(p.jobId) ?? jobById(s.flags['last_job_id'] as any);
  const hl = s.log.filter(l => l.important).slice(-40);
  const pickHl = [hl[0], ...hl.filter(l => /結婚|起業|立ち上げ|生まれた|昇進|家を買|卒業|独立|受賞/.test(l.text)).slice(0, 5), hl[hl.length - 1]].filter(Boolean).map(l => `${l!.age}歳 ${l!.text}`).filter((x, i, a) => a.indexOf(x) === i);
  const obit = `${c.home.name}出身。${job ? job.name + 'として働き、' : ''}${kids.length ? `${kids.length}人の子を育てた。` : ''}${p.business ? `${p.business.name}の創業者。` : ''}${ENDINGS[ending].text}${regrets ? `生前「もう一度やり直せるなら」と口にしたことが${regrets}度あったという。` : ''}`;
  return { gen: s.gen, name: p.name, birthYear: p.birthYear, deathYear: s.world.year, age: p.age, cause: p.deathCause ?? '', ending, endingTitle: ENDINGS[ending].title, scores: sc, netWorth: Math.round(nw), highlights: pickHl, obituary: obit };
}
export { money };
