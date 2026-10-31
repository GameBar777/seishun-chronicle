// 声の配役（2026-10-31 関本さん決定）。voice_id は ElevenLabs の公開ボイスID（秘密情報ではない）
export const VOICED: Record<string, { slug: string; name: string; voiceId: string; sex: 'f' | 'm'; pron: string }> = {
  hinata: { slug: 'hinata', name: 'Hina', voiceId: 'lhTvHflPVOqgSWyuWQry', sex: 'f', pron: 'きみ' },
  mio: { slug: 'mio', name: 'Yuki', voiceId: 'JTlYtJrcTzPC71hMLOxo', sex: 'f', pron: 'あなた' },
  yura: { slug: 'yura', name: 'Sumire', voiceId: 'KtSs8OSniRPofXnr5PeA', sex: 'f', pron: 'あなた' },
  kaho: { slug: 'kaho', name: 'itsuki', voiceId: 'oAlEJuW30knHWhA6cF0e', sex: 'f', pron: 'きみ' },
  reika: { slug: 'reika', name: 'Aki', voiceId: 'ngvNHfiCrXLPAHcTrZK1', sex: 'f', pron: 'あなた' },
  kotoha: { slug: 'kotoha', name: 'Renren', voiceId: 'RWZ1lnBIIgPBTpyCnKn2', sex: 'f', pron: 'あなた' },
  ruka: { slug: 'ruka', name: 'Chii-chan', voiceId: 'GxhGYQesaQaYKePCZDEC', sex: 'f', pron: 'センパイ' },
  rin: { slug: 'rin', name: 'Kumi', voiceId: 'my3P6caXGLzHy2BLxEdS', sex: 'f', pron: 'あんた' },
  shizuku: { slug: 'shizuku', name: 'Yui', voiceId: 'fUjY9K2nAIwlALOwSiwc', sex: 'f', pron: 'きみ' },
  '@芽衣': { slug: 'mei', name: 'Lida', voiceId: 'yPWBURQS57P0VcJh4deb', sex: 'f', pron: 'お兄' },
  '@健太': { slug: 'kenta', name: 'Hiro', voiceId: 'y3fpa8t4npoVDiU9o7Gc', sex: 'm', pron: 'お前' },
  '@担任・真鍋': { slug: 'manabe', name: 'Tatsuki', voiceId: 'AYFJOmHxRJdmf572TQ7R', sex: 'm', pron: 'お前' },
};
/**
 * 収録用の読み上げテキスト。主人公の名前（{C}{S}{M}）は録音できないので、
 * 呼びかけ位置なら削除、文中なら二人称（pron）に置き換える。画面の文字は名前のまま。
 */
export function spoken(who: string, tpl: string): string {
  const p = VOICED[who]?.pron ?? 'きみ';
  let t = tpl.replace(/[（(][^）)]*[）)]/g, '');
  const N = '(?:\\{[CSM]\\}(?:くん|さん|センパイ|先輩|ちゃん)?)';
  t = t.replace(new RegExp(`^(?:おい|ねえ|ね、|あ、|あれ、)?\\s*${N}(?:[、,]\\s*くん……)?[、。！!？?…]+\\s*`), m => { const q = m.match(/^(おい|ねえ|ね、|あ、|あれ、)/)?.[0]; return q ? (q.endsWith('、') ? q : q + '、') : ''; });
  t = t.replace(new RegExp(`^……${N}[。、]\\s*`), '……');
  t = t.replace(new RegExp(`[、,]\\s*${N}(?=[。！!？?…」]|$)`, 'g'), '');
  t = t.replace(new RegExp(`${N}……`, 'g'), '');
  t = t.replace(new RegExp(N, 'g'), p);
  return t.replace(/^[、。\s]+/, '').trim();
}
