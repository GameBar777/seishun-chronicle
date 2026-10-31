// 自由入力会話：ローカルの意図分類＋ヒロインごとの台詞＋記憶。外部AIは使っていない。
import type { GameState, Emo } from './types';
import { HMAP, HEROINES } from './data/index';
import { applyH, parseLine, tierOf, type Line, diary } from './engine';
import { pick, chance } from './rng';
export type Intent = 'greet' | 'praise' | 'study' | 'topic' | 'dislike' | 'promise' | 'love' | 'sorry' | 'other' | 'insult' | 'default' | 'ask';
const RX: [Intent, RegExp][] = [
  ['insult', /ブス|うざ|キモ|きも[いっ]|嫌い|大っ?嫌い|バカ|ばか|馬鹿|最低|うるさい|黙れ|消えろ|つまらない/],
  ['sorry', /ごめん|すまん|すみません|悪かった|申し訳|許して/],
  ['love', /好きだ|好きです|好きなんだ|好きだよ|付き合って|つきあって|愛して|大好き|恋人/],
  ['promise', /約束|今度.*(行こ|しよ|見よ)|一緒に.*(行こ|しよう)|連れて(行|い)く|絶対.*(行|守)/],
  ['praise', /かわいい|可愛い|かわいかった|きれい|綺麗|似合|素敵|すてき|かっこいい|格好いい|美人|優しい|頑張ってる|すごいね/],
  ['greet', /^(おはよ|こんにち|こんばん|やあ|よっ|おっす|ただいま|はじめまして)/],
  ['study', /勉強|テスト|宿題|数学|英語|古文|物理|化学|教えて|試験|受験/],
];
const ASK: [RegExp, (h: any) => string][] = [
  [/誕生日/, H => `誕生日？ ${H.birthday[0]}月${H.birthday[1]}日だよ`],
  [/好きな(食べ物|たべもの|料理)|何が好き.*食/, H => `好きな食べ物は……${H.food}`],
  [/夢|将来/, H => `夢は……${H.dream}`],
  [/趣味/, H => `趣味？ ${H.hobby}`],
  [/部活/, H => `部活は${H.club}`],
  [/家族|家/, H => `うち？ ……${H.family.split('。')[0]}`],
  [/好きな場所|どこ.*好き/, H => `好きな場所は${H.likePlace}かな`],
];
export function classify(text: string, selfId: string): { intent: Intent; other?: string; ask?: string } {
  const H = HMAP[selfId];
  for (const o of HEROINES) if (o.id !== selfId && (text.includes(o.mei) || text.includes(o.sei))) return { intent: 'other', other: o.id };
  for (const [re, f] of ASK) if (re.test(text) && /[？?]|教えて|って何|なに|何/.test(text)) return { intent: 'ask', ask: f(H) };
  for (const [i, re] of RX) if (re.test(text)) return { intent: i };
  const dislikes = H.dislikeTopics.map(t => t.replace(/の話.*$|（.*）/g, ''));
  if (dislikes.some(d => d && text.includes(d))) return { intent: 'dislike' };
  if (H.topicWords.some(w => text.includes(w))) return { intent: 'topic' };
  return { intent: 'default' };
}
const EMO: Record<Intent, [Emo, Emo]> = { greet: ['通常', '嬉'], praise: ['冷', '照'], study: ['冷', '通常'], topic: ['通常', '嬉'], dislike: ['冷', '哀'], promise: ['通常', '嬉'], love: ['怒', '告'], sorry: ['冷', '通常'], other: ['冷', '嫉'], insult: ['怒', '哀'], default: ['通常', '通常'], ask: ['通常', '嬉'] };

export function chatReply(s: GameState, id: string, text: string): Line[] {
  const H = HMAP[id], h = s.hs[id];
  const { intent, other, ask } = classify(text, id);
  const warm = h.friend >= 45 || h.toki >= 40;
  const out: Line[] = [];
  const say = (t: string, emo: Emo) => out.push(parseLine(`h(${emo}):${t}`, s, id));
  // 過去の傷を覚えている
  const grudge = h.mem.find(m => m.kind === 'hurt' && s.week - m.week < 40);
  if (grudge && !warm && chance(s, 0.4) && intent !== 'sorry') say(`……${grudge.text}こと、まだ忘れてないから`, '冷');
  let line: string; const emo = EMO[intent][warm ? 1 : 0];
  if (intent === 'ask') line = ask! + (warm ? '。……{C}には教えてあげる' : '');
  else if (intent === 'love') {
    const ready = h.toki >= 65 && h.trust >= 40;
    line = H.chat.love[ready ? 1 : 0];
    if (ready) { applyH(s, id, { t: 4, tr: 3 }); h.mem.push({ week: s.week, kind: 'confess', text: '「好きだ」と言ってくれた' }); diary(s, `${H.sei}${H.mei}に気持ちを伝えた。`); }
    else applyH(s, id, { f: -4, h: 8, tr: -3 });
    say(line, ready ? '告' : '怒'); return withRecall(s, id, out, intent);
  } else line = H.chat[intent]?.[warm ? 1 : 0] ?? H.chat.default[warm ? 1 : 0];
  say(line, emo);
  switch (intent) {
    case 'praise': applyH(s, id, warm ? { t: 3, f: 1 } : { f: 1 }); h.mem.push({ week: s.week, kind: 'praise', text: text.slice(0, 20) }); break;
    case 'topic': applyH(s, id, { f: 4, t: 1, tr: 1 }); h.mem.push({ week: s.week, kind: 'like', text: text.slice(0, 20) }); break;
    case 'study': applyH(s, id, { f: 2 }); break;
    case 'dislike': applyH(s, id, h.trust >= 50 ? { tr: 3 } : { f: -3, h: 4 }); break;
    case 'promise': applyH(s, id, { tr: 2, f: 1 }); h.mem.push({ week: s.week, kind: 'promise', text: text.slice(0, 24) }); break;
    case 'sorry': applyH(s, id, { h: -15, tr: 1 }); h.mem.forEach(m => { if (m.kind === 'hurt') m.done = true; }); break;
    case 'other': applyH(s, id, h.toki >= 40 ? { h: 8 } : { f: -1 }); break;
    case 'insult': applyH(s, id, { f: -8, t: -5, h: 15, tr: -6 }); h.mem.push({ week: s.week, kind: 'hurt', text: `「${text.slice(0, 16)}」と言われた` }); break;
    case 'greet': applyH(s, id, { f: 1 }); break;
    default: applyH(s, id, { f: 1 });
  }
  return withRecall(s, id, out, intent, other);
}
function withRecall(s: GameState, id: string, out: Line[], intent: Intent, other?: string): Line[] {
  const h = s.hs[id];
  if (other && h.toki >= 40) out.push(parseLine(`h(嫉):……${HMAP[other].sei}さんのこと、よく見てるんだね`, s, id));
  const prom = h.mem.find(m => m.kind === 'promise' && !m.done && s.week - m.week >= 2);
  if (prom && chance(s, 0.5) && intent !== 'promise') {
    const kept = h.dates > 0 && h.lastLocs.length > 0 && s.week - h.lastContact <= 2;
    out.push(parseLine(kept ? `h(嬉):そういえば前に「${prom.text}」って言ってくれたよね。……ちゃんと覚えてるよ` : `h(哀):……前に「${prom.text}」って言ったの、覚えてる？ まだなんだけど`, s, id));
    if (!kept) applyH(s, id, { tr: -1 }); prom.done = kept;
  }
  const liked = h.mem.filter(m => m.kind === 'like').pop();
  if (liked && intent === 'default' && chance(s, 0.4)) out.push(parseLine(`h:そうそう、この前の「${liked.text}」の話、あれから考えてたんだ`, s, id));
  return out;
}
export const SUGGEST = ['おはよう', '今日も似合ってるね', '勉強教えて', '趣味は何？', '今度一緒に出かけようよ、約束', 'この前はごめん', '好きだ'];
