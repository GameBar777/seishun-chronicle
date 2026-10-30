import type { EventDef } from '../../engine/eventTypes';
import type { Ctx } from '../../engine/ctx';
import { money } from '../../engine/ctx';
// Drama & surprise: twists, multi-year chains, rival / first-love arcs and rare big swings.
// Short text by design: `say` is the line shown in the speech bubble; `text` goes under "details".
const pl = (c: Ctx) => Math.max(1, c.w.priceLevel);
const single = (c: Ctx) => !c.spouse && !c.partner;
const rival = (c: Ctx) => c.s.npcs.find(n => n.role === 'rival' && n.alive);
const first = (n?: { name: string }) => n?.name.split(' ')[1] ?? '誰か';

export const drama: EventDef[] = [
  // ---- dream pick (start of every life) ----
  { id: 'dream_pick', cat: 'life', title: '夢をひとつ', scheduledOnly: true, when: c => !c.s.dream,
    say: '人生でいちばん叶えたいことは？', speaker: '18歳のあなた', text: '選んだ夢は画面上部のメーターで進み具合がわかります。叶えば特別なエンディングに。',
    prepare: c => { const ids = ['shop', 'family', 'fame', 'wealth', 'home', 'town', 'love']; const opts: string[] = []; while (opts.length < 4) { const x = c.rng.pick(ids); if (!opts.includes(x)) opts.push(x); } return { opts }; },
    choices: (['shop', 'family', 'fame', 'wealth', 'home', 'town', 'love'] as const).map(id => ({
      icon: { shop: '🏪', family: '👨‍👩‍👧‍👦', fame: '🌟', wealth: '💎', home: '🏡', town: '🏮', love: '💞' }[id],
      label: { shop: '自分の店を持つ', family: 'にぎやかな家族', fame: '名を残す', wealth: '億を築く', home: '庭のある家', town: '町の灯になる', love: 'ひとりと添い遂げる' }[id],
      hint: { shop: '看板に、自分の名前を', family: '食卓は、いつも満席で', fame: '町の誰もが知る人に', wealth: '数字で自由を買う', home: '帰る場所を自分の手で', town: '誰かの人生を明るく', love: '最後の日まで同じ人と' }[id],
      req: (c: Ctx) => c.data?.opts?.includes(id),
      run: (c: Ctx) => { c.s.dream = { id, picked: c.year, best: 0 }; c.flag('dream_' + id); c.log(`夢を決めた：「${{ shop: '自分の店を持つ', family: 'にぎやかな家族', fame: '名を残す', wealth: '億を築く', home: '庭のある家', town: '町の灯になる', love: 'ひとりと添い遂げる' }[id]}」`, true, 'life'); return '夢が決まった。上のメーターが、あなたの歩みを映す。'; },
    })) },

  // ---- the stranger you once helped (two-part, years apart) ----
  { id: 'drama_stranger_help', cat: 'social', title: '雨の駅', drama: true, once: true, weight: 1.2, when: c => c.age >= 19 && c.age <= 55,
    say: '「財布をなくして…帰れないんです」', speaker: 'ずぶ濡れの若者', text: '終電間際の駅。改札の前で、若者が途方に暮れている。',
    choices: [
      { icon: '☂️', label: '傘と交通費を渡す', hint: '小さな出費・いつか何かが…', fx: { cash: -1, happy: 2, flag: 'helped_stranger', later: ['drama_stranger_returns', 7, 16] } },
      { icon: '🚶', label: '駅員を呼んで立ち去る', hint: '無難', fx: { stress: -1 } },
      { icon: '🚕', label: 'タクシーで家まで送る', hint: '出費・縁が深まる', fx: { cash: -2, happy: 3, flag: 'helped_stranger', later: ['drama_stranger_returns', 5, 12] } },
    ] },
  { id: 'drama_stranger_returns', cat: 'social', title: 'あの雨の日の人', drama: true, scheduledOnly: true, when: c => c.age < 90,
    say: '「覚えていますか。あの雨の駅で、傘を貸してくれた」', speaker: '見知らぬ紳士', text: '名刺には、聞いたことのある会社の名前。あの若者は、いまや社長になっていた。',
    choices: [
      { icon: '🤝', label: '恩返しを受け取る', hint: `大金＋・縁が生まれる`, run: c => { const v = Math.round(300 * pl(c)); c.cash(v); c.happy(6); const n = c.addNpc('mentor', { birthYear: c.year - c.age + c.rng.int(-12, -4), f: { trust: 80, affection: 60, anger: 0, respect: 70, disappointment: 0 } }); c.note(n, '雨の駅の恩返し'); return `${money(v)}の「お礼」と、頼れる知人ができた。`; } },
      { icon: '🍵', label: 'お茶に誘って思い出話をする', hint: '幸福↑・友人ができる', run: c => { const n = c.addNpc('friend', { birthYear: c.year - c.age + c.rng.int(-12, -4), f: { trust: 75, affection: 65, anger: 0, respect: 60, disappointment: 0 } }); c.note(n, '雨の駅の恩返し'); c.happy(7); } },
      { icon: '🌱', label: '「誰かに同じことを」と返す', hint: '評判↑・町に残響', run: c => { c.rep(8); c.happy(8); c.echo({ key: 'favor_returned', cause: 'あの雨の日の傘', effect: '一本の傘から始まった「恩送り」の基金が町にできた', target: 'town', delay: [2, 5] }); return '彼は深く頭を下げた。'; } },
    ] },

  // ---- rival arc (3 acts) ----
  { id: 'drama_rival_meet', cat: 'career', title: 'もう一人の自分', drama: true, once: true, weight: 1.4, when: c => c.age >= 20 && c.age <= 38 && c.employed && !rival(c),
    say: '「あなたが噂の新人？ 負ける気はしないけど」', speaker: '同い年のライバル', text: '同じ業界、同じ年、同じ夢。何かと比べられる相手が現れた。',
    choices: [
      { icon: '🔥', label: '受けて立つ', hint: '根気↑・ストレス↑', fx: { stats: { dis: 4 }, stress: 5 }, run: c => { const n = c.addNpc('rival', { birthYear: c.p.birthYear, jobId: c.p.jobId, f: { trust: 30, affection: 25, anger: 15, respect: 50, disappointment: 0 } }); c.flag('rival_fight'); c.later('drama_rival_2', 3, 6, n.id); } },
      { icon: '👀', label: '相手の仕事ぶりを観察する', hint: '知性↑', fx: { stats: { int: 3 } } },
      { icon: '🍻', label: '飲みに誘う', hint: '社交↑', fx: { stats: { soc: 3 } }, run: c => { const n = c.addNpc('rival', { birthYear: c.p.birthYear, jobId: c.p.jobId, f: { trust: 50, affection: 50, anger: 0, respect: 50, disappointment: 0 } }); c.flag('rival_friend'); c.later('drama_rival_2', 3, 6, n.id); } },
    ] },
  { id: 'drama_rival_2', cat: 'career', title: 'ライバルの躍進', drama: true, scheduledOnly: true, bind: c => rival(c), when: c => !!c.npc,
    say: c => (c.has('rival_fight') ? '「悪いね、今回も私の勝ち」' : '「なあ、一緒に何か始めないか」'), speaker: c => c.npc!.name, text: '{npc}が大きな成果をあげ、業界紙に載った。',
    choices: [
      { icon: '⚔️', label: '真っ向勝負を挑む', hint: '勝てば評判↑↑・負ければ↓', run: c => { const win = c.chance(0.35 + (c.p.stats.dis + c.p.stats.int) / 400); c.later('drama_rival_3', 4, 9, c.npc!.id); if (win) { c.rep(10); c.happy(6); c.flag('rival_won'); return '大逆転。今度はあなたの名前が載った。'; } c.rep(-3); c.stress(8); return '完敗。悔しさで眠れない夜が続いた。'; } },
      { icon: '🤝', label: '手を組む', hint: '関係↑・将来の共同事業', fx: { feel: { trust: 20, affection: 15 }, flag: 'rival_ally' }, run: c => { c.later('drama_rival_3', 4, 9, c.npc!.id); } },
      { icon: '🍃', label: '自分のペースを守る', hint: 'ストレス↓', fx: { stress: -4 } },
    ] },
  { id: 'drama_rival_3', cat: 'career', title: '最後の対決', drama: true, scheduledOnly: true, bind: c => rival(c), when: c => !!c.npc && c.age < 80,
    say: c => (c.has('rival_ally') ? '「独立しよう。二人なら、やれる」' : '「最後に一度だけ、本気で勝負しよう」'), speaker: c => c.npc!.name, text: '長い付き合いになった{npc}が、人生を賭けた提案をしてきた。',
    choices: [
      { icon: '🚀', label: '乗る', hint: '一攫千金か、大損か', run: c => { const ok = c.chance(0.5 + (c.has('rival_ally') ? 0.15 : 0)); const v = Math.round((ok ? 600 : -250) * pl(c)); c.cash(v); c.happy(ok ? 10 : -6); if (ok) { c.rep(6); c.echo({ key: 'biz_jobs', cause: `${c.npc!.name}との勝負`, effect: '二人が始めた事業が、町に新しい仕事を生んだ', target: 'town', delay: [2, 4] }); } return ok ? `大成功。${money(v)}が手に入った。` : `失敗。${money(-v)}を失った。`; } },
      { icon: '🎓', label: '後輩を育てようと持ちかける', hint: '評判↑・町に残響', run: c => { c.rep(5); c.echo({ key: 'mentee_rises', cause: `${c.npc!.name}と始めた勉強会`, effect: '二人が育てた若手が、業界を引っ張る存在になった', target: 'town', delay: [3, 7] }); } },
      { icon: '🫱', label: '握手で終わらせる', hint: '幸福↑・関係↑', fx: { happy: 6, feel: { affection: 20, trust: 15 } }, result: '{npcFirst}は笑って、昔話を始めた。' },
    ] },

  // ---- first love (reunion arc) ----
  { id: 'drama_first_love', cat: 'love', title: '同窓会の隣の席', drama: true, once: true, weight: 1.2, when: c => c.age >= 19 && c.age <= 26,
    say: '「…久しぶり。変わってないね」', speaker: '初恋の人', text: '中学の同窓会。隣に座ったのは、ずっと言えなかった相手だった。',
    choices: [
      { icon: '📱', label: '連絡先を交換する', hint: '…いつか何かが返ってくるかも', run: c => { const n = c.addNpc('friend', { sex: c.p.sex === 'm' ? 'f' : 'm', birthYear: c.p.birthYear, jobId: null, f: { trust: 55, affection: 60, anger: 0, respect: 50, disappointment: 0 } }); c.note(n, '初恋の人'); c.flag('first_love'); c.later('drama_first_love_2', 4, 12, n.id); } },
      { icon: '🌙', label: '思い出のままにする', hint: '何も起きない…はず', fx: { happy: 1 } },
      { icon: '📸', label: '一緒に写真だけ撮る', hint: '幸福↑', fx: { happy: 3 } },
    ] },
  { id: 'drama_first_love_2', cat: 'love', title: '再会', drama: true, scheduledOnly: true, when: c => !!c.npc && c.npc.alive,
    say: c => (single(c) ? '「ずっと、言えなかったことがあるの」' : '「幸せそうでよかった。それだけ言いたくて」'), speaker: c => c.npc!.name, text: '偶然入った喫茶店に、{npc}がいた。',
    choices: [
      { icon: '💗', label: '気持ちを伝える', hint: '恋の始まり？', req: c => single(c), run: c => { const n = c.npc!; n.role = 'partner'; c.p.partnerId = n.id; c.happy(12); c.log(`${n.name}と付き合い始めた。`, true, 'love'); return '何年も遠回りした二人が、同じ傘に入った。'; } },
      { icon: '☕', label: '笑って昔話をする', hint: '幸福↑', fx: { happy: 5, feel: { affection: 5 } } },
      { icon: '🚪', label: '会釈して店を出る', hint: '何も変わらない', fx: { stress: -1 } },
    ] },

  // ---- mysterious letter (cliffhanger chain over years) ----
  { id: 'drama_letter_1', cat: 'life', title: '差出人のない封筒', drama: true, once: true, weight: 1, when: c => c.age >= 22 && c.age <= 60,
    say: '中には、古い鍵と手描きの地図。', speaker: '郵便受け', text: '消印は何十年も前の日付。宛名は、確かにあなたの名前だった。',
    choices: [
      { icon: '🗝️', label: '地図の場所を探す', hint: '続く…', fx: { stats: { cre: 2 } }, run: c => { c.later('drama_letter_2', 1, 3); return '地図の場所は、取り壊し寸前の古い倉庫だった。鍵は——合わない。'; } },
      { icon: '🗑️', label: '気味が悪いので捨てる', hint: '平穏', fx: { stress: -1 } },
      { icon: '📦', label: '引き出しにしまっておく', hint: '…いつか思い出すかも', run: c => { c.later('drama_letter_2', 4, 9); } },
    ] },
  { id: 'drama_letter_2', cat: 'life', title: '倉庫の二つ目の扉', drama: true, scheduledOnly: true, when: () => true,
    say: '「その鍵なら、奥の扉のだよ」', speaker: '倉庫の管理人', text: '倉庫の取り壊しが決まり、管理人から連絡が来た。奥にもう一つ扉があるらしい。',
    choices: [
      { icon: '🚪', label: '扉を開ける', hint: '何が出るか…', run: c => { c.later('drama_letter_3', 1, 2); return '埃の向こうに、布をかけた大きな何かがあった。——その日は、日が暮れて確かめられなかった。'; } },
      { icon: '✋', label: 'やめておく', hint: '謎は謎のまま', fx: { flag: 'regret_letter' } },
      { icon: '👥', label: '家族と一緒に開ける', hint: '関係↑・続く…', run: c => { for (const n of [...c.parents, ...c.children]) c.feel(n, { affection: 4 }); if (c.spouse) c.feel(c.spouse, { affection: 6 }); c.later('drama_letter_3', 1, 2); return '家族みんなで息をのんだ。布の下は——続きは来年。'; } },
    ] },
  { id: 'drama_letter_3', cat: 'life', title: '布の下にあったもの', drama: true, scheduledOnly: true, when: () => true,
    prepare: c => ({ kind: c.rng.weighted(['art', 'diary', 'deed'], k => ({ art: 3, diary: 4, deed: 2 })[k as 'art'])! }),
    say: c => ({ art: '一枚の油絵。署名は、町の伝説の画家だった。', diary: '祖父の日記。最後のページに、あなたの名前があった。', deed: '古い証文。町の公園の土地は、あなたの家のものだった。' } as any)[c.data.kind],
    speaker: '倉庫の奥', text: '何十年も眠っていたものが、あなたを待っていた。',
    choices: [
      { icon: '💰', label: '手放してお金にする', hint: '臨時収入＋', run: c => { const v = Math.round(({ art: 900, diary: 30, deed: 400 } as any)[c.data.kind] * pl(c)); c.cash(v); c.happy(4); return `${money(v)}になった。`; } },
      { icon: '🏛️', label: '町に寄贈する', hint: '評判↑・町に残響', run: c => { c.rep(10); c.happy(6); c.echo({ key: 'donation', cause: '倉庫で見つけた宝物の寄贈', effect: '寄贈品を中心に、小さな町の資料館が開かれた', target: 'town', delay: [1, 4] }); } },
      { icon: '🏠', label: '家に飾って大切にする', hint: '幸福↑', fx: { happy: 8, stress: -3 } },
    ] },

  // ---- rare big swings ----
  { id: 'drama_lottery', cat: 'money', title: '当たり', drama: true, once: true, weight: 0.35, when: c => c.age >= 20,
    prepare: c => ({ amt: Math.round(c.rng.weighted([100, 500, 3000], v => ({ 100: 6, 500: 3, 3000: 1 } as any)[v])! * pl(c)) }),
    say: c => `「…番号、全部合ってる」${money(c.data.amt)}が当たった。`, speaker: '売り場のおばちゃん', text: '何年も同じ番号を買い続けた、ただの習慣だった。',
    choices: [
      { icon: '🏦', label: '全額を投資に回す', hint: '将来の資産↑', run: c => { c.cash(c.data.amt); c.investMove(c.data.amt); c.happy(5); } },
      { icon: '🎁', label: '家族と友人に分ける', hint: '関係↑↑', run: c => { c.cash(Math.round(c.data.amt / 2)); for (const n of [...c.parents, ...c.friends, ...c.children]) c.feel(n, { affection: 10, trust: 5 }); c.happy(8); } },
      { icon: '🎉', label: 'ぱーっと使う', hint: '幸福↑↑…一時的に', run: c => { c.cash(Math.round(c.data.amt * 0.3)); c.happy(14); c.stress(-8); } },
      { icon: '🏮', label: '半分を町に寄付する', hint: '評判↑・町に残響', run: c => { c.cash(Math.round(c.data.amt / 2)); c.rep(10); c.echo({ key: 'scholarship', cause: '宝くじの寄付', effect: '匿名の寄付で、町の子ども食堂が十年続いた', target: 'town', delay: [2, 5] }); } },
    ] },
  { id: 'drama_scandal', cat: 'social', title: '炎上', drama: true, cooldown: 15, weight: 0.5, when: c => c.age >= 24 && c.age < 70 && (c.employed || c.p.rep > 15),
    say: '「これ、あなたのことじゃない？」', speaker: '友人からのメッセージ', text: '根も葉もない噂がSNSで拡散している。写真は別人、話はでたらめ。',
    choices: [
      { icon: '🎤', label: '正面から説明する', hint: '社交が高いほど好転', run: c => { if (c.chance(0.3 + c.p.stats.soc / 150)) { c.rep(6); return '誠実な説明が拡散され、かえって信頼が増した。'; } c.rep(-6); c.stress(10); return '火に油だった。しばらく外を歩けなかった。'; } },
      { icon: '⚖️', label: '弁護士に任せる', hint: `出費・確実`, run: c => { c.cash(-Math.round(60 * pl(c))); c.stress(4); return '訂正記事が出た。高くついたが、終わった。'; } },
      { icon: '🫥', label: '嵐が去るのを待つ', hint: 'ストレス↑', fx: { stress: 12, rep: -2 } },
    ] },
  { id: 'drama_reunion', cat: 'social', title: '二十年ぶりの顔', drama: true, once: true, weight: 1, when: c => c.age >= 36 && c.age <= 70,
    prepare: c => ({ fate: c.rng.pick(['rich', 'fallen', 'abroad', 'same']) }),
    say: c => ({ rich: '「いまは会社をやってるんだ。困ったら言えよ」', fallen: '「…実は、いろいろあってさ」', abroad: '「来週、また海外に戻るんだ」', same: '「お前、全然変わらないな！」' } as any)[c.data.fate], speaker: '高校の親友', text: '同窓会の二次会。あの頃いちばん仲がよかった相手が、隣に座った。',
    choices: [
      { icon: '🍶', label: '朝まで語り明かす', hint: '幸福↑・友情復活', run: c => { const n = c.addNpc('friend', { birthYear: c.p.birthYear, f: { trust: 70, affection: 70, anger: 0, respect: 55, disappointment: 0 } }); c.note(n, '二十年ぶりの再会'); c.happy(7); if (c.data.fate === 'fallen') { c.later('social_prodigal', 3, 8, n.id); } } },
      { icon: '💴', label: c => (c.data.fate === 'fallen' ? 'そっとお金を貸す' : '名刺だけ交換する'), hint: c => (c.data.fate === 'fallen' ? '出費・いつか…' : '平穏'), run: c => { if (c.data.fate === 'fallen') { c.cash(-Math.round(50 * pl(c))); c.echo({ key: 'helped_friend', cause: '同窓会の夜に貸したお金', effect: '立ち直った旧友が、今度は別の誰かを助けている', target: 'npc', delay: [3, 8] }); } } },
      { icon: '🏃', label: '一次会で帰る', hint: 'ストレス↓', fx: { stress: -2 } },
    ] },
  { id: 'drama_inherit_twist', cat: 'money', title: '知らない親戚の遺言', drama: true, once: true, weight: 0.6, when: c => c.age >= 28,
    say: '「遠縁の方が、あなたを相続人に指名されました」', speaker: '弁護士', text: '会ったこともない大叔母。財産目録は分厚い。ただし——借金の欄もある。',
    choices: [
      { icon: '📜', label: '相続する', hint: '大当たりか、借金か', run: c => { const good = c.chance(0.6); const v = Math.round((good ? c.rng.int(300, 1200) : -c.rng.int(80, 300)) * pl(c)); c.cash(v); if (!good) c.stress(10); else c.happy(6); return good ? `山の土地と預金、合わせて${money(v)}。` : `ふたを開けると借金の方が多かった。${money(-v)}の持ち出し。`; } },
      { icon: '🙅', label: '相続放棄する', hint: '何も起きない', fx: { stress: -1 } },
      { icon: '🔍', label: '専門家に精査させる', hint: '出費・損はしない', run: c => { c.cash(-Math.round(20 * pl(c))); if (c.chance(0.6)) { const v = Math.round(c.rng.int(200, 700) * pl(c)); c.cash(v); return `精査の結果、${money(v)}を受け取った。`; } return '借金の方が多いと分かり、放棄した。'; } },
    ] },
  { id: 'drama_viral', cat: 'career', title: 'バズった', drama: true, cooldown: 20, weight: 0.6, when: c => c.age >= 18 && c.age < 65 && c.w.tech > 25,
    say: '通知が鳴りやまない。何気ない投稿が、百万回見られていた。', speaker: 'スマホ', text: '趣味で作ったものの写真。コメント欄は「売ってください」で埋まっている。',
    choices: [
      { icon: '🏄', label: '波に乗って売り出す', hint: '創造が高いほど成功', run: c => { const ok = c.chance(0.35 + c.p.stats.cre / 140); const v = Math.round((ok ? 250 : 20) * pl(c)); c.cash(v); c.rep(ok ? 8 : 1); c.stress(6); if (ok) c.flag('dream_pursued'); return ok ? `副業が軌道に乗り、${money(v)}を稼いだ。` : '一週間で熱は冷めた。'; } },
      { icon: '🤫', label: '静かにやり過ごす', hint: '平穏', fx: { stress: -2 } },
      { icon: '🎁', label: '作り方を無料で公開する', hint: '評判↑', fx: { rep: 6, happy: 4 } },
    ] },
  { id: 'drama_stray', cat: 'family', title: '雨の日の小さな声', drama: true, once: true, weight: 0.8, when: c => c.age >= 22 && c.age < 75,
    say: '「にゃあ」——段ボールの中から。', speaker: '路地裏', text: '帰り道。濡れた段ボールの中で、子猫が鳴いていた。',
    choices: [
      { icon: '🐈', label: '連れて帰る', hint: '幸福↑・ストレス↓', fx: { happy: 8, stress: -6, cash: -5, flag: 'has_cat', later: ['drama_stray_2', 2, 6] } },
      { icon: '📢', label: '里親を探す', hint: '社交↑', fx: { stats: { soc: 2 }, happy: 2 } },
      { icon: '🏥', label: '動物病院に預ける', hint: '小さな出費', fx: { cash: -2, happy: 2 } },
    ] },
  { id: 'drama_stray_2', cat: 'family', title: '猫が知らせた', drama: true, scheduledOnly: true, when: () => true,
    say: '深夜、猫が狂ったように鳴いて起こした。台所から煙が——', speaker: 'うちの猫', text: 'ボヤで済んだ。あの雨の日に拾った小さな命に、家族ごと救われた。',
    choices: [{ icon: '🐟', label: '一番いい缶詰を開ける', hint: '幸福↑', fx: { happy: 10, stress: -4 } },
      { icon: '🧯', label: '防災グッズを買いそろえる', hint: '出費・安心', fx: { cash: -3, stress: -6 } },
      { icon: '📣', label: 'ご近所に武勇伝を広める', hint: '社交↑', fx: { stats: { soc: 2 }, happy: 5 } }] },
  { id: 'drama_twist_promo', cat: 'career', title: '内示', drama: true, cooldown: 12, weight: 0.6, when: c => !!c.p.jobId && c.p.jobId !== 'gig' && c.p.jobYears >= 3 && c.age < 60,
    say: '「おめでとう、新部署の部長だ。…ただ、その部署は一年後に解散する」', speaker: '人事部長', text: '昇進の内示——だと思ったら、とんでもない条件つきだった。',
    choices: [
      { icon: '🎲', label: '引き受けて立て直す', hint: '大成功か、職を失うか', run: c => { if (c.chance(0.4 + c.p.stats.dis / 200)) { c.p.rank = Math.min(4, c.p.rank + 2); c.rep(8); c.happy(8); return '部署は存続。あなたは社内の伝説になった。'; } c.loseJob('部署解散'); c.stress(10); return '奮闘むなしく部署は消えた。'; } },
      { icon: '🔄', label: '別の部署を逆提案する', hint: '社交が高いほど好転', run: c => { if (c.chance(0.3 + c.p.stats.soc / 150)) { c.p.rank = Math.min(4, c.p.rank + 1); return '交渉成功。普通の昇進を勝ち取った。'; } c.stress(4); return '話は流れた。'; } },
      { icon: '🙇', label: '丁重に断る', hint: '上司の評価↓', fx: { stress: 2 } },
    ] },
];
