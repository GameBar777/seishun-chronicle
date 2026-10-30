/**
 * Illustration registry (data-driven). To add art:
 *  1. put `<key>-480.webp` and `<key>-800.webp` in public/illustrations/
 *  2. add the key + Japanese alt text to ART
 *  3. map an event category in BY_CATEGORY, or a single event in BY_EVENT (override wins)
 */
export const ART: Record<string, string> = {
  title: '夕暮れの海辺の町から丘へ続く小道を、学生・恋人たち・親子・老人が歩いていく。手前の湖に波紋が広がる',
  career: '夕暮れのオフィスで、窓の外の街並みを背にノートパソコンに向かう若い社会人',
  romance: '雨の夜の石畳の通りで、ひとつの傘に入って寄り添う二人',
  marriage: '大きな木の下、灯りと舞う花びらの中で手を取り合う二人と拍手する友人たち',
  children: '陽の差すリビングで、幼い子の手を引く親と積み木で遊ぶ子ども',
  family: '紅葉の縁側で、年老いた親の歩みをそっと支える大人',
  health: '朝の光が差す病室で、温かい飲み物を手にベッドで休む人',
  money: '夜の台所で、家計簿と小銭の瓶、封筒を前に考え込む人',
  housing: '夕暮れの住宅街、段ボールを運び込む家族と小さな家',
  disaster: '冠水した町で、荷物を運び合い助け合う近所の人々。雲間から光が差す',
  friendship: '提灯の灯る居酒屋で、料理を囲んで笑い合う三人の友人',
  startup: '夜のガレージで、ホワイトボードに図を描きながら構想を練る二人の創業者',
  aging: '柿の木の下のベンチで、本を読み植木を手入れする老夫婦と三毛猫',
  legacy: '封蝋の手紙と懐中時計、写真立て、若木の鉢が置かれた古い机に手を添える若者',
  hometown: '田んぼと鉄橋を渡る列車、提灯の祭りが見える故郷を、鞄を手に眺める旅人',
  news: '朝のカフェの窓辺で新聞を広げる人。外を路面電車が走る',
  education: '桜の見える図書館で、本を積み上げて勉強する学生',
  review: '夕闇の湖に幾重にも広がる光る波紋と、岸辺の小舟と一本の木',
};

export const BY_CATEGORY: Record<string, string> = {
  career: 'career', education: 'education', love: 'romance', family: 'children', health: 'health',
  money: 'money', life: 'hometown', social: 'friendship', aging: 'aging', world: 'news', echo: 'legacy',
};

export const BY_EVENT: Record<string, string> = {
  career_startup_idea: 'startup', career_startup_collapse: 'startup', career_biz_crisis: 'startup', career_biz_growth: 'startup', career_biz_first_year: 'startup', life_crowdfunding: 'startup',
  love_proposal: 'marriage', love_remarry: 'marriage', family_child_wedding: 'marriage',
  family_parent_illness: 'family', family_parent_funeral: 'legacy', family_widowed: 'legacy', family_sibling_feud: 'family', family_reunion: 'family', family_grandchild: 'legacy',
  money_house: 'housing', money_house_repair: 'housing', life_big_move: 'housing', aging_downsize: 'housing', career_regional_job: 'hometown',
  money_inheritance_parent: 'legacy', life_uncle_estate: 'legacy', aging_will: 'legacy', aging_memoir: 'legacy',
  world_disaster: 'disaster', social_old_friend_dies: 'legacy', life_band: 'friendship', life_festival: 'hometown',
  health_pandemic: 'news', aging_frail: 'health',
};

export const artUrl = (key: string, w: 480 | 800 = 480) => `${import.meta.env?.BASE_URL ?? '/'}illustrations/${key}-${w}.webp`;

export function artForEvent(id: string, cat: string): string | undefined {
  const k = BY_EVENT[id] ?? BY_CATEGORY[cat];
  return k && ART[k] ? k : undefined;
}

/** <picture>-free responsive img; lazy + async decode; fixed aspect ratio prevents layout shift. */
export function artImg(key: string, cls: string, eager = false): string {
  const alt = ART[key]; if (!alt) return '';
  return `<img class="art ${cls}" src="${artUrl(key, 480)}" srcset="${artUrl(key, 480)} 480w, ${artUrl(key, 800)} 800w" sizes="(max-width: 600px) 100vw, 600px" width="800" height="${key === 'title' ? 600 : 450}" alt="${alt.replace(/"/g, '&quot;')}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" data-testid="art" data-art="${key}">`;
}
