import type { GameState, Difficulty, Job, StatKey } from './types';
import { STAT_LABEL } from './types';
import { HEROINES, HMAP, LOCATIONS, OUTFITS, JOBS } from './data/index';
import { newGame, view, resolve, doWeek, actions, phone, stage, tierOf, setJob, buyOutfit, PERSONAS, DIFF, judgeEnding, type Line, STAGES } from './engine';
import { cal, fmtDate, LAST_WEEK, season } from './time';
import { chatReply, SUGGEST } from './chat';
import { exportSave, importSave, store } from './save';
import { speak, stop, defaultSettings, type VoiceSettings, hasJapaneseVoice, voiceSupported, testName, initVoice, unlockVoice, preloadClip, isSpeaking, hasClip } from './voice';
import { voiceId } from './engine';
import * as audio from './audio';
import { bgmForAct, bgmForScene } from './bgm';
import { setBg, guessBg, pickBg, LOC_BG, type Tod } from './bg';
import { CG_LIST, CG_MAP, cgSeen } from './data/cg';
import { backlog, backlogHtml } from './backlog';
import { snap, diffStats, diffHearts, rank, fmtDelta, weekCard, SHOWN, BAR, type Snap , logTone, effectParts } from './progress';
import { replayClip } from './voice';
const BASE = (import.meta as any).env?.BASE_URL ?? '/';
const TRANS: Record<string, number> = { 春: 0, 夏: 2, 秋: -2, 冬: -4 };
const seasonNow = () => S ? season(cal(S.week).m) : '春';
function bgFor(key: string, tod?: Tod) { setBg(key, { season: seasonNow(), weather: S ? S.weather : '晴れ', tod }); }

let S: GameState | null = null;
let set: VoiceSettings = loadSettings();
void initVoice(BASE);
if (typeof document !== 'undefined') { const u = () => { unlockVoice(); ['pointerdown', 'keydown', 'touchend'].forEach(e => document.removeEventListener(e, u, true)); }; ['pointerdown', 'keydown', 'touchend'].forEach(e => document.addEventListener(e, u, true)); }
let chatCount = 0;
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
function loadSettings(): VoiceSettings { try { return { ...defaultSettings(), ...JSON.parse(localStorage.getItem('seishun:set') || '{}') }; } catch { return defaultSettings(); } }
function saveSettings() { try { localStorage.setItem('seishun:set', JSON.stringify(set)); } catch { } audio.setVolumes(set.master, set.bgm, set.se); }
const app = () => $('#app');

export function boot() { audio.setBase(BASE); audio.installUnlock(); audio.setVolumes(set.master, set.bgm, set.se); audio.preloadSe(); title(); }

// ───────── タイトル ─────────
function title() {
  cgOff(); stop(); audio.stopBgm(); S = null; setBg('key', { season: '春', weather: '晴れ', tod: 'day' });
  if (!audio.songElement()?.loop) audio.stopSong();
  void audio.titleSong(BASE).then(ok => { if (ok || S) return; const h = document.createElement('div'); h.className = 'tapstart'; h.textContent = '🔊 タップで主題歌スタート'; document.querySelector('.title')?.appendChild(h);
    // iOS Safari は touchend/click をユーザー操作として扱うため複数イベントで解錠を試みる
    const EVS = ['touchend', 'click', 'pointerup', 'keydown'];
    const go = () => { if (!S) audio.unlockTitleSong(BASE); setTimeout(() => { if (audio.songPlaying() || audio.titleFallbackOn() || S) { EVS.forEach(e => document.removeEventListener(e, go, true)); h.remove(); } }, 300); };
    EVS.forEach(e => document.addEventListener(e, go, true)); });
  app().innerHTML = `<div class="title"><div class="rays"></div><div class="logo"><small>星見ヶ丘学園</small><h1>青春クロニクル</h1><p>～君と過ごした1000日間～</p></div>
  <div class="menu"><button id="t-new">はじめから</button><button id="t-cont" ${store.has('auto') ? '' : 'disabled'}>つづきから（オートセーブ）</button><button id="t-load">セーブ文字列から再開</button><button id="t-set">音声・音量設定</button><button id="t-song">🎵 主題歌</button><button id="t-cg">🖼 CGモード</button><button id="t-help">遊び方</button></div>
  <p class="note">全${LAST_WEEK}週（高校3年間）。1周の目安 約4時間。ヒロイン・芽衣・健太・井上・真鍋先生はボイスつき（ElevenLabsで生成したAI音声）。<br><span class="credit">音楽：<a href="https://maou.audio/" target="_blank" rel="noopener">魔王魂</a>（CC BY 4.0）／効果音：<a href="https://soundeffect-lab.info/" target="_blank" rel="noopener">効果音ラボ</a>・<a href="https://maou.audio/" target="_blank" rel="noopener">魔王魂</a></span></p></div>`;
  $('#t-new').onclick = () => { audio.resume(); setup(); };
  $('#t-cont').onclick = () => { const g = store.load('auto'); if (g) { S = g; syncCg(); audio.resume(); main(); } };
  $('#t-load').onclick = () => loadDialog();
  $('#t-set').onclick = () => settings();
  $('#t-help').onclick = () => modal('遊び方', helpText());
  $('#t-song').onclick = () => themeSong();
  $('#t-cg').onclick = () => cgGallery();
}
const SONG_LYRICS: [number, string][] = [[0, '止まらない この鼓動 今 走り出す'], [13, '迷い込んだ この世界で 答えを探してた'], [20, '小さな光 見つけた時 君が笑ってた'], [27, 'もう一歩 踏み出せば 変わり始める'], [34, '輝いて Shine again'], [37, '何度でも立ち上がれ'], [41, '涙さえ 超えてゆける'], [46, '君となら 走り出せ'], [50, '今すぐに 未来を掴みに行こう'], [56, '響いてるこの想い どこまでも'], [64, '不安だってあるけれど 止まれはしないから'], [71, '繋いだ手を離さないで 前を向いていく'], [78, '遠くでも届くまで 歌い続ける'], [85, '輝いて Shine again 何度でも立ち上がれ'], [92, '壊れその夜の先に 光がある'], [99.5, '止まらないこの鼓動 明日へ繋いで行こう'], [106.7, '変わらないこの想い 抱きしめて'], [113.8, 'どんな未来でも'], [118.8, '君となら行ける'], [124.8, '輝いて Shine again'], [127.8, '限界を超えていけ'], [131.8, '涙さえ力になる'], [136.8, '信じてる'], [138.8, '走り出せ 今すぐに'], [142.8, '新しい空の下 終わらない'], [148.1, 'この歌を届けよう'], [157.3, 'また光る未来へ']];
function themeSong() {
  audio.resume();
  modal('🎵 主題歌', `<p class="note">提供音源（ボーカル入り）。歌詞は音声からの自動書き起こしのため、実際と異なる場合があります。</p>
  <div class="row"><button id="sg-play" class="primary">▶ 再生</button><button id="sg-stop">■ 停止</button><label><input type="checkbox" id="sg-loop"> ループ</label><label><input type="checkbox" id="sg-ly" checked> 歌詞を表示</label></div>
  <div class="lyrics">${SONG_LYRICS.map(([, l], i) => `<p data-i="${i}">${esc(l)}</p>`).join('')}</div><div class="bar"><i id="ly-bar"></i></div><p class="note">音量は「音声・音量設定」のBGM音量に連動します。</p>`);
  const loopEl = $('#sg-loop') as HTMLInputElement, lyEl = $('#sg-ly') as HTMLInputElement; loopEl.checked = true;
  // タイトルで流れている主題歌をそのまま使う（二重再生しない）
  const start = () => { const a = audio.songElement(); if (a) { a.loop = loopEl.checked; a.play().catch(() => { }); } else { audio.titleSong(BASE).then(() => { const b = audio.songElement(); if (b) b.loop = loopEl.checked; }); } };
  $('#sg-play').onclick = () => { const a = audio.songElement(); if (a) a.currentTime = 0; start(); }; $('#sg-stop').onclick = () => { audio.songElement()?.pause(); };
  loopEl.onchange = () => { const a = audio.songElement(); if (a) a.loop = loopEl.checked; };
  lyEl.onchange = () => { (document.querySelector('.lyrics') as HTMLElement).style.display = lyEl.checked ? '' : 'none'; };
  start();
  const tick = () => { const m = document.querySelector('.lyrics'); if (!m) { const a = audio.songElement(); if (a) a.loop = true; if (!S && !audio.songPlaying()) audio.unlockTitleSong(BASE); return; }
    const a = audio.songElement(); const t = a ? a.currentTime : 0; let cur = -1; SONG_LYRICS.forEach(([s0], i) => { if (t >= s0) cur = i; });
    m.querySelectorAll('p').forEach((p, i) => p.classList.toggle('on', i === cur)); const on = m.querySelector('p.on') as HTMLElement | null; if (on) m.scrollTop = on.offsetTop - m.clientHeight / 2;
    const b = document.getElementById('ly-bar'); if (b && a && a.duration) b.style.width = Math.min(100, t / a.duration * 100) + '%'; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
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
  cgOff(); if (!S) return title();
  store.save('auto', S);
  if (S.queue.length) return scene();
  audio.playTrack(bgmForAct(S.lastAct, S.week)); bgFor(S.week % 2 ? 'classroom' : 'gate', 'day');
  if (S.ended) return title();
  const s = S, c = cal(s.week);
  const acts = actions(s);
  app().innerHTML = `${hud()}${crowd(s)}
  <div class="grid"><div class="panel"><h3>今週の行動 <small>（番号でも入力可）</small></h3><div class="acts">${acts.map((a, i) => `<button class="act" data-a="${a.id}" ${a.ok || s.sick ? '' : 'disabled'} title="${esc(a.desc)}"><b>${i + 1}</b> ${esc(a.label)}<small>${a.ok ? effectParts(a.desc).map(x => x.tone ? `<span class="ef ${x.tone}">${esc(x.t)}</span>` : esc(x.t)).join('') : esc(a.why || '')}</small></button>`).join('')}</div>
  <div id="talkpick" class="hidden"><p>誰と話す？</p>${HEROINES.filter(h => s.hs[h.id].met && !s.hs[h.id].withRival).map(h => `<button class="tp" data-h="${h.id}" style="border-color:${h.color}">${h.sei}${h.mei}</button>`).join('')}</div></div>
  <div class="panel"><h3>📱 電話 <small>${s.phoneUsed ? '今週は使用済み' : '週1回'}</small></h3>
   <div class="row"><select id="ph-h"><option value="kenta">早乙女健太（情報・相談）</option>${HEROINES.filter(h => s.hs[h.id].met && !s.hs[h.id].withRival).map(h => `<option value="${h.id}">${h.sei}${h.mei}${s.hs[h.id].bomb ? ' 💣' : ''}</option>`).join('')}</select></div>
   <div class="row"><button id="ph-talk" ${s.phoneUsed ? 'disabled' : ''}>話す（傷心ケア）</button></div>
   <div class="row"><select id="ph-loc">${Object.entries(LOCATIONS).map(([k, L]) => `<option value="${k}">${L.name}（${L.cost}円${L.outdoor ? '・屋外' : ''}）</option>`).join('')}</select><button id="ph-inv" ${s.phoneUsed || s.dateBooked ? 'disabled' : ''}>日曜デートに誘う</button></div>
   ${s.dateBooked ? `<p class="note">📅 今週日曜：${HMAP[s.dateBooked.h].sei}${HMAP[s.dateBooked.h].mei}と${LOCATIONS[s.dateBooked.loc].name}</p>` : ''}
   <h3>🛍 ショップ・バイト</h3>
   <div class="row"><select id="sh-o">${Object.entries(OUTFITS).filter(([k]) => !s.outfits.includes(k)).map(([k, O]) => `<option value="${k}">${k}（${O.cost}円・容姿+${O.yo}）</option>`).join('')}</select><button id="sh-buy">服を買う</button></div>
   <div class="row"><select id="jb">${['', ...Object.keys(JOBS)].map(j => `<option value="${j}" ${s.job === j ? 'selected' : ''}>${j ? `${j}（${JOBS[j].pay}円/週）` : 'バイトしない'}</option>`).join('')}</select><button id="jb-set">バイト先を変更</button></div>
  </div></div>
  <div class="panel log" id="log">${(s.lastLog.length ? s.lastLog : ['新しい一週間が始まる。']).map(l => `<div class="lg ${logTone(l)}">${esc(l)}</div>`).join('')}${lastDeltaHtml}</div>
  ${cmdBar()}`;
  document.querySelectorAll<HTMLButtonElement>('.act').forEach(b => b.onclick = () => act(b.dataset.a!));
  document.querySelectorAll<HTMLButtonElement>('.tp').forEach(b => b.onclick = () => week('talk', b.dataset.h));
  $('#ph-talk').onclick = () => call('talk'); $('#ph-inv').onclick = () => call('invite');
  $('#sh-buy').onclick = () => { const o = $<HTMLSelectElement>('#sh-o').value; if (!o) return; if (buyOutfit(s, o)) { toast(`${o}の服を買った`); main(); } else toast('お金が足りない'); };
  $('#jb-set').onclick = () => { setJob(s, $<HTMLSelectElement>('#jb').value as Job | ''); toast('バイト先を変更した'); main(); };
  document.querySelectorAll<HTMLElement>('.cw').forEach(b => b.onclick = () => { const id = b.dataset.h!; if (s.hs[id]?.met && !s.hs[id].withRival) week('talk', id); });
  bindCmd(); void c;
}
/** 週画面：周囲にいる人物（直前の行動ログに登場した子を優先＋週ごとに入れ替わる顔ぶれ） */
export function nearby(s: GameState, n = 3): string[] {
  const met = HEROINES.filter(h => s.hs[h.id].met && !s.hs[h.id].withRival);
  const log = s.lastLog.join(' ');
  const hit = met.filter(h => log.includes(h.mei) || log.includes(h.sei + h.mei));
  const rest = met.filter(h => !hit.includes(h)).sort((a, b) => ((a.id.charCodeAt(0) * 31 + s.week * 17) % 23) - ((b.id.charCodeAt(0) * 31 + s.week * 17) % 23));
  return [...hit, ...rest].slice(0, n).map(h => h.id);
}
function crowd(s: GameState) {
  const ids = nearby(s); if (!ids.length) return '';
  return `<div class="crowd"><div class="cwl">周囲にいる人物 <small>（タップで話しかける）</small></div>${ids.map((id, i) => { const H = HMAP[id], x = s.hs[id]; const e = x.hurt > 40 ? 's' : tierOf(x) >= 2 ? 'b' : tierOf(x) >= 1 ? 'h' : 'n'; return `<button class="cw" data-h="${id}" style="--hc:${H.color};--d:${i * 0.12}s;--ph:${i * 1.3}s"><span class="cwimg"><img src="${pSrc(id, e)}" alt=""></span><span class="cwn">${H.mei}<small>${x.withRival ? '💔' : stage(x)}</small></span></button>`; }).join('')}</div>`;
}
function act(id: string) {
  if (id === 'talk') { $('#talkpick').classList.toggle('hidden'); return; }
  week(id);
}
function week(id: string, talkTo?: string) {
  if (!S) return; audio.se('confirm');
  const before = snap(S); const ill0 = { c: S.cold, i: S.injury };
  const res = doWeek(S, id, talkTo); S.lastLog = res; chatCount = 0;
  setTimeout(() => weekSe(id, res, before, ill0), 250);
  const after = snap(S);
  lastDeltaHtml = deltaChips(before, after);
  main();
  if (after.week !== before.week) weekFlip(before.week, after.week, () => showDelta(before, after));
  else showDelta(before, after);
}
/** 週の行動結果に合わせた効果音（風邪・ケガ・病院・休養・爆弾・ライバル・ステータス増減） */
function weekSe(id: string, res: string[], before: Snap, ill0: { c: unknown; i: unknown }) {
  if (!S) return; const t = res.join(' ');
  if (id === 'hospital') audio.se('hospital');
  else if (id === 'rest') audio.se('rest');
  if (!ill0.i && S.injury) return audio.se('injury');
  if (!ill0.c && S.cold) return audio.se('cold');
  if (t.includes('💥')) return audio.se('bomb');
  if (/和田|ライバル/.test(t)) return audio.se('rival');
  const ds = diffStats(before, snap(S)); const up = ds.filter(x => x.good).length, dn = ds.length - up;
  if (id !== 'hospital' && id !== 'rest') { if (up > dn) audio.se('statup', { vol: .7 }); else if (dn > up) audio.se('statdown', { vol: .7 }); }
}
function call(mode: 'talk' | 'invite') {
  if (!S) return; const id = $<HTMLSelectElement>('#ph-h').value; const loc = $<HTMLSelectElement>('#ph-loc').value;
  audio.se('phone');
  const lines = phone(S, id, mode, loc); bgFor('room', 'night'); audio.playTrack('night'); playLines('📱 電話', lines, () => main(), HMAP[id] || NPC_BY_ID[id] ? id : undefined);
}
function hud() {
  const s = S!, c = cal(s.week);
  const bar = (k: StatKey) => `<div class="st"><span>${STAT_LABEL[k]}</span><i style="width:${Math.min(100, s.stats[k] / (k === 'hp' || k === 'st' || k === 'moral' ? 1 : 3))}%"></i><b>${Math.round(s.stats[k])}</b></div>`;
  const hs = HEROINES.filter(h => s.hs[h.id].met).map(h => { const x = s.hs[h.id]; return `<span class="hchip" style="border-color:${h.color}" title="友好${Math.round(x.friend)} ときめき${Math.round(x.toki)} 傷心${Math.round(x.hurt)} 信頼${Math.round(x.trust)}">${h.mei}<small>${x.withRival ? '💔' : stage(x)}</small>${x.bomb ? '💣' : ''}</span>`; }).join('');
  return `<div class="hud"><div class="date"><b>${c.Y}年生</b> ${fmtDate(s.week)} <small>第${s.week + 1}/${LAST_WEEK}週・${s.weather}・${c.term}</small></div>
  <div class="money">💴 ${s.money.toLocaleString()}円　${s.club}${s.job ? '／' + s.job : ''}${s.course ? '／志望:' + s.course : ''}${s.sick ? ' 🤒寝込み' : ''}${s.cold ? ' 🤧風邪' : ''}${s.injury ? ' 🩹ケガ' : ''}${s.slump ? ' 🌀' : ''}${s.rumor ? ' 📢悪い噂' : ''}</div>
  <div class="stamina" style="margin:4px 0"><div style="display:flex;justify-content:space-between;font-size:12px"><b>💪 体力 ${Math.round(s.stats.hp)}%</b><span>${s.stats.hp >= 70 ? '元気' : s.stats.hp >= 50 ? 'ふつう' : s.stats.hp >= 30 ? '⚠ 疲れ気味' : '⚠⚠ ヘトヘト（故障注意）'}</span></div><div style="height:8px;background:#0003;border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:${Math.max(0, Math.min(100, s.stats.hp))}%;background:${s.stats.hp >= 50 ? '#4caf50' : s.stats.hp >= 30 ? '#ff9800' : '#e53935'}"></i></div></div>
  <div class="stats">${(['bun', 'ri', 'gei', 'yo', 'un', 'kon', 'st'] as StatKey[]).map(bar).join('')}</div><div class="hs">${hs}</div></div>`;
}

// ───────── シーン ─────────
function scene() {
  cgOff(); const s = S!; const v = view(s);
  if (!v) return main();
  const sc0 = s.queue[0]; const txt = v.title + ' ' + v.lines.map(l => l.text).join(' ');
  let sbg = '', stod: string | undefined;
  if (v.kind === 'date' && sc0?.data?.loc) { const loc = sc0.data.loc; sbg = LOC_BG[loc] || 'park'; stod = loc === 'festival' || loc === 'shrine' ? 'evening' : 'day'; bgFor(sbg, stod as Tod); }
  else if (v.kind === 'ending') { sbg = 'gate'; bgFor('gate', 'day'); } else { const fn = v.lines.find(l => l.who === 'n' && !l.text.startsWith('――'))?.text || v.title; const g = pickBg(sc0?.id || '', fn, [s.setup.sei, s.setup.mei, s.setup.seiYomi, s.setup.meiYomi], s.lastAct, sc0?.id === 'sister' || /^d_sis|^sis/.test(sc0?.id || '')); sbg = g.bg; stod = g.tod || (/夜/.test(txt) ? 'night' : /夕/.test(txt) ? 'evening' : 'day'); bgFor(g.bg, stod as Tod); }
  const sadN = v.lines.filter(l => l.emo === '哀' || l.emo === '怒').length;
  const conf = /告白|好きです|付き合/.test(txt) || v.lines.some(l => l.emo === '告');
  const rivalSc = /wada|rival/.test(sc0?.id || '') || v.lines.some(l => /和田|ライバル/.test(l.who || ''));
  audio.playTrack(bgmForScene({ kind: v.kind, title: v.title, text: txt, sadN, confess: conf, loc: sc0?.data?.loc, bg: sbg, tod: stod, season: seasonNow(), rival: rivalSc, endingId: v.kind === 'ending' ? (/バッド|と.*のエンディング/.test(v.title) && !/友情|グッド|トゥルー|告白成功|ノーマル|進路成功/.test(v.title) ? 'bad' : 'good') : undefined }));
  if (rivalSc && v.kind !== 'ending') audio.se('rival', { vol: .8 }); else if (v.kind === 'msg') audio.se('message'); else if (/チャイム|ホームルーム|始業|放課後/.test(v.title)) audio.se('bell', { vol: .6 }); else if (/^(room|living|classroom)/.test(sbg) && v.kind === 'event') audio.se('door', { vol: .6 });
  const done = (lines: Line[]) => { if (lines.length) playLines(v.title, lines, () => main()); else main(); };
  const choose = () => {
    if (v.kind === 'chat') return chatBox(v.h!);
    if (v.kind === 'ending') return endingBox();
    showChoices(v.choices, i => { audio.se('confirm'); done(resolve(s, i)); });
  };
  const isConf = /告白|好きです|付き合/.test(txt) || v.lines.some(l => l.emo === '告');
  const cg = v.kind === 'ending' ? 'ending' : (/告白/.test(v.title) || v.lines.some(l => l.emo === '告')) ? 'confess' : v.kind === 'date' && sc0?.data?.loc === 'festival' ? 'fireworks' : '';
  const stageCls = isConf ? 'confess' : v.kind === 'date' ? 'date' : v.kind === 'ending' ? 'ending' : '';
  const go = () => { playLines(v.title, v.lines, choose, v.h); if (stageCls) document.querySelector('.stage')?.classList.add(stageCls); };
  if (cg && !v.lines.some(l => l.who === 'cg')) showCG(cg, v.title, go); else go();
}
export const CGS = ['confess', 'ending', 'fireworks'];
function showCG(name: string, cap: string, after: () => void) {
  audio.se('doki');
  const el = document.createElement('div'); el.className = 'cg'; el.innerHTML = `<img src="${BASE}img/cg/${name}.webp" alt=""><div class="cgcap">${esc(cap)}</div><div class="hint">クリックで進む</div>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on'));
  let closed = false; const close = () => { if (closed) return; closed = true; el.classList.remove('on'); setTimeout(() => el.remove(), 600); document.removeEventListener('keydown', key); after(); };
  const key = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); close(); } };
  setTimeout(() => { el.onclick = close; document.addEventListener('keydown', key); }, 500);
}
// ───────── イベントCG（一枚絵） ─────────
const cgSmall = () => typeof innerWidth !== 'undefined' && Math.max(innerWidth, innerHeight) * (devicePixelRatio || 1) < 1100;
export const cgUrl = (id: string, small = cgSmall()) => `${BASE}img/cg/h/${id}${small ? '-s' : ''}.webp`;
export function preloadCgs(lines: Line[]) { for (const l of lines) if (l.who === 'cg' && CG_MAP[l.text]) { const im = new Image(); im.src = cgUrl(l.text); } }
function syncCg() { if (S) cgSeen.merge(S.flags.filter(f => f.startsWith('cg:')).map(f => f.slice(3))); }
function setCG(id: string) {
  if (!CG_MAP[id]) return;
  cgSeen.add(id); if (S && !S.flags.includes('cg:' + id)) S.flags.push('cg:' + id);
  const u = cgUrl(id); let el = document.getElementById('cgl');
  if (!el) { el = document.createElement('div'); el.id = 'cgl'; el.innerHTML = '<div class="cgblur"></div><img class="cgimg" alt="">'; document.body.appendChild(el); }
  (el.querySelector('.cgblur') as HTMLElement).style.backgroundImage = `url("${u}")`;
  const img = el.querySelector('.cgimg') as HTMLImageElement; img.alt = CG_MAP[id].title; el.dataset.id = id;
  el.classList.remove('on'); img.onload = () => requestAnimationFrame(() => el!.classList.add('on')); img.src = u; if (img.complete) requestAnimationFrame(() => el!.classList.add('on'));
  document.body.classList.add('cgmode');
}
function cgOff() {
  if (typeof document === 'undefined') return; document.body.classList.remove('cgmode');
  const el = document.getElementById('cgl'); if (el) { el.classList.remove('on'); el.id = ''; setTimeout(() => el.remove(), 600); }
}
function cgGallery() {
  const seen = new Set(cgSeen.all()); const by: Record<string, typeof CG_LIST> = {};
  for (const c of CG_LIST) (by[c.h] ||= []).push(c);
  const html = Object.entries(by).map(([h, cs]) => `<h4 style="color:${HMAP[h]?.color || '#333'}">${HMAP[h] ? HMAP[h].sei + HMAP[h].mei : h}　${cs.filter(c => seen.has(c.id)).length}/${cs.length}</h4><div class="cggrid">${cs.map(c => seen.has(c.id) ? `<button class="cgth" data-cg="${c.id}"><img src="${cgUrl(c.id, true)}" alt="${esc(c.title)}" loading="lazy"><span>${esc(c.title)}</span></button>` : `<div class="cgth locked"><span>？？？</span></div>`).join('')}</div>`).join('');
  modal(`CGモード（${CG_LIST.filter(c => seen.has(c.id)).length}/${CG_LIST.length}）`, html + '<p class="note">本編で見たイベントCGがここに追加されます（この端末に記録）。</p>');
  document.querySelectorAll<HTMLElement>('[data-cg]').forEach(b => b.onclick = () => {
    const id = b.dataset.cg!; const el = document.createElement('div'); el.className = 'cg cgview';
    el.innerHTML = `<img src="${cgUrl(id, false)}" alt=""><div class="hint">クリックで閉じる</div>`; document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on'));
    el.onclick = () => { el.classList.remove('on'); setTimeout(() => el.remove(), 600); };
  });
}
let typing: any = null;
function playLines(title: string, lines: Line[], after: () => void, h?: string) {
  let i = 0;
  app().innerHTML = `${S ? hud() : ''}<div class="stage" ${h ? `style="--hc:${porColor(h)}"` : ''}><div class="sc-title">${esc(title)}</div>${h ? portrait(h) : ''}
  <div class="box" id="box"><div class="name" id="nm"></div><div class="text" id="tx"></div><div class="hint bl-row-hint"><button class="bl-btn" id="bl-open" aria-label="会話ログ">📜 ログ</button><span>クリック / Enter で進む</span></div></div><div id="ch" class="choices"></div></div>${cmdBar()}`;
  bindCmd(); preloadCgs(lines);
  const box = $('#box'); bindBacklog(box);
  const next = () => {
    if (typing) { clearInterval(typing); typing = null; $('#tx').textContent = lines[i - 1].text; return; }
    if (i >= lines.length) { box.onclick = null; document.onkeydown = null; stop(); talking(false); after(); return; }
    const L = lines[i++];
    if (L.who === 'cg') { if (L.text === 'off') cgOff(); else setCG(L.text); return next(); }
    stop();
    $('#nm').textContent = L.name; $('#nm').style.color = L.color; $('#tx').className = 'text ' + (L.who === 'n' ? 'narr' : '');
    const tier = HMAP[L.who] && S ? tierOf(S.hs[L.who]) : 0;
    speak(L.who, L.voice, L.emo, tier, set, undefined, L.vid);
    for (const nx of lines.slice(i, i + 2)) preloadClip(nx.who, nx.vid);
    const isH = hasPortrait(L.who), pid = porId(L.who);
    if (isH && pid) { showSpeaker(pid); h = pid; }
    const apply = () => { const em = document.getElementById('emo'); if (em && h && (isH || L.who === 'me')) { if (isH) { em.textContent = emoIcon(L.emo); setExpr(h, L.emo); if (L.emo === '嬉' || L.emo === '照' || L.emo === '告') heartPop('up'); else if (L.emo === '哀' || L.emo === '怒' || L.emo === '冷') heartPop('down'); } } if (isH) talking(true); };
    if (isH && document.getElementById('por')?.classList.contains('exit')) setTimeout(apply, 260); else apply();
    const t = L.who === 'n' || !L.name ? L.text : `「${L.text}」`;
    backlog.line(L.who === 'n' ? '' : L.name, L.text, { color: L.color, who: L.who, vid: L.vid, narr: L.who === 'n' || !L.name });
    if (set.textSpeed <= 0) { $('#tx').textContent = t; return; }
    let k = 0; $('#tx').textContent = '';
    typing = setInterval(() => { k++; $('#tx').textContent = t.slice(0, k); if (k >= t.length) { clearInterval(typing); typing = null; } }, set.textSpeed);
    lines[i - 1] = { ...L, text: t };
  };
  box.onclick = next; document.onkeydown = e => { if ((e.target as HTMLElement)?.tagName === 'INPUT' || document.getElementById('backlog')) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } };
  next();
}
// ───────── 会話ログ ─────────
function bindBacklog(box: HTMLElement) {
  const btn = document.getElementById('bl-open'); if (btn) btn.onclick = e => { e.stopPropagation(); openBacklog(); };
  const st = document.querySelector('.stage') as HTMLElement | null;
  if (st) st.onwheel = e => { if (e.deltaY < -10 && !document.getElementById('backlog')) { e.preventDefault(); openBacklog(); } };
  let y0 = -1; box.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive: true });
  box.addEventListener('touchend', e => { const dy = e.changedTouches[0].clientY - y0; if (y0 >= 0 && dy > 60) { e.preventDefault(); openBacklog(); } y0 = -1; });
}
export function openBacklog() {
  if (document.getElementById('backlog')) return;
  const d = document.createElement('div'); d.id = 'backlog'; d.className = 'backlog'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', '会話ログ');
  const ent = backlog.all();
  d.innerHTML = `<div class="bl-box"><div class="bl-head"><b>📜 会話ログ</b><small>${ent.length}件（このセッションのみ・最大300）</small><button id="bl-x" aria-label="閉じる">×</button></div><div class="bl-list" id="bl-list">${backlogHtml(ent, (w, v) => !!w && hasClip(w, v))}</div></div>`;
  document.body.appendChild(d);
  const list = d.querySelector('#bl-list') as HTMLElement; list.scrollTop = list.scrollHeight;
  const close = () => { d.remove(); window.removeEventListener('keydown', key, true); };
  const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } else if (e.key === 'Enter' || e.key === ' ' || /^[0-9]$/.test(e.key)) { e.stopPropagation(); } };
  window.addEventListener('keydown', key, true);
  d.onclick = e => { e.stopPropagation(); if (e.target === d) close(); };
  (d.querySelector('#bl-x') as HTMLElement).onclick = close;
  d.querySelectorAll<HTMLElement>('.bl-play').forEach(b => b.onclick = () => { const x = ent[+b.dataset.bi!]; if (x?.who) replayClip(x.who, x.vid, set); });
}
const emoIcon = (e: string) => ({ 通常: '', 嬉: '♪', 照: '💗', 怒: '💢', 哀: '💧', 驚: '❗', 嫉: '💦', 囁: '…', 告: '💓', 冷: '😶' } as any)[e] || '';
export const EXPR: Record<string, string> = { 嬉: 'h', 照: 'b', 告: 'b', 囁: 'h', 哀: 's', 怒: 'a', 嫉: 'a', 冷: 'n', 驚: 'o', 通常: 'n' };
export const EXPR_FILES = ['n', 'h', 's', 'o', 'a', 'b'];
const SMALL = () => typeof matchMedia !== 'undefined' && matchMedia('(max-width:720px)').matches;
const pSrc = (h: string, e: string) => `${BASE}img/ch/${h}_${e}${SMALL() ? '-s' : ''}.webp`;
const preloaded = new Set<string>();
function preloadExpr(h: string) { if (preloaded.has(h)) return; preloaded.add(h); for (const e of EXPR_FILES) { const im = new Image(); im.src = pSrc(h, e); } }
function setExpr(h: string | undefined, emo: string) {
  const img = document.getElementById('pimg') as HTMLImageElement | null; if (!img || !h) return; const src = pSrc(h, EXPR[emo] || 'n');
  if (img.src.endsWith(src.replace(/^\./, ''))) { img.classList.remove('bounce'); void img.offsetWidth; img.classList.add('bounce'); return; }
  const hr = img.parentElement?.querySelector('.phair') as HTMLImageElement | null; img.classList.add('swap'); setTimeout(() => { img.src = src; if (hr) hr.src = src; img.classList.remove('swap'); }, 120);
}
/** ヒロイン以外で立ち絵のある登場人物（話者キー → 画像ID） */
export const NPC_PORTRAIT: Record<string, { id: string; color: string; name: () => string; sub: string }> = {
  '@芽衣': { id: 'mei', color: '#e05a6d', name: () => `${S?.setup.sei ?? ''}芽衣`, sub: '妹' },
  '@健太': { id: 'kenta', color: '#3d6fb6', name: () => '早乙女健太', sub: '親友・相談役' },
  '@和田': { id: 'wada', color: '#b5835a', name: () => '和田 和樹', sub: '生意気な後輩・ライバル' },
  '@田中': { id: 'inoue', color: '#c8821e', name: () => '井上 暸', sub: '悪友・恋愛研究会会長' },
  '@井上': { id: 'inoue', color: '#c8821e', name: () => '井上 暸', sub: '悪友・恋愛研究会会長' },
};
const NPC_BY_ID: Record<string, string> = Object.fromEntries(Object.entries(NPC_PORTRAIT).reverse().map(([k, v]) => [v.id, k]));
const hasPortrait = (w: string) => !!HMAP[w] || !!NPC_PORTRAIT[w];
const porId = (w: string) => HMAP[w] ? w : NPC_PORTRAIT[w]?.id;
const porColor = (id: string) => HMAP[id]?.color ?? NPC_PORTRAIT[NPC_BY_ID[id]]?.color ?? '#888';
function portrait(h: string) {
  if (!HMAP[h]) { const N = NPC_PORTRAIT[NPC_BY_ID[h]]; preloadExpr(h); const src = pSrc(h, 'n');
    return `<div class="portrait enter npc" id="por" data-h="${h}"><div class="pwrap"><div class="psway"><img id="pimg" class="pimg" src="${src}" alt="${N.name()}" onerror="this.style.display='none'"><img id="phair" class="phair" src="${src}" alt="" aria-hidden="true"></div></div><div id="emo" class="emo"></div><div class="pi" id="pinfo">${N.name()}<small>${N.sub}</small></div></div>`; }
  const H = HMAP[h], x = S!.hs[h]; preloadExpr(h);
  const src = pSrc(h, 'n');
  return `<div class="portrait enter" id="por" data-h="${h}"><div class="pwrap"><div class="psway"><img id="pimg" class="pimg" src="${src}" alt="${H.sei}${H.mei}" onerror="this.style.display='none'"><img id="phair" class="phair" src="${src}" alt="" aria-hidden="true"></div></div><div id="emo" class="emo"></div><div class="pi" id="pinfo">${H.sei}${H.mei}<small>${stage(x)}　呼び方:「${H.call[x.callTier].replace('{S}', S!.setup.sei).replace('{M}', S!.setup.mei)}」</small></div></div>`;
}
/** 話者が別のヒロインに変わったら立ち絵を入れ替える（退場→登場スライド） */
function showSpeaker(h: string) {
  const st = document.querySelector('.stage') as HTMLElement | null; if (!st || !S || !(HMAP[h] || NPC_BY_ID[h])) return;
  const cur = document.getElementById('por');
  if (cur && cur.dataset.h === h) return;
  st.style.setProperty('--hc', porColor(h));
  const put = () => { document.getElementById('por')?.remove(); st.querySelector('.sc-title')!.insertAdjacentHTML('afterend', portrait(h)); };
  if (cur) { cur.classList.add('exit'); setTimeout(put, 220); } else put();
}
let talkTimer: any = null;
function talking(on: boolean) {
  clearInterval(talkTimer); const w = () => document.querySelector('.pwrap');
  if (!on) { w()?.classList.remove('talk'); return; }
  w()?.classList.add('talk');
  talkTimer = setInterval(() => { const sp = isSpeaking(); if (!typing && !sp) { w()?.classList.remove('talk'); clearInterval(talkTimer); } }, 200);
}
function heartPop(kind: 'up' | 'down') {
  const p = document.getElementById('por'); if (!p) return;
  p.classList.remove('react-up', 'react-down'); void p.offsetWidth; p.classList.add(kind === 'up' ? 'react-up' : 'react-down');
  const f = document.createElement('div'); f.className = 'pfx ' + kind; f.textContent = kind === 'up' ? '♥' : '💧'; p.appendChild(f); setTimeout(() => f.remove(), 1200);
}
function showChoices(ch: string[], pick: (i: number) => void) {
  const el = $('#ch'); el.innerHTML = ch.map((c, i) => `<button data-i="${i}"><b>${i + 1}</b> ${esc(c)}</button>`).join('');
  const pk = pick; pick = (i: number) => { backlog.choice(ch[i]); pk(i); };
  el.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.onclick = () => pick(+b.dataset.i!));
  document.onkeydown = e => { if ((e.target as HTMLElement)?.tagName === 'INPUT' || document.getElementById('backlog')) return; const n = +e.key; if (n >= 1 && n <= ch.length) pick(n - 1); };
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
  const e = judgeEnding(S!); audio.playSong(BASE, { loop: false });
  $('#ch').innerHTML = `<div class="panel"><h2>🌸 ${esc(e.title)}</h2><p>おつかれさまでした。</p><div class="row"><button id="e-t" class="primary">タイトルへ</button><button id="e-s">最終セーブ文字列</button></div></div>`;
  $('#e-t').onclick = () => { audio.stopSong(); resolve(S!, 0); store.save('auto', S!); try { localStorage.removeItem('seishun:slotauto'); } catch { } title(); };
  $('#e-s').onclick = () => modal('SAVE', `<textarea readonly class="savestr">${exportSave(S!)}</textarea>`);
}

// ───────── コマンド ─────────
function cmdBar() { return `<div class="cmd"><input id="cmd" placeholder="番号 / SAVE LOAD STATUS RELATION SCHEDULE DIARY HELP"><button id="cmd-go">実行</button><button id="b-st" title="ステータス">📊</button><button id="b-set">⚙</button><button id="b-title">タイトル</button></div>`; }
function bindCmd() {
  const run = () => { const v = $<HTMLInputElement>('#cmd').value.trim(); $<HTMLInputElement>('#cmd').value = ''; command(v); };
  $('#cmd-go').onclick = run; $<HTMLInputElement>('#cmd').onkeydown = e => { if (e.key === 'Enter') run(); };
  $('#b-st').onclick = () => { if (S) modal('STATUS', statusHtml()); };
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
// ───────── 週替わり・パラメータ変化 ─────────
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function calPage(w: number, cls: string) { const c = weekCard(w); return `<div class="wf-page ${cls}"><div class="wf-top">${c.y}年生・${c.term}</div><div class="wf-m">${c.m}<small>月</small></div><div class="wf-d">${c.day}<small>日（${c.wd}）</small></div><div class="wf-w">${c.icon} 第${c.week}週</div></div>`; }
export function weekFlip(from: number, to: number, done: () => void) {
  document.getElementById('wflip')?.remove();
  const d = document.createElement('div'); d.id = 'wflip'; d.className = 'wflip' + (reduced() ? ' rm' : '');
  d.innerHTML = `<div class="wf-cal" style="background-image:url(${BASE}img/calendar.webp)"><div class="wf-sheet">${calPage(to, 'new')}${calPage(from, 'old')}</div></div><div class="wf-skip">タップでスキップ</div>`;
  document.body.appendChild(d); audio.se('page'); setTimeout(() => audio.se('flip', { vol: .6 }), 380); audio.duck(2.4); setTimeout(() => audio.se('jingle', { vol: .55 }), 250);
  let fin = false; const end = () => { if (fin) return; fin = true; d.classList.add('out'); setTimeout(() => { d.remove(); done(); }, 220); };
  d.onclick = e => { e.stopPropagation(); end(); };
  setTimeout(end, reduced() ? 900 : 1800);
}
let lastDeltaHtml = '';
function deltaChips(a: Snap, b: Snap) {
  const ds = diffStats(a, b), hs = diffHearts(a, b); if (!ds.length && !hs.length) return '';
  return `<div class="lgd">${ds.map(x => `<span class="lgc ${x.good ? 'pos' : 'neg'}">${x.d > 0 ? '▲' : '▼'}${esc(x.label)} ${fmtDelta(x)}</span>`).join('')}${hs.map(x => `<span class="lgc ${x.dir === 'down' ? 'neg' : 'pos'}">${x.dir === 'down' ? '💧' : x.dir === 'new' ? '✨' : '♥'}${esc(HMAP[x.id]?.mei || x.id)}${x.dir === 'down' ? ' 好感度↓' : x.dir === 'new' ? ' と出会った' : ' 好感度↑'}</span>`).join('')}</div>`;
}
export function showDelta(a: Snap, b: Snap) {
  const ds = diffStats(a, b), hs = diffHearts(a, b); if (!ds.length && !hs.length) return;
  if (hs.some(x => x.dir === 'up' || x.dir === 'new')) setTimeout(() => audio.se('heart', { vol: .7 }), 450);
  document.getElementById('dpanel')?.remove();
  const p = document.createElement('div'); p.id = 'dpanel'; p.className = 'dpanel'; p.setAttribute('role', 'status');
  p.innerHTML = `<div class="dp-h">今週の変化</div><div class="dp-list">${ds.map((x, i) => `<span class="dp ${x.good ? 'up' : 'down'}" style="animation-delay:${i * 90}ms">${x.d > 0 ? '▲' : '▼'} ${esc(x.label)} <b>${fmtDelta(x)}</b></span>`).join('')}${hs.map((x, i) => { const H = HMAP[x.id]; return `<span class="dp heart ${x.dir}" style="animation-delay:${(ds.length + i) * 90}ms;--hc:${H?.color || '#fd79a8'}">${x.dir === 'down' ? '💧' : x.dir === 'new' ? '✨' : '♥'} ${esc(H?.mei || x.id)}${x.dir === 'new' ? ' と出会った' : ''}</span>`; }).join('')}</div>`;
  document.body.appendChild(p); p.onclick = () => p.remove();
  setTimeout(() => p.classList.add('out'), 4200); setTimeout(() => p.remove(), 4700);
}
function statusHtml() {
  const s = S!; const bars = SHOWN.map(k => { const v = Math.round(s.stats[k]); const r = rank(k, v); return `<div class="sx"><span class="sx-l">${STAT_LABEL[k]}</span><span class="sx-bar"><i class="${k === 'st' ? 'bad' : ''}" style="width:${Math.min(100, v / BAR(k) * 100)}%"></i></span><b class="sx-v">${v}</b><em class="rk rk-${r}">${k === 'st' ? '' : r}</em></div>`; }).join('');
  return `<div class="sxs">${bars}</div><table><tr><th>所持金</th><td>${s.money}円</td></tr><tr><th>部活</th><td>${s.club}</td></tr><tr><th>バイト</th><td>${s.job || 'なし'}（${s.jobDays}日）</td></tr><tr><th>服</th><td>${s.outfits.join('、')}</td></tr><tr><th>難易度</th><td>${s.setup.diff}</td></tr><tr><th>テスト</th><td>${s.exams.map(e => e.rank + '位').join(' → ') || '-'}</td></tr></table>`;
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
  $('#ld-go').onclick = () => { try { S = importSave($<HTMLTextAreaElement>('#ld').value); syncCg(); closeModal(); toast('ロードしました'); main(); } catch (e: any) { toast(e.message); } };
}
function settings() {
  const ja = hasJapaneseVoice();
  const r = (k: keyof VoiceSettings, label: string, min = 0, max = 1, step = 0.05) => `<label>${label}<input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${set[k]}"></label>`;
  modal('音声・音量設定', `<p class="note">🎙 ヒロイン9人・芽衣・健太・井上・真鍋先生：収録ボイス（ElevenLabs のAI音声）。<br>地の文・その他の人物：${voiceSupported() ? (ja ? '端末内蔵の読み上げ（Web Speech API）。' : '日本語音声が見つからないため文字のみ。') : 'このブラウザは読み上げ非対応のため文字のみ。'}</p>
  <label><input type="checkbox" id="st-auto" ${set.auto ? 'checked' : ''}> ボイスON</label> <label><input type="checkbox" id="st-nar" ${set.narrate ? 'checked' : ''}> 地の文も読み上げ</label>
  <div class="sliders">${r('master', '全体音量')}${r('voice', 'ボイス音量')}${r('bgm', 'BGM音量')}${r('se', '効果音音量')}${r('voiceRate', '声の速さ', 0.6, 1.6, 0.05)}${r('textSpeed', '文字送り（ms/文字・0で瞬時）', 0, 80, 5)}</div>
  <h4>キャラ別音量</h4><div class="sliders">${HEROINES.map(H => `<label>${H.sei}${H.mei}<input type="range" data-c="${H.id}" min="0" max="1" step="0.05" value="${set.perChar[H.id] ?? 1}"><button class="vt" data-c="${H.id}">試聴</button></label>`).join('')}${[['@芽衣', '芽衣（妹）'], ['@健太', '健太'], ['@田中', '井上'], ['@担任・真鍋', '真鍋先生']].map(([id, nm]) => `<label>${nm}<input type="range" data-c="${id}" min="0" max="1" step="0.05" value="${set.perChar[id] ?? 1}"></label>`).join('')}</div>`);
  document.querySelectorAll<HTMLInputElement>('[data-k]').forEach(i => i.oninput = () => { (set as any)[i.dataset.k!] = +i.value; saveSettings(); });
  document.querySelectorAll<HTMLInputElement>('input[data-c]').forEach(i => i.oninput = () => { set.perChar[i.dataset.c!] = +i.value; saveSettings(); });
  document.querySelectorAll<HTMLButtonElement>('.vt').forEach(b => b.onclick = () => { const H = HMAP[b.dataset.c!]; stop(); unlockVoice(); const t = H.greet[1][0]; const vid = voiceId(H.id, t); if (!speak(H.id, t, '嬉', 1, { ...set, auto: true }, undefined, vid)) toast(hasClip(H.id, vid) ? '再生できませんでした' : 'ボイスを読み込み中です。少し待ってからもう一度'); });
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
