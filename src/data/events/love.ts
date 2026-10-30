import type { EventDef } from '../../engine/eventTypes';
import type { Ctx } from '../../engine/ctx';
const single = (c: Ctx) => !c.spouse && !c.partner;
const meet = (c: Ctx, how: string) => { const n = c.addNpc('partner', { sex: c.p.sex === 'm' ? (c.chance(0.9) ? 'f' : 'm') : (c.chance(0.9) ? 'm' : 'f'), birthYear: c.p.birthYear + c.rng.int(-4, 4), f: { trust: 45, affection: 55, anger: 0, respect: 45, disappointment: 0 } }); c.p.partnerId = n.id; c.note(n, how); c.log(`${n.name}と付き合い始めた。`, true, 'love'); return n; };
export const love: EventDef[] = [
  { id: 'love_meet_friend_intro', cat: 'love', title: '友人の紹介', cooldown: 4, when: c => single(c) && c.age >= 20 && c.age < 50, weight: c => 1.5 + c.p.stats.soc / 50, bind: c => c.pickBy('friend'),
    text: '{npc}が「会わせたい人がいる」と言う。週末のカフェ、少し緊張した顔の人が待っていた。',
    choices: [
      { label: '自分から積極的に話しかける', fx: { stats: { soc: 2 } }, run: c => { if (c.chance(0.45 + c.p.stats.soc / 200)) { const n = meet(c, '友人の紹介で出会う'); c.feel(c.npc, { trust: 5 }); return `${n.name}と、また会う約束をした。`; } return '会話は弾んだが、それきりだった。'; } },
      { label: '自然体で、聞き役に回る', run: c => { if (c.chance(0.4 + c.p.stats.soc / 300)) { meet(c, '静かなカフェで出会う'); return '「話しやすい人だね」と言われた。'; } return '良い人だったが、縁はなかった。'; } },
      { label: '今は恋愛より仕事だと断る', fx: { stats: { dis: 2 }, feel: { affection: -3 } } },
    ] },
  { id: 'love_workplace', cat: 'love', title: '残業後のコンビニ', cooldown: 5, when: c => single(c) && !!c.p.jobId && c.age >= 22 && c.age < 50,
    text: '終電を逃した夜、同じ部署の人とコンビニで鉢合わせた。「…ラーメンでも行きます？」',
    choices: [
      { label: '行く', run: c => { if (c.chance(0.5)) { const n = meet(c, '職場で出会う'); n.jobId = c.p.jobId; c.flag('office_romance'); return '気づけば朝まで話していた。'; } return '楽しい夜だった。それ以上でも以下でもなく。'; } },
      { label: '「また今度」と帰る', fx: { health: 1 } },
      { label: '職場恋愛は避けると決めている', fx: { stats: { dis: 1 } } },
    ] },
  { id: 'love_app', cat: 'love', title: 'マッチングアプリ', cooldown: 3, max: 4, when: c => single(c) && c.age >= 22 && c.age < 60,
    text: '画面の中に、何百もの「はじめまして」が並ぶ。',
    choices: [
      { label: '条件の合う人を探す', run: c => { if (c.chance(0.4)) { meet(c, 'アプリで出会う'); return '三度目のデートで、付き合うことになった。'; } c.happy(-2); return '疲れただけだった。'; } },
      { label: '趣味の合う人を探す', fx: { stats: { cre: 1 } }, run: c => { if (c.chance(0.35)) { const n = meet(c, '趣味を通じて出会う'); n.value = 'art'; return '同じ映画が好きな人と出会った。'; } return '会話は続かなかった。'; } },
      { label: 'アプリを消す', fx: { stress: -3 } },
    ] },
  { id: 'love_reunion', cat: 'love', title: '同窓会の再会', once: true, when: c => single(c) && c.age >= 27 && c.age <= 40,
    text: c => `${c.home.name}での同窓会。昔、少しだけ気になっていた人が、隣の席に座った。`,
    choices: [
      { label: '二次会で連絡先を交換する', run: c => { if (c.chance(0.55)) { const n = meet(c, '同窓会で再会'); n.regionId = c.p.homeRegionId; return '帰りの電車で、もうメッセージが来ていた。'; } return '相手には家庭があった。懐かしい話だけをした。'; } },
      { label: '昔話だけして帰る', fx: { happy: 3 } },
      { label: '幹事を手伝い、みんなとつながる', fx: { stats: { soc: 3 } }, run: c => { const f = c.addNpc('friend', { birthYear: c.p.birthYear, regionId: c.p.homeRegionId }); return `${f.name}と、また連絡を取り合うようになった。`; } },
    ] },
  { id: 'love_dating_conflict', cat: 'love', title: 'すれ違い', cooldown: 3, when: c => !!c.partner, bind: c => c.partner,
    text: c => `{npc}は${c.npc!.value === 'freedom' ? '自由を大事にしたい' : c.npc!.value === 'family' ? '早く家庭を持ちたい' : '仕事でもっと上に行きたい'}と言う。最近、会う時間が減っている。`,
    choices: [
      { label: '時間を作って向き合う', fx: { stress: 3, feel: { affection: 10, trust: 8 } }, run: c => { c.flag('saw_' + c.npc!.id); } },
      { label: 'お互いの距離を尊重する', fx: { feel: { respect: 6, affection: -3 } } },
      { label: '別れを切り出す', run: c => { const n = c.npc!; n.role = 'ex'; c.p.partnerId = null; c.feel(n, { affection: -20 }); c.happy(-5); c.log(`${n.name}と別れた。`, true, 'love'); } },
    ] },
  { id: 'love_proposal', cat: 'love', title: 'プロポーズ', cooldown: 2, when: c => !!c.partner && c.partner.f.affection >= 50 && c.age >= 22, weight: c => 2 + c.partner!.f.affection / 30, bind: c => c.partner,
    text: '{npc}と付き合って何年か。ふとした沈黙の中で、これからのことを考えた。',
    choices: [
      { label: 'プロポーズする', run: c => { const n = c.npc!; if (n.f.affection + n.f.trust > 95 || c.chance(0.6)) { c.marry(n); c.cash(-Math.round(80 * c.w.priceLevel)); c.happy(10); c.feel(n, { affection: 10, trust: 10 }); c.flag('saw_' + n.id); return '「はい」と言われた。'; } c.feel(n, { affection: -5 }); return '「もう少し考えさせて」と言われた。'; } },
      { label: '式は挙げず、届けだけ出そうと提案', run: c => { const n = c.npc!; if (n.f.affection > 55) { c.marry(n); c.happy(7); return '二人だけで役所に行った。'; } c.feel(n, { disappointment: 10 }); return '少し寂しそうな顔をされた。'; } },
      { label: '結婚という形にこだわらない', fx: { feel: { respect: 3 } }, run: c => { if (c.npc!.value === 'family') { c.feel(c.npc, { disappointment: 20 }); c.later('love_ultimatum', 1, 3); } } },
    ] },
  { id: 'love_ultimatum', cat: 'love', title: 'これからのこと', scheduledOnly: true, when: c => !!c.partner, bind: c => c.partner,
    text: '{npc}が言った。「私、家族がほしいの。あなたとじゃないなら、もう前に進みたい」',
    choices: [
      { label: '結婚する', run: c => { c.marry(c.npc!); c.happy(6); } },
      { label: '別れる', run: c => { const n = c.npc!; n.role = 'ex'; c.p.partnerId = null; c.happy(-8); c.flag('regret_love'); c.log(`${n.name}と別れた。`, true, 'love'); } },
      { label: 'もう少しだけ待ってほしいと頼む', fx: { feel: { trust: -10, disappointment: 15 } }, run: c => { if (c.chance(0.5)) { const n = c.npc!; n.role = 'ex'; c.p.partnerId = null; return '{npc}は去っていった。'; } } },
    ] },
  { id: 'love_marriage_strain', cat: 'love', title: '冷えた食卓', cooldown: 4, when: c => !!c.spouse && (c.spouse.f.affection < 50 || c.p.stress > 60), bind: c => c.spouse, weight: c => 1 + (60 - c.spouse!.f.affection) / 20,
    text: '{npc}との会話が、事務連絡ばかりになっている。食卓には、スマホの光が二つ。',
    choices: [
      { label: '二人で旅行に行く', fx: { cash: -30, feel: { affection: 12, trust: 5 }, happy: 4 } },
      { label: '夫婦カウンセリングを提案する', fx: { cash: -15 }, run: c => { if (c.npc!.traits.stability > 40) { c.feel(c.npc, { affection: 15, trust: 10 }); return '少しずつ、言葉が戻ってきた。'; } c.feel(c.npc, { anger: 10 }); return '「そこまでの問題じゃない」と取り合ってもらえなかった。'; } },
      { label: '仕事を減らして家にいる時間を増やす', fx: { stress: -5, feel: { affection: 8 } }, run: c => { if (c.p.jobId) c.p.rank = Math.max(0, c.p.rank - (c.chance(0.3) ? 1 : 0)); } },
      { label: '今は耐える', fx: { feel: { affection: -5, disappointment: 8 } }, run: c => { if (c.npc!.f.affection < 30) c.later('love_divorce_talk', 1, 3); } },
    ] },
  { id: 'love_divorce_talk', cat: 'love', title: '離婚届', cooldown: 5, when: c => !!c.spouse && c.spouse.f.affection < 30, weight: 3, bind: c => c.spouse,
    text: 'テーブルの上に、記入済みの離婚届が置かれていた。{npc}の欄はもう埋まっている。',
    choices: [
      { label: '受け入れて判を押す', run: c => { const kids = c.children.length; c.divorce('すれ違いの末'); const settle = Math.round(Math.max(0, c.p.cash) * 0.4); c.cash(-settle); for (const k of c.children) c.feel(k, { disappointment: 15, affection: -5 }); c.happy(-8);
        c.echo({ key: 'divorce_kids', cause: `${c.p.name}の離婚`, effect: kids ? '子どもたちは、二つの家を行き来しながら大きくなった' : '別々の道で、それぞれの暮らしが始まった', target: 'family', delay: [4, 8], magnitude: 0 }); return `財産分与で${Math.round(settle)}万円を渡した。`; } },
      { label: '土下座してでも引き止める', run: c => { if (c.chance(0.35)) { c.feel(c.npc, { affection: 20 }); return '{npc}は届けを破った。もう一度だけ、と。'; } c.divorce('話し合いの末'); c.happy(-10); c.flag('regret_marriage'); } },
      { label: '子どもが成人するまで待ってほしいと頼む', req: c => c.children.some(k => c.npcAge(k) < 18), fx: { stress: 8, feel: { anger: 10 } }, run: c => { c.later('love_divorce_talk', 3, 6); } },
    ] },
  { id: 'love_affair_temptation', cat: 'love', title: '誘惑', cooldown: 10, when: c => !!c.spouse && c.spouse.f.affection < 55 && c.age < 60, weight: 0.5,
    text: '出張先で、昔の恋人に偶然会った。「一杯だけ、どう？」',
    choices: [
      { label: '一杯だけ付き合って帰る', fx: { happy: 2 }, run: c => { if (c.chance(0.15)) { c.feel(c.spouse, { trust: -10 }); return '後日、なぜか配偶者の耳に入っていた。'; } } },
      { label: 'はっきり断る', fx: { stats: { dis: 2 } }, run: c => { c.feel(c.spouse, { trust: 3 }); } },
      { label: '関係を持ってしまう', fx: { flag: 'regret_affair', happy: 3 }, run: c => { c.later('love_affair_found', 1, 4, c.spouse!.id); } },
    ] },
  { id: 'love_affair_found', cat: 'love', title: '見つかった嘘', scheduledOnly: true, when: c => !!c.spouse,
    text: c => `${c.spouse!.name}がスマホの画面を突きつけた。声は震えていない。それが一番怖かった。`,
    choices: [
      { label: 'すべて正直に話して謝る', run: c => { c.feel(c.spouse, { trust: -40, anger: 40 }); if (c.spouse!.traits.warmth > 60 && c.chance(0.5)) return '長い沈黙のあと、「次はない」と言われた。'; c.divorce('不貞'); c.cash(-Math.round(Math.max(0, c.p.cash) * 0.5)); c.rep(-5); } },
      { label: '言い訳をする', run: c => { c.feel(c.spouse, { trust: -50, anger: 50 }); c.divorce('不貞'); c.cash(-Math.round(Math.max(0, c.p.cash) * 0.5)); c.rep(-8); } },
      { label: '家を出る', run: c => { c.divorce('別居の末'); c.cash(-Math.round(Math.max(0, c.p.cash) * 0.3)); c.happy(-10); } },
    ] },
  { id: 'love_remarry', cat: 'love', title: 'ふたたびの春', cooldown: 6, when: c => single(c) && (c.has('divorced') || c.has('widowed')) && c.age >= 35 && c.age < 75,
    text: '散歩道のベンチで、いつも同じ時間に会う人がいる。今日は向こうから話しかけてきた。',
    choices: [
      { label: 'お茶に誘う', run: c => { const n = meet(c, '散歩道で出会う'); n.birthYear = c.p.birthYear + c.rng.int(-5, 5); return `${n.name}と、ゆっくり歩く時間が増えた。`; } },
      { label: '一人の時間を大切にしたい', fx: { happy: 2, stats: { cre: 2 } } },
      { label: '子どもの意見を聞いてみる', req: c => c.children.length > 0, run: c => { const k = c.children[0]; if (k.f.affection > 55) { meet(c, '子どもに背中を押されて'); return '「お父さん/お母さんが幸せならいい」と言われた。'; } c.feel(k, { anger: 5 }); return '複雑な顔をされた。'; } },
    ] },
  { id: 'love_spouse_dream', cat: 'love', title: '配偶者の夢', cooldown: 10, when: c => !!c.spouse && c.spouse.goalProgress > 40 && c.spouse.goalProgress < 100, bind: c => c.spouse,
    text: c => `{npc}が切り出した。「ずっと言えなかったけど、${{ own_shop: '自分の店を持ちたい', move_city: '都会で挑戦したい', raise_family: 'もう一人子どもがほしい', master_craft: '職人の修業がしたい', travel: '一年、世界を旅したい', write_book: '本を書くために仕事を辞めたい', save_town: '地元の町おこしをしたい', get_rich: '起業したい', care_parents: '実家の親の近くに住みたい', research: '大学院に行き直したい' }[c.npc!.goal]}」`,
    choices: [
      { label: '全力で応援する', fx: { cash: -60, feel: { affection: 15, trust: 15, respect: 10 } }, run: c => { c.npc!.goalProgress = 100; c.npc!.jobId = null; c.note(c.npc, '夢をかなえた'); c.echo({ key: 'spouse_dream', cause: `${c.p.name}が配偶者の夢を支えた`, effect: `${c.npc!.name}は「あなたがいたからできた」と周囲に話している`, target: 'family', delay: [2, 5], npcId: c.npc!.id, magnitude: 1 }); } },
      { label: '家計が落ち着くまで待ってほしい', fx: { feel: { disappointment: 12 } }, run: c => { c.npc!.goalProgress += 10; } },
      { label: '反対する', fx: { feel: { anger: 20, affection: -12 } } },
    ] },
];
