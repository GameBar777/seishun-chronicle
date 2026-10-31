// ボイス再生。
// ・ヒロイン9人＋芽衣・健太・井上・真鍋：ElevenLabs で事前生成した収録音声（public/voice/、静的ファイル）。
//   収録のない台詞（プレイヤー入力の引用など）は文字のみ。
// ・それ以外（地の文・ちょい役）：ブラウザ標準の Web Speech API（端末内蔵の合成音声）。
import type { Emo } from './types';
import { HMAP, HEROINES } from './data/index';
export interface VoiceSettings { master: number; voice: number; bgm: number; se: number; auto: boolean; textSpeed: number; voiceRate: number; narrate: boolean; perChar: Record<string, number> }
export const defaultSettings = (): VoiceSettings => ({ master: 0.9, voice: 1, bgm: 0.35, se: 0.6, auto: true, textSpeed: 30, voiceRate: 1, narrate: false, perChar: Object.fromEntries([...HEROINES.map(h => h.id), '@芽衣', '@健太', '@田中', '@担任・真鍋'].map(id => [id, 1])) });
const EMO: Record<Emo, { p: number; r: number; v: number }> = {
  通常: { p: 0, r: 0, v: 1 }, 嬉: { p: 0.12, r: 0.06, v: 1 }, 照: { p: 0.08, r: -0.06, v: 0.85 }, 怒: { p: -0.12, r: 0.1, v: 1 }, 哀: { p: -0.12, r: -0.16, v: 0.75 },
  驚: { p: 0.2, r: 0.12, v: 1 }, 嫉: { p: -0.06, r: -0.04, v: 0.85 }, 囁: { p: 0.02, r: -0.2, v: 0.5 }, 告: { p: -0.04, r: -0.24, v: 0.8 }, 冷: { p: -0.15, r: 0.02, v: 0.9 },
};
export const voiceSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
let jaVoices: SpeechSynthesisVoice[] = [];
export function loadVoices() { if (!voiceSupported()) return []; jaVoices = speechSynthesis.getVoices().filter(v => /^ja/i.test(v.lang)); return jaVoices; }
if (voiceSupported()) speechSynthesis.onvoiceschanged = () => loadVoices();
export function hasJapaneseVoice() { return loadVoices().length > 0; }
// ───── 収録ボイス ─────
export const CAST_SLUG: Record<string, string> = { hinata: 'hinata', mio: 'mio', yura: 'yura', kaho: 'kaho', reika: 'reika', kotoha: 'kotoha', ruka: 'ruka', rin: 'rin', shizuku: 'shizuku', '@芽衣': 'mei', '@健太': 'kenta', '@担任・真鍋': 'manabe', '@田中': 'tanaka' };
export const isCast = (who: string) => who in CAST_SLUG;
let vbase = './'; let manifest: Set<string> | null = null; let manifestP: Promise<void> | null = null;
let vEl: HTMLAudioElement | null = null; let vPlaying = false;
export function initVoice(base: string) {
  vbase = base;
  if (!manifestP && typeof fetch !== 'undefined') manifestP = fetch(`${base}voice/manifest.json`).then(r => r.ok ? r.json() : { ids: [] }).then(j => { manifest = new Set(j.ids as string[]); }).catch(() => { manifest = new Set(); });
  return manifestP;
}
export const voiceUrl = (who: string, vid: string) => `${vbase}voice/${CAST_SLUG[who]}/${vid}.mp3`;
export const hasClip = (who: string, vid?: string) => !!(vid && isCast(who) && manifest?.has(vid));
function el() { if (!vEl && typeof Audio !== 'undefined') { vEl = new Audio(); vEl.preload = 'auto'; vEl.onended = () => { vPlaying = false; }; vEl.onerror = () => { vPlaying = false; }; } return vEl; }
/** iOS：最初のタップで同じ audio 要素を一度鳴らして解錠する */
export function unlockVoice() { const a = el(); if (!a || a.dataset.unlocked) return; a.dataset.unlocked = '1'; a.src = `${vbase}voice/silence.mp3`; a.play().catch(() => { }); }
export const isSpeaking = () => vPlaying || (voiceSupported() && speechSynthesis.speaking);
export function stop() { if (voiceSupported()) speechSynthesis.cancel(); if (vEl && vPlaying) { vEl.pause(); } vPlaying = false; }
/** 次の台詞の音声を先読み（HTTPキャッシュに載せるだけ） */
const pre = new Set<string>();
export function preloadClip(who: string, vid?: string) { if (!hasClip(who, vid) || pre.has(vid!) || typeof fetch === 'undefined') return; pre.add(vid!); fetch(voiceUrl(who, vid!)).catch(() => pre.delete(vid!)); }
function playClip(who: string, vid: string, vol: number, onend?: () => void): boolean {
  const a = el(); if (!a) return false;
  a.onended = () => { vPlaying = false; onend?.(); };
  a.src = voiceUrl(who, vid); if (typeof window !== 'undefined') { const w = window as any; w.__voiceLast = a.src; a.onplaying = () => { w.__voicePlayed = a.src; }; }
  a.volume = Math.max(0, Math.min(1, vol)); vPlaying = true;
  a.play().catch(() => { vPlaying = false; });
  return true;
}
/** 話者ごとの固定パラメータ。複数の日本語音声がある端末ではキャラごとに別の声を固定で割り当てる */
export function voiceParams(who: string, emo: Emo, tier: number, set: VoiceSettings) {
  const H = HMAP[who]; const e = EMO[emo] || EMO['通常'];
  const basePitch = H ? H.voice.pitch : who === 'me' ? 0.8 : who === 'n' ? 1 : 0.7;
  const baseRate = H ? H.voice.rate : 1.05;
  const pitch = Math.max(0.1, Math.min(2, basePitch + e.p + (tier === 2 ? 0.04 : 0)));
  const rate = Math.max(0.5, Math.min(1.8, (baseRate + e.r - (tier === 2 ? 0.03 : 0)) * set.voiceRate));
  const volume = Math.max(0, Math.min(1, set.master * set.voice * e.v * (H ? set.perChar[who] ?? 1 : 1)));
  const idx = H ? HEROINES.indexOf(H) : who === 'me' ? 99 : 50;
  const v = jaVoices.length ? jaVoices[idx % jaVoices.length] : undefined;
  return { pitch, rate, volume, voice: v };
}
export function speak(who: string, text: string, emo: Emo, tier: number, set: VoiceSettings, onend?: () => void, vid?: string): boolean {
  if (!set.auto) return false;
  if (isCast(who)) {
    // 収録ボイスのあるキャラは合成音声に戻さない（収録がない台詞は文字のみ）
    if (!hasClip(who, vid)) return false;
    const vol = set.master * set.voice * (HMAP[who] ? set.perChar[who] ?? 1 : set.perChar[who] ?? 1);
    if (vol <= 0) return false;
    return playClip(who, vid!, vol, onend);
  }
  if (!voiceSupported()) return false;
  if (who === 'n' && !set.narrate) return false;
  if (!jaVoices.length) loadVoices();
  const p = voiceParams(who, emo, tier, set); if (p.volume <= 0) return false;
  // 「……」で区切って間を作る
  const parts = text.replace(/[（(][^）)]*[）)]/g, '').split(/……|…/).map(x => x.trim()).filter(Boolean);
  if (!parts.length) return false;
  parts.forEach((t, i) => {
    const u = new SpeechSynthesisUtterance(t); u.lang = 'ja-JP'; u.pitch = p.pitch; u.rate = p.rate; u.volume = p.volume; if (p.voice) u.voice = p.voice;
    if (i === parts.length - 1 && onend) u.onend = () => onend();
    speechSynthesis.speak(u);
  });
  return true;
}
/** 名前の試聴（読み仮名がちゃんと発音されるか確認） */
export function testName(yomi: string, set: VoiceSettings) { stop(); return speak('n', `${yomi}くん、おはよう！`, '嬉', 0, { ...set, auto: true, narrate: true }); }
/** ログからの再生（自動再生設定に関係なく、収録ボイスを1本鳴らす） */
export function replayClip(who: string, vid: string | undefined, set: VoiceSettings): boolean {
  if (!hasClip(who, vid)) return false; stop();
  const vol = set.master * set.voice * (set.perChar[who] ?? 1);
  return playClip(who, vid!, Math.max(vol, 0.05));
}
