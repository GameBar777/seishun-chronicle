// Core data types. All money values are in 万円 (10,000 JPY units).
export type Stat = 'int' | 'soc' | 'phy' | 'cre' | 'dis';
export type Edu = 'hs' | 'voc' | 'uni' | 'grad';
export type Role = 'parent' | 'sibling' | 'friend' | 'partner' | 'spouse' | 'ex' | 'child' | 'boss' | 'coworker' | 'mentor' | 'neighbor' | 'stranger';

export interface Feelings { trust: number; affection: number; anger: number; respect: number; disappointment: number; }

export interface NPC {
  id: string; name: string; sex: 'm' | 'f'; birthYear: number; role: Role;
  traits: { warmth: number; ambition: number; stability: number }; // 0-100
  value: string;       // what they care about (key into VALUES)
  goal: string;        // independent life goal (key into GOALS)
  goalProgress: number; // 0-100
  jobId: string | null; income: number; health: number; alive: boolean; deathYear?: number;
  regionId: string; f: Feelings; notes: string[];
  // child-only
  parentIds?: string[]; eduPts?: number; outcome?: string; stats?: Record<Stat, number>;
  gen?: number;
}

export interface Business { name: string; value: number; employees: number; founded: number; profitRate: number; }
export interface House { value: number; mortgage: number; rate: number; payment: number; bought: number; }

export interface Player {
  name: string; sex: 'm' | 'f'; birthYear: number; age: number; regionId: string; homeRegionId: string;
  edu: Edu; studying: null | { kind: Edu; yearsLeft: number; cost: number };
  certs: string[];
  jobId: string | null; jobYears: number; rank: number; unemployedYears: number; retired: boolean;
  business: Business | null; house: House | null;
  cash: number; invest: number; debt: number; debtRate: number; investRate: number; // fraction of surplus auto-invested
  health: number; happy: number; stress: number; rep: number;
  stats: Record<Stat, number>; traits: string[];
  origin: { regionId: string; family: string; wealth: number; parentJobs: string[]; familyBusiness: string | null };
  spouseId: string | null; partnerId: string | null; childIds: string[];
  illness: string | null; deathCause?: string;
}

export interface World {
  year: number; phase: 'boom' | 'normal' | 'recession' | 'crisis'; growth: number; inflation: number; priceLevel: number;
  unemployment: number; interest: number; tech: number; tension: number; welfare: number; population: number;
  regions: Record<string, RegionState>; unlockedJobs: string[]; history: WorldNews[]; echoes: Echo[];
  townFacts: Record<string, string | number | boolean>; // persistent facts across generations
}
export interface RegionState { id: string; dev: number; pop: number; jobsBonus: number; disasterRisk: number; }
export interface WorldNews { year: number; kind: string; text: string; echoId?: string; }

// The Echo system: causal ripples from a choice to people / town / world.
export interface Echo {
  id: string; year: number; gen: number; cause: string; effect: string; target: 'npc' | 'town' | 'world' | 'family';
  key: string; surfaceYear: number; surfaced: boolean; magnitude: number; npcId?: string;
}

export interface LedgerRow {
  year: number; age: number; cashStart: number; oneoff: number; income: number; spouseIncome: number; tax: number; living: number;
  housing: number; education: number; debtInterest: number; debtRepay: number; borrowed: number; loans: number;
  invDeposit: number; invWithdraw: number; invReturn: number; cashEnd: number; debtStart: number; debtEnd: number; forgiven: number;
  investStart: number; investEnd: number; netWorth: number;
}

export interface LogEntry { year: number; age: number; kind: string; text: string; important?: boolean; }
export interface HistPoint { year: number; age: number; netWorth: number; happy: number; health: number; income: number; }

export interface PendingChoice { label: string; hint: string; disabled?: boolean; }
export interface ActiveEvent { id: string; npcId?: string; title: string; text: string; choices: PendingChoice[]; choiceMap: number[]; data?: any; }

export interface LifeSummary {
  gen: number; name: string; birthYear: number; deathYear: number; age: number; cause: string; ending: string; endingTitle: string;
  scores: Record<string, number>; netWorth: number; heirId?: string; highlights: string[]; obituary: string;
}

export interface GameState {
  version: number; seed: number; rng: number; gen: number; createdAt: number;
  world: World; p: Player; npcs: NPC[];
  queue: { id: string; npcId?: string; data?: any; scheduled?: boolean }[];
  active: ActiveEvent | null; yearResults: string[];
  log: LogEntry[]; ledger: LedgerRow[]; hist: HistPoint[];
  flags: Record<string, number>; evHist: Record<string, { n: number; last: number }>;
  scheduled: { year: number; id: string; npcId?: string; data?: any }[];
  phase: 'play' | 'yearEnd' | 'dead' | 'over';
  lineage: LifeSummary[]; pendingSummary: LifeSummary | null;
  cur: { oneoff: number; loans: number; invDeposit: number; invWithdraw: number; education: number; forgiven: number };
  choiceLog: { year: number; ev: string; c: number }[];
  stats: { yearsPlayed: number; eventsSeen: number };
}
