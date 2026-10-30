import type { EventDef } from '../../engine/eventTypes';
export const aging: EventDef[] = [
  { id: 'aging_retire', cat: 'aging', title: '定年', once: true, when: c => c.employed && c.age >= 63 && !c.has('work_long') || (c.employed && c.age >= 70), weight: 6,
    text: c => `${c.job?.name}として最後の日。机の上の荷物は、思ったより少なかった。`,
    choices: [
      { label: 'きっぱり引退する', fx: { happy: 5, stress: -15 }, run: c => { c.p.jobId = null; c.p.retired = true; c.log('引退した。', true, 'career'); } },
      { label: '嘱託で週3日だけ続ける', run: c => { c.p.rank = 0; c.flag('part_time_senior'); } },
      { label: '若手の指導役として残る', fx: { rep: 3 }, run: c => { c.flag('mentor'); } },
    ] },
  { id: 'aging_hobby', cat: 'aging', title: '第二の人生', cooldown: 6, when: c => c.age >= 60,
    text: '時間はある。何をしようか。',
    choices: [
      { label: '絵を習う', fx: { stats: { cre: 4 }, happy: 4, cash: -10 } },
      { label: '畑を借りる', fx: { health: 4, happy: 3 } },
      { label: '大学の公開講座に通う', fx: { stats: { int: 3 }, cash: -10 } },
      { label: '旅に出る', fx: { cash: -60, happy: 7 } },
    ] },
  { id: 'aging_memoir', cat: 'aging', title: '自分史', once: true, when: c => c.age >= 68,
    text: 'これまでのことを書き残そうか、と思った。',
    choices: [
      { label: '一冊の本にまとめる', fx: { cash: -20, stats: { cre: 3 }, flag: 'memoir' }, run: c => { c.echo({ key: 'memoir_read', cause: `${c.p.name}が自分史を書いた`, effect: '孫がその本を読み、同じ道を志した', target: 'family', delay: [8, 15], magnitude: 1 }); } },
      { label: '子どもたちに語って聞かせる', run: c => { for (const k of c.children) c.feel(k, { affection: 6, respect: 5 }); } },
      { label: '過去は過去。今を生きる', fx: { happy: 3 } },
    ] },
  { id: 'aging_downsize', cat: 'aging', title: '終の住処', once: true, when: c => c.age >= 70 && !!c.p.house,
    text: '家が広すぎる。階段もつらくなってきた。',
    choices: [
      { label: '家を売って小さなマンションへ', run: c => { c.sellHouse(); c.cash(-500 * c.w.priceLevel * 0.3); } },
      { label: '子どもと同居する', req: c => c.children.some(k => k.alive), run: c => { c.feel(c.children[0], { affection: 5, anger: 5 }); c.happy(3); } },
      { label: 'この家で最期まで暮らす', fx: { happy: 2 } },
    ] },
  { id: 'aging_will', cat: 'aging', title: '遺言', once: true, when: c => c.age >= 72 && (c.children.length > 0 || c.netWorth > 1000),
    text: c => `財産は${Math.round(c.netWorth)}万円ほど。誰に、何を残すか。`,
    choices: [
      { label: '子どもに均等に', fx: { flag: 'will_written' }, run: c => { for (const k of c.children) c.feel(k, { trust: 5 }); } },
      { label: '一番世話をしてくれた子に多く', req: c => c.children.length > 1, fx: { flag: ['will_written', 'will_favor'] }, run: c => { const ks = [...c.children].sort((a, b) => b.f.affection - a.f.affection); c.feel(ks[0], { affection: 5 }); for (const k of ks.slice(1)) c.feel(k, { disappointment: 10 }); } },
      { label: '半分を地域の奨学金に', fx: { flag: ['will_written', 'scholarship'], rep: 5 }, run: c => { const a = Math.max(0, c.p.cash * 0.5); c.cash(-a); c.echo({ key: 'scholarship', cause: `${c.p.name}が奨学金基金を設立した`, effect: `「${c.p.name.split(' ')[0]}奨学金」で進学した若者が、${c.home.name}で教師になった`, target: 'town', delay: [6, 12], magnitude: 2 }); } },
    ] },
  { id: 'aging_frail', cat: 'aging', title: '衰え', cooldown: 4, when: c => c.age >= 75,
    text: '最近、名前が出てこないことが増えた。',
    choices: [
      { label: '脳トレと散歩を日課にする', fx: { health: 3, stats: { dis: 1 } } },
      { label: '介護サービスを使う', fx: { cash: -30, stress: -5 } },
      { label: 'ありのままを受け入れる', fx: { happy: 2, health: -2 } },
    ] },
];
