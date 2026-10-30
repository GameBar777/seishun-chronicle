import type { EventDef } from '../../engine/eventTypes';
import { regionById } from '../regions';
export const education: EventDef[] = [
  { id: 'edu_crossroads', cat: 'education', title: '十八歳の分かれ道', scheduledOnly: true, when: () => true,
    text: c => `卒業式の帰り道、${c.home.name}の見慣れた景色が少しだけ違って見えた。${c.p.origin.familyBusiness ? `家では「${c.p.origin.familyBusiness}」を継ぐかどうか、誰もはっきり口にしない。` : ''}これからどう生きる？`,
    choices: [
      { label: '大学を目指して進学する', hint: '4年間・学費と奨学金の借金。高収入の職が開ける', run: c => { c.study('uni', 4, 80); if (c.p.origin.wealth < 45) { c.loan(200, 0.01); return '奨学金200万円を借りた。'; } } },
      { label: '専門学校で手に職をつける', hint: '2年間・看護・料理・デザインなどへの道', run: c => { c.study('voc', 2, 70); if (c.p.origin.wealth < 35) c.loan(100, 0.01); } },
      { label: 'すぐに働き始める', hint: '早くお金と経験が手に入る', fx: { stats: { dis: 4 } }, run: c => { c.s.queue.unshift({ id: 'career_job_hunt' }); } },
      { label: '都会へ出て、まず暮らしてみる', hint: '故郷を離れる。家と町に何かが起きるかもしれない', req: c => c.p.regionId !== 'seiran', fx: { stats: { soc: 3 }, happy: 4, flag: ['left_home', 'left_home_house'] },
        run: c => { c.move('seiran'); c.s.queue.unshift({ id: 'career_job_hunt' });
          if (c.p.origin.familyBusiness && !c.by('sibling').length) c.echo({ key: 'family_biz_closed', cause: `${c.p.name.split(' ')[1]}が18歳で${c.home.name}を離れた`, effect: `${c.p.origin.familyBusiness}は後継ぎがなく、シャッターを下ろした`, target: 'town', delay: [3, 6], magnitude: -1 });
          c.feel(c.parents[0], { disappointment: 10 }); } },
      { label: `家業「{family_biz}」を手伝う`, hint: '地元に残る。家族は喜ぶが、自分の道は？', req: c => !!c.p.origin.familyBusiness, fx: { feel: {}, stats: { dis: 3, soc: 2 } },
        run: c => { for (const pa of c.parents) c.feel(pa, { respect: 10, affection: 8 }); c.flag('family_biz_heir'); c.setJob(c.p.origin.family === 'farm' ? 'farmer' : 'retail');
          c.echo({ key: 'family_biz_kept', cause: `${c.p.name.split(' ')[1]}が家業に残った`, effect: `${c.p.origin.familyBusiness}は町の灯として続いている`, target: 'town', delay: [5, 9], magnitude: 1 }); } },
    ] },
  { id: 'edu_exam_week', cat: 'education', title: '試験週間', cooldown: 2, max: 2, when: c => !!c.p.studying,
    text: '図書館の閉館の音楽が流れる。明日は落とせない試験だ。友人からは「今夜くらい遊ぼうぜ」とメッセージ。',
    choices: [
      { label: '徹夜で勉強する', fx: { stats: { int: 4, dis: 2 }, health: -3, stress: 6 } },
      { label: '友人と出かけて息抜き', fx: { stats: { soc: 3 }, happy: 4, stress: -5 }, run: c => { if (c.chance(0.35)) { c.stat('int', -2); return '試験はぎりぎりだった。'; } return '意外と頭はすっきりしていた。'; } },
      { label: 'ほどほどに勉強して早く寝る', fx: { stats: { int: 2 }, health: 1 } },
    ] },
  { id: 'edu_club', cat: 'education', title: 'サークルの勧誘', once: true, when: c => !!c.p.studying && c.p.studying.kind !== 'grad',
    text: '掲示板の前で、演劇・山岳・起業研究会の三つのビラを渡された。',
    choices: [
      { label: '演劇サークル', fx: { stats: { cre: 5, soc: 3 }, flag: 'club_theater' } },
      { label: '山岳部', fx: { stats: { phy: 6 }, health: 3, flag: 'club_mountain' } },
      { label: '起業研究会', fx: { stats: { int: 2, soc: 2 }, flag: 'club_startup' }, run: c => { const n = c.addNpc('friend', { birthYear: c.p.birthYear, jobId: null, goal: 'get_rich', traits: { warmth: 50, ambition: 90, stability: 40 } }); c.note(n, '起業研究会で出会う'); return `熱っぽく語る${n.name}と知り合った。`; } },
      { label: 'どこにも入らずバイトに集中', fx: { cash: 40, stats: { dis: 3 } } },
    ] },
  { id: 'edu_professor', cat: 'education', title: '教授の誘い', once: true, when: c => c.p.studying?.kind === 'uni' && c.p.stats.int >= 48,
    text: 'ゼミの教授が研究室に呼んだ。「君、大学院に来る気はないか。研究の道は貧乏だが、面白いぞ」',
    choices: [
      { label: '大学院進学を決める', hint: '卒業が2年延びる。研究者・医師・弁護士の道', run: c => { c.p.studying!.kind = 'grad'; c.p.studying!.yearsLeft += 2; const m = c.addNpc('mentor', { birthYear: c.year - 58, jobId: 'researcher', traits: { warmth: 60, ambition: 70, stability: 80 } }); c.note(m, '指導教官'); c.flag('grad_path'); } },
      { label: '就職したいと正直に断る', fx: { stats: { soc: 1 } } },
      { label: '返事を保留し、資格試験の勉強を始める', fx: { stats: { int: 3, dis: 2 }, stress: 4, flag: 'cert_study' } },
    ] },
  { id: 'edu_medical', cat: 'education', title: '白衣の進路', once: true, when: c => c.p.studying?.kind === 'grad' && c.p.stats.int >= 55,
    text: '研究室の先輩が医学部編入と司法試験の話をしていた。どちらも難関で、何年も人生を賭けることになる。',
    choices: [
      { label: '医師国家試験を目指す', hint: '合格すれば医師へ。失敗すれば時間とお金を失う', fx: { stress: 10, cash: -60 }, run: c => { if (c.p.stats.int + c.p.stats.dis > 105 || c.chance(0.4)) { c.p.certs.push('medical'); c.log('医師国家試験に合格した。', true, 'education'); return '合格通知が届いた。'; } c.flag('regret_exam'); return '不合格。もう一度挑む気力は残っていなかった。'; } },
      { label: '司法試験に挑む', hint: '合格すれば弁護士へ', fx: { stress: 10, cash: -40 }, run: c => { if (c.p.stats.int + c.p.stats.soc > 100 || c.chance(0.35)) { c.p.certs.push('bar'); c.log('司法試験に合格した。', true, 'education'); return '合格した。'; } c.flag('regret_exam'); return '届かなかった。'; } },
      { label: '研究一筋でいく', fx: { stats: { int: 4 }, flag: 'research_devotee' } },
    ] },
  { id: 'edu_dropout', cat: 'education', title: 'このままでいいのか', once: true, when: c => !!c.p.studying && (c.p.stress > 55 || c.p.cash < 10),
    text: '仕送りも貯金も尽きかけている。講義室の後ろで、ふと「辞めて働けば楽になる」と考えてしまう。',
    choices: [
      { label: '退学して働く', hint: '学歴は手に入らないが、借金は増えない', run: c => { c.p.studying = null; c.flag('dropout'); c.flag('regret_dropout'); c.s.queue.unshift({ id: 'career_job_hunt' }); return '学生証を返した。'; } },
      { label: '休学してバイトで稼ぐ', fx: { cash: 120, stress: -5 }, run: c => { c.p.studying!.yearsLeft += 1; } },
      { label: '追加の奨学金を借りて続ける', run: c => { c.loan(100, 0.015); c.stress(-6); return '100万円を借り足した。'; } },
      { label: '親に頭を下げて援助を頼む', req: c => c.parents.length > 0 && c.p.origin.wealth >= 40, run: c => { c.cash(80); for (const pa of c.parents) c.feel(pa, { respect: -3, affection: 3 }); return '「水くさいこと言うな」と振り込まれていた。'; } },
    ] },
  { id: 'edu_study_abroad', cat: 'education', title: '交換留学の募集', once: true, when: c => c.p.studying?.kind === 'uni' && c.p.origin.wealth >= 30,
    text: '海の向こうの大学との交換留学枠が一つ空いた。費用はかかるが、世界は広がる。',
    choices: [
      { label: '応募して一年間留学する', fx: { cash: -120, stats: { soc: 6, cre: 5, int: 3 }, happy: 6, flag: 'abroad' }, run: c => { c.p.studying!.yearsLeft += 1; } },
      { label: '国内で資格取得に集中する', fx: { stats: { int: 3, dis: 3 }, flag: 'cert_study' } },
      { label: '今の友人と過ごす時間を選ぶ', fx: { happy: 3 }, run: c => { for (const f of c.friends) { c.feel(f, { affection: 5 }); c.flag('saw_' + f.id); } } },
    ] },
  { id: 'edu_certificate', cat: 'education', title: '資格試験', cooldown: 5, max: 3, when: c => c.age < 55 && (c.has('cert_study') || c.employed) && c.p.stats.dis > 30,
    text: '仕事帰りの書店で、資格の参考書が平積みになっていた。半年、夜の時間を差し出せば手が届くかもしれない。',
    choices: [
      { label: '看護・福祉系の資格に挑む', fx: { cash: -20, stress: 5 }, run: c => { if (c.chance(0.5 + c.p.stats.dis / 200)) { c.p.certs.push('nursing'); return '合格した。看護・介護の道が開けた。'; } return '今回は届かなかった。'; } },
      { label: '会計・金融系の資格に挑む', fx: { cash: -25, stress: 5 }, run: c => { if (c.chance(0.45 + c.p.stats.int / 200)) { c.p.certs.push('finance'); c.stat('int', 4); if (c.p.jobId) c.p.rank = Math.min(4, c.p.rank + 1); return '合格。職場での評価が上がった。'; } return '不合格。'; } },
      { label: '技術系の資格に挑む', fx: { cash: -20, stress: 5 }, run: c => { if (c.chance(0.5 + c.p.stats.int / 250)) { c.p.certs.push('tech'); c.stat('int', 5); return '合格。新しい仕事の扉が少し開いた。'; } return '不合格。'; } },
      { label: '今はやめておく', fx: { stress: -3 } },
    ] },
  { id: 'edu_night_school', cat: 'education', title: '夜間大学', once: true, when: c => c.p.edu === 'hs' && c.age >= 24 && c.age <= 45 && c.employed,
    text: '高卒だから、と見送られた昇進がある。駅前の夜間大学の看板が、今日はやけに目につく。',
    choices: [
      { label: '働きながら夜間大学に通う', hint: '4年間、疲れるが大卒になれる', fx: { cash: -60, stress: 12, health: -3 }, run: c => { c.later('edu_night_grad', 4, 4); c.flag('night_school'); } },
      { label: '通信講座で少しずつ学ぶ', fx: { cash: -15, stats: { int: 4 } } },
      { label: '学歴より現場の腕で勝負する', fx: { stats: { dis: 3 }, flag: 'pride_field' } },
    ] },
  { id: 'edu_night_grad', cat: 'education', title: '遅れてきた卒業式', scheduledOnly: true, when: c => c.has('night_school'),
    text: '若い学生に混じって、角帽をかぶる。四年間の夜が、一枚の紙になった。',
    choices: [
      { label: '家族を式に呼ぶ', fx: { happy: 10 }, run: c => { c.p.edu = 'uni'; c.log('夜間大学を卒業し、大卒になった。', true, 'education'); for (const n of [c.spouse, ...c.children]) c.feel(n, { respect: 10 }); } },
      { label: '一人で静かに祝う', fx: { happy: 6, stats: { dis: 2 } }, run: c => { c.p.edu = 'uni'; c.log('夜間大学を卒業した。', true, 'education'); } },
      { label: 'これを機に転職活動を始める', fx: { happy: 4 }, run: c => { c.p.edu = 'uni'; c.s.queue.unshift({ id: 'career_job_hunt' }); } },
    ] },
  { id: 'edu_reskill', cat: 'education', title: 'リスキリング講座', cooldown: 8, max: 2, when: c => c.w.tech > 35 && c.age >= 30 && c.age < 60 && !!c.job && c.job.automation >= 0.5,
    text: c => `${c.job!.name}の仕事が、少しずつソフトウェアに置き換わっている。自治体が無料の再教育講座を開いている。`,
    choices: [
      { label: '受講してAI調律の技術を学ぶ', fx: { stats: { int: 6 }, stress: 5 }, run: c => { if (c.p.edu === 'hs' || c.p.edu === 'voc') c.p.edu = 'uni'; c.p.certs.push('tech'); return '修了証は、思ったより重かった。'; } },
      { label: 'ドローン操縦の講座を受ける', fx: { stats: { phy: 3, int: 3 } }, run: c => { if (c.p.edu === 'hs') c.p.edu = 'voc'; } },
      { label: '今の仕事にしがみつく', fx: { flag: 'resist_tech' } },
    ] },
];
