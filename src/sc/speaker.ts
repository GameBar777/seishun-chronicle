/**
 * 立ち絵（名札）の持ち越し判定。
 * 地の文（n）になったとき、直前の話者が脇役（健太・芽衣など）のままだと
 * 場面と関係ない名札が残ってしまう。脇役の名札は地の文で外し、
 * 場面のヒロインがいればその立ち絵に戻す（ヒロイン同士の会話中は従来どおり維持）。
 * 戻り値: 表示すべき立ち絵ID（null = 立ち絵なし）。
 */
export function portraitAfterLine(cur: string | null, who: string, speakerPid: string | undefined, sceneH: string | undefined, isHeroine: (id: string) => boolean): string | null {
  if (speakerPid) return speakerPid;
  if (who === 'n' && cur && !isHeroine(cur)) return sceneH ?? null;
  return cur;
}
