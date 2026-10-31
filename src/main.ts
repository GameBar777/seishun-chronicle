import './style.css';
import { boot } from './sc/ui';
declare const __BUILD__: string;
// キャッシュされた古いビルドで起動していたら、最新版に一度だけ読み直す
if (!import.meta.env.DEV) {
  fetch(import.meta.env.BASE_URL + 'version.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(v => {
    if (v?.build && v.build !== __BUILD__ && sessionStorage.getItem('seishun:reloaded') !== v.build) {
      sessionStorage.setItem('seishun:reloaded', v.build);
      const u = new URL(location.href); u.searchParams.set('v', v.build); location.replace(u.toString());
    }
  }).catch(() => {});
}
boot();
