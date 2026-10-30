import type { Edu, Stat } from '../engine/types';
export interface JobDef {
  id: string; name: string; base: number; // annual salary at rank 0 (万円)
  edu: Edu; stat: Stat; min: number; industry: string; automation: number; // 0-1 risk as tech rises
  techMin?: number; techMax?: number; stress: number; prestige: number; ranks: string[];
}
const R = (a: string) => a.split(',');
export const JOBS: JobDef[] = [
  { id: 'clerk', name: '事務職', base: 290, edu: 'hs', stat: 'dis', min: 25, industry: 'service', automation: 0.8, stress: 3, prestige: 2, ranks: R('一般職,主任,係長,課長,部長') },
  { id: 'retail', name: '販売スタッフ', base: 250, edu: 'hs', stat: 'soc', min: 20, industry: 'service', automation: 0.6, stress: 3, prestige: 1, ranks: R('スタッフ,リーダー,副店長,店長,エリア長') },
  { id: 'factory', name: '工場技能職', base: 320, edu: 'hs', stat: 'phy', min: 25, industry: 'manufacturing', automation: 0.7, stress: 4, prestige: 2, ranks: R('作業員,班長,職長,工場課長,工場長') },
  { id: 'driver', name: '配送ドライバー', base: 340, edu: 'hs', stat: 'phy', min: 20, industry: 'logistics', automation: 0.75, stress: 4, prestige: 1, ranks: R('ドライバー,班長,配車係,所長,支店長') },
  { id: 'fisher', name: '漁師', base: 300, edu: 'hs', stat: 'phy', min: 30, industry: 'fishing', automation: 0.2, stress: 5, prestige: 2, ranks: R('乗組員,甲板長,船頭,船主,漁協理事') },
  { id: 'farmer', name: '果樹農家', base: 260, edu: 'hs', stat: 'dis', min: 25, industry: 'farming', automation: 0.3, stress: 3, prestige: 2, ranks: R('見習い,農家,中堅農家,農園主,組合長') },
  { id: 'cook', name: '料理人', base: 270, edu: 'voc', stat: 'cre', min: 30, industry: 'tourism', automation: 0.25, stress: 5, prestige: 3, ranks: R('見習い,板前,副料理長,料理長,オーナーシェフ') },
  { id: 'carer', name: '介護福祉士', base: 300, edu: 'voc', stat: 'soc', min: 30, industry: 'care', automation: 0.15, stress: 6, prestige: 3, ranks: R('介護職,リーダー,主任,施設長補佐,施設長') },
  { id: 'nurse', name: '看護師', base: 420, edu: 'voc', stat: 'dis', min: 40, industry: 'care', automation: 0.1, stress: 7, prestige: 4, ranks: R('看護師,主任,副師長,師長,看護部長') },
  { id: 'electrician', name: '電気工事士', base: 380, edu: 'voc', stat: 'phy', min: 35, industry: 'manufacturing', automation: 0.2, stress: 4, prestige: 3, ranks: R('見習い,職人,班長,現場監督,親方') },
  { id: 'designer', name: 'デザイナー', base: 330, edu: 'voc', stat: 'cre', min: 45, industry: 'media', automation: 0.55, stress: 5, prestige: 4, ranks: R('ジュニア,デザイナー,シニア,アートディレクター,クリエイティブ長') },
  { id: 'teacher', name: '教師', base: 400, edu: 'uni', stat: 'soc', min: 40, industry: 'education', automation: 0.1, stress: 6, prestige: 5, ranks: R('講師,教諭,主任,教頭,校長') },
  { id: 'civil', name: '公務員', base: 380, edu: 'uni', stat: 'dis', min: 40, industry: 'service', automation: 0.3, stress: 3, prestige: 5, ranks: R('主事,主任,係長,課長,局長') },
  { id: 'engineer', name: 'ソフトウェア技術者', base: 480, edu: 'uni', stat: 'int', min: 50, industry: 'tech', automation: 0.35, stress: 5, prestige: 5, ranks: R('エンジニア,シニア,リード,マネージャー,CTO') },
  { id: 'sales', name: '法人営業', base: 420, edu: 'uni', stat: 'soc', min: 40, industry: 'finance', automation: 0.4, stress: 6, prestige: 4, ranks: R('営業,主任,課長,部長,営業本部長') },
  { id: 'banker', name: '銀行員', base: 470, edu: 'uni', stat: 'int', min: 50, industry: 'finance', automation: 0.6, stress: 6, prestige: 6, ranks: R('行員,主任,支店次長,支店長,役員') },
  { id: 'journalist', name: '記者', base: 410, edu: 'uni', stat: 'cre', min: 45, industry: 'media', automation: 0.45, stress: 7, prestige: 5, ranks: R('記者,中堅記者,デスク,編集長,論説委員') },
  { id: 'researcher', name: '研究者', base: 450, edu: 'grad', stat: 'int', min: 60, industry: 'research', automation: 0.15, stress: 5, prestige: 7, ranks: R('研究員,助教,准教授,教授,所長') },
  { id: 'doctor', name: '医師', base: 750, edu: 'grad', stat: 'int', min: 70, industry: 'care', automation: 0.1, stress: 8, prestige: 9, ranks: R('研修医,医師,専門医,部長,院長') },
  { id: 'lawyer', name: '弁護士', base: 650, edu: 'grad', stat: 'int', min: 70, industry: 'finance', automation: 0.3, stress: 7, prestige: 8, ranks: R('アソシエイト,弁護士,シニア,パートナー,代表') },
  { id: 'musician', name: '音楽家', base: 180, edu: 'hs', stat: 'cre', min: 55, industry: 'media', automation: 0.3, stress: 5, prestige: 4, ranks: R('駆け出し,セッション奏者,ソロ活動,有名奏者,巨匠') },
  { id: 'innkeeper', name: '温泉宿の番頭', base: 280, edu: 'hs', stat: 'soc', min: 25, industry: 'tourism', automation: 0.2, stress: 4, prestige: 3, ranks: R('仲居,番頭,支配人,女将/主人,宿の顔') },
  // Jobs unlocked by technological progress
  { id: 'ai_trainer', name: 'AI調律師', base: 520, edu: 'uni', stat: 'int', min: 45, industry: 'tech', automation: 0.1, techMin: 35, stress: 5, prestige: 6, ranks: R('調律師,シニア,リード,責任者,フェロー') },
  { id: 'drone_pilot', name: 'ドローン物流操縦士', base: 400, edu: 'voc', stat: 'phy', min: 30, industry: 'logistics', automation: 0.4, techMin: 30, stress: 4, prestige: 3, ranks: R('操縦士,主任,運航管理,所長,統括') },
  { id: 'climate', name: '防災・気候エンジニア', base: 500, edu: 'uni', stat: 'int', min: 50, industry: 'research', automation: 0.1, techMin: 45, stress: 5, prestige: 6, ranks: R('技師,主任技師,課長,部長,技監') },
  { id: 'gig', name: '単発ワーカー', base: 200, edu: 'hs', stat: 'phy', min: 0, industry: 'service', automation: 0.5, stress: 4, prestige: 1, ranks: R('ワーカー,常連,高評価,エース,伝説') },
];
export const jobById = (id: string | null) => JOBS.find(j => j.id === id);
export const EDU_RANK: Record<Edu, number> = { hs: 0, voc: 1, uni: 2, grad: 3 };
export const EDU_NAME: Record<Edu, string> = { hs: '高卒', voc: '専門卒', uni: '大卒', grad: '院卒' };
