import { hinata, mio, yura, kaho } from './heroinesA';
import { reika, kotoha, ruka, rin, shizuku } from './heroinesB';
import type { Heroine } from './schema';
export const HEROINES: Heroine[] = [hinata, mio, yura, kaho, reika, kotoha, ruka, rin, shizuku];
export const HMAP: Record<string, Heroine> = Object.fromEntries(HEROINES.map(h => [h.id, h]));
export const LOCATIONS: Record<string, { name: string; cost: number; outdoor: boolean; season?: number[]; desc: string }> = {
  movie: { name: '映画館', cost: 1800, outdoor: false, desc: '話題の新作を観る' },
  amuse: { name: '遊園地', cost: 5000, outdoor: true, desc: '絶叫マシンと観覧車' },
  aquarium: { name: '水族館', cost: 2400, outdoor: false, desc: '青い光の中を歩く' },
  zoo: { name: '動物園', cost: 800, outdoor: true, desc: '動物たちとのんびり' },
  mall: { name: 'ショッピングモール', cost: 2000, outdoor: false, desc: '服や雑貨を見て回る' },
  cafe: { name: 'カフェ', cost: 1200, outdoor: false, desc: '駅前の静かな喫茶店' },
  restaurant: { name: 'レストラン', cost: 6000, outdoor: false, desc: '少し背伸びしたディナー' },
  park: { name: '公園', cost: 0, outdoor: true, desc: '汐見中央公園を散歩' },
  sea: { name: '海', cost: 600, outdoor: true, desc: '汐見の浜辺' },
  mountain: { name: '山', cost: 900, outdoor: true, desc: '星見山ハイキング' },
  arcade: { name: 'ゲームセンター', cost: 1500, outdoor: false, desc: 'クレーンゲームと音ゲー' },
  museum: { name: '美術館', cost: 1400, outdoor: false, desc: '市立美術館の企画展' },
  karaoke: { name: 'カラオケ', cost: 1600, outdoor: false, desc: '二時間フリータイム' },
  shrine: { name: '神社', cost: 0, outdoor: true, desc: '汐見神社の参道' },
  festival: { name: '夏祭り', cost: 2000, outdoor: true, season: [7, 8], desc: '汐見川の夏祭り（7〜8月のみ）' },
};
export const OUTFITS: Record<string, { name: string; cost: number; yo: number }> = {
  'カジュアル': { name: 'カジュアル', cost: 0, yo: 0 },
  'きれいめ': { name: 'きれいめ', cost: 8000, yo: 30 },
  'スポーティ': { name: 'スポーティ', cost: 5000, yo: 0 },
  'ナチュラル': { name: 'ナチュラル', cost: 6000, yo: 20 },
  'トレンド': { name: 'トレンド', cost: 12000, yo: 60 },
};
export const CLUBS: Record<string, { gain: Record<string, number>; note: string }> = {
  '野球部': { gain: { un: 6, kon: 5, hp: -6, st: -2 }, note: '運動・根性が伸びる。夏の大会あり' },
  'サッカー部': { gain: { un: 6, yo: 2, hp: -6, st: -2 }, note: '運動と少し容姿' },
  'テニス部': { gain: { un: 5, yo: 3, hp: -5, st: -2 }, note: '運動と容姿' },
  '陸上部': { gain: { un: 7, kon: 4, hp: -7 }, note: '速水夏帆と同じ部' },
  '吹奏楽部': { gain: { gei: 6, kon: 3, hp: -4 }, note: '芸術。桐生院麗華と同じ部' },
  '美術部': { gain: { gei: 7, bun: 1, hp: -2, st: -3 }, note: '芸術。白鷺ゆらが籍を置く' },
  '写真部': { gain: { gei: 5, yo: 2, hp: -2, st: -3 }, note: '芸術と容姿。2年目から姫野ルカが入部' },
  '帰宅部': { gain: { hp: 4, st: -6 }, note: '自由時間。部活コマンドは休養扱い' },
};
export const JOBS: Record<string, { pay: number; gain: Record<string, number>; note: string }> = {
  'コンビニ': { pay: 6000, gain: { kon: 2, hp: -5, st: 4 }, note: '安定収入' },
  'ファミレス': { pay: 7000, gain: { kon: 3, hp: -7, st: 5 }, note: '忙しいが高め' },
  '書店': { pay: 5500, gain: { bun: 3, hp: -3, st: 2 }, note: '文系も伸びる。文学少女と出会うかも' },
  'カフェ': { pay: 6000, gain: { yo: 2, gei: 1, hp: -4, st: 3 }, note: '容姿が伸びる。2年目以降に出会いあり' },
  'ホテル': { pay: 8000, gain: { yo: 2, moral: 1, hp: -8, st: 6 }, note: '高収入・高疲労。名家と縁が' },
  'イベントスタッフ': { pay: 9000, gain: { un: 2, kon: 2, hp: -10, st: 4 }, note: '最高収入、最大疲労' },
};
