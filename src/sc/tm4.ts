// ときメモ4的な恋愛システム群（すべてオリジナル実装・オリジナル文面）
// 爆弾3段階／ハート色／携帯（電池・メール・プロフィール帳・学園通信）／廊下のすれ違い／情報屋／
// ダブルブッキング・延長デート・ナンパ男・帰り道の手つなぎ／卒業の桜の告白・自分からの告白
import type { GameState, HState, Scene } from './types';
import { HEROINES, HMAP, LOCATIONS } from './data/index';
import { applyH, stage, tierOf, parseLine, dateOrder, type Line, type View } from './engine';
import { rand, pick, chance } from './rng';
import { cal, LAST_WEEK, fmtDate } from './time';

export interface Mail { w: number; from: string; title: string; body: string; read?: boolean }
export interface TmState { bat: number; mail: Mail[]; mailW?: number; hall?: { w: number; h: string; done?: boolean }; dbl?: { h: string; loc: string }; conf?: string }
const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));
export function tm(s: GameState): TmState { const x = s as any; return (x.tm ||= { bat: 100, mail: [] }); }
const nm = (id: string) => HMAP[id].sei + HMAP[id].mei;
const log = (s: GameState, t: string) => s.lastLog.push(t);
const diary = (s: GameState, t: string) => s.diary.push({ week: s.week, text: t });

// ───────── ハートの色（関係の段階） ─────────
export const HEART_COLOR: Record<string, string> = { 他人: '#b0b0b0', 顔見知り: '#7fb3ff', 友人: '#4cc38a', 親友: '#f2c230', 気になる存在: '#ff9f43', 好き: '#ff6fa5', 夢中: '#e8264f' };
export const HEART_WORD: Record<string, string> = { 他人: '灰', 顔見知り: '青', 友人: '緑', 親友: '黄', 気になる存在: '橙', 好き: '桃', 夢中: '紅' };
export function heartOf(h: HState): { color: string; word: string; stage: string } { const st = stage(h); return { color: HEART_COLOR[st] || '#ccc', word: HEART_WORD[st] || '灰', stage: st }; }

// ───────── 爆弾：出現 → 点火 → 爆発 ─────────
export const BOMB_WARN = 45, BOMB_FUSE = 4;
/** 0:なし 1:出現（くすぶり） 2:点火 3:爆発寸前 */
export function bombStage(h: HState): 0 | 1 | 2 | 3 { if (h.bomb > 0) return h.bomb >= BOMB_FUSE - 1 ? 3 : 2; return h.flags.includes('bombWarn') ? 1 : 0; }
export const BOMB_LABEL = ['', '⚠ 不穏（傷心が溜まっている）', '💣🔥 爆弾に火がついた', '💣🔥🔥 爆発寸前！'];
export function bombWeek(s: GameState, id: string) {
  const h = s.hs[id];
  if (h.bomb === 0) {
    if (h.hurt >= BOMB_WARN && !h.flags.includes('bombWarn')) { h.flags.push('bombWarn'); log(s, `💣 ${nm(id)}の頭上に爆弾が現れた……（まだ点火していない。早めに連絡を）`); }
    else if (h.hurt < 35 && h.flags.includes('bombWarn')) h.flags.splice(h.flags.indexOf('bombWarn'), 1);
    return;
  }
  if (h.bomb === BOMB_FUSE - 1) {
    // 噂の飛び火：仲の良い別のヒロインの耳にも入る
    const os = HEROINES.filter(o => o.id !== id && s.hs[o.id].met && !s.hs[o.id].withRival && s.hs[o.id].friend >= 20);
    if (os.length) { const o = pick(s, os); applyH(s, o.id, { h: 8, tr: -3 }, false); log(s, `📢 ${nm(id)}の噂が${nm(o.id)}の耳にも入ったらしい……`); }
    log(s, `💣🔥🔥 ${nm(id)}の爆弾が爆発寸前だ！`);
  }
}

// ───────── 携帯：電池・メール・プロフィール帳・学園通信 ─────────
export const BAT = { call: 35, mail: 15, charge: 30 };
export function spendBattery(s: GameState, n: number): string | null { const t = tm(s); if (t.bat < n) return `n:……携帯の電池が切れかけている（残り${t.bat}%）。今週は充電を待つしかない。`; t.bat -= n; return null; }
const MAIL_TPL: [string, string][][] = [
  [['こんにちは', '{C}、この前はどうも。また学校でね。'], ['連絡', '明日の小テスト、範囲どこまでだっけ？']],
  [['ねえねえ', '{C}、今なにしてる？ ……別に用はないんだけど。'], ['今日のこと', '今日はありがと。ちょっと楽しかった。'], ['おすすめ', '最近見つけたお店、今度教えてあげるね。']],
  [['眠れなくて', '{C}の声、ちょっとだけ聞きたくなっちゃった。……なんでもない、おやすみ！'], ['週末', '週末、空いてたりする？ ……ううん、聞いてみただけ。'], ['ありがとう', '{C}がいてくれてよかった。それだけ言いたかったの。']],
];
const MAIL_COLD: [string, string][] = [['……', '最近、全然連絡くれないんだね。'], ['べつに', '忙しいんでしょ。わかってるから。']];
export function weeklyPhone(s: GameState) {
  const t = tm(s); t.bat = clamp(t.bat + BAT.charge);
  const c = cal(s.week + 1);
  if (c.n === 1 || s.week === 0) newsletter(s, s.week + 1);
  for (const H of HEROINES) {
    const h = s.hs[H.id]; if (!h.met || h.withRival) continue;
    const st = bombStage(h);
    if (st >= 2 && chance(s, 0.35)) { const [ti, b] = pick(s, MAIL_COLD); t.mail.push({ w: s.week + 1, from: H.id, title: ti, body: b }); continue; }
    if ((h.friend >= 30 || h.toki >= 25) && chance(s, 0.12 + tierOf(h) * 0.06)) { const [ti, b] = pick(s, MAIL_TPL[tierOf(h)]); t.mail.push({ w: s.week + 1, from: H.id, title: ti, body: b }); }
  }
  if (t.mail.length > 60) t.mail.splice(0, t.mail.length - 60);
}
export const unread = (s: GameState) => tm(s).mail.filter(m => !m.read).length;
export function sendMail(s: GameState, id: string): Line[] {
  const t = tm(s), h = s.hs[id];
  if (t.mailW === s.week) return [parseLine('n:今週はもうメールを送った。しつこいと思われそうだ。', s)];
  const e = spendBattery(s, BAT.mail); if (e) return [parseLine(e, s)];
  t.mailW = s.week; applyH(s, id, { h: -6 }, false);
  const st = bombStage(h);
  return [parseLine(`n:${nm(id)}にメールを送った。`, s), parseLine(st >= 2 ? 'n:返信は「うん」の一言だけだった。' : tierOf(h) >= 1 ? 'n:すぐに返信が来た。絵文字がひとつ、添えてあった。' : 'n:しばらくして、短い返信が届いた。', s)];
}
export function newsletter(s: GameState, w: number) {
  const c = cal(w); const met = HEROINES.filter(H => s.hs[H.id].met);
  const rows: string[] = [`【${c.m}月号】今月の主な予定：${MONTH_NEWS[c.m] || '特になし'}`];
  const bd = HEROINES.filter(H => H.birthday[0] === c.m && s.hs[H.id].met); if (bd.length) rows.push(`今月誕生日の生徒：${bd.map(H => `${H.sei}${H.mei}（${H.birthday[1]}日）`).join('・')}`);
  if (met.length) { const H = met[(w * 7) % met.length]; rows.push(`【突撃インタビュー】${H.sei}${H.mei}さんの好きな場所は「${H.likePlace}」だそうです。`); }
  rows.push(`【恋のジンクス】卒業式の日、校舎裏の「星見の桜」の下で女の子から告白されて結ばれた二人は、ずっと幸せになれるらしい……？`);
  tm(s).mail.push({ w, from: 'news', title: `星見ヶ丘通信 ${c.y}年${c.m}月号`, body: rows.join('\n') });
}
const MONTH_NEWS: Record<number, string> = { 4: '入学式・部活動紹介', 5: 'GW・体育祭・中間テスト', 6: '梅雨・衣替え', 7: '期末テスト・夏休み開始・夏祭り', 8: '花火大会・海', 9: '新学期', 10: '文化祭準備・中間テスト', 11: '文化祭・修学旅行（2年）', 12: '期末テスト・クリスマス', 1: '初詣・冬休み明け', 2: 'バレンタイン・学年末テスト', 3: '卒業式・春休み' };
/** プロフィール帳：仲良くなるほど項目が埋まる */
export function profile(s: GameState, id: string): { k: string; v: string }[] {
  const H = HMAP[id], h = s.hs[id]; const q = '？？？';
  const best = Object.entries(H.datePref).sort((a, b) => b[1] - a[1])[0]?.[0];
  return [
    { k: '名前', v: h.met ? `${H.sei}${H.mei}（${H.seiYomi} ${H.meiYomi}）` : q },
    { k: '学年', v: h.met ? H.grade : q },
    { k: '部活', v: h.met ? H.club : q },
    { k: '誕生日', v: h.friend >= 15 || h.toki >= 15 ? `${H.birthday[0]}月${H.birthday[1]}日` : q },
    { k: '趣味', v: h.friend >= 25 ? H.hobby : q },
    { k: '好きな食べ物', v: h.friend >= 35 ? H.food : q },
    { k: '好きな場所', v: h.friend >= 45 || h.toki >= 35 ? H.likePlace + (best ? `（デートなら${LOCATIONS[best]?.name || best}）` : '') : q },
    { k: '苦手な場所', v: h.friend >= 55 || h.toki >= 45 ? H.dislikePlace : q },
    { k: '好きな服の系統', v: h.toki >= 40 ? H.outfit : q },
    { k: '好きな話題', v: tierOf(h) >= 1 ? H.likeTopics.join('・') : q },
    { k: '夢', v: tierOf(h) >= 2 ? H.dream : q },
  ];
}

// ───────── 情報屋（健太）：居場所と様子 ─────────
const SPOTS = ['図書室', '屋上', '中庭のベンチ', '購買の前', '音楽室', '昇降口', '部室棟', '渡り廊下', '校庭'];
export function spotOf(s: GameState, id: string): string { const t = tm(s); if (t.hall?.w === s.week && t.hall.h === id && !t.hall.done) return '2階の廊下（すれ違えそうだ）'; const i = (s.week * 5 + id.charCodeAt(0) * 3 + id.length) % SPOTS.length; return SPOTS[i]; }
export function informant(s: GameState): { id: string; name: string; heart: string; color: string; where: string; note: string }[] {
  return HEROINES.filter(H => s.hs[H.id].met).map(H => {
    const h = s.hs[H.id], hc = heartOf(h), b = bombStage(h);
    const note = h.withRival ? '……もう、他のやつと付き合ってるらしい' : b === 3 ? 'かなりヤバい。今すぐ連絡しろ' : b === 2 ? '怒ってるぞ。噂になる前に電話かデートだ' : b === 1 ? 'ちょっと不満そうだったな' : tierOf(h) >= 2 ? 'お前の話ばっかりしてるってよ' : tierOf(h) >= 1 ? 'まんざらでもないみたいだぜ' : h.friend >= 20 ? '普通に友達って感じだな' : 'まだお前のこと、よく知らないってさ';
    return { id: H.id, name: nm(H.id), heart: hc.word, color: hc.color, where: spotOf(s, H.id), note };
  });
}

// ───────── 廊下のすれ違い（週1・短い会話） ─────────
export function rollHall(s: GameState) {
  const met = HEROINES.filter(H => s.hs[H.id].met && !s.hs[H.id].withRival);
  const t = tm(s); t.hall = met.length && chance(s, 0.4) ? { w: s.week + 1, h: pick(s, met).id } : undefined;
}
export const hallNow = (s: GameState) => { const t = tm(s); return t.hall && t.hall.w === s.week && !t.hall.done && !s.queue.length ? t.hall.h : null; };
export const HALL_CH = ['「おはよう」と声をかける', '髪型や持ち物をほめる', '肩を軽くたたいて呼び止める', '気づかないふりをする'];
export function hallTalk(s: GameState, idx: number): Line[] {
  const id = hallNow(s); if (!id) return [];
  const t = tm(s); t.hall!.done = true; const h = s.hs[id], tr = tierOf(h), b = bombStage(h);
  const L = (x: string) => parseLine(x, s, id);
  const out = [L(`n:休み時間、廊下で${nm(id)}とすれ違った。`)];
  if (idx === 0) { applyH(s, id, { f: b ? 0 : 1 }, false); out.push(L(b ? 'h(冷):……おはよ' : tr ? 'h(嬉):あ、{C}！ おはよ！' : 'h:……おはよう')); }
  else if (idx === 1) { const ok = tr >= 1 && !b; applyH(s, id, ok ? { t: 1 } : { f: -1, h: 3 }, false); out.push(L(ok ? 'h(照):……気づいてくれたんだ。ちょっと、嬉しいかも' : 'h(驚):え、なに急に……？ ……ありがと')); }
  else if (idx === 2) { const ok = tr >= 2 && !b; applyH(s, id, ok ? { t: 1, tr: 1 } : { tr: -2 }, false); out.push(L(ok ? 'h(照):わっ……もう、びっくりさせないでよ、{C}' : 'h(驚):っ……！ ……びっくりした。急に触らないで')); }
  else { if (b || tr >= 1) applyH(s, id, { h: 4 }, false); out.push(L(tr >= 1 ? 'h(哀):……今、目、合ったよね？' : 'n:彼女はこちらに気づかず、通り過ぎていった。')); }
  return out;
}

// ───────── 特殊シーン（tm4:*） ─────────
const sc = (t: string, h: string, data: any = {}): Scene => ({ kind: 'event', id: 'tm4', h, data: { t, ...data } });
/** ダブルブッキングを受け付ける（電話で2人目を誘ったとき） */
export function tryDouble(s: GameState, id: string, loc: string): Line[] | null {
  const t = tm(s); if (!s.dateBooked || t.dbl || s.dateBooked.h === id) return null;
  t.dbl = { h: id, loc };
  return [parseLine(`n:今週の日曜日、${LOCATIONS[loc].name}で会う約束をした。`, s), parseLine(`n:……しまった。日曜日は${nm(s.dateBooked.h)}とも約束している。ダブルブッキングだ！`, s)];
}
/** doWeek でデートシーンを積んだ直後に呼ぶ */
export function beforeDate(s: GameState) {
  const t = tm(s); if (!t.dbl) return;
  const i = s.queue.findIndex(q => q.kind === 'date');
  if (i < 0) { t.dbl = undefined; return; }
  s.queue.splice(i, 0, sc('dbl', s.queue[i].h!, { b: t.dbl.h, loc: t.dbl.loc })); t.dbl = undefined;
}
export function afterDate(s: GameState, q: Scene, grade: number) {
  const h = s.hs[q.h!], add: Scene[] = [];
  if (!q.data.dbl && chance(s, 0.1)) add.push(sc('nanpa', q.h!));
  if (grade === 3 && tierOf(h) >= 1 && !q.data.dbl && chance(s, 0.5)) add.push(sc('extra', q.h!));
  if (grade >= 2) add.push(sc('hand', q.h!));
  s.queue.splice(1, 0, ...add.slice(0, 2));
}
export const mkDate = (s: GameState, h: string, loc: string, extra: any = {}): Scene => ({ kind: 'date', id: 'date', h, step: 0, data: { loc, score: 0, order: dateOrder(s, h, loc), ...extra } });
export function canConfess(s: GameState) { const c = cal(s.week); return c.Y === 3 && c.m >= 1 && c.m <= 3 && s.week < LAST_WEEK && !tm(s).conf; }
export function startConfess(s: GameState, id: string) { if (!canConfess(s)) return false; s.queue.push(sc('confess', id)); return true; }

export function tm4View(s: GameState, q: Scene): View {
  const id = q.h!, L = (x: string) => parseLine(x, s, id), d = q.data;
  switch (d.t) {
    case 'dbl': return { kind: 'event', title: '⚠ ダブルブッキング', h: id, lines: [`n:日曜日。${nm(id)}との${LOCATIONS[s.queue.find(x => x.kind === 'date')?.data.loc || 'park'].name}、${nm(d.b)}との${LOCATIONS[d.loc].name}——同じ日に二つの約束。`, 'n:どうする……？'].map(L), choices: ['両方こなす（走り回る）', `${HMAP[d.b].mei}に断りの電話を入れる`, `${HMAP[id].mei}に断りの電話を入れる`] };
    case 'nanpa': return { kind: 'event', title: '帰り道のトラブル', h: id, lines: ['n:帰り際、ガラの悪い二人組が彼女に声をかけてきた。', '@男:ねえ、そんなやつほっといて、俺らと遊ぼうよ', 'h(驚):……っ、{C}……'].map(L), choices: ['二人の間に割って入る', '店員さんを呼びに行く', '目をそらしてしまう'] };
    case 'extra': return { kind: 'event', title: 'もう少しだけ', h: id, lines: ['h(照):ねえ、{C}。……このあと、もうちょっとだけ寄り道しない？'].map(L), choices: ['寄り道する（体力-10・500円）', '今日はもう帰ろう'] };
    case 'hand': return { kind: 'event', title: '帰り道', h: id, lines: [`n:夕暮れの帰り道。並んで歩く${HMAP[id].mei}の手が、ときどき自分の手に触れそうになる。`].map(L), choices: ['そっと手を伸ばす', '歩幅を合わせて歩く', '何もしない'] };
    case 'confess': return { kind: 'event', title: '💌 想いを伝える', h: id, lines: [`n:放課後。${nm(id)}を、誰もいない屋上に呼び出した。`, 'h:……どうしたの、{C}。急に呼び出したりして', 'n:心臓の音がうるさい。言うなら、今しかない。'].map(L), choices: ['「ずっと好きだった」と伝える', 'やっぱり、やめておく'] };
  }
  return { kind: 'event', title: '', lines: [], choices: ['次へ'] };
}
export function tm4Resolve(s: GameState, q: Scene, idx: number): Line[] {
  const id = q.h!, h = s.hs[id], d = q.data, L = (x: string) => parseLine(x, s, id), out: string[] = [];
  switch (d.t) {
    case 'dbl': {
      const di = s.queue.findIndex(x => x.kind === 'date');
      if (idx === 0) {
        const p = clamp((s.stats.un + s.stats.kon) / 700 + s.stats.hp / 250, 0.1, 0.75);
        s.stats.hp = clamp(s.stats.hp - 15);
        if (rand(s) < p) { out.push('n:走った。とにかく走った。トイレだ電話だと言い訳しながら、二つの約束の間を往復した——', 'n:……どうにか、どちらにも気づかれずに済んだ。'); if (di >= 0) { s.queue[di].data.pen = -1; s.queue.splice(di + 1, 0, mkDate(s, d.b, d.loc, { pen: -1, dbl: true })); } }
        else { out.push('n:走り回った末——曲がり角で、二人が鉢合わせした。', `${d.b}(怒):……{C}？ どういうこと？`, 'h(冷):……最っ低。', 'n:二人とも、黙って帰ってしまった。'); for (const x of [id, d.b]) applyH(s, x, { h: 25, tr: -10, t: -6 }, false); if (di >= 0) s.queue.splice(di, 1); s.rumor = Math.max(s.rumor, 4); diary(s, `ダブルブッキングがばれた。${nm(id)}と${nm(d.b)}を怒らせた。`); }
      } else if (idx === 1) { applyH(s, d.b, { h: 20, tr: -8 }, false); out.push(`n:${nm(d.b)}に断りの電話を入れた。`, `${d.b}(哀):……そっか。ううん、いいよ。……べつに`); }
      else { applyH(s, id, { h: 20, tr: -8 }, false); out.push(`n:${nm(id)}に断りの電話を入れた。`, 'h(哀):……わかった。また今度、ね'); if (di >= 0) s.queue.splice(di, 1, mkDate(s, d.b, d.loc)); }
      break;
    }
    case 'nanpa': {
      if (idx === 0) {
        const win = (s.stats.un + s.stats.kon) / 2 + rand(s) * 80 >= 140;
        if (win) { applyH(s, id, { t: 4, tr: 8 }); out.push('me:……俺の連れに、何か用ですか', '@男:ちっ……なんだよ。行こうぜ', 'h(照):……{C}、ありがと。……かっこよかった'); h.flags.push('savedNanpa'); }
        else { s.stats.hp = clamp(s.stats.hp - 20); applyH(s, id, { tr: 4 }); out.push('n:割って入ったものの、突き飛ばされて尻もちをついた。騒ぎに気づいた通行人のおかげで、二人組は去っていった。', 'h(哀):……{C}、大丈夫？ ……無茶しないでよ、もう'); }
      } else if (idx === 1) { applyH(s, id, { tr: 1 }); out.push('n:店員さんが駆けつけると、二人組は舌打ちして去っていった。', 'h:……ありがと。ちょっと、怖かった'); }
      else { applyH(s, id, { t: -6, tr: -12, h: 10 }); out.push('n:足がすくんで、何もできなかった。彼女は自分で振り切って戻ってきた。', 'h(冷):……帰ろ。'); }
      break;
    }
    case 'extra': {
      if (idx === 0) { s.stats.hp = clamp(s.stats.hp - 10); s.money = Math.max(0, s.money - 500); applyH(s, id, { t: 3, tr: 2 }); out.push('n:駅前のクレープ屋に寄って、ベンチで半分こした。', 'h(嬉):……えへへ。今日、すっごくいい日だった'); }
      else out.push('h:……そっか。うん、また今度ね');
      break;
    }
    case 'hand': {
      const n = h.flags.filter(f => f === 'hand').length;
      if (idx === 0) {
        if (tierOf(h) >= 2 || h.toki >= 60) { h.flags.push('hand'); applyH(s, id, { t: n ? 2 : 4, tr: 2 }); out.push(n ? 'n:当たり前みたいに、指をからめて歩いた。' : 'n:そっと指先に触れると、少し驚いたあと——きゅっと、握り返してくれた。', n ? 'h(照):……ふふ。あったかいね' : 'h(照):……手、つないじゃったね。……離さないでよ'); if (!n) diary(s, `${nm(id)}と初めて手をつないで帰った。`); }
        else { applyH(s, id, { t: -3, h: 8 }); out.push('n:手を伸ばした瞬間、彼女はさっと手を引っこめた。', 'h(驚):……っ、ご、ごめん。……まだ、そういうのは'); }
      } else if (idx === 1) { applyH(s, id, { tr: 1 }); out.push('n:黙って歩幅を合わせた。彼女も、少しだけゆっくり歩いてくれた。'); }
      else out.push('n:結局、何も言えないまま分かれ道に着いた。');
      break;
    }
    case 'confess': {
      if (idx === 1) { out.push('me:……いや、なんでもない。また明日な', 'h:……？ うん、また明日'); break; }
      const t = tm(s); const good = h.toki >= 75 && h.trust >= 55 && !h.withRival && h.bomb === 0;
      out.push('me:……ずっと、好きだった。');
      if (good) { t.conf = 'held:' + id; applyH(s, id, { t: 3, tr: 3 }); out.push('h(照):……待って。', 'h(照):その続きは……卒業式の日まで、取っておいて。……私からも、言いたいことがあるから', 'n:彼女は真っ赤な顔で、そう言って笑った。'); diary(s, `${nm(id)}に想いを伝えかけた。続きは卒業式の日に。`); }
      else if (h.toki >= 45 && !h.withRival) { t.conf = 'uneasy:' + id; applyH(s, id, { h: 20, tr: -8 }, false); out.push('h(哀):……ごめん。今は、まだ……答えられない', 'n:気まずい沈黙のまま、彼女は先に屋上を出ていった。'); diary(s, `${nm(id)}に告白したが、答えはもらえなかった。`); }
      else { t.conf = 'no:' + id; applyH(s, id, { h: 30, t: -15, tr: -10 }, false); s.rumor = Math.max(s.rumor, 4); out.push('h(驚):……え？', 'h(哀):……ごめんなさい。{C}のこと、そういう風には見られない', 'n:翌日には、告白して振られた噂がクラス中に広まっていた。'); diary(s, `${nm(id)}に告白して、振られた。`); }
      break;
    }
  }
  return out.map(L);
}

// ───────── 卒業の日：星見の桜 ─────────
export function legendPrelude(s: GameState, id: string): string[] {
  const c = tm(s).conf || '';
  const out = ['n:式の後、下駄箱を開けると、一通の手紙が入っていた。', `n:「校舎裏の、星見の桜の下で待っています。　${HMAP[id].mei}」`, 'n:——卒業の日、あの桜の下で女の子から告白されて結ばれた二人は、ずっと幸せになれる。そんな言い伝えを、ふと思い出した。', 'n:息を切らして校舎裏へ走ると、満開には少し早い桜の下に、彼女が立っていた。'];
  if (c === 'held:' + id) out.push('h(照):……あの日の続き。今度は、私から言わせて');
  else if (c && c.endsWith(':' + id)) out.push('h(照):……あのときは、答えられなくてごめん。ずっと、考えてたんだ');
  return out;
}
export function uneasyNote(s: GameState, id: string): string[] { const c = tm(s).conf || ''; return c === 'uneasy:' + id ? ['h(哀):……あのとき、答えられなかったこと。ずっと、引っかかってた'] : []; }

// ───────── カレンダー ─────────
export function calendarStrip(s: GameState, n = 8): { w: number; label: string; marks: string[] }[] {
  const r: { w: number; label: string; marks: string[] }[] = [];
  for (let w = s.week; w < Math.min(LAST_WEEK + 1, s.week + n); w++) {
    const c = cal(w); const marks: string[] = [];
    for (const H of HEROINES) if (s.hs[H.id].met && H.birthday[0] === c.m && Math.abs(H.birthday[1] - c.day - 3) <= 3) marks.push(`🎂${H.mei}`);
    if (w === s.week && s.dateBooked) marks.push(`💗${HMAP[s.dateBooked.h].mei}`);
    if (c.n === 1) marks.push('📰通信');
    if (w === LAST_WEEK) marks.push('🌸卒業式');
    r.push({ w, label: fmtDate(w).replace(/^\d+年/, ''), marks });
  }
  return r;
}
