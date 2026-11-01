// エンディングムービー＋スタッフロール（v1.15.0）。
// 純粋関数 buildEndingMovie / buildCredits はテスト可能。playEndingMovie が DOM 演出を担当。
import type { GameState } from './types';
import { HEROINES, HMAP } from './data/index';
import { HEVENTS } from './data/hevents';
import { CG_LIST } from './data/cg';

export type EndTier = 'good' | 'normal' | 'rival' | 'bad';
export interface Slide { img: string; cg: boolean; text: string; pan: number }
export interface EndingMovie { tier: EndTier; h?: string; title: string; slides: Slide[]; credits: CreditSection[]; epilogue: string }
export interface CreditSection { role: string; names: string[] }

export function tierOfEnding(id: string): EndTier {
  if (id === 'true' || id.startsWith('good') || id.startsWith('confess')) return 'good';
  if (id.startsWith('normal') || id.startsWith('friend') || id === 'course') return 'normal';
  if (id.startsWith('rival') || id.startsWith('wada')) return 'rival';
  return 'bad';
}

/** ライバル編（和田）でヒロインを奪われた場合は、エンディングの格に関わらずほろ苦い「rival」演出にする */
export const lostToWada = (s: GameState, h?: string) => !!h && s.flags.includes(`wadaClimax:lose:${h}`);
export const wonVsWada = (s: GameState, h?: string) => !!h && s.flags.includes(`wadaClimax:win:${h}`);
export const endTier = (s: GameState, id: string, h?: string): EndTier => lostToWada(s, h) ? 'rival' : tierOfEnding(id);
const seenCgs = (s: GameState, h: string) => CG_LIST.filter(c => c.h === h && s.flags.includes('cg:' + c.id)).map(c => c.id);

/** 3年間を振り返る独白。実際のプレイデータ（見たイベント・デート回数・部活・進路・試験など）から組み立てる */
export function monologue(s: GameState, id: string, h?: string): string[] {
  const tier = endTier(s, id, h); const me = s.setup.mei; const H = h ? HMAP[h] : undefined; const hs = h ? s.hs[h] : undefined;
  const out: string[] = [];
  const metN = HEROINES.filter(x => s.hs[x.id].met).length;
  out.push(`入学式の朝から、${s.week >= 150 ? '千日' : s.week + '週'}。——三年間が、終わった。`);
  if (s.club && s.club !== '帰宅部') out.push(`${s.club}で過ごした放課後。${s.tournaments.length ? `大会のことは、${s.tournaments.length}つとも覚えている。` : '汗と、夕焼けの匂い。'}`);
  else out.push('部活には入らなかった。そのぶん、寄り道ばかりの帰り道だった。');
  const best = s.exams.length ? Math.min(...s.exams.map(e => e.rank)) : 0;
  if (best) out.push(best <= 10 ? `定期テストの最高順位は学年${best}位。我ながら、よく頑張ったと思う。` : `定期テストの最高順位は学年${best}位。……まあ、悪くない。`);
  if (H && hs) {
    const evs = HEVENTS.filter(e => e.h === h && s.seen.includes(e.id)).map(e => e.title);
    const meet = HEVENTS.find(e => e.id === `${h}_meet`);
    if (meet && s.seen.includes(meet.id)) out.push(`${H.sei}${H.mei}と初めて会ったのは「${meet.title}」。あの時は、まだ名前も知らなかった。`);
    const mid = evs.filter(t => t !== meet?.title).slice(-3);
    if (mid.length) out.push(`「${mid.join('」「')}」——${tier === 'good' ? '一つひとつが、今の二人につながっている。' : 'どれも、忘れられない。'}`);
    if (hs.dates) out.push(`二人で出かけたのは${hs.dates}回。${hs.dates >= 10 ? '数えきれないくらい、と言ってもいい。' : hs.dates >= 4 ? 'どの日も、天気まで覚えている。' : '少ないけれど、大切な日ばかりだ。'}`);
    if (wonVsWada(s, h) && tier !== 'rival') out.push(`三年の冬、和田との勝負から逃げなかった。あの日があったから、今がある。`);
    if (lostToWada(s, h)) out.push(`三年の冬。和田に「本気」で負けた。言い訳は、ひとつも思いつかなかった。`);
    if (tier === 'good') out.push(`そして卒業式の日。${H.mei}の答えを、きっと一生忘れない。`);
    else if (tier === 'normal') out.push(`${H.mei}とは、これからも。——その「これから」が、少しだけ楽しみだ。`);
    else if (tier === 'rival') out.push(`${H.mei}の隣にいるのは、自分じゃなかった。……それでも、あの笑顔が見られるなら。`);
  } else {
    out.push(metN ? `出会った人は${metN}人。……けれど、誰かの「特別」にはなれなかった。` : '誰とも深く関わらないまま、季節だけが過ぎていった。');
  }
  if (s.courseResult) out.push(s.courseResult === '合格' ? `春からは${s.course === '就職' ? '社会人' : s.course}。新しい場所でも、きっとやっていける。` : '進路はまだ決まらない。でも、もう一度挑戦する理由ならある。');
  out.push(tier === 'bad' ? `${me}の青春は、少しだけ苦い味がした。` : `${me}の三年間は、確かにここにあった。`);
  return out;
}

export function buildCredits(s?: GameState): CreditSection[] {
  const cast = HEROINES.map(H => `${H.sei} ${H.mei}`);
  return [
    { role: '青春クロニクル ～君と過ごした1000日間～', names: [] },
    { role: 'ヒロイン', names: cast },
    { role: 'クラスメイト・後輩', names: ['健太', '田中', '井上', '和田 和樹', '芽衣'] },
    { role: '企画・シナリオ・プログラム', names: ['GameBar777'] },
    { role: 'キャラクター・背景・イベントCG', names: ['画像生成AIによるオリジナル'] },
    { role: '音楽', names: ['魔王魂（https://maou.audio/）', 'CC BY 4.0'] },
    { role: '効果音', names: ['OtoLogic（https://otologic.jp/）', '魔王魂（https://maou.audio/）', 'CC BY 4.0'] },
    { role: 'ボイス', names: ['ElevenLabs（AI音声合成）', 'ブラウザ音声合成（フォールバック）'] },
    { role: 'Special Thanks', names: ['「ときめきメモリアル」シリーズへのリスペクトを込めて', s ? `そして、${s.setup.sei} ${s.setup.mei} を演じてくれたあなた` : 'そして、プレイしてくれたあなた'] },
  ];
}

export function buildEndingMovie(s: GameState, e: { id: string; title: string; h?: string }, base = '/'): EndingMovie {
  const tier = endTier(s, e.id, e.h); const h = e.h;
  const bg = (n: string) => `${base}img/bg/${n}.webp`;
  let imgs: { img: string; cg: boolean }[] = [];
  if (h && tier !== 'bad') {
    const cgs = seenCgs(s, h);
    const order = [...cgs.filter(c => !/_(confess|kiss|ask)$/.test(c)), ...(tier === 'rival' ? [] : cgs.filter(c => /_(ask|confess|kiss)$/.test(c)))];
    imgs = order.map(id => ({ img: `${base}img/cg/h/${id}.webp`, cg: true }));
  }
  const fill = tier === 'bad' ? ['gate', 'classroom', 'station', 'river'] : ['gate', 'classroom', 'rooftop', 'park', 'station'];
  for (const f of fill) if (imgs.length < 3) imgs.push({ img: bg(f), cg: false });
  const text = monologue(s, e.id, h);
  const n = tier === 'good' ? text.length : Math.min(text.length, tier === 'bad' ? 4 : 6);
  const pick = tier === 'good' ? text : [text[0], ...text.slice(1, -1).slice(-(n - 2)), text[text.length - 1]];
  const slides = pick.map((t, i) => ({ ...imgs[Math.min(imgs.length - 1, Math.floor(i * imgs.length / pick.length))], text: t, pan: i % 4 }));
  const H = h ? HMAP[h] : undefined;
  const epilogue = tier === 'good' && H ? `——そして、${H.mei}との新しい春が始まる。` : tier === 'normal' ? '——また、いつか。' : tier === 'rival' ? '——それぞれの春へ。' : '——それでも、春は来る。';
  return { tier, h, title: e.title, slides, credits: buildCredits(s), epilogue };
}

// ───────── DOM 演出 ─────────
export interface MovieHooks { music(phase: 'mono' | 'roll' | 'end'): void; se?(k: string): void; done(): void }
const escH = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function playEndingMovie(m: EndingMovie, hooks: MovieHooks) {
  const el = document.createElement('div'); el.id = 'endmv'; el.className = `endmv t-${m.tier}`;
  const color = m.h ? HMAP[m.h]?.color || '#fff' : '#fff';
  el.style.setProperty('--hc', color);
  el.innerHTML = `<div class="em-stage"></div><div class="em-bar top"></div><div class="em-bar bot"></div><div class="em-text"></div><div class="em-title"></div><div class="em-roll"></div><button class="em-skip">SKIP ▶▶</button>`;
  document.body.appendChild(el);
  const stage = el.querySelector('.em-stage') as HTMLElement, txt = el.querySelector('.em-text') as HTMLElement, roll = el.querySelector('.em-roll') as HTMLElement, ttl = el.querySelector('.em-title') as HTMLElement;
  let i = -1, timer: any = 0, phase: 'title' | 'mono' | 'roll' | 'end' = 'title', closed = false;
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const showImg = (src: string, pan: number, cg: boolean) => {
    const d = document.createElement('div'); d.className = `em-img pan${pan}${cg ? ' cg' : ''}`;
    d.innerHTML = `<div class="em-blur" style="background-image:url('${src}')"></div><img src="${src}" alt="">`;
    stage.appendChild(d); requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('on')));
    const olds = [...stage.children].slice(0, -1) as HTMLElement[]; olds.forEach(o => { o.classList.remove('on'); setTimeout(() => o.remove(), 2200); });
  };
  const SLIDE_MS = reduce ? 6000 : 6200;
  const nextSlide = () => {
    clearTimeout(timer); i++;
    if (i >= m.slides.length) return startRoll();
    const sl = m.slides[i]; if (i === 0 || sl.img !== m.slides[i - 1].img) showImg(sl.img, sl.pan, sl.cg);
    txt.classList.remove('on'); setTimeout(() => { txt.textContent = sl.text; txt.classList.add('on'); }, 450);
    timer = setTimeout(nextSlide, SLIDE_MS);
  };
  const startMono = () => { phase = 'mono'; ttl.classList.remove('on'); hooks.music('mono'); setTimeout(nextSlide, 900); };
  const startRoll = () => {
    if (phase === 'roll' || phase === 'end') return; phase = 'roll'; clearTimeout(timer); txt.classList.remove('on'); el.classList.add('rolling'); hooks.music('roll');
    roll.innerHTML = `<div class="em-col">${m.credits.map((c, k) => `<section${k === 0 ? ' class="logo"' : ''}><h3>${escH(c.role)}</h3>${c.names.map(n => `<p>${escH(n)}</p>`).join('')}</section>`).join('')}<section class="fin"><p>${escH(m.epilogue)}</p><h2>FIN</h2></section></div>`;
    const col = roll.querySelector('.em-col') as HTMLElement;
    const dur = m.tier === 'good' ? 52 : 34; col.style.animationDuration = dur + 's'; roll.classList.add('on');
    // 背景は見たCGをゆっくり順番に
    let k = 0; const imgs = [...new Set(m.slides.map(s => s.img))]; const cyc = () => { if (phase !== 'roll') return; showImg(imgs[k++ % imgs.length], k % 4, true); timer = setTimeout(cyc, 7000); }; cyc();
    col.addEventListener('animationend', end, { once: true });
  };
  const end = () => {
    if (phase === 'end') return; phase = 'end'; clearTimeout(timer); hooks.music('end');
    roll.classList.remove('on'); ttl.innerHTML = `<h2>FIN</h2><p>${escH(m.title)}</p><p class="em-tap">タップで終了</p>`; ttl.classList.add('on', 'fin');
  };
  const close = () => { if (closed) return; closed = true; clearTimeout(timer); el.classList.add('out'); setTimeout(() => el.remove(), 900); hooks.done(); };
  el.onclick = () => { if (phase === 'title') startMono(); else if (phase === 'mono') nextSlide(); else if (phase === 'end') close(); };
  (el.querySelector('.em-skip') as HTMLElement).onclick = ev => { ev.stopPropagation(); if (phase === 'mono' || phase === 'title') startRoll(); else if (phase === 'roll') end(); else close(); };
  // タイトルカード（ため）
  ttl.innerHTML = `<p class="em-sub">${m.tier === 'good' ? 'ENDING' : m.tier === 'bad' ? 'GRADUATION' : 'ENDING'}</p><h2>${escH(m.title)}</h2>`;
  requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.add('on'); ttl.classList.add('on'); }));
  hooks.se?.('doki');
  timer = setTimeout(startMono, 3200);
  return { el, skip: () => (el.querySelector('.em-skip') as HTMLElement).click() };
}
