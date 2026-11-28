import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  stripA8Pr, stripPortalExtras, shouldStripA8Pr, shouldPortalLink, shouldPortalPanel,
} from '../scripts/strip-a8-pr.mjs';
import {
  OFFICIAL_SITE_URL, PORTAL_BTN_TEXT, PORTAL_BTN_ID_TITLE, PORTAL_BTN_ID_ENDING,
  PORTAL_PANEL_LEAD, PORTAL_COPY_OK, PORTAL_COPY_FALLBACK, PORTAL_OPEN_FALLBACK,
  portalLinkHtml, portalLinkEnabled, portalPanelFirst,
} from '../src/sc/portal-link';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/style.css', 'utf8');
const ui = readFileSync('src/sc/ui.ts', 'utf8');
const changelog = readFileSync('public/changelog.html', 'utf8');
const mod = readFileSync('src/sc/portal-link.ts', 'utf8');

describe('portal link flag', () => {
  it('is off by default and on with PORTAL_LINK=1 or PORTAL_BUILD=1', () => {
    expect(shouldPortalLink({})).toBe(false);
    expect(shouldPortalLink({ PORTAL_LINK: '1' })).toBe(true);
    expect(shouldPortalLink({ PORTAL_BUILD: '1' })).toBe(true);
    expect(shouldPortalLink({ PORTAL_LINK: '0' })).toBe(false);
    expect(shouldStripA8Pr({})).toBe(false);
    expect(shouldStripA8Pr({ A8_PR: '0' })).toBe(true);
    expect(shouldStripA8Pr({ PORTAL_BUILD: '1' })).toBe(true);
    expect(shouldPortalPanel({})).toBe(false);
    expect(shouldPortalPanel({ PORTAL_BUILD: '1' })).toBe(false);
    expect(shouldPortalPanel({ PORTAL_TARGET: 'plicy' })).toBe(true);
  });

  it('vitest / 本家相当の define では案内を出さない', () => {
    expect(portalLinkEnabled()).toBe(false);
    expect(portalPanelFirst()).toBe(false);
    expect(portalLinkHtml('title')).toBe('');
    expect(portalLinkHtml('ending')).toBe('');
  });
});

describe('portal button markup', () => {
  it('is a menu-style button; PLiCy opens a panel, itch tries window.open first', () => {
    expect(OFFICIAL_SITE_URL).toBe('https://gamebar777.github.io/seishun-chronicle/');
    expect(PORTAL_BTN_TEXT).toBe('公式サイト版（攻略ページ・最新版）');
    expect(PORTAL_BTN_ID_TITLE).toBe('t-official');
    expect(PORTAL_BTN_ID_ENDING).toBe('e-official');
    expect(PORTAL_PANEL_LEAD).toBe('公式サイトでは最新版と攻略ページが見られます');
    expect(PORTAL_COPY_OK).toBe('コピーしました');
    expect(PORTAL_COPY_FALLBACK).toBe('長押しでコピーしてください');
    expect(PORTAL_OPEN_FALLBACK).toBe('開けない場合はURLをコピーしてブラウザに貼り付けてください');
    expect(mod).toContain('button type="button"');
    expect(mod).toContain('menu-btn portal-link-btn');
    expect(mod).toContain(`id="\${PORTAL_BTN_ID_TITLE}"`);
    expect(mod).toContain(`id="\${PORTAL_BTN_ID_ENDING}"`);
    expect(mod).toContain("window.open(OFFICIAL_SITE_URL, '_blank')");
    expect(mod).toContain("el.addEventListener('pointerdown', go)");
    expect(mod).toContain("el.addEventListener('mousedown', go)");
    expect(mod).toContain("el.addEventListener('pointerup', go)");
    expect(mod).toContain("el.addEventListener('click', go)");
    expect(mod).toContain("el.addEventListener('keydown', onKey)");
    expect(mod).toContain("ev.key === 'Enter' || ev.key === ' '");
    expect(mod).not.toContain('el.onclick = go');
    expect(mod).toContain('windowCanvas');
    expect(mod).not.toContain('ev?.preventDefault()');
    expect(mod).toContain('showOfficialPanel()');
    expect(mod).toContain("if (__PORTAL_PANEL__ || !openOfficialSite()) showOfficialPanel()");
    expect(mod).toContain('navigator.clipboard');
    expect(mod).toContain("execCommand('copy')");
    expect(mod).toContain('target="_blank"');
    expect(mod).toContain('img/official-qr.png');
    expect(mod).toContain('aria-label="閉じる"');
    expect(mod).not.toContain('秘密');
    expect(mod).not.toContain('隠しエンド');
    expect(PORTAL_BTN_TEXT).not.toContain('はこちら');
    expect(PORTAL_PANEL_LEAD).not.toContain('秘密');
  });
});

describe('official (GitHub Pages) sources stay unchanged in appearance', () => {
  it('index.html has no portal CTA, keeps ads / GoatCounter / A8, and is v1.20.14', () => {
    expect(html).not.toContain(PORTAL_BTN_TEXT);
    expect(html).not.toContain('t-official');
    expect(html).not.toContain('e-official');
    expect(html).not.toContain('class="portal-link"');
    expect(html).toContain('adsbygoogle');
    expect(html).toContain('pagead2.googlesyndication.com');
    expect(html).toContain('<!--ads-start-->');
    expect(html).toContain('goatcounter');
    expect(html).toContain('<!--goatcounter-start-->');
    expect(html).toContain('aside class="fnb"');
    expect(html).toContain('a8.net');
    expect(html).toContain('"softwareVersion": "1.20.14"');
  });

  it('changelog notes the distribution-build button modestly', () => {
    expect(changelog).toContain('<h2>v1.20.14</h2>');
    expect(changelog).toContain('参考リンクの計測画像を、枠が画面に出たときだけ読むようにした');
    expect(changelog).toContain('<h2>v1.20.13</h2>');
    expect(changelog).toContain('エンディングの結果画面で、参考リンクの案内と並びを変え、攻略ガイドへの案内を足しました');
    expect(changelog).toContain('<h2>v1.20.12</h2>');
    expect(changelog).toContain('配布版の公式サイト案内が、1回のクリックで開くようにした');
    expect(changelog).toContain('<h2>v1.20.11</h2>');
    expect(changelog).toContain('配布版の公式サイト案内を、URLのコピーでも使えるようにした');
    expect(changelog).toContain('<h2>v1.20.10</h2>');
    expect(changelog).toContain('配布版の読み込みを安定化');
    expect(changelog).toContain('配布版の公式サイト案内を、押しやすいボタンに変更');
  });
});

describe('portal HTML strip', () => {
  it('PORTAL_BUILD=1 removes ads, A8 and GoatCounter but leaves the app root', () => {
    const gone = stripPortalExtras(html, { PORTAL_BUILD: '1' });
    expect(gone).not.toContain('adsbygoogle');
    expect(gone).not.toContain('googlesyndication');
    expect(gone).not.toContain('a8.net');
    expect(gone).not.toContain('aside class="fnb"');
    expect(gone).not.toContain('goatcounter');
    expect(gone).not.toContain('gc.zgo.at');
    expect(gone).toContain('<div id="app" aria-live="polite"></div>');
    expect(gone).toContain('application/ld+json');
  });

  it('A8_PR=0 also strips ads and GoatCounter, default env strips nothing', () => {
    const gone = stripPortalExtras(html, { A8_PR: '0' });
    expect(gone).not.toContain('adsbygoogle');
    expect(gone).not.toContain('goatcounter');
    expect(gone).not.toContain('a8.net');
    expect(stripPortalExtras(html, {})).toContain('adsbygoogle');
    expect(stripPortalExtras(html, {})).toContain('goatcounter');
    expect(stripA8Pr(html, {})).toContain('aside class="fnb"');
  });
});

describe('ui wiring', () => {
  it('places the official-site button inside the title menu and the ending button row, bound via pointer and click', () => {
    expect(ui).toContain("import { portalLinkHtml, bindPortalLinks, portalLinkEnabled } from './portal-link';");
    // タイトル：はじめから（押せる列の先頭）の直後、.menu の中
    expect(ui).toMatch(/id="t-new" class="primary menu-btn">はじめから<\/button>\$\{portalLinkHtml\('title'\)\}/);
    // エンディング：既存ボタンと同じ .row の中
    expect(ui).toMatch(/id="e-s">最終セーブ文字列<\/button>\$\{portalLinkHtml\('ending'\)\}<\/div>/);
    expect(ui).toMatch(/setPrMode\('title'\);\s*document\.body\.classList\.remove\('portal-ending'\);\s*bindPortalLinks\(\);/);
    expect(ui).toContain("document.body.classList.toggle('portal-ending', portalLinkEnabled())");
    expect(css).toContain('.title .menu button.portal-link-btn');
    expect(css).toContain('.endpanel .row .portal-link-btn');
    expect(css).toContain('.opanel{');
    expect(css).toContain('user-select:all');
    expect(css).not.toContain('.portal-link a{');
  });
});

it('portal vite config uses stable CSS/JS filenames', () => {
  const vite = readFileSync('vite.config.ts', 'utf8');
  expect(vite).toContain("entryFileNames: 'assets/index.js'");
  expect(vite).toContain("return 'assets/index.css'");
  expect(vite).toContain("fileName: 'img/official-qr.png'");
  expect(vite).toContain('__PORTAL_PANEL__');
});
