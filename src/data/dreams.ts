import type { Ctx } from '../engine/ctx';
import { clamp } from '../engine/rng';
/** Per-life dream picked at 18. progress() is 0-100 and is re-evaluated every year. */
export interface Dream { id: string; name: string; icon: string; pitch: string; payoff: string; progress: (c: Ctx) => number }
const yearsMarried = (c: Ctx) => (c.has('married') && c.spouse && !c.has('divorced') ? c.since('married') : 0);
export const DREAMS: Dream[] = [
  { id: 'shop', name: '自分の店を持つ', icon: '🏪', pitch: '看板に、自分の名前を。', payoff: '自分の店の灯りを、毎晩この手で消した。',
    progress: c => c.p.business ? 70 + Math.min(30, c.p.business.value / 60) : Math.min(45, Math.max(0, c.p.cash) / 20 + c.p.stats.cre / 6) },
  { id: 'family', name: 'にぎやかな家族', icon: '👨‍👩‍👧‍👦', pitch: '食卓は、いつも満席で。', payoff: '年の瀬の食卓には、いつも椅子が足りなかった。',
    progress: c => (c.spouse || c.partner ? 25 : 0) + c.children.length * 22 + (c.has('grandparent') ? 15 : 0) },
  { id: 'fame', name: '名を残す', icon: '🌟', pitch: 'この町の誰もが知る人に。', payoff: 'あなたの名は、町の誰もが知っていた。',
    progress: c => Math.max(0, c.p.rep) * 1.3 + c.w.echoes.filter(e => e.surfaced && e.gen === c.s.gen).length * 4 },
  { id: 'wealth', name: '億を築く', icon: '💎', pitch: '数字で、自由を買う。', payoff: '通帳の桁は、子どもの頃の夢を越えた。',
    progress: c => (c.netWorth / (8000 * Math.max(1, c.w.priceLevel))) * 100 },
  { id: 'home', name: '庭のある家', icon: '🏡', pitch: '帰る場所を、自分の手で。', payoff: '庭の木は、あなたより長生きするだろう。',
    progress: c => c.p.house ? 80 + Math.min(20, c.since('homeowner') * 2) : Math.min(50, Math.max(0, c.p.cash + c.p.invest) / 25) },
  { id: 'town', name: '町の灯になる', icon: '🏮', pitch: '誰かの人生を、少しだけ明るく。', payoff: 'あなたが灯した明かりは、今も町のどこかで点いている。',
    progress: c => c.w.echoes.filter(e => e.gen === c.s.gen && e.magnitude > 0).length * 14 + Math.max(0, c.p.rep) / 3 },
  { id: 'love', name: 'ひとりと添い遂げる', icon: '💞', pitch: '最後の日まで、隣に同じ人を。', payoff: '最後の日まで、隣には同じ笑い声があった。',
    progress: c => c.has('divorced') ? 10 : c.spouse ? 35 + yearsMarried(c) * 2 : c.partner ? 20 : 0 },
];
export const dreamById = (id?: string | null) => DREAMS.find(d => d.id === id);
export const dreamProgress = (c: Ctx) => { const d = dreamById(c.s.dream?.id); if (!d) return 0; try { return clamp(Math.round(d.progress(c))); } catch { return 0; } };
