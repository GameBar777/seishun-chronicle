export type StatKey = 'bun' | 'ri' | 'gei' | 'yo' | 'un' | 'kon' | 'hp' | 'st' | 'moral' | 'exp';
export const STAT_LABEL: Record<StatKey, string> = { bun: '文系', ri: '理系', gei: '芸術', yo: '容姿', un: '運動', kon: '根性', hp: '体力', st: 'ストレス', moral: 'モラル', exp: '経験値' };
export type Difficulty = 'EASY' | 'NORMAL' | 'HARD' | 'VERY HARD';
export type Emo = '通常' | '嬉' | '照' | '怒' | '哀' | '驚' | '嫉' | '囁' | '告' | '冷';
export const STAGES = ['他人', '顔見知り', '友人', '親友', '気になる存在', '好き', '夢中'] as const;
export type Stage = typeof STAGES[number];
export type Club = '野球部' | 'サッカー部' | 'テニス部' | '陸上部' | '吹奏楽部' | '美術部' | '写真部' | '帰宅部';
export type Job = 'コンビニ' | 'ファミレス' | '書店' | 'カフェ' | 'ホテル' | 'イベントスタッフ';
export type Course = '国公立大学' | '私立大学' | '専門学校' | '就職' | '';
export interface Memory { week: number; kind: 'promise' | 'like' | 'hurt' | 'told' | 'confess' | 'praise'; text: string; done?: boolean }
export interface HState {
  met: boolean; friend: number; toki: number; hurt: number; trust: number;
  dates: number; events: number; points: number; bomb: number; // bomb: 0 none, >0 weeks lit
  lastContact: number; rival: number; withRival: boolean; impression: string;
  lastLocs: string[]; mem: Memory[]; flags: string[]; callTier: number; gotBirthday: number;
}
export interface Setup { sei: string; mei: string; seiYomi: string; meiYomi: string; bm: number; bd: number; persona: string; look: string; diff: Difficulty; seed?: number }
export interface Scene { kind: 'event' | 'date' | 'ending' | 'msg' | 'chat'; id: string; h?: string; step?: number; data?: any; tr?: string }
export interface DiaryEntry { week: number; text: string }
export interface GameState {
  v: number; setup: Setup; week: number; rng: number; lastAct?: string; later?: { q: Scene; w: number }[]; seenL?: string[]; wada?: { m: Record<string, number>; st: Record<string, number>; next: number; out: string[]; won: string[]; t?: string; watch?: Record<string, number>; p?: Record<string, number>; done?: boolean };
  stats: Record<StatKey, number>; money: number;
  club: Club; job: Job | ''; jobDays: number; course: Course; courseResult: '' | '合格' | '不合格';
  hs: Record<string, HState>;
  seen: string[]; flags: string[]; diary: DiaryEntry[]; queue: Scene[];
  sick: number; slump: number; injury: number; rumor: number; cold?: number;
  weather: string; phoneUsed: boolean; dateBooked: { h: string; loc: string } | null;
  exams: { week: number; rank: number; total: number }[]; tournaments: string[];
  outfits: string[]; ended: boolean; ending?: { id: string; title: string; h?: string };
  lastLog: string[]; actionCounts: Record<string, number>;
}
