import { EVENTS } from '../src/data/events';
import { JOBS } from '../src/data/jobs';
import { writeFileSync } from 'node:fs';
const CAT: Record<string, string> = { education: '教育', career: '仕事', money: 'お金', love: '恋愛・結婚', family: '家族', health: '健康', social: '人間関係', world: '世界', aging: '老後', echo: '残響・継承', life: '暮らし' };
const rec = (e: any) => e.scheduledOnly ? '結果イベント（予約時のみ）' : e.max ? `最大${e.max}回${e.cooldown ? `／${e.cooldown}年間隔` : ''}` : e.cooldown ? `${e.cooldown}年間隔` : '一生に1回';
let md = `# イベント一覧（自動生成：npm run eventlist）\n\n総数：${EVENTS.length}件／職業：${JOBS.length}種\n\n`;
for (const cat of Object.keys(CAT)) { const es = EVENTS.filter(e => e.cat === cat); if (!es.length) continue;
  md += `## ${CAT[cat]}（${es.length}件）\n\n| ID | タイトル | 選択肢数 | 再発制御 | 選択肢 |\n|---|---|---|---|---|\n`;
  for (const e of es) md += `| ${e.id} | ${typeof e.title === 'string' ? e.title : '(動的)'} | ${e.choices.length} | ${rec(e)} | ${e.choices.map(c => typeof c.label === 'string' ? c.label : '(動的)').join(' / ')} |\n`;
  md += '\n'; }
md += `## 職業\n\n| ID | 名称 | 基本年収(万円) | 必要学歴 | 自動化リスク |\n|---|---|---|---|---|\n` + JOBS.map(j => `| ${j.id} | ${j.name} | ${j.base} | ${j.edu} | ${j.automation} |`).join('\n') + '\n';
writeFileSync('docs/events.md', md); console.log('events', EVENTS.length, 'jobs', JOBS.length);
