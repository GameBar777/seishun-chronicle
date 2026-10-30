import type { EventDef, ChoiceDef } from '../../engine/eventTypes';
import type { Ctx } from '../../engine/ctx';
import { jobById, JOBS } from '../jobs';
import { money } from '../../engine/ctx';

const offer = (i: number): ChoiceDef => ({
  label: c => { const j = jobById(c.data.offers[i])!; return `${j.name}の内定を受ける`; },
  hint: c => { const j = jobById(c.data.offers[i])!; return `年収目安 ${money(j.base * c.w.priceLevel)}・ストレス${'●'.repeat(Math.ceil(j.stress / 2))}${j.automation > 0.6 && c.w.tech > 30 ? '・自動化の影響大' : ''}`; },
  req: c => !!c.data.offers?.[i], run: c => { c.setJob(c.data.offers[i]); c.s.flags['last_job_id'] = 0; },
});
const unemployed = (c: Ctx) => !c.p.jobId && !c.p.business && !c.p.studying && !c.p.retired && c.age < 65;
const bossOf = (c: Ctx) => c.pickBy('boss');

export const career: EventDef[] = [
  { id: 'career_job_hunt', cat: 'career', title: '仕事探し', cooldown: 1, weight: c => (unemployed(c) ? 8 : 0), when: c => !c.p.studying && !c.p.retired && c.age < 66,
    prepare: c => { const av = c.availableJobs(); const offers: string[] = []; const slots = Math.max(1, Math.min(4, Math.round(4 - c.w.unemployment / 3 + c.p.stats.soc / 50)));
      while (offers.length < slots && av.length) { const j = c.rng.weighted(av, id => { const d = jobById(id)!; return 1 + (d.techMin ? 1.5 : 0) + (c.region.industries.includes(d.industry) ? 1.5 : 0); })!; offers.push(j); av.splice(av.indexOf(j), 1); }
      return { offers }; },
    text: c => `求人サイトと職安を回った。${c.slump ? '不況で求人は少ない。' : c.boom ? '景気がよく、声をかけてくる会社も多い。' : ''}手元に届いた返事は${c.data.offers.length}通。`,
    choices: [offer(0), offer(1), offer(2), offer(3), { label: '単発の仕事でつなぎながら探し続ける', hint: '収入は低いが自由', run: c => { if (!c.p.jobId) c.setJob('gig'); } }] },
  { id: 'career_first_day', cat: 'career', title: '最初の一年', when: c => !!c.p.jobId && c.p.jobYears <= 1 && c.p.jobId !== 'gig', cooldown: 3, max: 4, bind: c => bossOf(c),
    text: c => `新しい職場。上司の{npc}は${c.npc!.traits.warmth > 55 ? '面倒見がいいと評判だ' : '口数が少なく、何を考えているかわからない'}。最初の一年をどう過ごす？`,
    choices: [
      { label: '誰よりも早く来て遅く帰る', fx: { stats: { dis: 4 }, stress: 8, feel: { respect: 10 } } },
      { label: '同僚と打ち解けることを優先する', fx: { stats: { soc: 4 }, happy: 3 }, run: c => { const w = c.addNpc('coworker', { birthYear: c.p.birthYear + c.rng.int(-4, 4), jobId: c.p.jobId }); c.feel(w, { trust: 15, affection: 10 }); return `同期の${w.name}と飲みに行くようになった。`; } },
      { label: '定時で帰り、自分の時間を守る', fx: { happy: 4, stress: -3, feel: { respect: -5 } } },
    ] },
  { id: 'career_overtime', cat: 'career', title: '終わらない仕事', cooldown: 4, when: c => !!c.job && c.job.stress >= 5 && c.age < 60, weight: c => 1 + c.p.stress / 50, bind: bossOf,
    text: '繁忙期。{npc}が「今月は全員、土日も頼む」と言った。体は正直に疲れている。',
    choices: [
      { label: '引き受けて結果を出す', fx: { cash: 30, stress: 12, health: -4, feel: { respect: 8, trust: 5 } }, run: c => { if (c.spouse) c.feel(c.spouse, { affection: -4 }); } },
      { label: '週末だけは断る', fx: { stress: 3, feel: { respect: -3 } } },
      { label: '同僚と分担を提案する', fx: { stats: { soc: 2 }, stress: 5, feel: { respect: 4 } } },
      { label: '体調を理由に休む', fx: { health: 4, feel: { trust: -8 } }, run: c => { if (c.chance(0.2)) { c.flag('marked_slacker'); return '上司の目が少し冷たくなった気がする。'; } } },
    ] },
  { id: 'career_promotion_offer', cat: 'career', title: '昇進の打診', cooldown: 6, when: c => !!c.p.jobId && c.p.jobYears >= 4 && c.p.rank < 4 && !c.has('marked_slacker'), weight: 1.2,
    text: c => `人事から呼ばれた。「${c.job!.ranks[c.p.rank + 1]}をやってみないか。ただし、${c.region.name}から離れた支社だ」`,
    choices: [
      { label: '転勤を受け入れて昇進する', hint: '引っ越し・家族への影響あり', run: c => { c.p.rank++; const to = c.rng.pick(['seiran', 'akagane', 'shiratori', 'minatobe'].filter(r => r !== c.p.regionId)); c.move(to); c.happy(2); if (c.spouse) { c.feel(c.spouse, { anger: 10, affection: -5 }); if (c.spouse.jobId) { c.spouse.jobId = null; c.note(c.spouse, '転勤で仕事を辞めた'); } } for (const k of c.children) c.feel(k, { disappointment: 6 }); return '新しい町での暮らしが始まった。'; } },
      { label: '地元に残れるなら、と条件をつける', fx: { stats: { soc: 2 } }, run: c => { if (c.chance(0.45)) { c.p.rank++; return '意外にも条件が通った。'; } return '話は流れた。'; } },
      { label: '断って今のままでいる', fx: { stress: -4, happy: 1 }, run: c => { c.flag('declined_promo'); } },
    ] },
  { id: 'career_layoff', cat: 'career', title: '希望退職の募集', cooldown: 6, when: c => !!c.p.jobId && c.p.jobId !== 'gig' && (c.slump || (c.job!.automation > 0.5 && c.w.tech > 40)), weight: c => (c.w.phase === 'crisis' ? 3 : 1.2) * (0.5 + c.job!.automation),
    text: c => `${c.slump ? '業績悪化' : '業務の自動化'}を理由に、会社が希望退職を募り始めた。応じれば退職金が上乗せされる。残っても安泰とは限らない。`,
    choices: [
      { label: '退職金を受け取って辞める', run: c => { const pay = Math.round(c.salary() * (0.5 + c.p.jobYears * 0.08)); c.cash(pay); c.loseJob('希望退職'); return `${money(pay)}の退職金を受け取った。`; } },
      { label: 'しがみついて残る', run: c => { if (c.chance(c.w.phase === 'crisis' ? 0.45 : 0.25)) { c.loseJob('整理解雇'); c.cash(Math.round(c.salary() * 0.3)); c.flag('regret_stayed'); return '結局、半年後に解雇された。'; } c.stress(8); return '残った。職場の空気は重い。'; } },
      { label: '残りつつ副業を始める', fx: { stress: 6, stats: { cre: 3 } }, run: c => { c.flag('side_hustle'); } },
    ] },
  { id: 'career_fired_scandal', cat: 'career', title: '上司の不正', once: true, when: c => !!c.p.jobId && c.p.jobYears >= 2 && c.age < 60, weight: 0.6, bind: bossOf,
    text: '帳簿の数字が合わない。調べるほど、{npc}が取引先から金を受け取っている証拠が出てくる。',
    choices: [
      { label: '社内の通報窓口に告発する', fx: { rep: 8, stress: 10, feel: { anger: 50, trust: -40 } }, run: c => { if (c.chance(0.4)) { c.loseJob('告発後の配置換えに耐えられず'); c.echo({ key: 'whistle_reform', cause: `${c.p.name}の内部告発`, effect: `会社の不正が明るみに出て、業界のルールが改められた`, target: 'world', delay: [2, 4], magnitude: 2 }); return '告発は受理されたが、居場所はなくなった。'; } c.echo({ key: 'whistle_reform', cause: `${c.p.name}の内部告発`, effect: '会社の不正が明るみに出て、業界のルールが改められた', target: 'world', delay: [2, 4], magnitude: 2 }); return '調査が始まり、{npc}は処分された。'; } },
      { label: '直接{npc}に問いただす', fx: { stress: 6 }, run: c => { if (c.npc!.traits.warmth > 55) { c.feel(c.npc, { respect: 10 }); c.rep(3); return '{npc}は青ざめて、返金すると約束した。'; } c.feel(c.npc, { anger: 30 }); c.flag('boss_enemy'); return '「君の将来のためにも、忘れたほうがいい」と言われた。'; } },
      { label: '見なかったことにする', fx: { stress: 4, flag: 'regret_silence' }, run: c => { c.later('career_scandal_return', 3, 6); } },
    ] },
  { id: 'career_scandal_return', cat: 'career', title: 'あの帳簿', scheduledOnly: true, when: c => !!c.p.jobId,
    text: '数年前に見て見ぬふりをした不正が、新聞に載った。記者が「当時、気づいていた社員がいたはずだ」と取材に回っている。',
    choices: [
      { label: '記者に当時のことを話す', fx: { rep: 5, stress: 8 }, run: c => { c.rep(3); c.unflag('regret_silence'); return '胸のつかえが少しとれた。'; } },
      { label: '口を閉ざす', fx: { stress: 5, rep: -3 } },
      { label: '会社を辞めて距離を置く', run: c => { c.loseJob('不祥事の余波'); } },
    ] },
  { id: 'career_headhunt', cat: 'career', title: '引き抜きの電話', cooldown: 5, when: c => !!c.p.jobId && c.p.rank >= 1 && c.age < 58 && (c.p.rep > 5 || c.boom),
    text: c => `知らない番号から電話。「${c.job!.name}として、今の1.3倍の年収でお迎えしたい」。ただし新興企業で、先行きは読めない。`,
    choices: [
      { label: '転職する', hint: '年収↑・倒産リスクあり', run: c => { c.p.rank = Math.min(4, c.p.rank + 1); c.p.jobYears = 2; c.stress(5); c.flag('jumped_ship'); if (c.chance(c.slump ? 0.4 : 0.15)) c.later('career_startup_collapse', 1, 3); return '新しい名刺を受け取った。'; } },
      { label: '今の会社と条件交渉する', fx: { stats: { soc: 2 } }, run: c => { if (c.chance(0.5)) { c.p.rank = Math.min(4, c.p.rank + 1); return '慰留され、昇格が決まった。'; } return '「そうか、残念だ」とだけ言われた。'; } },
      { label: '断る', fx: { stress: -2 } },
    ] },
  { id: 'career_startup_collapse', cat: 'career', title: '会社が傾く', scheduledOnly: true, when: c => !!c.p.jobId,
    text: '移った会社の資金が尽きた。給与の振込が遅れ始めている。',
    choices: [
      { label: '最後まで残って立て直しに賭ける', fx: { stress: 12 }, run: c => { if (c.chance(0.35)) { c.p.rank = Math.min(4, c.p.rank + 1); c.rep(6); return '奇跡的に持ち直した。あなたは功労者だ。'; } c.loseJob('倒産'); return '倒産した。'; } },
      { label: 'すぐに次の職を探す', run: c => { c.loseJob('倒産前に退職'); c.s.queue.unshift({ id: 'career_job_hunt' }); } },
      { label: '仲間を連れて独立する', req: c => c.p.cash > 100, run: c => { c.startBusiness(`${c.p.name.split(' ')[0]}ラボ`, Math.min(c.p.cash, 300)); c.cash(-Math.min(c.p.cash, 300)); } },
    ] },
  { id: 'career_startup_idea', cat: 'career', title: '起業の誘惑', cooldown: 8, when: c => !c.p.business && c.age >= 24 && c.age < 58 && (c.p.stats.cre + c.p.stats.soc > 90 || c.has('club_startup') || c.has('side_hustle')),
    text: c => `ずっと温めてきたアイデアがある。${c.region.name}には、まだ誰もやっていない商売だ。手元の資金は${money(c.p.cash)}。`,
    choices: [
      { label: '貯金をはたいて起業する', req: c => c.p.cash >= 80, run: c => { const cap = Math.round(c.p.cash * 0.8); c.cash(-cap); c.startBusiness(c.rng.pick(['あおば工房', 'ひだまり食堂', 'みなもデザイン', 'こだま配送', 'ゆいまーる介護', 'あかり書房']), cap); c.flag('dream_pursued'); bizEcho(c); } },
      { label: '借金をして大きく始める', hint: '成功すれば大きいが、失敗すれば重い借金', run: c => { c.loan(500, 0.04); c.cash(-500); c.startBusiness(c.rng.pick(['星嵐ロジテック', 'ネクストハーバー', 'ミライ農園', 'シンクス']), 500); c.p.business!.profitRate += 0.03; c.flag('dream_pursued'); bizEcho(c); } },
      { label: '副業として小さく試す', fx: { stats: { cre: 3 }, stress: 4, flag: 'side_hustle' }, run: c => { const r = c.chance(0.5) ? 40 : -15; c.cash(r); return r > 0 ? '小さく黒字になった。' : '少し赤字。でも学びは多い。'; } },
      { label: '夢は夢のままにしておく', fx: { flag: 'regret_no_startup' } },
    ] },
  { id: 'career_biz_crisis', cat: 'career', title: '資金繰り', cooldown: 4, when: c => !!c.p.business && (c.slump || c.p.cash < 30), weight: 2,
    text: c => `${c.p.business!.name}の通帳残高が、来月の給料に足りない。従業員は${c.p.business!.employees}人。`,
    choices: [
      { label: '銀行から追加融資を受ける', run: c => { c.loan(200, 0.035); return '200万円の融資が下りた。'; } },
      { label: '従業員を減らす', fx: { rep: -6, stress: 6 }, run: c => { const b = c.p.business!; b.employees = Math.max(1, Math.floor(b.employees / 2)); b.value *= 0.8; c.w.regions[c.p.regionId].jobsBonus -= 1; } },
      { label: '自分の給料をゼロにして耐える', fx: { stress: 10, happy: -4, rep: 4 }, run: c => { c.p.business!.value *= 1.05; } },
      { label: '会社をたたむ', run: c => { const b = c.p.business!; c.cash(b.value * 0.4); c.log(`${b.name}を閉じた。`, true, 'career'); c.p.business = null; c.flag('bankrupt'); c.flag('regret_biz'); } },
    ] },
  { id: 'career_biz_growth', cat: 'career', title: '拡大のチャンス', cooldown: 4, when: c => !!c.p.business && !c.slump && c.p.business.value > 100,
    text: c => `${c.p.business!.name}に大口の取引の話が来た。人を雇い、店を広げる必要がある。`,
    choices: [
      { label: '人を雇って拡大する', run: c => { const b = c.p.business!; b.employees += c.rng.int(3, 8); b.value *= 1.35; c.stress(8); c.w.regions[c.p.regionId].jobsBonus += 2; c.rep(4);
        c.echo({ key: 'biz_jobs', cause: `${b.name}の拡大`, effect: `${c.region.name}に新しい雇用が生まれ、若者が町に残るようになった`, target: 'town', delay: [2, 5], magnitude: 2 }); return '町の若者が何人も面接に来た。'; } },
      { label: '品質を守るため、規模は据え置く', fx: { stats: { cre: 2 }, happy: 2 }, run: c => { c.p.business!.profitRate += 0.01; } },
      { label: '大手に会社を売却する', run: c => { const b = c.p.business!; const v = Math.round(b.value * 1.6); c.cash(v); c.log(`${b.name}を${money(v)}で売却した。`, true, 'career'); c.p.business = null; c.flag('sold_biz'); c.p.retired = c.age > 55; } },
    ] },
  { id: 'career_mentee', cat: 'career', title: '新人の相談', cooldown: 7, when: c => !!c.p.jobId && c.p.rank >= 2 && c.age >= 35,
    prepare: c => ({ nm: c.newName(c.rng.chance(0.5) ? 'm' : 'f') }),
    text: '{nm}という新人が、辞めたいと相談に来た。「向いてないんです」。目の下にクマがある。',
    choices: [
      { label: '時間をとって話を聞き、仕事を一緒に整理する', fx: { stress: 4, rep: 3 }, run: c => { const m = c.addNpc('coworker', { name: c.data.nm, birthYear: c.year - 23, jobId: c.p.jobId, f: { trust: 70, affection: 55, anger: 0, respect: 75, disappointment: 0 } });
        c.echo({ key: 'mentee_rises', cause: `${c.p.name}が新人の${m.name}を支えた`, effect: `${m.name}は職場の柱となり、あなたと同じように若手を支えている`, target: 'npc', delay: [6, 12], npcId: m.id, magnitude: 1 }); return '彼/彼女は、もう少しだけ頑張ってみると言った。'; } },
      { label: '「向き不向きはある」と転職を勧める', run: c => { c.addNpc('stranger', { name: c.data.nm, birthYear: c.year - 23 }); return '翌月、彼/彼女は辞めていった。'; } },
      { label: '忙しいので人事に任せる', fx: { stress: -2 } },
    ] },
  { id: 'career_automation', cat: 'career', title: '隣の席の機械', cooldown: 10, when: c => !!c.job && c.job.automation >= 0.5 && c.w.tech >= 40,
    text: c => `${c.job!.name}の仕事の半分を、新しいシステムがこなすようになった。会社は「人は判断業務に回す」と言うが、席は確実に減っている。`,
    choices: [
      { label: 'システムを使いこなす側に回る', fx: { stats: { int: 4 }, stress: 5 }, run: c => { c.p.rank = Math.min(4, c.p.rank + 1); } },
      { label: '技術と無縁の職へ移る準備をする', fx: { stats: { soc: 2 } }, run: c => { c.s.queue.push({ id: 'career_job_hunt' }); } },
      { label: '労働組合で配置転換の交渉に加わる', fx: { rep: 4, stress: 4 }, run: c => { c.w.welfare = Math.min(100, c.w.welfare + 1); } },
    ] },
  { id: 'career_retire', cat: 'career', title: '定年', when: c => c.age >= 63 && (!!c.p.jobId) && !c.p.retired, weight: c => (c.age >= 65 ? 6 : 1.5), cooldown: 2,
    text: c => `${c.job!.name}として${c.p.jobYears}年。送別会の段取りの話が出ている。`,
    choices: [
      { label: '退職して年金生活に入る', run: c => { const j = c.job!; c.cash(Math.round(c.salary() * Math.min(2.5, c.p.jobYears * 0.08))); c.s.flags['last_job_id'] = 0; c.log(`${j.name}を定年退職した。`, true, 'career'); c.p.jobId = null; c.p.retired = true; c.happy(5); if (c.p.jobYears >= 25) c.flag('craft_master'); } },
      { label: '嘱託で週3日働き続ける', fx: { stress: -5 }, run: c => { c.p.rank = Math.max(0, c.p.rank - 1); c.flag('part_retired'); } },
      { label: '退職して、ずっとやりたかったことを始める', fx: { happy: 8, flag: 'dream_pursued' }, run: c => { c.p.jobId = null; c.p.retired = true; c.stat('cre', 6); } },
    ] },
  { id: 'career_gig_life', cat: 'career', title: '単発仕事の日々', cooldown: 3, when: c => c.p.jobId === 'gig' && c.age < 60,
    text: '今日の配達件数は42件。評価は星4.9。自由だけど、来月の保証はどこにもない。',
    choices: [
      { label: '正社員の仕事を探す', run: c => { c.s.queue.unshift({ id: 'career_job_hunt' }); } },
      { label: '件数を増やして稼ぐ', fx: { cash: 40, health: -3, stress: 5 } },
      { label: '空いた時間で創作を続ける', fx: { stats: { cre: 5 }, happy: 3, flag: 'dream_pursued' } },
    ] },
  { id: 'career_music_break', cat: 'career', title: 'ライブハウスの夜', cooldown: 4, when: c => (c.p.jobId === 'musician' || c.p.stats.cre >= 60) && c.age < 50,
    text: '小さなライブハウスの客席に、音楽プロデューサーが来ているらしい。今夜の演奏で何かが変わるかもしれない。',
    choices: [
      { label: '新曲で勝負する', fx: { stats: { cre: 4 }, stress: 4 }, run: c => { if (c.chance(0.2 + c.p.stats.cre / 300)) { c.rep(15); c.flag('dream_pursued'); if (c.p.jobId !== 'musician') c.setJob('musician'); c.p.rank = Math.min(4, c.p.rank + 1); return '名刺を渡された。「一緒にアルバムを作ろう」'; } return '拍手はあたたかかった。それで十分だった。'; } },
      { label: '定番曲で客を盛り上げる', fx: { happy: 6, rep: 3 } },
      { label: 'もう音楽は趣味にすると決める', fx: { stress: -4, flag: 'regret_music' } },
    ] },
  { id: 'career_coworker_rival', cat: 'career', title: '同期のライバル', cooldown: 6, when: c => !!c.p.jobId && c.by('coworker').length > 0, bind: c => c.pickBy('coworker'),
    text: '{npc}と、同じポストを争うことになった。{npc}には介護中の親がいて、昇進で給料を上げたいと漏らしていた。',
    choices: [
      { label: '全力で競う', fx: { stress: 6, feel: { respect: 5, affection: -10 } }, run: c => { if (c.chance(0.5 + (c.p.stats.dis - c.npc!.traits.ambition / 2) / 200)) { c.p.rank = Math.min(4, c.p.rank + 1); return 'あなたが選ばれた。{npc}は「おめでとう」と言った。'; } return '{npc}が選ばれた。'; } },
      { label: '{npc}に譲る', fx: { feel: { trust: 25, affection: 15 }, happy: 2 }, run: c => { c.echo({ key: 'favor_returned', cause: `${c.p.name}が昇進を${c.npc!.name}に譲った`, effect: `${c.npc!.name}はあの日の恩を忘れていなかった`, target: 'npc', delay: [4, 10], npcId: c.npc!.id, magnitude: 1 }); } },
      { label: '{npc}の評判を裏で下げる', fx: { flag: 'regret_betray', feel: { trust: -30 } }, run: c => { c.p.rank = Math.min(4, c.p.rank + 1); if (c.chance(0.5)) { c.rep(-10); c.feel(c.npc, { anger: 50 }); return '昇進はしたが、噂はやがて本人の耳に入った。'; } return '昇進した。後味は悪い。'; } },
    ] },
  { id: 'career_jobchange_itch', cat: 'career', title: '転職サイトを眺める夜', cooldown: 5, when: c => !!c.p.jobId && c.p.jobYears >= 3 && c.age < 55 && (c.p.happy < 50 || c.p.stress > 55),
    text: c => `${c.job!.name}の仕事に、最近手応えを感じない。スマホの転職サイトには「未経験歓迎」の文字が並ぶ。`,
    choices: [
      { label: '本格的に転職活動をする', run: c => { c.s.queue.unshift({ id: 'career_job_hunt' }); } },
      { label: '休暇をとって考え直す', fx: { stress: -10, happy: 3, cash: -15 } },
      { label: '今の仕事で新しい役割を探す', fx: { stats: { cre: 2, soc: 2 } }, run: c => { c.p.jobYears += 1; } },
    ] },
  { id: 'career_regional_job', cat: 'career', title: 'ふるさとの求人', once: true, when: c => c.p.regionId !== c.p.homeRegionId && c.age >= 28 && c.age < 55,
    text: c => `${c.home.name}の役場から「地元にUターンしませんか」という冊子が届いた。${c.fact('family_biz_closed') ? `かつての${c.p.origin.familyBusiness}の跡地は、空き地のままらしい。` : ''}`,
    choices: [
      { label: '故郷に戻る', hint: '物価が下がり、家族との距離が縮まる', run: c => { c.move(c.p.homeRegionId); for (const pa of c.parents) c.feel(pa, { affection: 12 }); if (c.p.jobId && c.chance(0.5)) c.loseJob('Uターン'); c.w.regions[c.p.homeRegionId].dev += 1; c.flag('returned_home');
        c.echo({ key: 'return_home', cause: `${c.p.name}のUターン`, effect: `${c.home.name}に戻った人の話が広まり、若い世代の移住が少し増えた`, target: 'town', delay: [3, 6], magnitude: 1 }); } },
      { label: '今の町に根を下ろす', fx: { stats: { soc: 1 } } },
      { label: 'ふるさと納税で応援だけする', fx: { cash: -10, rep: 1 }, run: c => { c.w.regions[c.p.homeRegionId].dev += 0.5; } },
    ] },
];
function bizEcho(c: Ctx) {
  const b = c.p.business!; c.later('career_biz_first_year', 1, 1);
  c.echo({ key: 'biz_founded', cause: `${c.p.name}が${b.name}を創業`, effect: `${b.name}の看板が${c.region.name}の通りに馴染んできた`, target: 'town', delay: [4, 8], magnitude: 1 });
}
career.push({ id: 'career_biz_first_year', cat: 'career', title: '創業一年目', scheduledOnly: true, when: c => !!c.p.business,
  text: c => `${c.p.business!.name}の一年目が終わろうとしている。客は少しずつ増えているが、あなたは一日も休んでいない。`,
  choices: [
    { label: '営業に走り回る', fx: { stress: 8, stats: { soc: 4 } }, run: c => { c.p.business!.value *= 1.2; } },
    { label: '商品の質を磨く', fx: { stress: 5, stats: { cre: 4 } }, run: c => { c.p.business!.profitRate += 0.02; } },
    { label: '家族との時間も守る', fx: { happy: 4 }, run: c => { if (c.spouse) c.feel(c.spouse, { affection: 8 }); } },
  ] });
