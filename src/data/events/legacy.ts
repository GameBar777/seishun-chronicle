import type { EventDef } from '../../engine/eventTypes';
const echoLine = (c: any) => { const e = [...c.w.echoes].reverse().find((x: any) => x.surfaced && x.gen < c.s.gen); return e ? `「${e.cause}」——その余波は、今もこの町に残っている。` : ''; };
export const legacy: EventDef[] = [
  { id: 'legacy_letter', cat: 'echo', title: '受け継いだもの', scheduledOnly: true, when: () => true,
    text: c => `遺品の中に、自分宛ての手紙があった。「${c.s.lineage.length ? c.s.lineage[c.s.lineage.length - 1].name : '先代'}より」。${echoLine(c)}`,
    choices: [
      { label: '先代の生き方を継ぐと誓う', fx: { stats: { dis: 3 }, happy: 3, flag: 'honor_legacy' } },
      { label: '自分は自分の道を行く', fx: { stats: { cre: 3 }, flag: 'own_path' } },
      { label: '手紙を引き出しの奥にしまう', fx: { stress: -2 } },
    ] },
  { id: 'echo_reflection', cat: 'echo', title: 'あの日の選択', cooldown: 8, when: c => c.w.echoes.some(e => e.surfaced && c.year - e.surfaceYear < 3 && e.gen === c.s.gen),
    text: c => { const e = [...c.w.echoes].reverse().find(x => x.surfaced && x.gen === c.s.gen)!; return `ふと思う。${e.year}年のあの選択がなければ——${e.effect}。`; },
    choices: [
      { label: '誇りに思う', fx: { happy: 4 } },
      { label: '別の道もあったと考える', fx: { stats: { int: 1 }, stress: 1 } },
      { label: '人に話してみる', fx: { stats: { soc: 2 }, rep: 1 } },
    ] },
  { id: 'echo_stranger_thanks', cat: 'echo', title: '見知らぬ人の礼', cooldown: 12, when: c => c.has('volunteer') || c.has('scholarship') || c.has('mentor'),
    text: '駅で知らない若者に呼び止められた。「昔、助けていただいた者です。覚えていないかもしれませんが」',
    choices: [
      { label: '一緒にお茶をする', fx: { happy: 6 }, run: c => { c.addNpc('friend', { birthYear: c.year - 28 }); } },
      { label: '照れて立ち去る', fx: { happy: 3 } },
      { label: '「今度は君が誰かを助けて」とだけ伝える', hint: '善意の連鎖が続くかもしれない', fx: { happy: 4, rep: 2 }, run: c => { c.echo({ key: 'helped_friend', cause: `${c.p.name}の言葉`, effect: '受け取った恩を、誰かに渡した人がいた', target: 'town', delay: [6, 14] }); } },
    ] },
];
