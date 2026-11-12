import { describe, it, expect } from 'vitest';
// @ts-ignore node types are not installed; vitest runs on node
import { existsSync, readdirSync, statSync } from 'node:fs';
// @ts-ignore
import { fileURLToPath } from 'node:url';
// @ts-ignore
import { dirname, join } from 'node:path';
import { newGame, doWeek, view, resolve, PERSONAS } from './engine';
import { outfitFile, EXPR_FILES, nearby, crowd } from './ui';
import { OUTFITS, OUTFIT_HEROINES } from './outfit';
import type { Setup } from './types';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../../public/img/ch');
const mk = () => newGame({
  sei: '青木', mei: '湊', seiYomi: 'あおき', meiYomi: 'みなと',
  bm: 4, bd: 2, persona: Object.keys(PERSONAS)[0], look: '普通', diff: 'NORMAL', seed: 1,
} as Setup);

describe('portrait assets and week-1 talk (v1.20.3)', () => {
  it('every heroine has a file for every outfit × expression (full and -s)', () => {
    const missing: string[] = [];
    for (const h of OUTFIT_HEROINES) {
      for (const o of OUTFITS) {
        const exprs = o === 'u' ? EXPR_FILES : (['n', 'h'] as const);
        for (const e of exprs) {
          const base = outfitFile(h, e, o);
          for (const suf of ['', '-s']) {
            const f = `${base}${suf}.webp`;
            if (!existsSync(join(dir, f))) missing.push(f);
          }
        }
      }
    }
    expect(missing, missing.join(', ')).toEqual([]);
  });

  it('all public/img/ch webp files are non-empty', () => {
    const empty = readdirSync(dir).filter(f => f.endsWith('.webp')).filter(f => statSync(join(dir, f)).size < 1000);
    expect(empty, empty.join(', ')).toEqual([]);
  });

  it('after the opening, 澪 is in the crowd and talking to her yields dialogue', () => {
    const s = mk();
    expect(s.queue[0]?.id).toBe('opening');
    resolve(s, 0);
    expect(s.hs.mio.met).toBe(true);
    s.queue = s.queue.filter(q => q.kind !== 'chat');
    expect(nearby(s)).toContain('mio');
    const html = crowd(s);
    expect(html).toMatch(/img\/ch\/mio_/);
    expect(html).toContain('class="cwrow"');
    expect(html).toContain('alt="澪"');
    doWeek(s, 'talk', 'mio');
    expect(s.queue.some(q => q.kind === 'chat' && q.h === 'mio')).toBe(true);
    const v = view(s);
    expect(v).toBeTruthy();
    expect(v!.h).toBe('mio');
    expect(v!.title).toMatch(/澪/);
    expect(v!.lines.length).toBeGreaterThan(0);
    expect(v!.lines.some(l => l.text && l.text.length > 1)).toBe(true);
  });
});
