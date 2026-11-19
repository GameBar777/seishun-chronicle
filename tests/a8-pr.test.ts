import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { stripA8Pr } from '../scripts/strip-a8-pr.mjs';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/style.css', 'utf8');

const ASIDE = `aside class="fnb"`;
const LINKS = [
  { href: 'https://px.a8.net/svt/ejp?a8mat=4BGJFP+UYK8I+6HW+3SY4KI', text: '【DMMブックス】', img: 'https://www17.a8.net/0.gif?a8mat=4BGJFP+UYK8I+6HW+3SY4KI' },
  { href: 'https://px.a8.net/svt/ejp?a8mat=4BGJFP+XCANM+41ZK+60WN6', text: 'あなたの好きなアニメ・漫画・ゲームのコラボグッズがみつかる！AMNIBUS', img: 'https://www15.a8.net/0.gif?a8mat=4BGJFP+XCANM+41ZK+60WN6' },
  { href: 'https://px.a8.net/svt/ejp?a8mat=4BGOWO+7VECQA+3CJQ+64C3M', text: '新作続々追加！オーディオブック聴くなら - audiobook.jp', img: 'https://www16.a8.net/0.gif?a8mat=4BGOWO+7VECQA+3CJQ+64C3M' },
  { href: 'https://px.a8.net/svt/ejp?a8mat=4BGOWO+87WGFM+4EKC+60OXE', text: 'オリジナルコンテンツ数No1！【ABEMAプレミアム】', img: 'https://www11.a8.net/0.gif?a8mat=4BGOWO+87WGFM+4EKC+60OXE' },
];

describe('A8 PR footer on GitHub Pages index.html', () => {
  it('sits after #app and outside it, before </body>', () => {
    const app = html.indexOf('<div id="app" aria-live="polite"></div>');
    const fnb = html.indexOf('<aside class="fnb">');
    const bodyEnd = html.indexOf('</body>');
    expect(app).toBeGreaterThan(-1);
    expect(fnb).toBeGreaterThan(app);
    expect(bodyEnd).toBeGreaterThan(fnb);
    // must not live inside #app
    const afterApp = html.slice(app);
    expect(afterApp.startsWith('<div id="app" aria-live="polite"></div>')).toBe(true);
    expect(html.includes('<div id="app" aria-live="polite"></div>\n<!--a8-pr-start-->\n<aside class="fnb">')).toBe(true);
  });

  it('keeps issued markup: PR mark, lead, classes, 4 links in order, no 無料体験', () => {
    expect(html).toContain('<p class="mark">PR</p>');
    expect(html).toContain('ゲームのあとで見る・読むときの参考です。登録や購入、効果を保証するものではありません。');
    expect(html).toContain('class="fnl"');
    expect(html).not.toContain('class="ad"');
    expect(html).not.toContain('無料体験');
    let pos = 0;
    for (const L of LINKS) {
      const a = html.indexOf(`href="${L.href}"`);
      expect(a).toBeGreaterThan(pos);
      expect(html).toContain(`>${L.text}</a>`);
      expect(html).toContain(`src="${L.img}"`);
      pos = a;
    }
    // ABEMA copy stays as issued
    expect(html).toContain('オリジナルコンテンツ数No1！【ABEMAプレミアム】');
  });

  it('has portal-like CSS and hides the box during play', () => {
    expect(css).toContain('aside.fnb');
    expect(css).toContain('body:not(:has(#app .title)) aside.fnb{display:none}');
    expect(css).not.toMatch(/(^|\n)\.ad\s*\{/);
  });

  it('strips the block for portal / itch / Game Jolt builds', () => {
    expect(stripA8Pr(html, {})).toContain(ASIDE);
    const gone = stripA8Pr(html, { A8_PR: '0' });
    expect(gone).not.toContain('aside class="fnb"');
    expect(gone).not.toContain('a8.net');
    expect(gone).toContain('<div id="app" aria-live="polite"></div>');
    expect(stripA8Pr(html, { PORTAL_BUILD: '1' })).not.toContain('aside class="fnb"');
  });
});
