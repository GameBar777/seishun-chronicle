// ElevenLabs でセリフ音声を生成（オフライン専用。キーはクライアントに出さない）
// 使い方: node scripts/voice/gen.mjs [--limit N] [--only id1,id2] [--force]
// 入力: scripts/voice/lines.json / 生音声キャッシュ: /workspace/voice-cache/<id>.mp3（リポジトリ外）
// 再実行しても生成済みはスキップ（resume-safe）。429/5xx は指数バックオフで再試行。
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync, statSync, renameSync } from 'node:fs';
const have = f => existsSync(f) && statSync(f).size > 2000; // 0 バイトの壊れたファイルは未生成扱い
const env = readFileSync('/workspace/.secrets/elevenlabs.env', 'utf8');
const KEY = env.match(/ELEVENLABS_API_KEY=(\S+)/)?.[1]; if (!KEY) throw new Error('no key');
const CAST = { hinata: 'lhTvHflPVOqgSWyuWQry', mio: 'JTlYtJrcTzPC71hMLOxo', yura: 'KtSs8OSniRPofXnr5PeA', kaho: 'oAlEJuW30knHWhA6cF0e', reika: 'ngvNHfiCrXLPAHcTrZK1', kotoha: 'RWZ1lnBIIgPBTpyCnKn2', ruka: 'GxhGYQesaQaYKePCZDEC', rin: 'my3P6caXGLzHy2BLxEdS', shizuku: 'fUjY9K2nAIwlALOwSiwc', '@芽衣': 'yPWBURQS57P0VcJh4deb', '@健太': 'y3fpa8t4npoVDiU9o7Gc', '@担任・真鍋': 'AYFJOmHxRJdmf572TQ7R', '@田中': 'A4AyGcPAjb1pHgflyZZp' };
export const TAG = { 通常: '', 嬉: '[cheerful] ', 照: '[shy] ', 怒: '[angry] ', 哀: '[sad] ', 驚: '[surprised] ', 嫉: '[sulky] ', 囁: '[whispers] ', 告: '[softly] ', 冷: '[coldly] ' };
const CACHE = '/workspace/voice-cache'; mkdirSync(CACHE, { recursive: true });
const LOG = new URL('./gen.log', import.meta.url);
const args = process.argv.slice(2); const lim = +(args[args.indexOf('--limit') + 1] || 1e9) || 1e9;
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null; const force = args.includes('--force');
const lines = JSON.parse(readFileSync(new URL('./lines.json', import.meta.url), 'utf8'));
const todo = lines.filter(l => (only ? only.has(l.id) : true) && (force || !have(`${CACHE}/${l.id}.mp3`))).slice(0, lim);
const MAXCH = +(process.env.MAXCH || 80000); let used = 0; const planned = todo.reduce((a, l) => a + [...(TAG[l.emo] || '') + l.say].length, 0);
console.log(`todo ${todo.length} lines, ~${planned} chars`); if (planned > MAXCH) { console.log('projected over budget; abort'); process.exit(2); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function one(l) {
  const text = (TAG[l.emo] || '') + l.say;
  for (let a = 0; a < 6; a++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${CAST[l.who]}?output_format=mp3_44100_128`, { method: 'POST', headers: { 'xi-api-key': KEY, 'content-type': 'application/json', accept: 'audio/mpeg' }, body: JSON.stringify({ text, model_id: 'eleven_v3', language_code: 'ja', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }) });
    if (r.ok) { const b = Buffer.from(await r.arrayBuffer()); if (b.length < 2000) { await sleep(2000 * 2 ** a); continue; } writeFileSync(`${CACHE}/${l.id}.mp3.tmp`, b); renameSync(`${CACHE}/${l.id}.mp3.tmp`, `${CACHE}/${l.id}.mp3`); const c = +(r.headers.get('character-cost') || r.headers.get('x-character-count') || [...text].length); used += c; appendFileSync(LOG, `${new Date().toISOString()}\t${l.id}\t${l.who}\t${c}\tok\n`); return true; }
    const msg = (await r.text()).slice(0, 200);
    if (r.status === 429 || r.status >= 500) { await sleep(2000 * 2 ** a); continue; }
    appendFileSync(LOG, `${new Date().toISOString()}\t${l.id}\t${l.who}\t0\tERR ${r.status} ${msg.replace(/\s+/g, ' ')}\n`); return false;
  }
  appendFileSync(LOG, `${new Date().toISOString()}\t${l.id}\t${l.who}\t0\tERR retries\n`); return false;
}
let i = 0, ok = 0, fail = 0; const C = +(process.env.CONC || 4);
await Promise.all(Array.from({ length: C }, async () => { while (i < todo.length) { const l = todo[i++]; (await one(l)) ? ok++ : fail++; if ((ok + fail) % 100 === 0) console.log(ok + fail, '/', todo.length, 'chars', used); } }));
console.log(JSON.stringify({ ok, fail, charsUsed: used }));
appendFileSync(LOG, `# run ${new Date().toISOString()} ok=${ok} fail=${fail} chars=${used}\n`);
