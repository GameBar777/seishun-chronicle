import type { GameState, StatKey, Memory } from '../types';
export interface Eff {
  f?: number; t?: number; tr?: number; h?: number; pt?: number;
  stats?: Partial<Record<StatKey, number>>; money?: number;
  flag?: string; hflag?: string; mem?: { kind: Memory['kind']; text: string };
  others?: { f?: number; t?: number }; rival?: number; to?: string; nc?: boolean; // nc: 接触扱いにしない（日常シーンの顔出し） to: target heroine override
}
export interface Choice { label: string; eff?: Eff; res: string[]; need?: (s: GameState) => boolean }
export interface Ev {
  id: string; h?: string; title: string;
  cond: (s: GameState) => boolean;
  lines: string[]; choices: Choice[]; prio?: number; dyn?: (s: GameState) => Choice[]; dynLines?: (s: GameState) => string[];
}
export interface DateQ { q: string; a: [string, number][] }
export interface Heroine {
  id: string; sei: string; mei: string; seiYomi: string; meiYomi: string; color: string;
  grade: string; birthday: [number, number]; look: string; personality: string; family: string;
  hobby: string; club: string; likePlace: string; dislikePlace: string; food: string;
  likeTopics: string[]; dislikeTopics: string[]; loveView: string; aggressiveness: string;
  initialImpression: string; difficulty: number; dream: string; strong: string; weak: string;
  scenario: string; hiddenCond: string; // documented spoilers (not shown in game)
  rate: { f: number; t: number }; decay: number;
  demand: Partial<Record<StatKey, number>>; // stat thresholds she is attracted to (scaled by year)
  datePref: Record<string, number>; // -2..+3
  outfit: string; // preferred outfit style
  voice: { pitch: number; rate: number; desc: string };
  call: [string, string, string]; // how she calls player at tier 0/1/2
  greet: [string[], string[], string[]];
  phone: [string[], string[], string[]];
  inviteOk: string[]; inviteNo: string[]; bombLine: string; explodeLine: string;
  dateQ: DateQ[];
  chat: Record<string, [string, string]>; // intent -> [cold, warm]
  topicWords: string[]; // keywords she lights up at
  gift: { good: string; bad: string };
  endings: { good: string[]; normal: string[]; friend: string[]; rival: string[] };
  rivalName: string;
}
