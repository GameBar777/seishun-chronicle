import type { GameState } from './types';
import type { Meta } from '../platform/save';
import { Ctx } from './ctx';
export interface Achievement { id: string; name: string; desc: string; test: (s: GameState, m: Meta) => boolean }
const has = (s: GameState, f: string) => s.flags[f] !== undefined;
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'dream_done', name: '夢の続きを生きる', desc: '人生の夢をかなえる', test: s => has(s, 'dream_done') },
  { id: 'echo_seen', name: '時を越えて', desc: '過去の選択の残響に出会う', test: s => s.world.echoes.some(e => e.surfaced && e.gen === s.gen) },
  { id: 'stranger_back', name: '恩送り', desc: '助けた見知らぬ人と再会する', test: s => !!s.evHist['drama_stranger_returns'] },
  { id: 'rival_end', name: '好敵手', desc: 'ライバルとの物語を最後まで見届ける', test: s => !!s.evHist['drama_rival_3'] },
  { id: 'first_year', name: 'はじまりの一年', desc: '最初の一年を終える', test: s => s.stats.yearsPlayed >= 1 },
  { id: 'married', name: '誓いの日', desc: '結婚する', test: s => has(s, 'married') },
  { id: 'parent', name: '小さな手', desc: '子どもを迎える', test: s => has(s, 'parent') },
  { id: 'homeowner', name: '城の主', desc: '家を買う', test: s => has(s, 'homeowner') },
  { id: 'founder', name: '旗を立てる', desc: '起業する', test: s => has(s, 'founder') },
  { id: 'debt_free', name: '身軽になる', desc: '借金がある状態から完済する', test: s => s.ledger.some(r => r.debtStart > 100 && r.debtEnd === 0) },
  { id: 'millionaire', name: '一億の壁', desc: '純資産1億円（10000万円）に到達', test: s => s.hist.some(h => h.netWorth >= 10000) },
  { id: 'bankrupt', name: 'どん底', desc: '自己破産または債務整理を経験', test: s => has(s, 'bankrupt') },
  { id: 'comeback', name: '再起', desc: '破産を経験した後、純資産3000万円以上に', test: s => has(s, 'bankrupt') && new Ctx(s).netWorth >= 3000 },
  { id: 'divorced', name: '別々の道', desc: '離婚を経験する', test: s => has(s, 'divorced') },
  { id: 'caregiver', name: 'ありがとうを言う番', desc: '親の介護を担う', test: s => has(s, 'cared_parent') },
  { id: 'echo1', name: '最初の残響', desc: '自分の選択の残響が初めて表れる', test: s => s.world.echoes.some(e => e.surfaced && e.gen === s.gen) },
  { id: 'echo10', name: '波紋の人', desc: '一つの世界で残響を10回起こす', test: s => s.world.echoes.filter(e => e.surfaced).length >= 10 },
  { id: 'gen2', name: '受け継ぐ者', desc: '二代目として生きる', test: s => s.gen >= 2 },
  { id: 'gen4', name: '系譜', desc: '四代目に到達する', test: s => s.gen >= 4 },
  { id: 'age90', name: '長い旅', desc: '90歳を迎える', test: s => s.p.age >= 90 },
  { id: 'mayor', name: '町の顔', desc: '町長に当選する', test: s => has(s, 'mayor') },
  { id: 'grandparent', name: '三代の食卓', desc: '孫が生まれる', test: s => has(s, 'grandparent') },
  { id: 'survivor', name: '生還', desc: '病気を乗り越える', test: s => has(s, 'survivor') },
  { id: 'endings3', name: 'いくつもの人生', desc: '3種類のエンディングを見る', test: (_s, m) => Object.keys(m.lifetime.endings).length >= 3 },
  { id: 'endings8', name: '人生の収集家', desc: '8種類のエンディングを見る', test: (_s, m) => Object.keys(m.lifetime.endings).length >= 8 },
  { id: 'scholarship', name: '未来への種', desc: '奨学金を残す', test: s => has(s, 'scholarship') },
];
/** Returns newly unlocked achievements (and records them in meta). */
export function checkAchievements(s: GameState, m: Meta): Achievement[] {
  const out: Achievement[] = [];
  for (const a of ACHIEVEMENTS) { if (m.achievements[a.id]) continue; let ok = false; try { ok = a.test(s, m); } catch { ok = false; } if (ok) { m.achievements[a.id] = Date.now(); out.push(a); } }
  return out;
}
