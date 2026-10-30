import type { Ctx } from '../engine/ctx';
import type { Echo } from '../engine/types';
type H = (c: Ctx, e: Echo) => void;
const surface = (c: Ctx, e: Echo, kind = 'echo') => {
  c.news(e.effect + '。', kind, e.id);
  c.s.log.push({ year: c.year, age: c.age, kind: 'echo', text: `【残響】${e.cause}——${e.effect}。`, important: true });
  c.setFact('echo_' + e.key, c.year);
};
const generic: H = (c, e) => surface(c, e);
export const ECHO_HANDLERS: Record<string, H> = {
  family_biz_closed: (c, e) => { surface(c, e, 'town'); c.w.regions[c.p.homeRegionId].dev -= 1; },
  family_biz_kept: (c, e) => { surface(c, e, 'town'); c.w.regions[c.p.homeRegionId].dev += 1; },
  whistle_reform: (c, e) => { surface(c, e, 'society'); if (c.s.gen === e.gen) c.rep(5); },
  biz_jobs: (c, e) => { surface(c, e, 'economy'); c.w.regions[c.p.regionId].dev += 1; },
  biz_founded: generic,
  biz_orphaned: (c, e) => { surface(c, e, 'economy'); },
  mentee_rises: (c, e) => { surface(c, e, 'people'); if (c.s.gen === e.gen) c.rep(3); },
  favor_returned: (c, e) => { surface(c, e, 'people'); if (c.s.gen === e.gen) { c.cash(50); c.happy(4); } },
  return_home: generic,
  helped_friend: (c, e) => { surface(c, e, 'people'); if (c.npc) c.feel(c.npc, { trust: 5 }); },
  donation: (c, e) => { surface(c, e, 'town'); c.w.regions[c.p.homeRegionId].dev += 1; },
  divorce_kids: (c, e) => { surface(c, e, 'family'); },
  child_supported: (c, e) => { surface(c, e, 'family'); if (c.npc) { c.npc.income += 200; c.feel(c.npc, { affection: 10 }); } if (c.s.gen === e.gen) c.happy(6); },
  child_drift: (c, e) => { surface(c, e, 'family'); if (c.npc) c.feel(c.npc, { affection: -10 }); if (c.s.gen === e.gen) c.happy(-4); },
  spouse_dream: (c, e) => { surface(c, e, 'family'); if (c.s.gen === e.gen) c.happy(3); },
  tutored_kid: (c, e) => { surface(c, e, 'town'); c.w.regions[c.p.regionId].dev += 1; },
  disaster_helper: (c, e) => { surface(c, e, 'town'); c.w.regions[c.p.regionId].disasterRisk *= 0.8; },
  memoir_read: generic,
  scholarship: (c, e) => { surface(c, e, 'town'); c.w.regions[c.p.homeRegionId].dev += 1; },
};
