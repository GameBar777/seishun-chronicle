import type { EventDef } from '../../engine/eventTypes';
import { GOALS } from '../people';
export const social: EventDef[] = [
  { id: 'social_new_friend', cat: 'social', title: '新しい友人', cooldown: 3, when: c => c.friends.length < 5,
    text: c => `${c.region.name}の${c.chance(0.5) ? '銭湯' : '古本屋'}で、同じ本を手に取った人がいた。`,
    choices: [
      { label: '声をかける', fx: { stats: { soc: 2 } }, run: c => { const n = c.addNpc('friend', { birthYear: c.p.birthYear + c.rng.int(-6, 6) }); c.note(n, '偶然の出会い'); return `${n.name}と友達になった。`; } },
      { label: '会釈だけする', fx: { happy: 1 } },
      { label: 'その本を譲る', fx: { rep: 1, happy: 2 }, run: c => { const n = c.addNpc('friend', { birthYear: c.p.birthYear + c.rng.int(-10, 10), f: { trust: 50, affection: 45, anger: 0, respect: 55, disappointment: 0 } }); return `${n.name}が後日お礼の連絡をくれた。`; } },
    ] },
  { id: 'social_npc_goal', cat: 'social', title: '誰かの夢', scheduledOnly: true, when: () => true,
    text: c => `{npc}から知らせが来た。「${GOALS[c.npc!.goal] ?? '夢'}、ついに叶ったよ」`,
    choices: [
      { label: '駆けつけて祝う', fx: { cash: -10, happy: 5, feel: { affection: 12, trust: 6 } }, run: c => { c.news(`${c.npc!.name}さんの挑戦が地元紙で紹介された。`, 'people'); } },
      { label: 'お祝いのメッセージを送る', fx: { happy: 2, feel: { affection: 4 } } },
      { label: '少し嫉妬してしまう', fx: { happy: -3, stress: 3, stats: { dis: 1 } }, run: c => { c.flag('envy'); } },
    ] },
  { id: 'social_betrayal', cat: 'social', title: '裏切り', cooldown: 10, when: c => c.friends.some(f => f.f.trust > 40), weight: 0.6, bind: c => c.rng.pick(c.friends),
    text: '{npc}があなたの悪口を言いふらしていたと、別の知人から聞いた。',
    choices: [
      { label: '直接問いただす', run: c => { if (c.npc!.traits.warmth > 50) { c.feel(c.npc, { trust: 5, affection: 5 }); return '誤解だった。むしろ、あなたをかばっていたらしい。'; } c.feel(c.npc, { anger: 30, trust: -30 }); c.npc!.role = 'stranger'; return '口論になり、それきりになった。'; } },
      { label: '黙って距離を置く', fx: { feel: { trust: -20, affection: -15 } } },
      { label: '気にしない', fx: { stress: 2 } },
    ] },
  { id: 'social_prodigal', cat: 'social', title: '戻ってきた人', scheduledOnly: true, when: c => !!c.npc,
    text: '何年も音信不通だった{npc}が、玄関先に立っていた。手には封筒。',
    choices: [
      { label: '家に上げて話を聞く', fx: { cash: 100, happy: 8 }, run: c => { c.npc!.role = 'friend'; c.feel(c.npc, { trust: 40, affection: 20 }); } },
      { label: '封筒だけ受け取る', fx: { cash: 100 } },
      { label: '封筒は受け取らず、「もういいよ」と返す', hint: 'お金より、関係を選ぶ', fx: { happy: 10, rep: 2 }, run: c => { c.npc!.role = 'friend'; c.feel(c.npc, { trust: 50, affection: 30, respect: 20 }); c.flag('forgave'); } },
    ] },
  { id: 'social_volunteer', cat: 'social', title: '地域の手', cooldown: 6, when: c => c.age >= 25,
    text: c => `${c.region.name}の自治会が、子どもの学習支援のボランティアを募集している。`,
    choices: [
      { label: '参加する', fx: { rep: 4, happy: 3, stats: { soc: 2 } }, run: c => { c.flag('volunteer'); c.echo({ key: 'tutored_kid', cause: `${c.p.name}が学習支援をした`, effect: 'あのとき勉強を見てもらった子が、医師になって町に戻ってきた', target: 'town', delay: [10, 18], magnitude: 2 }); } },
      { label: '寄付だけする', fx: { cash: -10, rep: 1 } },
      { label: '忙しいので断る', fx: {} },
    ] },
  { id: 'social_rival', cat: 'social', title: 'ライバル', cooldown: 8, when: c => c.employed && c.age < 50,
    text: '同期が先に昇進した。祝う言葉が、少し喉に引っかかる。',
    choices: [
      { label: '素直に祝い、教えを請う', fx: { stats: { soc: 2 }, happy: 1 }, run: c => { c.addNpc('friend', { birthYear: c.p.birthYear, jobId: c.p.jobId }); } },
      { label: '見返してやると燃える', fx: { stats: { dis: 3 }, stress: 5 }, run: c => { c.addNpc('stranger', { birthYear: c.p.birthYear, jobId: c.p.jobId }); } },
      { label: '転職を考え始める', fx: { flag: 'restless' } },
    ] },
  { id: 'social_neighbor', cat: 'social', title: '隣人トラブル', cooldown: 10, when: c => c.age >= 22,
    text: '隣の家の騒音が、毎晩続く。',
    choices: [
      { label: '菓子折りを持って話しに行く', fx: { cash: -1, stats: { soc: 1 } }, run: c => { if (c.chance(0.7)) { c.addNpc('friend', { birthYear: c.p.birthYear + c.rng.int(-20, 20) }); return '話してみると、いい人だった。'; } c.stress(4); return '改善しなかった。'; } },
      { label: '管理会社に通報する', fx: { stress: -2 } },
      { label: '引っ越す', req: c => !c.p.house, fx: { cash: -30, stress: -6 } },
    ] },
  { id: 'social_old_friend_dies', cat: 'social', title: '友の訃報', cooldown: 4, when: c => c.age >= 60 && c.friends.length > 0, bind: c => c.rng.pick(c.friends),
    text: '{npc}の訃報が届いた。最後に会ったのは、いつだったろう。',
    choices: [
      { label: '葬儀で弔辞を読む', fx: { happy: -4, rep: 2 }, run: c => { c.killNpc(c.npc!, '病気'); } },
      { label: '思い出の場所を一人で訪ねる', fx: { happy: -3, stats: { cre: 1 } }, run: c => { c.killNpc(c.npc!, '病気'); } },
      { label: '残された家族を支える', fx: { cash: -20, rep: 3 }, run: c => { c.killNpc(c.npc!, '病気'); c.flag('kept_promise'); } },
    ] },
];
