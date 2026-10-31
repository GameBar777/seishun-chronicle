// 場面 → BGM（実音源ファイル）の対応表。純関数なのでテスト可能。
export const BGM_KEYS = ['school', 'day', 'evening', 'night', 'study', 'club', 'date', 'cafe', 'tender', 'sad', 'rival', 'confession', 'festival', 'winter', 'good_end', 'bad_end'] as const;
export type BgmKey = typeof BGM_KEYS[number];
export const SE_KEYS = ['select', 'confirm', 'cancel', 'good', 'bad', 'statup', 'statdown', 'heart', 'doki', 'page', 'flip', 'jingle', 'door', 'bell', 'phone', 'message', 'rest', 'rival', 'bomb', 'hospital', 'cold', 'injury'] as const;
export type SeKey = typeof SE_KEYS[number];

/** 週画面：直前の行動から */
export function bgmForAct(act: string | undefined, week: number): BgmKey {
  switch (act) {
    case 'bun': case 'ri': return 'study';
    case 'train': case 'run': case 'club': return 'club';
    case 'rest': case 'hospital': return 'night';
    case 'hobby': case 'art': case 'fashion': return 'day';
    case 'job': return 'evening';
    default: return week % 3 === 2 ? 'day' : 'school';
  }
}
export type SceneCtx = { kind: string; title: string; text: string; sadN: number; confess: boolean; loc?: string; bg?: string; tod?: string; endingId?: string; season?: string; rival?: boolean };
/** シーン：種類・場所・背景・時間帯・内容から */
export function bgmForScene(c: SceneCtx): BgmKey {
  if (c.kind === 'ending') return c.endingId && !c.endingId.startsWith('bad') ? 'good_end' : 'bad_end';
  if (c.confess) return 'confession';
  if (c.sadN >= 2 || /💣|爆弾|噂|別れ|泣/.test(c.title)) return 'sad';
  if (c.rival || /和田|ライバル|宣戦|奪/.test(c.title)) return 'rival';
  if (c.kind === 'date') {
    if (c.loc === 'festival' || c.loc === 'shrine') return c.season === '冬' ? 'winter' : 'festival';
    if (c.loc === 'cafe' || c.loc === 'library' || c.loc === 'movie' || c.loc === 'aquarium') return 'cafe';
    return 'date';
  }
  if (/体育祭|運動会|球技大会/.test(c.title)) return 'club';
  if (/祭|花火|文化祭|クリスマス|初詣|バレンタイン/.test(c.title)) return c.season === '冬' || /クリスマス|初詣|バレンタイン/.test(c.title) ? 'winter' : 'festival';
  if (c.kind === 'event' || c.kind === 'msg' || c.kind === 'chat') {
    if (c.tod === 'night') return 'night';
    if (c.tod === 'evening') return 'tender';
  }
  const bg = c.bg || '';
  if (/library|study/.test(bg)) return 'study';
  if (/gym|ground|pool|field/.test(bg)) return 'club';
  if (/^(room|home|house|living)|^sis/.test(bg)) return c.tod === 'night' ? 'night' : 'evening';
  if (c.tod === 'night') return 'night';
  if (c.tod === 'evening') return 'evening';
  return c.kind === 'event' ? 'tender' : 'school';
}
