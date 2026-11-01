/** 立ち絵の衣装選択（v1.18.0）: u=制服 cs=私服(春夏) cw=私服(秋冬) yk=浴衣 sw=水着 */
export type Outfit = 'u' | 'cs' | 'cw' | 'yk' | 'sw';
export const OUTFITS: Outfit[] = ['u', 'cs', 'cw', 'yk', 'sw'];
export const OUTFIT_LABEL: Record<Outfit, string> = { u: '制服', cs: '私服（春夏）', cw: '私服（秋冬）', yk: '浴衣', sw: '水着' };
export const OUTFIT_HEROINES = ['hinata', 'mio', 'yura', 'kaho', 'reika', 'kotoha', 'ruka', 'rin', 'shizuku'];
/** 学校の背景（ここでは必ず制服） */
const SCHOOL_BG = new Set(['classroom', 'gate', 'gym', 'ground', 'rooftop', 'hospital']);
export interface OutfitCtx { kind?: string; loc?: string; bg?: string; text?: string; month: number; vacation?: boolean; holiday?: boolean }
const casual = (m: number): Outfit => (m >= 4 && m <= 9 ? 'cs' : 'cw');
const summer = (m: number) => m >= 6 && m <= 9;
export function outfitFor(c: OutfitCtx): Outfit {
  const t = c.text || '', m = c.month;
  if (c.kind === 'ending') return 'u';
  if (c.kind === 'date' && c.loc) {
    if (c.loc === 'sea') return summer(m) ? 'sw' : casual(m);
    if (c.loc === 'festival') return summer(m) ? 'yk' : casual(m);
    if (c.loc === 'shrine') return summer(m) || /夏祭り|花火|縁日/.test(t) ? 'yk' : casual(m); // 初詣は冬私服（寒さ優先）
    return casual(m);
  }
  const bg = c.bg || '';
  if (SCHOOL_BG.has(bg) || /授業|教室|ホームルーム|文化祭|体育祭|修学旅行|始業|終業|部活/.test(t) && !c.vacation) return 'u';
  if (bg === 'pool') return c.vacation && summer(m) ? 'sw' : 'u'; // 学校のプール授業はスク水素材なし→制服
  if (bg === 'sea' && summer(m) && /海|泳|ビーチ|浜/.test(t)) return 'sw';
  if (/夏祭り|花火大会|縁日|浴衣/.test(t) && summer(m)) return 'yk';
  if (c.vacation || c.holiday || /休日|日曜|土曜|デート|週末/.test(t)) return casual(m);
  return 'u';
}
/** デートに付随する場面（ダブルブッキング・ナンパ・延長・帰り道の手つなぎ） */
export const DATE_FOLLOW = new Set(['dbl', 'nanpa', 'extra', 'hand']);
/** キュー先頭の場面からデート文脈を補う: デート付随場面ならデート場所(dloc)、古いセーブはキュー内/直前のデートから */
export function sceneOutfit(sc: { kind?: string; id?: string; data?: any } | undefined, ctx: OutfitCtx, lastDateLoc?: string): Outfit {
  if (sc?.id === 'tm4' && DATE_FOLLOW.has(sc.data?.t)) return outfitFor({ ...ctx, kind: 'date', loc: sc.data.dloc || lastDateLoc || 'park' });
  return outfitFor(ctx);
}
