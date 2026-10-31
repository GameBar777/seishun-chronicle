// 検証用：各BGMを headless Chromium の OfflineAudioContext でレンダリングして WAV 出力
import { chromium } from 'playwright'; import { writeFileSync } from 'node:fs';
const out = process.argv[2] || '/tmp/wav'; const names = ['title', 'school', 'date', 'sad', 'confession', 'ending', 'theme'];
const b = await chromium.launch(); const p = await b.newPage(); await p.goto('http://localhost:4637/');
for (const n of names) {
  const b64 = await p.evaluate(async n => { const m = await import('/src/sc/audio.ts'); const buf = await m.renderBgm(n); const L = buf.getChannelData(0), R = buf.getChannelData(1);
    const i16 = new Int16Array(L.length * 2); for (let i = 0; i < L.length; i++) { i16[2 * i] = Math.max(-1, Math.min(1, L[i])) * 32767; i16[2 * i + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
    let s = ''; const u8 = new Uint8Array(i16.buffer); for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); }, n);
  const pcm = Buffer.from(b64, 'base64'), h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(44100, 24); h.writeUInt32LE(176400, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  writeFileSync(`${out}/${n}.wav`, Buffer.concat([h, pcm])); console.log(n, (pcm.length / 176400).toFixed(1) + 's');
}
await b.close();
