/** A8 PR枠の表示状態。CSS は body/html のクラスで切り替える（:has() 非依存、古い iOS Safari 向け）。 */
export type PrMode = 'off' | 'title' | 'ending';

const CLS = ['pr-title', 'pr-ending'] as const;

export function setPrMode(mode: PrMode) {
  if (typeof document === 'undefined') return;
  const title = mode === 'title';
  const ending = mode === 'ending';
  for (const el of [document.documentElement, document.body]) {
    if (!el) continue;
    el.classList.toggle('pr-title', title);
    el.classList.toggle('pr-ending', ending);
  }
}

export function prMode(): PrMode {
  if (typeof document === 'undefined') return 'off';
  if (document.body.classList.contains('pr-ending')) return 'ending';
  if (document.body.classList.contains('pr-title')) return 'title';
  return 'off';
}

/** テスト用 */
export const _prClasses = CLS;
