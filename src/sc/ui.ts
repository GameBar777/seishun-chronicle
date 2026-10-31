import type { GameState, Difficulty, Job, StatKey } from './types';
import { STAT_LABEL } from './types';
import { HEROINES, HMAP, LOCATIONS, OUTFITS, JOBS } from './data/index';
import { newGame, view, resolve, doWeek, actions, phone, stage, tierOf, setJob, buyOutfit, PERSONAS, DIFF, judgeEnding, type Line, STAGES } from './engine';
import { cal, fmtDate, LAST_WEEK, season } from './time';
import { chatReply, SUGGEST } from './chat';
import { exportSave, importSave, store } from './save';
import { speak, stop, defaultSettings, type VoiceSettings, hasJapaneseVoice, voiceSupported, testName } from './voice';
import * as audio from './audio';

let S: GameState | null = null;
let set: VoiceSettings = loadSettings();
let chatCount = 0;
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
function loadSettings(): VoiceSettings { try { return { ...defaultSettings(), ...JSON.parse(localStorage.getItem('seishun:set') || '{}') }; } catch { return defaultSettings(); } }
function saveSettings() { try { localStorage.setItem('seishun:set', JSON.stringify(set)); } catch { } audio.setVolumes(set.master, set.bgm, set.se); }
const app = () => $('#app');

export function boot() { audio.setVolumes(set.master, set.bgm, set.se); title(); }

// ───────── タイトル ─────────
function title() {
  stop(); audio.stopBgm(); S = null;
  app().innerHTML = `<div class="title"><div class="logo"><small>星見ヶ丘学園</small><h1>青春クロニクル</h1><p>～君と過ごした1000日間～</p></div>
  <div class="menu"><button id="t-new">はじめから</button><button id="t-cont" ${store.has('auto') ? '' : 'disabled'}>つづきから（オートセーブ）</button><button id="t-load">セーブ文字列から再開</button><button id="t-set">音声・音量設定</button><button id="t-help">遊び方</button></div>
  <p class="note">全156週（高校3年間）。1周の目安 2〜4時間。音声は端末内蔵の読み上げ機能（Web Speech API）で、AI音声ではありません。</p></div>`;
  $('#t-new').onclick = () => { audio.resume(); setup(); };
  $('#t-cont').onclick = () => { const g = store.load('auto'); if (g) { S = g; audio.resume(); main(); } };
  $('#t-load').onclick = () => loadDialog();
  $('#t-set').onclick = () => settings();
  $('#t-help').onclick = () => modal('遊び方', helpText());
}
function helpText() {
  return `<p>毎週「電話（任意・1回）」→「平日の行動を1つ」選ぶと1週間が進みます。行動で能力が伸び、ヒロインとの出会い・イベントが起きます。</p>
  <ul><li>ヒロインには「友好・ときめき・傷心・信頼」があります。放っておくと<b>傷心</b>が溜まり💣<b>爆弾</b>に。電話や会話でケアしないと爆発して悪い噂が広まります。</li>
  <li>電話で日曜のデートに誘えます（場所・天気・服装・会話の受け答えで評価）。同じ場所ばかりだと飽きられます。</li>
  <li>「ヒロインと交流」を選ぶと<b>自由入力</b>で会話できます（端末内のキーワード判定。褒める・約束・謝る・好きな話題など。言ったことは覚えています）。</li>
  <li>2年目からライバルが現れます。卒業時、ときめき・信頼・個別イベント・隠し条件でエンディングが決まります。</li>
  <li>下の入力欄で番号やコマンド：<code>SAVE</code> <code>LOAD</code> <code>STATUS</code> <code>RELATION</code> <code>SCHEDULE</code> <code>DIARY</code> <code>HELP</code></li></ul>`;
}

// ───────── 主人公設定 ─────────
function setup() {
  const days = (m: number) => new Date(2010, m, 0).getDate();
  app().innerHTML = `<div class="panel setup"><h2>主人公の設定</h2>
  <div class="row"><label>姓<input id="s-sei" value="相沢" maxlength="6"></label><label>名<input id="s-mei" value="悠斗" maxlength="6"></label></div>
  <div class="row"><label>せい（読み）<input id="s-sy" value="あいざわ" maxlength="12"></label><label>めい（読み）<input id="s-my" value="ゆうと" maxlength="12"></label><button id="s-test" type="button">🔊 呼ばれ方を試聴</button></div>
  <p class="note">読み仮名はヒロインが名前を呼ぶときの読み上げに使います（ひらがな推奨）。</p>
  <div class="row"><label>誕生日<select id="s-bm">${Array.from({ length: 12 }, (_, i) => `<option ${i === 3 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select>月<select id="s-bd">${Array.from({ length: 31 }, (_, i) => `<option>${i + 1}</option>`).join('')}</select>日</label></div>
  <div class="row"><label>性格<select id="s-p">${Object.keys(PERSONAS).map(p => `<option>${p}</option>`).join('')}</select></label>
  <label>見た目<select id="s-look"><option>爽やか系</option><option>メガネ知的系</option><option>スポーツ刈り</option><option>無造作ヘア</option><option>前髪長め</option></select></label></div>
  <div class="row"><label>難易度<select id="s-diff">${(Object.keys(DIFF) as Difficulty[]).map(d => `<option value="${d}" ${d === 'NORMAL' ? 'selected' : ''}>${d}：${DIFF[d].label}</option>`).join('')}</select></label></div>
  <div class="row"><button id="s-go" class="primary">入学する</button><button id="s-back">戻る</button></div></div>`;
  void days;
  $('#s-back').onclick = title;
  $('#s-test').onclick = () => { if (!testName($<HTMLInputElement>('#s-my').value || $<HTMLInputElement>('#s-mei').value, set)) toast(voiceSupported() ? '日本語音声が見つかりません（文字のみで遊べます）' : 'このブラウザは読み上げに未対応です'); };
  $('#s-go').onclick = () => {
    const v = (id: string) => ($<HTMLInputElement>(id).value || '').trim();
    if (!v('#s-sei') || !v('#s-mei')) return toast('姓と名を入力してください');
    S = newGame({ sei: v('#s-sei'), mei: v('#s-mei'), seiYomi: v('#s-sy'), meiYomi: v('#s-my'), bm: +v('#s-bm'), bd: +v('#s-bd'), persona: v('#s-p'), look: v('#s-look'), diff: v('#s-diff') as Difficulty });
    main();
  };
}

// ───────── メイン ─────────
function main() {
  if (!S) return title();
  store.save('auto', S);
  audio.playBgm(season(cal(S.week).m));
  if (S.queue.length) return scene();
  if (S.ended) return title();
  const s = S, c = cal(s.week);
  const acts = actions(s);
  app().innerHTML = `${hud()}
  <div class="grid"><div class="panel"><h3>今週の行動 <small>（番号でも入力可）</small></h3><div class="acts">${acts.map((a, i) => `<button class="act" data-a="${a.id}" ${a.ok || s.sick ? '' : 'disabled'} title="${esc(a.desc)}"><b>${i + 1}</b> ${esc(a.label)}<small>${esc(a.ok ? a.desc : a.why || '')}</small></button>`).join('')}</div>
  <div id="talkpick" class="hidden"><p>誰と話す？</p>${HEROINES.filter(h => s.hs[h.id].met && !s.hs[h.id].withRival).map(h => `<button class="tp" data-h="${h.id}" style="border-color:${h.color}">${h.sei}${h.mei}</button>`).join('')}</div></div>
  <div class="panel"><h3>📱 電話 <small>${s.phoneUsed ? '今週は使用済み' : '週1回'}</small></h3>
   <div class="row"><select id="ph-h"><option value="kenta">早乙女健太（情報）</option>${HEROINES.filter(h => s.hs[h.id].met && !s.hs[h.id].withRival).map(h => `<option value="${h.id}">${h.sei}${h.mei}${s.hs[h.id].bomb ? ' 💣' : ''}</option>`).join('')}</select></div>
   <div class="row"><button id="ph-talk" ${s.phoneUsed ? 'disabled' : ''}>話す（傷心ケア）</button></div>
   <div class="row"><select id="ph-loc">${Object.entries(LOCATIONS).map(([k, L]) => `<option value="${k}">${L.name}（${L.cost}円${L.outdoor ? '・屋外' : ''}）</option>`).join('')}</select><button id="ph-inv" ${s.phoneUsed || s.dateBooked ? 'disabled' : ''}>日曜デートに誘う</button></div>
   ${s.dateBooked ? `<p class="note">📅 今週日曜：${HMAP[s.dateBooked.h].sei}${HMAP[s.dateBooked.h].mei}と${LOCATIONS[s.dateBooked.loc].name}</p>` : ''}
   <h3>🛍 ショップ・バイト</h3>
   <div class="row"><select id="sh-o">${Object.entries(OUTFITS).filter(([k]) => !s.outfits.includes(k)).map(([k, O]) => `<option value="${k}">${k}（${O.cost}円・容姿+${O.yo}）</option>`).join('')}</select><button id="sh-buy">服を買う</button></div>
   <div class="row"><select id="jb">${['', ...Object.keys(JOBS)].map(j => `<option value="${j}" ${s.job === j ? 'selected' : ''}>${j ? `${j}（${JOBS[j].pay}円/週）` : 'バイトしない'}</option>`).join('')}</select><button id="jb-set">バイト先を変更</button></div>
  </div></div>
  <div class="panel log" id="log">${(s.lastLog.length ? s.lastLog : ['新しい一週間が始まる。']).map(l => `<div>${esc(l)}</div>`).join('')}</div>
  ${cmdBar()}`;
  document.querySelectorAll<HTMLButtonElement>('.act').forEach(b => b.onclick = () => act(b.dataset.a!));
  document.querySelectorAll<HTMLButtonElement>('.tp').forEach(b => b.onclick = () => week('talk', b.dataset.h));
  $('#ph-talk').onclick = () => call('talk'); $('#ph-inv').onclick = () => call('invite');
  $('#sh-buy').onclick = () => { const o = $<HTMLSelectElement>('#sh-o').value; if (!o) return; if (buyOutfit(s, o)) { toast(`${o}の服を買った`); main(); } else toast('お金が足りない'); };
  $('#jb-set').onclick = () => { setJob(s, $<HTMLSelectElement>('#jb').value as Job | ''); toast('バイト先を変更した'); main(); };
  bindCmd(); void c;
}
function act(id: string) {
  if (id === 'talk') { $('#talkpick').classList.toggle('hidden'); return; }
  week(id);
}
function week(id: string, talkTo?: string) {
  if (!S) return; audio.se('select');
  const res = doWeek(S, id, talkTo); S.lastLog = res; chatCount = 0;
  if (res.some(r => r.includes('💥'))) audio.se('bomb');
  main();
}
function call(mode: 'talk' | 'invite') {
  if (!S) return; const id = $<HTMLSelectElement>('#ph-h').value; const loc = $<HTMLSelectElement>('#ph-loc').value;
  const lines = phone(S, id, mode, loc); playLines('📱 電話', lines, () => main());
}
function hud() {
  const s = S!, c = cal(s.week);
  const bar = (k: StatKey) => `<div class="st"><span>${STAT_LABEL[k]}</span><i style="width:${Math.min(100, s.stats[k] / (k === 'hp' || k === 'st' || k === 'moral' ? 1 : 3))}%"></i><b>${Math.round(s.stats[k])}</b></div>`;
  const hs = HEROINES.filter(h => s.hs[h.id].met).map(h => { const x = s.hs[h.id]; return `<span class="hchip" style="border-color:${h.color}" title="友好${Math.round(x.friend)} ときめき${Math.round(x.toki)} 傷心${Math.round(x.hurt)} 信頼${Math.round(x.trust)}">${h.mei}<small>${x.withRival ? '💔' : stage(x)}</small>${x.bomb ? '💣' : ''}</span>`; }).join('');
  return `<div class="hud"><div class="date"><b>${c.Y}年生</b> ${fmtDate(s.week)} <small>第${s.week + 1}/${LAST_WEEK}週・${s.weather}・${c.term}</small></div>
  <div class="money">💴 ${s.money.toLocaleString()}円　${s.club}${s.job ? '／' + s.job : ''}${s.course ? '／志望:' + s.course : ''}${s.sick ? ' 🤒' : ''}${s.injury ? ' 🩹' : ''}${s.slump ? ' 🌀' : ''}${s.rumor ? ' 📢悪い噂' : ''}</div>
  <div class="stats">${(['bun', 'ri', 'gei', 'yo', 'un', 'kon', 'hp', 'st'] as StatKey[]).map(bar).join('')}</div><div class="hs">${hs}</div></div>`;
}

// ───────── シーン ─────────
function scene() {
  const s = S!; const v = view(s);
  if (!v) return main();
  if (v.kind === 'ending') audio.playBgm('春');
  const done = (lines: Line[]) => { if (lines.length) playLines(v.title, lines, () => main()); else main(); };
  const choose = () => {
    if (v.kind === 'chat') return chatBox(v.h!);
    if (v.kind === 'ending') return endingBox();
    showChoices(v.choices, i => { audio.se('select'); done(resolve(s, i)); });
  };
  playLines(v.title, v.lines, choose, v.h);
}
let typing: any = null;
function playLines(title: string, lines: Line[], after: () => void, h?: string) {
  let i = 0;
  app().innerHTML = `${S ? hud() : ''}<div class="stage" ${h ? `style="--hc:${HMAP[h].color}"` : ''}><div class="sc-title">${esc(title)}</div>${h ? portrait(h) : ''}
  <div class="box" id="box"><div class="name" id="nm"></div><div class="text" id="tx"></div><div class="hint">クリック / Enter で進む</div></div><div id="ch" class="choices"></div></div>${cmdBar()}`;
  bindCmd();
  const box = $('#box');
  const next = () => {
    if (typing) { clearInterval(typing); typing = null; $('#tx').textContent = lines[i - 1].text; return; }
    if (i >= lines.length) { box.onclick = null; document.onkeydown = null; stop(); after(); return; }
    const L = lines[i++]; stop();
    $('#nm').textContent = L.name; $('#nm').style.color = L.color; $('#tx').className = 'text ' + (L.who === 'n' ? 'narr' : '');
    const tier = HMAP[L.who] && S ? tierOf(S.hs[L.who]) : 0;
    speak(L.who, L.voice, L.emo, tier, set);
    const em = $('#emo'); if (em) em.textContent = emoIcon(L.emo);
    const t = L.who === 'n' || !L.name ? L.text : `「${L.text}」`;
    if (set.textSpeed <= 0) { $('#tx').textContent = t; return; }
    let k = 0; $('#tx').textContent = '';
    typing = setInterval(() => { k++; $('#tx').textContent = t.slice(0, k); if (k >= t.length) { clearInterval(typing); typing = null; } }, set.textSpeed);
    lines[i - 1] = { ...L, text: t };
  };
  box.onclick = next; document.onkeydown = e => { if ((e.target as HTMLElement)?.tagName === 'INPUT') return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } };
  next();
}
const emoIcon = (e: string) => ({ 通常: '', 嬉: '♪', 照: '💗', 怒: '💢', 哀: '💧', 驚: '❗', 嫉: '💦', 囁: '…', 告: '💓', 冷: '❄' } as any)[e] || '';
function portrait(h: string) {
  const H = HMAP[h], x = S!.hs[h];
  return `<div class="portrait" style="background:${H.color}"><div class="ini">${H.mei[0]}</div><div id="emo" class="emo"></div><div class="pi">${H.sei}${H.mei}<small>${stage(x)}　呼び方:「${H.call[x.callTier].replace('{S}', S!.setup.sei).replace('{M}', S!.setup.mei)}」</small></div></div>`;
}
function showChoices(ch: string[], pick: (i: number) => void) {
  const el = $('#ch'); el.innerHTML = ch.map((c, i) => `<button data-i="${i}"><b>${i + 1}</b> ${esc(c)}</button>`).join('');
  el.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.onclick = () => pick(+b.dataset.i!));
  document.onkeydown = e => { if ((e.target as HTMLElement)?.tagName === 'INPUT') return; const n = +e.key; if (n >= 1 && n <= ch.length) pick(n - 1); };
  numberPick = pick; numberMax = ch.length;
}
let numberPick: ((i: number) => void) | null = null, numberMax = 0;
function chatBox(h: string) {
  const H = HMAP[h];
  $('#ch').innerHTML = `<div class="chat"><p class="note">${H.sei}${H.mei}に話しかける（あと${3 - chatCount}回）。自由に入力してください。</p>
  <div class="row"><input id="ci" placeholder="例：${SUGGEST[chatCount % SUGGEST.length]}" maxlength="60"><button id="cs" class="primary">話す</button><button id="ce">会話を終える</button></div>
  <div class="sugg">${SUGGEST.map(x => `<button class="sg">${x}</button>`).join('')}</div></div>`;
  const send = () => {
    const t = $<HTMLInputElement>('#ci').value.trim(); if (!t || !S) return;
    chatCount++;
    const me: Line = { who: 'me', name: `${S.setup.sei} ${S.setup.mei}`, emo: '通常', text: t, voice: t, color: '#0984e3' };
    const out = [me, ...chatReply(S, h, t)];
    playLines(`${H.sei}${H.mei}と話す`, out, () => { if (chatCount >= 3) { resolve(S!, 0); main(); } else { scene(); } }, h);
  };
  $('#cs').onclick = send; $<HTMLInputElement>('#ci').onkeydown = e => { if (e.key === 'Enter') send(); };
  document.querySelectorAll<HTMLButtonElement>('.sg').forEach(b => b.onclick = () => { $<HTMLInputElement>('#ci').value = b.textContent!; $<HTMLInputElement>('#ci').focus(); });
  $('#ce').onclick = () => { resolve(S!, 0); main(); };
  $<HTMLInputElement>('#ci').focus();
}
function endingBox() {
  const e = judgeEnding(S!);
  $('#ch').innerHTML = `<div class="panel"><h2>🌸 ${esc(e.title)}</h2><p>おつかれさまでした。</p><div class="row"><button id="e-t" class="primary">タイトルへ</button><button id="e-s">最終セーブ文字列</button></div></div>`;
  $('#e-t').onclick = () => { resolve(S!, 0); store.save('auto', S!); try { localStorage.removeItem('seishun:slotauto'); } catch { } title(); };
  $('#e-s').onclick = () => modal('SAVE', `<textarea readonly class="savestr">${exportSave(S!)}</textarea>`);
}

// ───────── コマンド ─────────
function cmdBar() { return `<div class="cmd"><input id="cmd" placeholder="番号 / SAVE LOAD STATUS RELATION SCHEDULE DIARY HELP"><button id="cmd-go">実行</button><button id="b-set">⚙</button><button id="b-title">タイトル</button></div>`; }
function bindCmd() {
  const run = () => { const v = $<HTMLInputElement>('#cmd').value.trim(); $<HTMLInputElement>('#cmd').value = ''; command(v); };
  $('#cmd-go').onclick = run; $<HTMLInputElement>('#cmd').onkeydown = e => { if (e.key === 'Enter') run(); };
  $('#b-set').onclick = settings; $('#b-title').onclick = () => { if (confirm('タイトルに戻りますか？（オートセーブ済み）')) title(); };
}
export function command(raw: string) {
  const v = raw.toUpperCase().replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xfee0));
  if (!S) return;
  const n = parseInt(v, 10);
  if (!isNaN(n)) {
    if (S.queue.length && numberPick && n >= 1 && n <= numberMax) return numberPick(n - 1);
    if (!S.queue.length) { const a = actions(S)[n - 1]; if (a) return act(a.id); }
    return toast('その番号はありません');
  }
  switch (v) {
    case 'SAVE': return modal('SAVE（この文字列をコピーして保存）', `<textarea readonly class="savestr" onclick="this.select()">${exportSave(S)}</textarea><p class="note">別の端末・ブラウザで「LOAD」に貼り付けると再開できます。オートセーブもこの端末に保存済み。</p>`);
    case 'LOAD': return loadDialog();
    case 'STATUS': return modal('STATUS', statusHtml());
    case 'RELATION': return modal('RELATION', relationHtml());
    case 'SCHEDULE': return modal('SCHEDULE', scheduleHtml());
    case 'DIARY': return modal('DIARY', `<div class="diary">${S.diary.slice().reverse().map(d => `<div><small>${fmtDate(d.week)}</small> ${esc(d.text)}</div>`).join('')}</div>`);
    case 'HELP': return modal('HELP', helpText());
    default: return toast('不明なコマンド：HELP で一覧');
  }
}
function statusHtml() {
  const s = S!; return `<table>${(Object.keys(STAT_LABEL) as StatKey[]).map(k => `<tr><th>${STAT_LABEL[k]}</th><td>${Math.round(s.stats[k])}</td></tr>`).join('')}<tr><th>所持金</th><td>${s.money}円</td></tr><tr><th>部活</th><td>${s.club}</td></tr><tr><th>バイト</th><td>${s.job || 'なし'}（${s.jobDays}日）</td></tr><tr><th>服</th><td>${s.outfits.join('、')}</td></tr><tr><th>難易度</th><td>${s.setup.diff}</td></tr><tr><th>テスト</th><td>${s.exams.map(e => e.rank + '位').join(' → ') || '-'}</td></tr></table>`;
}
function relationHtml() {
  const s = S!; return `<table class="rel"><tr><th></th><th>段階</th><th>友好</th><th>ときめき</th><th>傷心</th><th>信頼</th><th>デート</th><th>呼び方</th></tr>${HEROINES.map(H => { const x = s.hs[H.id]; if (!x.met) return `<tr><td>？？？</td><td colspan=7>未登場</td></tr>`; return `<tr><td style="color:${H.color}">${H.sei}${H.mei}${x.bomb ? '💣' : ''}${x.withRival ? '💔' : ''}</td><td>${stage(x)}</td><td>${Math.round(x.friend)}</td><td>${Math.round(x.toki)}</td><td>${Math.round(x.hurt)}</td><td>${Math.round(x.trust)}</td><td>${x.dates}</td><td>${H.call[x.callTier].replace('{S}', s.setup.sei).replace('{M}', s.setup.mei)}</td></tr>`; }).join('')}</table><p class="note">段階：${STAGES.join(' → ')}</p>`;
}
function scheduleHtml() {
  const s = S!; const ev: string[] = [];
  for (let w = s.week; w < Math.min(LAST_WEEK, s.week + 10); w++) { const c = cal(w); const marks: string[] = []; if ((c.m === 5 && c.n === 3) || (c.m === 7 && c.n === 2) || (c.m === 10 && c.n === 3) || (c.m === 12 && c.n === 1) || (c.m === 2 && c.n === 4 && c.Y <= 2)) marks.push('定期テスト'); for (const H of HEROINES) if (s.hs[H.id].met && H.birthday[0] === c.m && H.birthday[1] >= c.date.getDate() && H.birthday[1] < c.date.getDate() + 7) marks.push(`🎂${H.mei}`); if (c.vacation) marks.push('休み'); ev.push(`<div><small>${fmtDate(w)}</small> ${marks.join('・') || '-'}</div>`); }
  return `<p>今後10週</p>${ev.join('')}<p class="note">年間行事：4月部活/5月GW・体育祭/7月夏休み・夏祭り/8月海・花火/10-11月文化祭/修学旅行(2年)/12月クリスマス/1月初詣/2月バレンタイン/3月卒業式</p>`;
}
function loadDialog() {
  modal('LOAD（セーブ文字列を貼り付け）', `<textarea id="ld" class="savestr" placeholder="SEISHUN1:..."></textarea><button id="ld-go" class="primary">読み込む</button>`);
  $('#ld-go').onclick = () => { try { S = importSave($<HTMLTextAreaElement>('#ld').value); closeModal(); toast('ロードしました'); main(); } catch (e: any) { toast(e.message); } };
}
function settings() {
  const ja = hasJapaneseVoice();
  const r = (k: keyof VoiceSettings, label: string, min = 0, max = 1, step = 0.05) => `<label>${label}<input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${set[k]}"></label>`;
  modal('音声・音量設定', `<p class="note">${voiceSupported() ? (ja ? '✅ 日本語の読み上げ音声が使えます（端末内蔵・Web Speech API）。' : '⚠ 日本語音声が見つかりません。文字のみ表示になります。') : '⚠ このブラウザは読み上げ非対応です。文字のみ表示になります。'}　※AI音声ではありません。</p>
  <label><input type="checkbox" id="st-auto" ${set.auto ? 'checked' : ''}> ボイス自動再生</label> <label><input type="checkbox" id="st-nar" ${set.narrate ? 'checked' : ''}> 地の文も読み上げ</label>
  <div class="sliders">${r('master', '全体音量')}${r('voice', 'ボイス音量')}${r('bgm', 'BGM音量')}${r('se', '効果音音量')}${r('voiceRate', '声の速さ', 0.6, 1.6, 0.05)}${r('textSpeed', '文字送り（ms/文字・0で瞬時）', 0, 80, 5)}</div>
  <h4>キャラ別音量</h4><div class="sliders">${HEROINES.map(H => `<label>${H.sei}${H.mei}<input type="range" data-c="${H.id}" min="0" max="1" step="0.05" value="${set.perChar[H.id] ?? 1}"><button class="vt" data-c="${H.id}">試聴</button></label>`).join('')}</div>`);
  document.querySelectorAll<HTMLInputElement>('[data-k]').forEach(i => i.oninput = () => { (set as any)[i.dataset.k!] = +i.value; saveSettings(); });
  document.querySelectorAll<HTMLInputElement>('input[data-c]').forEach(i => i.oninput = () => { set.perChar[i.dataset.c!] = +i.value; saveSettings(); });
  document.querySelectorAll<HTMLButtonElement>('.vt').forEach(b => b.onclick = () => { const H = HMAP[b.dataset.c!]; stop(); speak(H.id, H.greet[1][0].replace(/\{[SMC]\}/g, ''), '嬉', 1, { ...set, auto: true }); });
  $<HTMLInputElement>('#st-auto').onchange = e => { set.auto = (e.target as HTMLInputElement).checked; saveSettings(); };
  $<HTMLInputElement>('#st-nar').onchange = e => { set.narrate = (e.target as HTMLInputElement).checked; saveSettings(); };
}
function modal(t: string, html: string) {
  closeModal(); const d = document.createElement('div'); d.className = 'modal'; d.id = 'modal';
  d.innerHTML = `<div class="mbox"><div class="mh"><b>${esc(t)}</b><button id="m-x">×</button></div><div class="mb">${html}</div></div>`;
  document.body.appendChild(d); $('#m-x').onclick = closeModal; d.onclick = e => { if (e.target === d) closeModal(); };
}
function closeModal() { document.getElementById('modal')?.remove(); }
function toast(t: string) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); }
