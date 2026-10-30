import type { EventDef } from '../../engine/eventTypes';
import { REGIONS } from '../regions';
export const worldEvents: EventDef[] = [
  { id: 'world_disaster', cat: 'world', title: '災害', scheduledOnly: true, when: () => true,
    text: c => `${c.region.name}を${c.region.id === 'minatobe' ? '高潮' : c.rng.chance(0.5) ? '大地震' : '豪雨'}が襲った。`,
    choices: [
      { label: '家族の安全を最優先に避難する', run: c => { const h = c.p.house; if (h) { const loss = h.value * (c.has('insured') ? 0.05 : 0.25); h.value -= loss; } c.health(-3); c.news(`${c.region.name}で大規模災害。復興には数年かかる見込み。`, 'disaster'); c.w.regions[c.p.regionId].dev -= 1; } },
      { label: '避難所の運営を手伝う', fx: { rep: 6, stress: 8, health: -5 }, run: c => { if (c.p.house) c.p.house.value *= 0.8; c.news(`${c.region.name}の災害で、住民の自主運営による避難所が話題に。`, 'disaster'); c.echo({ key: 'disaster_helper', cause: `${c.p.name}が被災地の避難所を運営した`, effect: `${c.region.name}に住民主体の防災組織ができた`, target: 'town', delay: [2, 4], magnitude: 1 }); } },
      { label: 'この土地を離れる', run: c => { if (c.p.house) { c.p.house.value *= 0.7; c.sellHouse(); } const r = REGIONS.filter(x => x.id !== c.p.regionId); c.move(c.rng.pick(r).id); c.happy(-5); } },
      { label: '保険に入っておけばよかった…（今後は加入）', fx: { flag: 'insured', cash: -5 }, run: c => { if (c.p.house) c.p.house.value *= 0.75; } },
    ] },
  { id: 'world_recession_fear', cat: 'world', title: '不況の足音', cooldown: 5, when: c => c.w.phase === 'recession' || c.w.phase === 'crisis', weight: 2,
    text: c => `失業率が${c.w.unemployment.toFixed(1)}%に上がった。職場の空気が重い。`,
    choices: [
      { label: '資格を取って備える', fx: { cash: -15, stats: { int: 3 } } },
      { label: '支出を絞る', fx: { happy: -2 }, run: c => { c.unflag('lifestyle_high'); } },
      { label: '不況でも伸びる業界に移る', req: c => c.availableJobs().length > 0, run: c => { const j = c.rng.pick(c.availableJobs()); c.setJob(j); } },
    ] },
  { id: 'world_tech', cat: 'world', title: '新しい技術', cooldown: 6, when: c => c.w.tech > 20 && c.age < 65,
    text: c => `「${c.w.tech > 60 ? '汎用ロボット' : c.w.tech > 40 ? '自律運転' : '対話型AI'}」が一気に普及した。仕事の形が変わり始めている。`,
    choices: [
      { label: 'いち早く学ぶ', fx: { stats: { int: 4 }, cash: -10 }, run: c => { c.flag('early_adopter'); } },
      { label: '関連銘柄に投資する', req: c => c.p.cash > 50, run: c => { c.investMove(50); } },
      { label: '人間にしかできない仕事を極める', fx: { stats: { cre: 3, soc: 2 } } },
    ] },
  { id: 'world_election', cat: 'world', title: '町長選挙', cooldown: 8, when: c => c.age >= 20,
    text: c => `${c.region.name}で町長選。「再開発」派と「保存」派が争っている。`,
    choices: [
      { label: '再開発派に投票する', run: c => { if (c.chance(0.5)) { c.w.regions[c.p.regionId].dev += 2; c.news(`${c.region.name}で再開発派が当選。駅前に高層ビル計画。`, 'politics'); } } },
      { label: '保存派に投票する', run: c => { if (c.chance(0.5)) { c.setFact('preserved_' + c.p.regionId, c.year); c.news(`${c.region.name}で保存派が当選。古い商店街が残ることに。`, 'politics'); } } },
      { label: '自分が立候補する', req: c => c.p.rep > 60 && c.age >= 35, fx: { cash: -100, stress: 15 }, run: c => { if (c.chance(c.p.rep / 150)) { c.flag('mayor'); c.rep(15); c.news(`${c.region.name}で${c.p.name}氏が町長に初当選。`, 'politics'); return '当選した！'; } return '落選した。それでも、何人もが声をかけてくれた。'; } },
      { label: '棄権する', fx: {} },
    ] },
  { id: 'world_tension', cat: 'world', title: '国際情勢', cooldown: 8, when: c => c.w.tension > 60, weight: 2,
    text: '隣国との緊張が高まり、物価が跳ね上がった。',
    choices: [
      { label: '備蓄を買い込む', fx: { cash: -15, stress: -2 } },
      { label: '平和運動に参加する', fx: { rep: 2, stats: { soc: 2 } }, run: c => { c.w.tension -= 3; } },
      { label: 'ニュースを見ないようにする', fx: { stress: -3 } },
    ] },
];
