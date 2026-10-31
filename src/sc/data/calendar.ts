import type { Ev, Choice } from './schema';
import type { GameState } from '../types';
import { cal } from '../time';
import { HEROINES, HMAP } from './index';
const C = (s: GameState) => cal(s.week);
const at = (Y: number | null, m: number, n: number) => (s: GameState) => { const c = C(s); return (Y === null || c.Y === Y) && c.m === m && c.n === n; };
const metList = (s: GameState) => HEROINES.filter(h => s.hs[h.id].met && !s.hs[h.id].withRival);
// 誘いイベント: 誘える相手を動的に並べる。成功判定は engine.inviteOutcome。
const invite = (tag: string, t: number, f: number): ((s: GameState) => Choice[]) => s => [
  ...metList(s).map(h => ({ label: `${h.sei}${h.mei}を誘う`, eff: { to: h.id, t, f, flag: `${tag}:${h.id}` }, res: [`@invite:${h.id}:${tag}`] })),
  { label: '一人で過ごす / 友達と行く', eff: { stats: { st: -8 } }, res: ['n:悪友の健太たちと騒いで終わった。それはそれで楽しかった。', '@健太:来年こそは彼女と来いよな、お互い！'] },
];
export const CAL: Ev[] = [
  // ── 4月 ──
  { id: 'club_select', title: '部活動見学', cond: at(1, 4, 2), lines: ['n:部活動の勧誘で校門前は大騒ぎだ。どの部に入ろう。（あとから変更はできない）'],
    choices: ['野球部', 'サッカー部', 'テニス部', '陸上部', '吹奏楽部', '美術部', '写真部', '帰宅部'].map(c => ({ label: c, eff: { flag: 'club:' + c }, res: [`n:${c}に入ることにした。`] })) },
  { id: 'class_y2', title: 'クラス替え（2年）', cond: at(2, 4, 1), lines: ['n:二年生。昇降口に新しいクラス表が貼り出されている。', '@健太:{S}、また同じクラスだな！ ……お、今年は女子のレベル高いぞ'],
    choices: [{ label: '新しいクラスメイトに積極的に話しかける', eff: { stats: { yo: 2, st: 3 }, others: { f: 2 } }, res: ['n:顔と名前を覚えるだけで一日が終わった。'] }, { label: '窓際の席で静かに過ごす', eff: { stats: { st: -5, bun: 2 } }, res: ['n:春の陽射しが心地よかった。'] }] },
  { id: 'class_y3', title: 'クラス替え（3年）', cond: at(3, 4, 1), lines: ['n:三年生。最後のクラス替え。廊下の空気がどこか張り詰めている。', '@担任・真鍋:三年は早いぞ。気づいたら卒業式だ。後悔のないようにな'],
    choices: [{ label: '「今年が勝負だ」と気合を入れる', eff: { stats: { kon: 4, st: 4 } }, res: ['n:手帳の一年分の空白が、やけに眩しく見えた。'] }, { label: '「まだ一年ある」とのんびり構える', eff: { stats: { st: -6 } }, res: ['n:その「一年」が、どれほど短いかを知らずに。'] }] },
  { id: 'rumor_ghost', title: '噂：天文台の幽霊', cond: s => C(s).Y >= 2 && C(s).m === 5 && C(s).n === 1, lines: ['@健太:なあ知ってるか？ 丘の上の旧天文台、夜中に白い服の女の幽霊が出るんだってよ', '@健太:眠れない夜にふらっと行くと会えるとか。理系の頭いい奴にしか見えないとか。……誰が言い出したんだろな'],
    choices: [{ label: '「くだらない」と聞き流す', eff: { flag: 'rumor_ghost' }, res: ['n:……けれど、なぜかその噂は頭の片隅に残った。'] }, { label: '「詳しく聞かせろ」', eff: { flag: 'rumor_ghost', stats: { ri: 1 } }, res: ['@健太:星が好きな奴だけ、ってのが本当らしいぜ。あと芸術的センス？ 盛りすぎだろ'] }] },
  // ── 5月 ──
  { id: 'gw', title: 'ゴールデンウィーク', cond: s => C(s).m === 5 && C(s).n === 1 && C(s).Y === 1, lines: ['n:ゴールデンウィーク。家族は親戚の家に出かけていった。'],
    choices: [{ label: '家で一日中勉強', eff: { stats: { bun: 4, ri: 4, st: 6 } }, res: ['n:やりきった。少し肩が凝った。'] }, { label: '商店街をぶらつく', eff: { stats: { st: -8 }, to: 'hinata', f: 3 }, res: ['hinata(嬉):あ、{C}くん！ ちょうどいいとこに。荷物運び手伝って！'] }, { label: '寝て過ごす', eff: { stats: { hp: 15, st: -10 } }, res: ['n:最高の休日だった。'] }] },
  // ── 6月 ──
  { id: 'sports_day', title: '体育祭', cond: s => C(s).m === 6 && C(s).n === 1, dynLines: s => [`n:${C(s).Y}年目の体育祭。快晴。クラス対抗リレーのアンカーを誰がやるかで揉めている。`],
    lines: [], choices: [
      { label: 'アンカーに立候補する', eff: { stats: { kon: 3 } }, res: ['@sports:'] },
      { label: '応援団で声を張る', eff: { stats: { kon: 2, st: -4 }, others: { f: 1 } }, res: ['n:喉が枯れるまで叫んだ。クラスは三位だった。'] },
      { label: '日陰で見学', eff: { stats: { hp: 3 } }, res: ['n:誰かが走り、誰かが転び、誰かが泣いていた。それを少し離れて見ていた。'] }] },
  // ── 7月 ──
  { id: 'summer_start', title: '夏休みの始まり', cond: s => C(s).m === 7 && C(s).n === 4, dynLines: s => [`n:終業式。${C(s).Y === 3 ? '高校最後の夏休み。受験生の夏でもある。' : '待ちに待った夏休みだ。'}`, '@健太:海行こうぜ海！ 夏祭りもあるし、花火大会もあるし！'],
    lines: [], choices: [{ label: '夏の計画を立てる', eff: { stats: { st: -5 } }, res: ['n:カレンダーに丸をつけた。夏祭り、海、花火。'] }, { label: '夏期講習に申し込む', eff: { stats: { bun: 3, ri: 3, st: 5 }, money: -10000 }, need: s => s.money >= 10000, res: ['n:講習代一万円。親に半分出してもらった。'] }] },
  // ── 8月 ──
  { id: 'summer_fes', title: '夏祭り', cond: s => C(s).m === 8 && C(s).n === 1, dynLines: s => [`n:汐見川の夏祭り。${C(s).Y}年目の夏。浴衣姿の同級生がちらほら見える。誰かを誘おうか。`], lines: [], choices: [], dyn: invite('夏祭り', 6, 4) },
  { id: 'beach', title: '海水浴', cond: s => C(s).m === 8 && C(s).n === 2 && C(s).Y <= 2, lines: ['@健太:海だー！！ ……で、{S}。なんでお前、女子と来なかったんだよ'],
    choices: [{ label: '泳ぎまくる', eff: { stats: { un: 4, hp: -4, st: -8 } }, res: ['n:日焼けで三日間眠れなかった。'] }, { label: '砂の城を本気で作る', eff: { stats: { gei: 4, st: -6 } }, res: ['n:通りすがりの子どもに拍手された。'] }] },
  { id: 'fireworks', title: '花火大会', cond: s => C(s).m === 8 && C(s).n === 3, dynLines: s => [`n:汐見湾の花火大会。${C(s).Y === 3 ? '高校最後の花火だ。' : ''}二人で見られたら、きっと忘れられない夜になる。`], lines: [], choices: [], dyn: invite('花火大会', 8, 3) },
  // ── 9月 ──
  { id: 'culture_prep', title: '文化祭準備', cond: s => C(s).m === 9 && C(s).n === 3, dynLines: s => [`n:文化祭まであと三週間。クラスの出し物は${['お化け屋敷', '演劇「銀河鉄道の夜」', 'メイド＆執事喫茶'][C(s).Y - 1]}に決まった。`], lines: [],
    choices: [{ label: '実行委員を引き受ける', eff: { stats: { kon: 4, st: 8, moral: 3 }, others: { f: 2 } }, res: ['n:毎日最終下校まで残った。クラスの空気が、少しずつまとまっていった。', '@健太:お前がまとめ役とか、一年前じゃ考えられねえな'] }, { label: '装飾・小道具を担当', eff: { stats: { gei: 6, st: 3 } }, res: ['n:段ボールとペンキの匂い。手が真っ赤になった。'] }, { label: '適当にサボる', eff: { stats: { st: -6, moral: -4 }, others: { f: -2 } }, res: ['n:クラスの女子の視線が冷たかった。'] }] },
  // ── 10月 ──
  { id: 'culture_fes', title: '文化祭', cond: s => C(s).m === 10 && C(s).n === 2, dynLines: s => [`n:文化祭当日。${C(s).Y}年目。校舎全体がお祭り騒ぎだ。自由時間、誰と回ろう？`], lines: [], choices: [], dyn: invite('文化祭', 6, 5) },
  { id: 'school_trip', title: '修学旅行（京都・奈良）', cond: s => C(s).Y === 2 && C(s).m === 10 && C(s).n === 4, lines: ['n:二年生の修学旅行。行き先は京都と奈良。', '@健太:自由行動、班の女子と回れるって知ってたか？', 'n:班行動の最終日、少しだけ抜け出して誰かと回るチャンスがある。'], choices: [], dyn: invite('修学旅行', 10, 6) },
  // ── 11月 ──
  { id: 'art_event', title: '芸術鑑賞会', cond: s => C(s).m === 11 && C(s).n === 2, dynLines: s => [`n:芸術鑑賞会。今年の演目は${['オーケストラ', '能楽', '現代演劇'][C(s).Y - 1]}だ。`], lines: [],
    choices: [{ label: '真剣に鑑賞する', eff: { stats: { gei: 5, bun: 2 } }, res: ['n:胸の奥で、何かが静かに震えた。'] }, { label: '寝る', eff: { stats: { hp: 5, moral: -2 } }, res: ['n:いびきをかいて先生に怒られた。'] }] },
  // ── 12月 ──
  { id: 'christmas', title: 'クリスマス', cond: s => C(s).m === 12 && C(s).n === 4, dynLines: s => [`n:クリスマス・イブ。${C(s).Y === 3 ? '受験直前だけれど、' : ''}街はイルミネーションで輝いている。`], lines: [], choices: [], dyn: invite('クリスマス', 10, 4) },
  // ── 1月 ──
  { id: 'new_year', title: '初詣', cond: s => C(s).m === 1 && C(s).n === 1, dynLines: s => [`n:元旦。${C(s).Y === 3 ? '合格祈願' : '新しい一年'}のために、汐見神社へ。`], lines: [], choices: [], dyn: invite('初詣', 6, 5) },
  { id: 'hatsuuri', title: '初売り', cond: s => C(s).m === 1 && C(s).n === 2 && C(s).Y <= 2, lines: ['n:駅前モールの初売り。福袋の列ができている。'],
    choices: [{ label: '服の福袋を買う（1万円）', need: s => s.money >= 10000, eff: { money: -10000, stats: { yo: 6 }, flag: 'outfit:トレンド' }, res: ['n:中身は当たりだった。流行りの服一式（トレンド）が手に入った。'] }, { label: '見るだけ', eff: {}, res: ['n:人混みに疲れただけだった。'] }] },
  // ── 2月 ──
  { id: 'valentine', title: 'バレンタイン', cond: s => C(s).m === 2 && C(s).n === 2, lines: ['n:二月十四日。教室の空気がどこかそわそわしている。'], choices: [{ label: '放課後を待つ', eff: {}, res: ['@valentine:'] }] },
  // ── 3月 ──
  { id: 'senior_grad', title: '先輩たちの卒業', cond: s => C(s).m === 3 && C(s).n === 2 && C(s).Y <= 2, dynLines: s => [`n:三年生の卒業式。${C(s).Y === 2 ? '来年は自分たちの番だ。' : '式の後、泣いている先輩たちを見送った。'}`], lines: [],
    choices: [{ label: 'お世話になった先輩に挨拶する', eff: { stats: { moral: 3 } }, res: ['n:「お前らも頑張れよ」と背中を叩かれた。'] }, { label: '一年を振り返る', eff: { stats: { st: -6 } }, res: ['n:日記帳を読み返した。いろいろあった一年だった。'] }] },
  // ── 進路 ──
  { id: 'course_select', title: '進路希望調査', cond: s => C(s).Y === 3 && C(s).m === 9 && C(s).n === 1, lines: ['@担任・真鍋:最終の進路希望だ。ここからは変更できないと思え。', 'n:（合否は2月の試験で、文系・理系などの能力で判定される）'],
    choices: [
      { label: '国公立大学（文系＋理系が高く必要）', eff: { flag: 'course:国公立大学' }, res: ['n:一番高い山を選んだ。'] },
      { label: '私立大学（文系か理系のどちらかが高ければ）', eff: { flag: 'course:私立大学' }, res: ['n:得意科目で勝負する。'] },
      { label: '専門学校（芸術か容姿が必要）', eff: { flag: 'course:専門学校' }, res: ['n:好きなことを仕事にする道。'] },
      { label: '就職（根性とモラルが必要）', eff: { flag: 'course:就職' }, res: ['n:一足先に、社会へ。'] }] },
  { id: 'exam_result', title: '受験', cond: s => C(s).Y === 3 && C(s).m === 2 && C(s).n === 3, lines: ['n:試験当日の朝。手が冷たい。', 'n:三年間のすべてが、この一日に問われる。'], choices: [{ label: '試験に臨む', eff: {}, res: ['@exam:'] }] },
];
