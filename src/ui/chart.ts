import type { HistPoint } from '../engine/types';
/** Minimal dependency-free SVG line chart. */
export function lineChart(hist: HistPoint[], opts: { w?: number; h?: number } = {}) {
  const W = opts.w ?? 360, H = opts.h ?? 180, P = 28;
  if (hist.length < 2) return `<div class="muted small">データが2年分以上たまるとグラフが表示されます。</div>`;
  const xs = hist.map(h => h.age); const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const nw = hist.map(h => h.netWorth); const lo = Math.min(0, ...nw), hi = Math.max(10, ...nw);
  const X = (a: number) => P + ((a - x0) / Math.max(1, x1 - x0)) * (W - P - 8);
  const Ym = (v: number) => H - P - ((v - lo) / (hi - lo)) * (H - P - 10);
  const Yp = (v: number) => H - P - (v / 100) * (H - P - 10);
  const path = (f: (h: HistPoint) => number, Y: (v: number) => number) => hist.map((h, i) => `${i ? 'L' : 'M'}${X(h.age).toFixed(1)},${Y(f(h)).toFixed(1)}`).join('');
  const fmt = (v: number) => Math.abs(v) >= 10000 ? (v / 10000).toFixed(1) + '億' : Math.round(v) + '万';
  const ticks = [x0, Math.round((x0 + x1) / 2), x1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="純資産・幸福・健康の推移">
    <line x1="${P}" y1="${Ym(0)}" x2="${W - 8}" y2="${Ym(0)}" class="axis0"/>
    <path d="${path(h => h.happy, Yp)}" class="l-happy"/><path d="${path(h => h.health, Yp)}" class="l-health"/><path d="${path(h => h.netWorth, Ym)}" class="l-money"/>
    ${ticks.map((t, i) => `<text x="${X(t)}" y="${H - 8}" class="tick" text-anchor="${i === 0 ? "start" : i === 2 ? "end" : "middle"}">${t}歳</text>`).join('')}
    <text x="${P}" y="12" class="tick">${fmt(hi)}</text><text x="${P}" y="${Ym(lo) - 2}" class="tick">${fmt(lo)}</text>
  </svg><div class="legend"><span class="k money">純資産</span><span class="k happy">幸福</span><span class="k health">健康</span></div>`;
}
export function bars(scores: Record<string, number>, names: Record<string, string>) {
  return `<div class="bars">${Object.keys(names).map(k => `<div class="bar"><span class="bl">${names[k]}</span><span class="bt"><i style="width:${scores[k] ?? 0}%"></i></span><span class="bv">${scores[k] ?? 0}</span></div>`).join('')}</div>`;
}
