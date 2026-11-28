import { readFileSync } from 'node:fs';
import { describe, expect, it, beforeEach } from 'vitest';
import { stripA8Pr } from '../scripts/strip-a8-pr.mjs';
import { setPrMode, prMode } from '../src/sc/pr';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/style.css', 'utf8');
const ui = readFileSync('src/sc/ui.ts', 'utf8');

const ASIDE = `aside class="fnb"`;
const LINKS = [
  { href: 'https://px.a8.net/svt/ejp?a8mat=4BGJFP+UYK8I+6HW+3SY4KI', text: '【DMMブックス】', img: 'https://www17.a8.net/0.gif?a8mat=4BGJFP+UYK8I+6HW+3SY4KI' },
  { href: 'https://px.a8.net/svt/ejp?a8mat=4BGJFP+XCANM+41ZK+60WN6', text: 'あなたの好きなアニメ・漫画・ゲームのコラボグッズがみつかる！AMNIBUS', img: 'https://www15.a8.net/0.gif?a8mat=4BGJFP+XCANM+41ZK+60WN6' },
  { href: 'https://px.a8.net/svt/ejp?a8mat=4BGQGS+4P34KY+4AHY+5YRHE', text: 'ゲーマーズ', img: 'https://www12.a8.net/0.gif?a8mat=4BGQGS+4P34KY+4AHY+5YRHE' },
  { href: 'https://px.a8.net/svt/ejp?a8mat=4BGOWO+87WGFM+4EKC+60OXE', text: 'オリジナルコンテンツ数No1！【ABEMAプレミアム】', img: 'https://www11.a8.net/0.gif?a8mat=4BGOWO+87WGFM+4EKC+60OXE' },
];

const ISSUED_LIST = `<ul class="fnl"><li><a href="https://px.a8.net/svt/ejp?a8mat=4BGJFP+UYK8I+6HW+3SY4KI" rel="nofollow">【DMMブックス】</a> <img border="0" width="1" height="1" src="https://www17.a8.net/0.gif?a8mat=4BGJFP+UYK8I+6HW+3SY4KI" alt=""></li><li><a href="https://px.a8.net/svt/ejp?a8mat=4BGJFP+XCANM+41ZK+60WN6" rel="nofollow">あなたの好きなアニメ・漫画・ゲームのコラボグッズがみつかる！AMNIBUS</a><img border="0" width="1" height="1" src="https://www15.a8.net/0.gif?a8mat=4BGJFP+XCANM+41ZK+60WN6" alt=""></li><li><a href="https://px.a8.net/svt/ejp?a8mat=4BGQGS+4P34KY+4AHY+5YRHE" rel="nofollow">ゲーマーズ</a>


<img border="0" width="1" height="1" src="https://www12.a8.net/0.gif?a8mat=4BGQGS+4P34KY+4AHY+5YRHE" alt=""></li><li><a href="https://px.a8.net/svt/ejp?a8mat=4BGOWO+87WGFM+4EKC+60OXE" rel="nofollow">オリジナルコンテンツ数No1！【ABEMAプレミアム】</a>
<img border="0" width="1" height="1" src="https://www11.a8.net/0.gif?a8mat=4BGOWO+87WGFM+4EKC+60OXE" alt=""></li></ul>`;

const TITLE_LEAD = 'ゲームのあとで見る・読むときの参考です。登録や購入、効果を保証するものではありません。';
const ENDING_LEAD = 'エンディングのあとに（PR）　学園恋愛ものの余韻に。登録や購入、効果を保証するものではありません。';
const GUIDE_HREF = 'https://gamebar777.github.io/guides/seishun-chronicle/endings.html';
const GUIDE_TEXT = 'ほかの結末も見てみる → 攻略ガイド：エンディング一覧';

describe('A8 PR footer on GitHub Pages index.html', () => {
  it('sits after #app and outside it, before </body>', () => {
    const app = html.indexOf('<div id="app" aria-live="polite"></div>');
    const fnb = html.indexOf('<aside class="fnb">');
    const bodyEnd = html.indexOf('</body>');
    expect(app).toBeGreaterThan(-1);
    expect(fnb).toBeGreaterThan(app);
    expect(bodyEnd).toBeGreaterThan(fnb);
    const afterApp = html.slice(app);
    expect(afterApp.startsWith('<div id="app" aria-live="polite"></div>')).toBe(true);
    expect(html.includes('<div id="app" aria-live="polite"></div>\n<!--a8-pr-start-->\n<p class="end-guide">')).toBe(true);
    expect(fnb).toBeGreaterThan(html.indexOf('class="end-guide"'));
  });

  it('keeps issued A8 <a>/<img> byte-for-byte in title order, no 無料体験, each 0.gif once', () => {
    const i = html.indexOf('<ul class="fnl">');
    const j = html.indexOf('</ul>', i) + '</ul>'.length;
    expect(html.slice(i, j)).toBe(ISSUED_LIST);
    expect(html).toContain('<p class="mark">PR</p>');
    expect(html).toContain(`<p class="fnb-lead fnb-lead-title">${TITLE_LEAD}</p>`);
    expect(html).toContain(`<p class="fnb-lead fnb-lead-ending">${ENDING_LEAD}</p>`);
    expect(html).not.toContain('class="ad"');
    expect(html).not.toContain('無料体験');
    expect(html).not.toContain('audiobook.jp');
    expect(html).not.toContain('4BGOWO+7VECQA+3CJQ+64C3M');
    let pos = 0;
    for (const L of LINKS) {
      const a = html.indexOf(`href="${L.href}"`);
      expect(a).toBeGreaterThan(pos);
      expect(html).toContain(`>${L.text}</a>`);
      expect(html).toContain(`src="${L.img}"`);
      expect(html.split(`src="${L.img}"`).length - 1).toBe(1);
      pos = a;
    }
  });

  it('adds a non-ad internal guide link above the PR box, same tab, no nofollow', () => {
    const guide = html.indexOf('class="end-guide"');
    const fnb = html.indexOf('<aside class="fnb">');
    const a8start = html.indexOf('<!--a8-pr-start-->');
    const a8end = html.indexOf('<!--a8-pr-end-->');
    expect(guide).toBeGreaterThan(a8start);
    expect(guide).toBeLessThan(fnb);
    expect(fnb).toBeLessThan(a8end);
    expect(html).toContain(`<p class="end-guide"><a href="${GUIDE_HREF}">${GUIDE_TEXT}</a></p>`);
    const chunk = html.slice(guide, fnb);
    expect(chunk).not.toContain('nofollow');
    expect(chunk).not.toContain('target=');
    expect(chunk).not.toContain('秘密');
    expect(chunk).not.toContain('隠し');
    expect(css).toContain('body.pr-ending .end-guide{display:block');
    expect(css).toMatch(/\.end-guide\{[^}]*display:\s*none/);
  });

  it('reorders ending links with CSS order and does not duplicate the list', () => {
    expect(css).toContain('body.pr-ending aside.fnb .fnb-lead-title{display:none}');
    expect(css).toContain('body.pr-ending aside.fnb .fnb-lead-ending{display:block}');
    expect(css).toContain('body.pr-ending aside.fnb .fnl li:nth-child(1){order:2}');
    expect(css).toContain('body.pr-ending aside.fnb .fnl li:nth-child(2){order:4}');
    expect(css).toContain('body.pr-ending aside.fnb .fnl li:nth-child(3){order:1}');
    expect(css).toContain('body.pr-ending aside.fnb .fnl li:nth-child(4){order:3}');
    expect((html.match(/class="fnl"/g) || []).length).toBe(1);
    expect((html.match(/a8mat=4BGQGS\+4P34KY\+4AHY\+5YRHE/g) || []).length).toBe(2); // a + img
  });

  it('hides the box by default and shows it only with pr-title / pr-ending (no :has() dependency)', () => {
    expect(css).toContain('aside.fnb{');
    expect(css).toMatch(/aside\.fnb\{[^}]*display:\s*none/);
    expect(css).toContain('body.pr-title aside.fnb');
    expect(css).toContain('body.pr-ending aside.fnb');
    expect(css).not.toMatch(/body:not\(:has\(#app \.title\)\) aside\.fnb/);
    expect(css).not.toMatch(/(^|\n)\.ad\s*\{/);
  });

  it('strips the block for portal / itch / Game Jolt builds', () => {
    expect(stripA8Pr(html, {})).toContain(ASIDE);
    const gone = stripA8Pr(html, { A8_PR: '0' });
    expect(gone).not.toContain('aside class="fnb"');
    expect(gone).not.toContain('a8.net');
    expect(gone).not.toContain('end-guide');
    expect(gone).not.toContain('ほかの結末も見てみる');
    expect(gone).not.toContain('endings.html');
    expect(gone).toContain('<div id="app" aria-live="polite"></div>');
    const portal = stripA8Pr(html, { PORTAL_BUILD: '1' });
    expect(portal).not.toContain('aside class="fnb"');
    expect(portal).not.toContain('end-guide');
    expect(portal).not.toContain('ほかの結末も見てみる');
  });
});

describe('setPrMode body classes', () => {
  beforeEach(() => {
    const make = () => {
      const set = new Set<string>();
      return {
        classList: {
          toggle(c: string, on?: boolean) { if (on) set.add(c); else set.delete(c); },
          contains(c: string) { return set.has(c); },
        },
      };
    };
    const body = make();
    const htmlEl = make();
    (globalThis as any).document = { body, documentElement: htmlEl };
  });

  it('starts off, title and ending toggle exclusively, off clears both', () => {
    expect(prMode()).toBe('off');
    setPrMode('title');
    expect(prMode()).toBe('title');
    expect(document.body.classList.contains('pr-title')).toBe(true);
    expect(document.body.classList.contains('pr-ending')).toBe(false);
    setPrMode('ending');
    expect(prMode()).toBe('ending');
    expect(document.body.classList.contains('pr-title')).toBe(false);
    expect(document.body.classList.contains('pr-ending')).toBe(true);
    setPrMode('off');
    expect(prMode()).toBe('off');
    expect(document.body.classList.contains('pr-title')).toBe(false);
    expect(document.body.classList.contains('pr-ending')).toBe(false);
  });

  it('ui.ts assigns pr-title on the title screen, clears it for play, and shows it after the ending movie', () => {
    expect(ui).toContain("import { setPrMode } from './pr';");
    expect(ui).toMatch(/\$\('#t-cg'\)\.onclick = \(\) => cgGallery\(\);\s*setPrMode\('title'\);/);
    expect(ui).toMatch(/function setup\(\) \{\s*setPrMode\('off'\);/);
    expect(ui).toMatch(/function main\(\) \{\s*setPrMode\('off'\);/);
    expect(ui).toMatch(/function playLines[\s\S]{0,120}?setPrMode\('off'\);/);
    expect(ui).toMatch(/function endingBox[\s\S]{0,80}?setPrMode\('off'\);/);
    expect(ui).toMatch(/setTimeout\(\(\) => \{[\s\S]*?setPrMode\('ending'\);[\s\S]*?\}, 920\)/);
  });
});
