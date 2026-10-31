# イベントCG（一枚絵）リスト

各ヒロイン5枚＝計45枚。シナリオ行に `'cg:<id>'` を書くとその行から全画面CG（立ち絵は非表示）、シーン終了か `'cg:off'` で消える。
画像: `public/img/cg/h/<id>.webp`（1280×720）＋ `<id>-s.webp`（768×432、スマホ用）。定義: `src/sc/data/cg.ts`。
共通方針: 16:9、主人公は顔を出さない（画面外の一人称視点 or 後ろ姿）、全年齢（キスまで）。

| ヒロイン | ① 個別イベント | ② 個別イベント | ③ 山場 | ④ 告白（グッドエンド） | ⑤ キス（グッドエンド） | 状態 |
|---|---|---|---|---|---|---|
| 春日ひなた | hinata_1 焼きたての朝 | hinata_2 アルバムの写真 | hinata_3 雨宿りの告白未遂 | hinata_confess 歩道橋の告白 | hinata_kiss 春風のキス | **実装済み（パイロット）** |
| 氷室澪 | mio_1 校則違反の現場 | mio_3 生徒会選挙 | mio_4 母との対話 | mio_confess 生徒会室 | mio_kiss | **実装済み** |
| 白鷺ゆら | yura_1 音が見える | yura_2 冬の海 | yura_4 わたしの音 | yura_confess 夕暮れの音楽室 | yura_kiss | **実装済み** |
| 速水夏帆 | kaho_1 はやみ食堂 | kaho_3 止まった脚 | kaho_4 最後の県大会 | kaho_confess 誰もいないグラウンド | kaho_kiss | 未実装 |
| 桐生院麗華 | reika_2 秘密のゲームセンター | reika_3 姉の影 | reika_4 縁談 | reika_confess 校門・歩いて帰る | reika_kiss | 未実装 |
| 灯野ことは | kotoha_1 最初の読者 | kotoha_2 雨の神社 | kotoha_4 選考結果 | kotoha_confess 図書室の手製の本 | kotoha_kiss | 未実装 |
| 姫野ルカ | ruka_1 撮影モデル | ruka_2 夜のコンビニ | ruka_4 本気の負け | ruka_confess 卒業式の後 | ruka_kiss | 未実装 |
| 黒瀬凛 | rin_1 病院の売店 | rin_3 手術の前夜 | rin_4 同じ未来 | rin_confess 病院の屋上 | rin_kiss | 未実装 |
| 宙野しずく（隠し） | shizuku_meet 丘の上の幽霊 | shizuku_1 木星の縞 | shizuku_3 新しい光 | shizuku_confess 旧天文台のドーム | shizuku_kiss | 未実装 |

キスはグッドエンド本文に地の文（ナレーション、音声なし）を2行足して挿入する（ひなたで実施済み）。
見たCGは端末の localStorage `seishun:cg` と、セーブの flags `cg:<id>` に記録。タイトルの「CGモード」で閲覧。
