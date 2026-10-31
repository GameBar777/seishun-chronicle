// ブラウザ標準の Web Speech API（speechSynthesis）による読み上げ。
// これは「AI音声」ではなく端末内蔵の合成音声。端末に日本語音声がなければ文字のみになる。
import type { Emo } from './types';
import { HMAP, HEROINES } from './data/index';
export interface VoiceSettings { master: number; voice: number; bgm: number; se: number; auto: boolean; textSpeed: number; voiceRate: number; narrate: boolean; perChar: Record<string, number> }
export const defaultSettings = (): VoiceSettings => ({ master: 0.9, voice: 1, bgm: 0.35, se: 0.6, auto: true, textSpeed: 30, voiceRate: 1, narrate: false, perChar: Object.fromEntries(HEROINES.map(h => [h.id, 1])) });
const EMO: Record<Emo, { p: number; r: number; v: number }> = {
  通常: { p: 0, r: 0, v: 1 }, 嬉: { p: 0.12, r: 0.06, v: 1 }, 照: { p: 0.08, r: -0.06, v: 0.85 }, 怒: { p: -0.12, r: 0.1, v: 1 }, 哀: { p: -0.12, r: -0.16, v: 0.75 },
  驚: { p: 0.2, r: 0.12, v: 1 }, 嫉: { p: -0.06, r: -0.04, v: 0.85 }, 囁: { p: 0.02, r: -0.2, v: 0.5 }, 告: { p: -0.04, r: -0.24, v: 0.8 }, 冷: { p: -0.15, r: 0.02, v: 0.9 },
};
export const voiceSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
let jaVoices: SpeechSynthesisVoice[] = [];
export function loadVoices() { if (!voiceSupported()) return []; jaVoices = speechSynthesis.getVoices().filter(v => /^ja/i.test(v.lang)); return jaVoices; }
if (voiceSupported()) speechSynthesis.onvoiceschanged = () => loadVoices();
export function hasJapaneseVoice() { return loadVoices().length > 0; }
export function stop() { if (voiceSupported()) speechSynthesis.cancel(); }
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
export function speak(who: string, text: string, emo: Emo, tier: number, set: VoiceSettings, onend?: () => void): boolean {
  if (!voiceSupported() || !set.auto) return false;
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
export function testName(yomi: string, set: VoiceSettings) { stop(); return speak('hinata', `${yomi}くん、おはよう！`, '嬉', 0, { ...set, auto: true }); }
