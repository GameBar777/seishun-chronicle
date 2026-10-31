export const START = new Date(2027, 3, 5); // 2027-04-05 (月) 1年目4月第1週
export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
export function cal(week: number) {
  const d = new Date(START.getTime() + week * 7 * 86400000);
  const m = d.getMonth() + 1, day = d.getDate();
  const n = Math.floor((day - 1) / 7) + 1;
  const schoolYear = (m >= 4 ? d.getFullYear() : d.getFullYear() - 1) - 2027 + 1;
  const term = m >= 4 && m <= 7 ? '1学期' : m >= 9 && m <= 12 ? '2学期' : m === 8 ? '夏休み' : '3学期';
  const vacation = (m === 8) || (m === 7 && n >= 4) || (m === 12 && n >= 4) || (m === 1 && n === 1) || (m === 3 && n >= 4);
  return { date: d, y: d.getFullYear(), m, day, n, Y: schoolYear, term: vacation && m !== 8 ? term + '（休み）' : term, vacation, wd: WEEKDAYS[d.getDay()] };
}
export const season = (m: number) => (m >= 3 && m <= 5 ? '春' : m >= 6 && m <= 8 ? '夏' : m >= 9 && m <= 11 ? '秋' : '冬');
// 卒業式: 3年目3月第1週
export const LAST_WEEK = (() => { for (let w = 140; w < 160; w++) { const c = cal(w); if (c.Y === 3 && c.m === 3) return w; } return 151; })();
export const fmtDate = (week: number) => { const c = cal(week); return `${c.y}年${c.m}月${c.day}日（${c.wd}）`; };
