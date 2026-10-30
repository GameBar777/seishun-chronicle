// Fictional regions of the island nation "Aomine" (青嶺).
export interface RegionDef { id: string; name: string; desc: string; price: number; urban: number; industries: string[]; disaster: number; }
export const REGIONS: RegionDef[] = [
  { id: 'seiran', name: '星嵐市', desc: '高層ビルと地下鉄が網の目のように走る首都。チャンスも家賃も高い。', price: 1.35, urban: 95, industries: ['finance', 'tech', 'media', 'service'], disaster: 0.02 },
  { id: 'minatobe', name: '湊辺町', desc: '潮の匂いのする港町。漁協と小さな造船所が町の背骨。', price: 0.9, urban: 45, industries: ['fishing', 'logistics', 'service'], disaster: 0.05 },
  { id: 'kayano', name: '茅野谷', desc: '山あいの盆地。果樹園と温泉宿、そして過疎の気配。', price: 0.75, urban: 20, industries: ['farming', 'tourism', 'care'], disaster: 0.04 },
  { id: 'akagane', name: '赤金市', desc: '製鉄所の煙突が並ぶ工業都市。景気の波をまともに受ける。', price: 0.95, urban: 70, industries: ['manufacturing', 'logistics', 'tech'], disaster: 0.03 },
  { id: 'shiratori', name: '白鳥台', desc: '大学と研究所が集まる学園都市。若者と古書店が多い。', price: 1.1, urban: 65, industries: ['research', 'education', 'care', 'tech'], disaster: 0.02 },
];
export const regionById = (id: string) => REGIONS.find(r => r.id === id)!;
