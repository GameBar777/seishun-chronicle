# Audio credits（v1.12.0〜）

ゲーム内表記（タイトル画面）：**音楽：魔王魂（CC BY 4.0）／効果音：効果音ラボ・魔王魂**

- 魔王魂 https://maou.audio/ — CC BY 4.0（クレジット「音楽：魔王魂」必須）。ゲーム組み込み利用可、音源単体での再配布は不可。
- 効果音ラボ https://soundeffect-lab.info/ — 商用・非商用無料、クレジット任意。素材そのものの再配布は禁止（ゲーム内利用は可）。

加工：BGM は前後無音カット → loudnorm I=-16 LUFS / TP -1.5 → 44.1kHz stereo 128kbps。SE は I=-18 LUFS mono 96kbps。ループは終端 1.6 秒前から同曲へクロスフェード。
ファイル読み込み失敗時のみ旧シンセ BGM/SE にフォールバック。タイトル曲 theme.mp3 は従来のまま。

## BGM（public/audio/bgm/）
| key | 使う場面 | 原曲（魔王魂） |
|---|---|---|
| school | 登校・通常の学校 | maou_bgm_acoustic12 |
| day | 昼・趣味系行動 | maou_bgm_piano06 |
| evening | 放課後・自宅（夕）・バイト | maou_bgm_piano29（end of the day） |
| night | 夜・休養・病院・電話 | maou_bgm_acoustic52（ast daily sound） |
| study | 勉強・図書室 | maou_bgm_piano14 |
| club | 部活・運動 | maou_bgm_neorock56（Hot road） |
| date | デート（遊園地など） | maou_bgm_acoustic44（Merry-go-round） |
| cafe | カフェ/図書館/映画/水族館デート | maou_bgm_acoustic38（Avenue Cafe） |
| tender | ヒロインイベント・しっとり | maou_bgm_piano28（once again…） |
| sad | 悲しい場面・爆弾・噂 | maou_bgm_piano22（悲しみのモノクロ） |
| rival | ライバル・和田 | maou_bgm_piano17 |
| confession | 告白 | maou_bgm_piano19 |
| festival | 夏祭り・文化祭・体育祭 | maou_bgm_acoustic34（サマータイムわんこ） |
| winter | クリスマス・冬の初詣 | maou_bgm_acoustic54（candle night アレンジver.） |
| good_end | グッド系エンディング | maou_bgm_piano30（Departure） |
| bad_end | バッド/ライバルエンド | maou_bgm_piano20 |

## SE（public/audio/se/）
| key | 用途 | 出典 |
|---|---|---|
| select / confirm / cancel / good | 選択・決定・キャンセル | 効果音ラボ button/cursor1, decision1, cancel2, decision3 |
| statup / statdown / bad | 能力アップ・ダウン | 効果音ラボ battle/magic-statusup1, battle/down1 |
| heart / doki | 好感度アップ・CG | 効果音ラボ anime/kira2, anime/heart1 |
| page / flip / jingle | 週替わりカレンダー | 効果音ラボ various/page1、魔王魂 se_sound_paper01, se_jingle12 |
| door / bell | ドア・チャイム | 効果音ラボ various/slidingdoor-open1, anime/school-chime1（9秒に短縮） |
| phone / message | 電話・メッセージ | 効果音ラボ machine/mobile-phone-vibration1, mobile-phone-tone1 |
| rest / hospital / cold / injury | 休養・病院・風邪・ケガ | 効果音ラボ various/futon-dive1, various/autodoor-open1、魔王魂 se_sound_heartbeat01、効果音ラボ battle/real-down1 |
| rival / bomb | ライバル登場・爆弾 | 効果音ラボ anime/eye-shine1, anime/trumpet-greasedown1 |
