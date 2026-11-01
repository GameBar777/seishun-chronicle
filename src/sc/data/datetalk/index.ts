import type { DateTalk } from './types';
import hinata from './hinata'; import mio from './mio'; import yura from './yura'; import kaho from './kaho'; import reika from './reika';
import kotoha from './kotoha'; import ruka from './ruka'; import rin from './rin'; import shizuku from './shizuku';
export type { DateTalk } from './types';
import { SPOT_EV, EV_REACT, MID_TALK, WALK_HOME } from './beats';
import { GREET2, OUTFIT2, MID2, EVR2, REACT2 } from './more2';
export { SPOT_EV, EV_REACT, MID_TALK, WALK_HOME };
import { REACT_MORE, END_MORE, OUTFIT, KENTA_ENC, KENTA_REACT } from './more';
export { KENTA_ENC, KENTA_REACT };
export const DATE_OUTFIT = OUTFIT;
export const DATE_TALK: Record<string, DateTalk> = { hinata, mio, yura, kaho, reika, kotoha, ruka, rin, shizuku };
for (const [k, T] of Object.entries(DATE_TALK)) for (let i = 0; i < 3; i++) { T.greet[i].push(...(GREET2[k]?.[i] || [])); OUTFIT[k]?.[i]?.push(...(OUTFIT2[k]?.[i] || [])); EV_REACT[k]?.[i]?.push(...(EVR2[k]?.[i] || [])); }
for (const [k, L] of Object.entries(MID2)) MID_TALK[k]?.push(...L);
for (const [k, T] of Object.entries(DATE_TALK)) for (let i = 0; i < 4; i++) { T.react[i].push(...(REACT_MORE[k]?.[i] || []), ...(REACT2[k]?.[i] || [])); T.end[i].push(...(END_MORE[k]?.[i] || [])); }

// 汎用（服装への反応・別れのナレーション）
export const OUT_GOOD = ['h(照):その服、いいね。{C}に似合ってる', 'h(嬉):あ、その服……私の好きな感じ', 'h(照):……今日の{C}、ちょっとかっこいいかも', 'h(嬉):その服、選んでくれたの？ ……うれしい'];
export const OUT_PLAIN = ['h:……いつもの格好だね', 'h:{C}、今日もそれなんだ。……まあ、らしいけど', 'h:見慣れた服。……次はちょっと期待してもいい？'];
export const OUT_MEH = ['h:……ふうん、そういう服なんだ', 'h:へえ、今日はそういう感じ', 'h:その服、初めて見たかも', 'h:……意外な服、着てくるんだね'];
export const END_NARR: string[][] = [
  ['n:気まずい沈黙のまま、駅で別れた。', 'n:改札の前で、彼女は振り返らなかった。', 'n:帰りの電車、二人の間に会話はなかった。'],
  ['n:悪くはない一日だった。', 'n:駅前で手を振って別れた。', 'n:また今度、と言い合って別れた。'],
  ['n:帰り道、彼女はずっと笑っていた。', 'n:夕焼けの中、並んで駅まで歩いた。', 'n:別れたあとも、すぐにメッセージが届いた。'],
  ['n:別れ際、彼女は何度も振り返って手を振った。', 'n:駅のホームで、電車を一本見送った。', 'n:家に着いても、まだ胸の奥があたたかかった。'],
];
/** デート会話の全テキスト（未ボイス判定用）。h(感情): の接頭辞を除いた本文 */
export const DATE_TALK_LINES: string[] = (() => {
  const o: string[] = []; const add = (x: string) => x.split('\n').forEach(l => o.push(l.replace(/^h(\([^)]*\))?:/, '')));
  for (const T of Object.values(DATE_TALK)) {
    [...T.greet.flat(), ...Object.values(T.spot).flat(), ...T.react.flat(), ...T.end.flat(), ...Object.values(T.season).flat(), ...T.rain, ...T.again, ...Object.values(T.cb), ...T.y3, ...T.qs.map(q => q[0])].forEach(add);
  }
  [...OUT_GOOD, ...OUT_PLAIN, ...OUT_MEH, ...Object.values(OUTFIT).flat(2), ...Object.values(KENTA_REACT).flat(), ...KENTA_ENC.map(x => x.replace(/^@健太:/, ''))].forEach(add);
  [...Object.values(EV_REACT).flat(2), ...Object.values(MID_TALK).flat()].forEach(add);
  return o;
})();
