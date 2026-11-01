# Audio credits（v1.12.0〜）

ゲーム内表記（タイトル画面）：**音楽：魔王魂（CC BY 4.0）／効果音：OtoLogic（CC BY 4.0）・魔王魂**

- 魔王魂 https://maou.audio/ — CC BY 4.0（クレジット「音楽：魔王魂」必須）。ゲーム組み込み利用可、音源単体での再配布は不可。
- OtoLogic https://otologic.jp/ — CC BY 4.0（https://otologic.jp/free/license.html ：クレジット「OtoLogic」表示で改変・商用・再配布可）。
- 魔王魂は https://maou.audio/rule/ で CC BY 4.0 を選択して利用（二次配布は著作表記＋魔王魂へのリンクで可）。公開リポジトリに素材ファイルが含まれるため、両者とも CC BY 4.0 の条件（表記＋ライセンス明示）で再配布している。
- v1.12.0 で使っていた効果音ラボの素材は「素材そのものの再配布禁止」のため v1.12.1 で全て差し替え済み（※ git 履歴の v1.12.0 コミットには旧ファイルが残っている。履歴の書き換えはしていない）。

加工：BGM は前後無音カット → loudnorm I=-16 LUFS / TP -1.5 → 44.1kHz stereo 128kbps。SE は I=-18 LUFS（0.4秒未満の短い音はループ計測でゲイン算出、TP -1.5 上限）mono 96kbps。ループは終端 1.6 秒前から同曲へクロスフェード。
ファイル読み込み失敗時のみ旧シンセ BGM/SE にフォールバック。タイトル曲 theme.mp3 は従来のまま。

主題歌（public/audio/theme.mp3 / .ogg、タイトル画面・エンディングで再生）：「Shine Again」 歌：MIRAi — https://youtube.com/@mirai_official19（ユーザー提供の音源）。表記：タイトル画面のクレジット、🎵主題歌プレイヤー、エンドロール。

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

## SE（public/audio/se/、v1.12.1〜）
| key | 用途 | 出典（ファイル） | ライセンス |
|---|---|---|---|
| select | カーソル・選択 | OtoLogic システム音セット01（Sys_Set01-sentaku） | CC BY 4.0 |
| confirm | 決定 | OtoLogic システム音セット01（Sys_Set01-click） | CC BY 4.0 |
| cancel | キャンセル・閉じる | OtoLogic システム音セット01（Sys_Set01-pop down） | CC BY 4.0 |
| good | 良い結果 | OtoLogic システム音セット01（Sys_Set01-pop up） | CC BY 4.0 |
| statup | 能力アップ | OtoLogic オノマトペ キラキラ03（Short, 2秒に短縮） | CC BY 4.0 |
| statdown | 能力ダウン | OtoLogic オノマトペ ネガティブ01（Dry） | CC BY 4.0 |
| bad | 悪い結果 | OtoLogic オノマトペ ネガティブ02（Short） | CC BY 4.0 |
| bomb | 爆弾 | OtoLogic オノマトペ ネガティブ03（Short） | CC BY 4.0 |
| heart | 好感度アップ | OtoLogic オノマトペ キラキラ01（Short, 2.4秒に短縮） | CC BY 4.0 |
| doki | CG表示のドキッ | OtoLogic 心拍02（2.2秒に短縮） | CC BY 4.0 |
| page | 週替わり：カレンダー | OtoLogic カレンダー01（Pull） | CC BY 4.0 |
| flip | 週替わり：紙 | 魔王魂 se_sound_paper01 | CC BY 4.0 |
| jingle | 週替わりジングル | 魔王魂 se_jingle12 | CC BY 4.0 |
| door | ドア | 魔王魂 se_sound_door01 | CC BY 4.0 |
| bell | 学校のチャイム | OtoLogic チャイム 学校02（Fast-Short, 末尾フェード） | CC BY 4.0 |
| phone | 電話（バイブ） | OtoLogic 携帯電話 バイブレーション01（Table, 3秒） | CC BY 4.0 |
| message | メッセージ着信 | OtoLogic システム音セット02（Sys_Set02-pop up） | CC BY 4.0 |
| rest | 休養 | OtoLogic オノマトペ ため息01（Short） | CC BY 4.0 |
| rival | ライバル登場 | OtoLogic オノマトペ びっくり02（Low） | CC BY 4.0 |
| hospital | 病院 | 魔王魂 se_sound_elevator01 | CC BY 4.0 |
| cold | 風邪 | OtoLogic オノマトペ めまい01（Slow-Short） | CC BY 4.0 |
| injury | ケガ | OtoLogic 打撃 パンチ01 | CC BY 4.0 |
