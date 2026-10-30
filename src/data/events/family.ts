import type { EventDef } from '../../engine/eventTypes';
import type { Ctx } from '../../engine/ctx';
import { money } from '../../engine/ctx';
const kid = (c: Ctx, min: number, max: number) => c.children.filter(k => k.alive && c.npcAge(k) >= min && c.npcAge(k) <= max);
const sickParent = (c: Ctx) => c.parents.find(p => p.alive && c.npcAge(p) >= 70 && p.health < 55);
export const family: EventDef[] = [
  { id: 'family_baby_talk', cat: 'family', title: '家族を増やす？', cooldown: 3, when: c => !!c.spouse && c.age < 45 && c.children.length < 4, weight: c => (c.children.length === 0 ? 2.5 : 1.2) * (c.spouse!.goal === 'raise_family' ? 1.5 : 1), bind: c => c.spouse,
    text: c => c.children.length === 0 ? '{npc}が言った。「そろそろ、子どものこと考えない？」' : '{npc}が言った。「もう一人、どうかな」',
    choices: [
      { label: '子どもを迎える', run: c => { if (c.age > 40 && c.chance(0.4)) { c.cash(-60); c.later('family_baby_talk', 1, 2); return '不妊治療を始めた。結果はまだ出ない。'; } const k = c.haveChild(); c.happy(8); c.feel(c.npc, { affection: 10 }); c.npc!.goalProgress += 20; return `${k.name.split(' ')[1]}が生まれた。小さな手が、指を握り返した。`; } },
      { label: 'お金が貯まるまで待とう', fx: { feel: { disappointment: 8 } } },
      { label: '子どもを持たない人生を選ぶ', req: c => c.children.length === 0, fx: { feel: { disappointment: 15 }, flag: 'childfree' } },
      { label: '養子縁組を検討する', req: c => c.age >= 35, fx: { cash: -50 }, run: c => { const k = c.haveChild(); k.birthYear = c.year - c.rng.int(2, 6); c.note(k, '養子として迎えた'); c.happy(6); return `${k.name.split(' ')[1]}が家族になった。`; } },
    ] },
  { id: 'family_night_crying', cat: 'family', title: '夜泣き', cooldown: 4, when: c => kid(c, 0, 1).length > 0,
    text: '三日連続で、ほとんど眠れていない。泣き声と、自分の心臓の音しか聞こえない夜。',
    choices: [
      { label: '育休を取る', req: c => c.employed, fx: { stress: -8, happy: 4 }, run: c => { c.feel(c.spouse, { affection: 10, respect: 10 }); c.p.jobYears = Math.max(0, c.p.jobYears - 1); } },
      { label: '親に手伝いを頼む', req: c => c.parents.some(p => p.alive), fx: { stress: -5 }, run: c => { c.feel(c.parents[0], { affection: 8 }); } },
      { label: '配偶者に任せて仕事に集中', fx: { stats: { dis: 2 }, feel: { anger: 10, affection: -8 } }, run: c => { c.feel(c.spouse, { anger: 12 }); } },
      { label: 'ベビーシッターを雇う', fx: { cash: -40, stress: -6 } },
    ] },
  { id: 'family_school_choice', cat: 'family', title: '子どもの進路', cooldown: 4, when: c => kid(c, 11, 12).length > 0, bind: c => kid(c, 11, 12)[0],
    text: c => `${c.npc!.name.split(' ')[1]}の中学受験をどうするか。塾の費用は年${money(60 * c.w.priceLevel)}ほど。`,
    choices: [
      { label: '塾に通わせて受験させる', fx: { cash: -120, feel: { respect: 5 } }, run: c => { c.npc!.eduPts! += 25; c.feel(c.npc, { anger: c.npc!.traits.ambition < 40 ? 15 : 0 }); } },
      { label: '本人に決めさせる', fx: { feel: { trust: 10, respect: 8 } }, run: c => { c.npc!.eduPts! += c.npc!.traits.ambition > 50 ? 15 : 5; } },
      { label: '公立でのびのび育てる', fx: { feel: { affection: 5 } }, run: c => { c.npc!.eduPts! += 5; c.npc!.stats!.cre += 5; } },
    ] },
  { id: 'family_teen_rebellion', cat: 'family', title: '反抗期', cooldown: 3, when: c => kid(c, 13, 17).length > 0, bind: c => c.rng.pick(kid(c, 13, 17)),
    text: c => `${c.npc!.name.split(' ')[1]}が部屋のドアを乱暴に閉めた。「どうせわかんないでしょ」`,
    choices: [
      { label: '時間を置いて、話を聞く', fx: { feel: { trust: 12, affection: 5 } }, run: c => { c.flag('saw_' + c.npc!.id); } },
      { label: '厳しく叱る', fx: { feel: { anger: 15, respect: 3 } }, run: c => { c.npc!.eduPts! += 5; } },
      { label: '好きにさせる', fx: { feel: { affection: 3, disappointment: 5 } }, run: c => { c.npc!.stats!.cre += 4; c.npc!.eduPts! -= 3; } },
      { label: '一緒に旅に出る', fx: { cash: -30, feel: { affection: 15, trust: 8 } }, run: c => { c.flag('saw_' + c.npc!.id); } },
    ] },
  { id: 'family_child_dream', cat: 'family', title: '子どもの夢', cooldown: 6, when: c => kid(c, 16, 22).length > 0, bind: c => c.rng.pick(kid(c, 16, 22)),
    text: c => `${c.npc!.name.split(' ')[1]}が言う。「${c.npc!.traits.ambition > 60 ? '海外の大学に行きたい' : c.npc!.stats!.cre > 55 ? '音楽で食べていきたい' : '早く働いて自立したい'}」`,
    choices: [
      { label: '貯金を崩して全面的に支援する', fx: { cash: -200, feel: { affection: 15, trust: 15 } }, run: c => { c.npc!.eduPts! += 30; c.npc!.goalProgress += 30; c.echo({ key: 'child_supported', cause: `${c.p.name}が子の夢を支えた`, effect: `${c.npc!.name}は自分の道で成功し、親への感謝を口にした`, target: 'family', delay: [6, 12], npcId: c.npc!.id, magnitude: 2 }); } },
      { label: '奨学金を探すよう勧める', fx: { feel: { respect: 8 } }, run: c => { c.npc!.eduPts! += 15; } },
      { label: '「現実を見なさい」と止める', fx: { feel: { anger: 20, disappointment: 20 } }, run: c => { c.echo({ key: 'child_drift', cause: `${c.p.name}が子の夢に反対した`, effect: `${c.npc!.name}は家を出て、ほとんど連絡をよこさなくなった`, target: 'family', delay: [3, 8], npcId: c.npc!.id, magnitude: -1 }); } },
    ] },
  { id: 'family_child_wedding', cat: 'family', title: '子の結婚', cooldown: 5, when: c => kid(c, 25, 40).some(k => !k.notes.some(n => n.includes('結婚'))), bind: c => kid(c, 25, 40).find(k => !k.notes.some(n => n.includes('結婚'))),
    text: c => `${c.npc!.name.split(' ')[1]}が、恋人を連れて家に来た。`,
    choices: [
      { label: '心から祝福し、式の費用を援助する', fx: { cash: -100, happy: 8, feel: { affection: 15 } }, run: c => { c.note(c.npc, '結婚'); } },
      { label: '祝福する（援助はしない）', fx: { happy: 5, feel: { affection: 5 } }, run: c => { c.note(c.npc, '結婚'); } },
      { label: '相手に不満を言う', fx: { feel: { anger: 25, affection: -15 } }, run: c => { c.note(c.npc, '結婚（親は反対）'); } },
    ] },
  { id: 'family_grandchild', cat: 'family', title: '孫', cooldown: 6, max: 3, when: c => c.children.some(k => k.notes.some(n => n.includes('結婚')) && c.npcAge(k) < 45),
    text: '電話の向こうで、子どもが少し照れくさそうに言った。「生まれたよ」',
    choices: [
      { label: 'すぐに会いに行く', fx: { cash: -10, happy: 10 }, run: c => { c.flag('grandparent'); c.s.flags['grandchildren'] = (c.s.flags['grandchildren'] ?? 0) + 1; } },
      { label: 'お祝い金を送る', fx: { cash: -30, happy: 6 }, run: c => { c.flag('grandparent'); c.s.flags['grandchildren'] = (c.s.flags['grandchildren'] ?? 0) + 1; } },
      { label: '子育てを手伝うと申し出る', hint: '時間と体力を使うが、絆が深まる', fx: { stress: 6, happy: 8, health: -2 }, run: c => { c.flag('grandparent'); c.s.flags['grandchildren'] = (c.s.flags['grandchildren'] ?? 0) + 1; for (const k of c.children) c.feel(k, { affection: 8, trust: 5 }); } },
    ] },
  { id: 'family_parent_illness', cat: 'family', title: '親の入院', cooldown: 4, when: c => !!sickParent(c), weight: 3, bind: c => sickParent(c),
    text: c => `${c.region.id === c.npc!.regionId ? '' : '実家から電話。'}{npc}が倒れて入院した。退院後は一人での生活が難しいと医師は言う。`,
    choices: [
      { label: '同居して自分で介護する', fx: { stress: 15, happy: -3, feel: { affection: 15, trust: 15 } }, run: c => { c.flag('cared_parent'); c.move(c.npc!.regionId); if (c.employed && c.chance(0.3)) { c.loseJob('介護離職'); return '仕事を続けられなくなった。'; } c.p.stress += 0; } },
      { label: '施設に入ってもらう（費用を負担）', fx: { cash: -150, feel: { disappointment: 8 } }, run: c => { c.flag('cared_parent'); } },
      { label: 'きょうだいに任せる', req: c => c.by('sibling').length > 0, run: c => { for (const s of c.by('sibling')) c.feel(s, { anger: 25, trust: -15 }); c.flag('regret_care'); } },
      { label: '週末ごとに通う', fx: { stress: 8, cash: -30, feel: { affection: 8 } }, run: c => { c.flag('cared_parent'); } },
    ] },
  { id: 'family_parent_funeral', cat: 'family', title: '親を送る', cooldown: 1, when: c => c.parents.some(p => p.alive && (c.npcAge(p) > 92 || p.health < 15)), weight: 8, bind: c => c.parents.find(p => p.alive && (c.npcAge(p) > 92 || p.health < 15)),
    text: c => `{npc}が静かに息を引き取った。${c.npcAge(c.npc!)}歳だった。${c.has('cared_parent') ? '最期まで、そばにいられた。' : ''}`,
    choices: [
      { label: '盛大に葬儀を出す', fx: { cash: -150, rep: 3 }, run: c => { c.killNpc(c.npc!, '老衰'); c.happy(-6); c.later('money_inheritance_parent', 0, 1, c.npc!.id); } },
      { label: '家族だけで静かに見送る', fx: { cash: -50 }, run: c => { c.killNpc(c.npc!, '老衰'); c.happy(-6); c.later('money_inheritance_parent', 0, 1, c.npc!.id); } },
      { label: '遺品を整理しながら手紙を読む', fx: { cash: -60, stats: { cre: 2 } }, run: c => { c.killNpc(c.npc!, '老衰'); c.happy(-4); c.flag('parent_letter'); c.later('money_inheritance_parent', 0, 1, c.npc!.id); return '「あなたの人生を生きなさい」と書いてあった。'; } },
    ] },
  { id: 'family_widowed', cat: 'family', title: '伴侶との別れ', cooldown: 1, when: c => !!c.spouse && (c.spouse.health < 12 || c.npcAge(c.spouse) > 95), weight: 10, bind: c => c.spouse,
    text: c => `{npc}の手が、少しずつ冷たくなっていく。${c.year - (c.s.log.find(l => l.text.includes(c.npc!.name + 'と結婚'))?.year ?? c.year)}年間、ありがとう。`,
    choices: [
      { label: '最期の言葉をかける', run: c => { c.killNpc(c.npc!, '病気'); c.happy(-15); c.flag('last_words'); } },
      { label: '黙って手を握り続ける', run: c => { c.killNpc(c.npc!, '病気'); c.happy(-15); } },
      { label: '子どもたちを呼び寄せる', run: c => { c.killNpc(c.npc!, '病気'); c.happy(-12); for (const k of c.children) c.feel(k, { affection: 10, trust: 5 }); } },
    ] },
  { id: 'family_sibling_feud', cat: 'family', title: 'きょうだいの確執', cooldown: 8, when: c => c.by('sibling').length > 0, bind: c => c.rng.pick(c.by('sibling')),
    text: '{npc}から久々に連絡。「お金のことで、ちょっと相談がある」',
    choices: [
      { label: '話を聞いて援助する', fx: { cash: -60, feel: { affection: 15, trust: 10 } } },
      { label: '家計を理由に断る', fx: { feel: { disappointment: 15 } } },
      { label: '昔の恨みを持ち出す', fx: { feel: { anger: 30, affection: -20 }, stress: -2 } },
    ] },
  { id: 'family_child_struggle', cat: 'family', title: '子どもからの電話', cooldown: 5, when: c => c.children.some(k => c.npcAge(k) >= 22 && !k.jobId), bind: c => c.children.find(k => c.npcAge(k) >= 22 && !k.jobId),
    text: c => `${c.npc!.name.split(' ')[1]}が、仕事を辞めて実家に戻りたいと言っている。`,
    choices: [
      { label: '戻っておいで、と言う', fx: { cash: -40, feel: { affection: 12, trust: 10 } }, run: c => { c.npc!.regionId = c.p.regionId; } },
      { label: '自分で何とかしなさいと突き放す', fx: { feel: { anger: 12, respect: 5 } }, run: c => { if (c.chance(0.5)) c.npc!.jobId = 'office'; } },
      { label: 'うちの仕事を手伝わせる', req: c => !!c.p.business, fx: { feel: { affection: 8 } }, run: c => { c.npc!.jobId = 'founder'; c.note(c.npc, '家業に入った'); c.flag('heir_in_biz'); } },
    ] },
  { id: 'family_reunion', cat: 'family', title: '正月の食卓', cooldown: 4, when: c => c.age >= 55 && c.children.length > 0,
    text: '正月、久しぶりに家族全員がそろった。テーブルの端まで料理が並ぶ。',
    choices: [
      { label: '昔話をする', fx: { happy: 6 }, run: c => { for (const k of c.children) c.feel(k, { affection: 4 }); } },
      { label: 'これからのこと（遺言・家）を話す', fx: { stress: 3 }, run: c => { c.flag('will_written'); for (const k of c.children) c.feel(k, { trust: 6 }); } },
      { label: '仕事の電話で席を外す', fx: { stats: { dis: 1 } }, run: c => { for (const k of c.children) c.feel(k, { disappointment: 6 }); } },
    ] },
];
