import type { Ctx } from './ctx';
import type { Stat, Feelings } from './types';
export type Txt = string | ((c: Ctx) => string);
export interface Fx {
  cash?: number; health?: number; happy?: number; stress?: number; rep?: number;
  stats?: Partial<Record<Stat, number>>; feel?: Partial<Feelings>; flag?: string | string[]; unflag?: string | string[];
  later?: [string, number, number]; // schedule follow-up event id in [min,max] years (bound npc carried)
}
export interface ChoiceDef { icon?: string; label: Txt; hint?: Txt; req?: (c: Ctx) => boolean; fx?: Fx; run?: (c: Ctx) => string | void; result?: Txt; }
export type Category = 'career' | 'education' | 'money' | 'love' | 'family' | 'health' | 'social' | 'world' | 'echo' | 'aging' | 'life';
export interface EventDef {
  id: string; cat: Category; title: Txt; text: Txt;
  say?: Txt; speaker?: Txt; // short spoken line shown in a speech bubble (text then goes under 'details')
  drama?: boolean; // a notable/surprising beat (used to keep most years eventful)
  when: (c: Ctx) => boolean; weight?: number | ((c: Ctx) => number);
  bind?: (c: Ctx) => import('./types').NPC | undefined; // which NPC this event is about
  prepare?: (c: Ctx) => any; // computes per-instance data (e.g. job offers) stored with the active event
  once?: boolean; cooldown?: number; max?: number; scheduledOnly?: boolean;
  choices: ChoiceDef[];
}
