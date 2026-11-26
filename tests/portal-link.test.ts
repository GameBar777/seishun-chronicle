import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  stripA8Pr, stripPortalExtras, shouldStripA8Pr, shouldPortalLink,
} from '../scripts/strip-a8-pr.mjs';
import {
  OFFICIAL_SITE_URL, PORTAL_LINK_TEXT, portalLinkHtml, portalLinkEnabled,
} from '../src/sc/portal-link';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/style.css', 'utf8');
const ui = readFileSync('src/sc/ui.ts', 'utf8');
const changelog = readFileSync('public/changelog.html', 'utf8');

describe('portal link flag', () => {
  it('is off by default and on with PORTAL_LINK=1 or PORTAL_BUILD=1', () => {
    expect(shouldPortalLink({})).toBe(false);
    expect(shouldPortalLink({ PORTAL_LINK: '1' })).toBe(true);
    expect(shouldPortalLink({ PORTAL_BUILD: '1' })).toBe(true);
    expect(shouldPortalLink({ PORTAL_LINK: '0' })).toBe(false);
    expect(shouldStripA8Pr({})).toBe(false);
    expect(shouldStripA8Pr({ A8_PR: '0' })).toBe(true);
    expect(shouldStripA8Pr({ PORTAL_BUILD: '1' })).toBe(true);
  });

  it('vitest / 本家相当の define では案内を出さない', () => {
    expect(portalLinkEnabled()).toBe(false);
    expect(portalLinkHtml('title')).toBe('');
    expect(portalLinkHtml('ending')).toBe('');
  });
});

describe('portalLinkHtml', () => {
  it('defines the official URL, target and wording (rendered only when __PORTAL_LINK__ is true)', () => {
    expect(OFFICIAL_SITE_URL).toBe('https://gamebar777.github.io/seishun-chronicle/');
    expect(PORTAL_LINK_TEXT).toBe('公式サイト版（攻略ページ・最新版あり）はこちら');
    const mod = readFileSync('src/sc/portal-link.ts', 'utf8');
    expect(mod).toContain(`href="\${OFFICIAL_SITE_URL}"`);
    expect(mod).toContain('target="_blank"');
    expect(mod).toContain('rel="noopener"');
    expect(mod).toContain('portal-link-title');
    expect(mod).toContain('portal-link-ending');
    expect(mod).not.toContain('秘密');
    expect(mod).not.toContain('隠しエンド');
    expect(mod).toContain("window.open(url, '_blank', 'noopener')");
  });
});

describe('official (GitHub Pages) sources stay unchanged in appearance', () => {
  it('index.html has no portal CTA, keeps ads / GoatCounter / A8, and is v1.20.8', () => {
    expect(html).not.toContain(PORTAL_LINK_TEXT);
    expect(html).not.toContain('class="portal-link"');
    expect(html).toContain('adsbygoogle');
    expect(html).toContain('pagead2.googlesyndication.com');
    expect(html).toContain('<!--ads-start-->');
    expect(html).toContain('<!--ads-end-->');
    expect(html).toContain('goatcounter');
    expect(html).toContain('gc.zgo.at/count.js');
    expect(html).toContain('<!--goatcounter-start-->');
    expect(html).toContain('<!--goatcounter-end-->');
    expect(html).toContain('aside class="fnb"');
    expect(html).toContain('a8.net');
    expect(html).toContain('"softwareVersion": "1.20.8"');
  });

  it('changelog notes the distribution-build link modestly', () => {
    expect(changelog).toContain('<h2>v1.20.8</h2>');
    expect(changelog).toContain('配布版に公式サイトへの案内を追加');
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
    expect(gone).not.toContain('<!--ads-start-->');
    expect(gone).not.toContain('<!--a8-pr-start-->');
    expect(gone).not.toContain('<!--goatcounter-start-->');
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
  it('title and endpanel insert the portal link and bind it, with window.open fallback in the module', () => {
    expect(ui).toContain("import { portalLinkHtml, bindPortalLinks, portalLinkEnabled } from './portal-link';");
    expect(ui).toContain("document.body.classList.toggle('portal-ending', portalLinkEnabled())");
    expect(ui).toMatch(/\$\{portalLinkHtml\('title'\)\}/);
    expect(ui).toMatch(/\$\{portalLinkHtml\('ending'\)\}/);
    expect(ui).toMatch(/setPrMode\('title'\);\s*document\.body\.classList\.remove\('portal-ending'\);\s*bindPortalLinks\(\);/);
    expect(ui).toContain('class="panel endpanel"');
    expect(ui).toMatch(/portalLinkHtml\('ending'\)\}<div class="row">/);
    const mod = readFileSync('src/sc/portal-link.ts', 'utf8');
    expect(mod).toContain("window.open(url, '_blank', 'noopener')");
    expect(mod).toContain('target="_blank"');
    expect(css).toContain('.portal-link{');
    expect(css).toContain('.endpanel .portal-link{display:none');
    expect(css).toContain('body.pr-ending .endpanel .portal-link{display:block}');
  });
});
