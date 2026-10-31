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
  const r: [RegExp, string, Tod?][] = [[/病院|お見舞い|病室/, 'hospital'], [/体育館/, 'gym'], [/河川敷|土手|川沿い/, 'river'], [/体育祭|運動会|球技大会|リレー|グラウンド|校庭/, 'ground', 'day'], [/文化祭/, 'classroom'], [/駅のホーム|早朝の駅|改札|駅で|ホームで/, 'station'],
    [/プール/, 'pool', 'day'], [/リビング|玄関|食卓|こたつ|台所|ソファ|夕食|我が家|居間/, 'living'], [/天文|星空|星を|流れ星|夜空/, 'observatory', 'night'], [/(?<!体育|文化|学園)祭|花火|浴衣|神社|初詣|縁日/, 'festival', 'night'], [/海|浜|水着|波/, 'sea'], [/屋上|夕焼け/, 'rooftop', 'evening'],
    [/水族館/, 'aquarium'], [/遊園地|観覧車/, 'amuse'], [/カフェ|喫茶|ベーカリー|パン屋/, 'cafe'], [/ゲームセンター|カラオケ|モール|商店街|駅前/, 'town', 'evening'], [/美術館/, 'museum'], [/映画/, 'movie'], [/山道|山頂|登山|ハイキング/, 'mountain'], [/公園/, 'park'],
    [/電話|部屋|自室|ベッド|夜、/, 'room', 'night'], [/教室|授業|図書|放課後|休み時間|昼休み|廊下|クラスメイト|ホームルーム|始業式|学期初日|隣の席|テスト|生徒会|部活|文化祭|体育祭/, 'classroom'], [/校門|入学|卒業|登校|桜/, 'gate']];
  for (const [re, bg, tod] of r) if (re.test(text)) return { bg, tod };
  return { bg: fallback };
}
// シーンIDごとの明示背景（キーワード推測より優先）
export const SCENE_BG: Record<string, string> = {
  d_y1_nov: 'ground', d_y2_kareha: 'ground', d_y3_june: 'ground', d_y3_nov: 'classroom', d_y3_jan: 'station', d_y1_after: 'classroom', d_y2_matsuri: 'town',
  d_y2_atokata: 'ground', d_y3_mendan: 'classroom', d_y3_yokou: 'gym', d_y1_akiyasumi: 'classroom', d_fr_t_fireworks: 'town', d_fr_t_center: 'station', sports_day: 'ground:day', d_y1_pool: 'pool:day', rumor_ghost: 'classroom:day', beach: 'sea:day', d_y3_amagumo: 'town:evening', rin_s2: 'town', shizuku_s4: 'observatory:day',
  kaho_meet: 'river', reika_1: 'rooftop', ruka_3: 'hospital', rin_1: 'hospital', rin_2: 'hospital', mio_s1: 'classroom', kaho_s1: 'ground', ruka_s2: 'station',
  sister: 'living', d_sis_y3_autumn: 'living', exam_result: 'station', tournament: 'gym',
};
// その週の行動からの既定背景
export const ACT_BG: Record<string, string> = { bun: 'room', ri: 'room', rest: 'living', hobby: 'room', art: 'room', fashion: 'town', club: 'ground', job: 'town', train: 'park', run: 'river', talk: 'classroom' };
/** 場面の文脈（タイトル・本文・日付の決まったイベントか・休み中か・ヒロインの場面か） */
export type BgCtx = { text?: string; dated?: boolean; vacation?: boolean; heroine?: boolean };
const SCHOOLW = /クラスメイト|学期|始業|終業|修了式|担任|先生|ホームルーム|昼休み|購買|廊下|休み時間|生徒会|同級生|クラス|下駄箱|昇降口|職員室|黒板|席替え|進路|三者面談|期末|中間/;
const HOMEW = /芽衣|(?<!お)母さん|(?<!お)父さん|お袋|親父|家族|我が家|自宅|帰宅|リビング|食卓|晩ご飯|夕飯/;
/** 背景決定：明示キー → 1行目の地の文（主人公名を除く）のキーワード → 場面の文脈（学校/家） → 行動 → 既定 */
export function pickBg(id: string, firstN: string, names: string[], act: string | undefined, isSister: boolean, ctx: BgCtx = {}): { bg: string; tod?: Tod } {
  if (SCENE_BG[id]) { const [bg, tod] = SCENE_BG[id].split(':'); return tod ? { bg, tod: tod as Tod } : { bg }; }
  let t = firstN; for (const n of names) if (n) t = t.split(n).join('');
  const g = guessBg(t, ''); if (g.bg) return g;
  if (isSister) return { bg: 'living' };
  let all = (ctx.text || ''); for (const n of names) if (n) all = all.split(n).join('');
  const head = all.slice(0, 120);
  if (SCHOOLW.test(head) && !(ctx.vacation && !/部活|補習|講習/.test(head))) return { bg: 'classroom' };
  if (HOMEW.test(head)) return { bg: 'living' };
  // 学期中の日付の決まったイベントは学校、ヒロインの場面は家・自室にしない
  if (ctx.dated) return { bg: ctx.vacation ? 'town' : 'classroom' };
  const a = (act && ACT_BG[act]) || 'classroom';
  if (ctx.heroine && (a === 'living' || a === 'room')) return { bg: ctx.vacation ? 'town' : 'classroom' };
  return { bg: a };
}
/** 場面の天気：本文に天気の記述があればそれに従う。固定イベントで記述がなければ雨・雪を出さない */
export function sceneWeather(text: string, base: string, fixed: boolean): string {
  if (/快晴|晴れ渡|晴天|青空|日差し|炎天|晴れた|晴れの/.test(text)) return '晴れ';
  if (/雨の中|雨が降|雨が強|土砂降り|夕立|梅雨|雨粒|雨の日|雨で|雨音|傘を|小雨|大雨|雨に濡|雨宿り|雨が止むのを待/.test(text)) return '雨';
  if (/雪が|雪の|粉雪|吹雪|雪景色/.test(text)) return '雪';
  if (fixed && (base === '雨' || base === '雪')) return '曇り';
  return base;
}
export function fxFor(season: string, weather: string, tod: Tod, indoor: boolean): Fx {
  if (indoor) return season === '冬' ? 'none' : 'sparkle';
  if (weather === '雨') return 'rain'; if (weather === '雪') return 'snow';
  if (season === '春') return 'petal'; if (season === '秋') return 'leaf'; if (season === '冬') return 'snow';
  return tod === 'night' || tod === 'evening' ? 'firefly' : 'sparkle';
}
const INDOOR = new Set(['classroom', 'room', 'living', 'hospital', 'gym', 'cafe', 'movie', 'museum', 'aquarium']);
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
