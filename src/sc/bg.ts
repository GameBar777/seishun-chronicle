// 動く背景：画像のパララックス／ゆっくりズーム＋時間帯の色調＋季節・天気のパーティクル（canvas）
const BASE = (import.meta as any).env?.BASE_URL ?? '/';
export const LOC_BG: Record<string, string> = { movie: 'movie', amuse: 'amuse', aquarium: 'aquarium', zoo: 'park', mall: 'town', cafe: 'cafe', restaurant: 'cafe', park: 'park', sea: 'sea', mountain: 'mountain', arcade: 'town', museum: 'museum', karaoke: 'town', shrine: 'festival', festival: 'festival' };
export type Tod = 'morning' | 'day' | 'evening' | 'night';
export type Fx = 'petal' | 'rain' | 'snow' | 'leaf' | 'firefly' | 'sparkle' | 'none';
let cur = '', layer: HTMLDivElement | null = null, cv: HTMLCanvasElement | null = null, raf = 0, parts: any[] = [], fx: Fx = 'none', small = false;
const reduce = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const portraitKey = () => typeof innerWidth !== 'undefined' && innerHeight > innerWidth * 1.25;
export const bgUrl = (k: string) => k === 'key' && portraitKey() ? `${BASE}img/bg/key-p.webp` : `${BASE}img/bg/${k}${small ? '-s' : ''}.webp`;
export function guessBg(text: string, fallback = 'gate'): { bg: string; tod?: Tod } {
  const r: [RegExp, string, Tod?][] = [[/天文|星空|星を|流れ星|夜空/, 'observatory', 'night'], [/祭|花火|浴衣|神社|初詣|縁日/, 'festival', 'night'], [/海|浜|水着|波/, 'sea'], [/屋上|夕焼け/, 'rooftop', 'evening'],
    [/水族館/, 'aquarium'], [/遊園地|観覧車/, 'amuse'], [/カフェ|喫茶/, 'cafe'], [/ゲームセンター|カラオケ|モール|商店街|駅前/, 'town', 'evening'], [/美術館/, 'museum'], [/映画/, 'movie'], [/山|ハイキング/, 'mountain'], [/公園/, 'park'],
    [/電話|部屋|自室|ベッド|夜、/, 'room', 'night'], [/教室|授業|図書|放課後|休み時間|隣の席|テスト|生徒会|部活|文化祭|体育祭/, 'classroom'], [/校門|入学|卒業|登校|桜/, 'gate']];
  for (const [re, bg, tod] of r) if (re.test(text)) return { bg, tod };
  return { bg: fallback };
}
export function fxFor(season: string, weather: string, tod: Tod, indoor: boolean): Fx {
  if (indoor) return season === '冬' ? 'none' : 'sparkle';
  if (weather === '雨') return 'rain'; if (weather === '雪') return 'snow';
  if (season === '春') return 'petal'; if (season === '秋') return 'leaf'; if (season === '冬') return 'snow';
  return tod === 'night' || tod === 'evening' ? 'firefly' : 'sparkle';
}
const INDOOR = new Set(['classroom', 'room', 'cafe', 'movie', 'museum', 'aquarium']);
export function setBg(key: string, opt: { season: string; weather: string; tod?: Tod }) {
  if (typeof document === 'undefined') return;
  small = innerWidth < 760;
  if (!layer) {
    layer = document.createElement('div'); layer.id = 'bg'; layer.innerHTML = '<div class="bgimg"></div><div class="bgimg b2"></div><div class="tint"></div><canvas></canvas>';
    document.body.prepend(layer); cv = layer.querySelector('canvas');
    addEventListener('resize', size); size();
    addEventListener('resize', () => { if (cur === 'key' && layer!.dataset.key !== (portraitKey() ? 'key-p' : 'key')) { const k = cur; cur = ''; setBg(k, { season: '春', weather: '晴れ', tod: layer!.dataset.tod as Tod }); } });
    addEventListener('pointermove', e => { if (reduce()) return; const x = (e.clientX / innerWidth - .5), y = (e.clientY / innerHeight - .5); layer!.style.setProperty('--px', `${-x * 18}px`); layer!.style.setProperty('--py', `${-y * 12}px`); });
  }
  const tod = opt.tod || 'day';
  layer.dataset.tod = tod; layer.dataset.key = key + (key === 'key' && portraitKey() ? '-p' : '');
  if (key !== cur) {
    const imgs = layer.querySelectorAll<HTMLDivElement>('.bgimg'); const front = imgs[0].classList.contains('on') ? imgs[1] : imgs[0], back = front === imgs[0] ? imgs[1] : imgs[0];
    const im = new Image(); im.onload = () => { front.style.backgroundImage = `url(${im.src})`; front.classList.add('on'); back.classList.remove('on'); }; im.src = bgUrl(key); cur = key;
  }
  const f = fxFor(opt.season, opt.weather, tod, INDOOR.has(key));
  if (f !== fx) { fx = f; parts = []; }
  if (!raf && !reduce()) raf = requestAnimationFrame(loop);
}
export const currentBg = () => cur;
function size() { if (!cv) return; cv.width = innerWidth; cv.height = innerHeight; }
function spawn(): any {
  const W = cv!.width, H = cv!.height, r = Math.random;
  switch (fx) {
    case 'rain': return { x: r() * W, y: -20, vx: -1.5, vy: 14 + r() * 6, s: 1, life: 1 };
    case 'snow': return { x: r() * W, y: -10, vx: r() - .5, vy: .6 + r() * 1.2, s: 1.5 + r() * 2.5, ph: r() * 6 };
    case 'petal': return { x: r() * W, y: -10, vx: .6 + r(), vy: .8 + r(), s: 4 + r() * 4, ph: r() * 6, rot: r() * 6 };
    case 'leaf': return { x: r() * W, y: -10, vx: .3 + r(), vy: 1 + r(), s: 5 + r() * 4, ph: r() * 6, rot: r() * 6, c: ['#e17055', '#fdcb6e', '#d35400'][Math.floor(r() * 3)] };
    case 'firefly': return { x: r() * W, y: H * (.4 + r() * .6), vx: r() - .5, vy: -(r() * .4), s: 2 + r() * 2, ph: r() * 6 };
    default: return { x: r() * W, y: r() * H, vx: 0, vy: -.15, s: 1 + r() * 2, ph: r() * 6 };
  }
}
const MAX: Record<Fx, number> = { rain: 140, snow: 90, petal: 45, leaf: 30, firefly: 30, sparkle: 26, none: 0 };
function loop(t: number) {
  raf = requestAnimationFrame(loop);
  if (!cv || document.hidden) return; const g = cv.getContext('2d')!; const W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H); const max = MAX[fx] * (small ? .5 : 1);
  if (parts.length < max && Math.random() < .5) parts.push(spawn());
  for (const p of parts) {
    p.ph = (p.ph || 0) + .03; p.x += p.vx + (fx === 'petal' || fx === 'leaf' || fx === 'snow' ? Math.sin(p.ph) * .8 : 0); p.y += p.vy;
    if (fx === 'rain') { g.strokeStyle = 'rgba(200,220,255,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + p.vx * 2, p.y + p.vy * 1.4); g.stroke(); }
    else if (fx === 'snow') { g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(p.x, p.y, p.s, 0, 7); g.fill(); }
    else if (fx === 'petal' || fx === 'leaf') { p.rot += .03; g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, Math.abs(Math.sin(p.ph))); g.fillStyle = fx === 'petal' ? 'rgba(255,183,206,.9)' : p.c; g.beginPath(); g.ellipse(0, 0, p.s, p.s * .55, 0, 0, 7); g.fill(); g.restore(); }
    else { const a = .35 + .35 * Math.sin(p.ph * 2 + t / 600); g.fillStyle = fx === 'firefly' ? `rgba(220,255,140,${a})` : `rgba(255,255,255,${a})`; g.shadowColor = g.fillStyle; g.shadowBlur = 8; g.beginPath(); g.arc(p.x, p.y, p.s, 0, 7); g.fill(); g.shadowBlur = 0; }
  }
  parts = parts.filter(p => p.y < H + 20 && p.y > -30 && p.x > -30 && p.x < W + 30 && (fx !== 'sparkle' || Math.random() > .004));
}
