import { HEROINES } from '../src/sc/data/index';
import { EVMAP } from '../src/sc/engine';
export function ALL_LINES_COUNT() {
  const evs = Object.values(EVMAP); let lines = 0;
  for (const e of evs) { lines += e.lines.length; for (const c of e.choices || []) lines += c.res.length; }
  for (const H of HEROINES) { lines += H.greet.flat().length + H.phone.flat().length + H.inviteOk.length + H.inviteNo.length + Object.values(H.chat).flat().length + H.dateQ.length * 6 + Object.values(H.endings).flat().length + 2; }
  return { events: evs.length, lines };
}
