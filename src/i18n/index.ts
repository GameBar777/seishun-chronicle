import { ja } from './ja';
export type Dict = typeof ja;
const dicts: Record<string, Partial<Dict>> = { ja };
let lang = 'ja';
export const setLang = (l: string) => { lang = dicts[l] ? l : 'ja'; if (typeof document !== 'undefined') document.documentElement.lang = lang; };
export function t(key: keyof Dict, vars: Record<string, string | number> = {}): string {
  let s = (dicts[lang]?.[key] ?? ja[key] ?? key) as string;
  for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}
export const LANGS = [{ id: 'ja', name: '日本語' }];
