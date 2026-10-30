# 仕様書 — 人生の残響 RIPPLE YEARS (v0.1.0 MVP)

## コンセプト
1年=1ターン。毎年2〜4件のイベントが起き、各3〜5択。選択は即時効果に加え「残響（echo）」として数年後に因果的に回帰する。18歳開始、死亡まで（多くは60〜90歳）。死後は相続人で継続（世代継承）または新しい人生／新しい世界。

## 構成
| 層 | ファイル | 内容 |
|---|---|---|
| 乱数 | src/engine/rng.ts | mulberry32、状態は save に保存 → 完全決定論 |
| 世界経済 | src/engine/world.ts | 架空国家の景気循環（好況/後退/危機）、金利・インフレ（小数）、失業率（%）、株価指数、住宅指数、新聞見出し |
| 家計 | src/engine/finance.ts | 単位=万円。収入・税・生活費・家賃/ローン・投資損益・借金利息を年次計算。純資産 = 現金+投資+不動産評価−負債 を毎年恒等式で検証 |
| イベントDSL | src/engine/eventTypes.ts, src/data/events/* | 条件・重み・`once`/`cooldown`/`max`/`scheduledOnly`、選択肢ごとの効果・遅延予約・echo |
| 進行 | src/engine/game.ts | 抽選（eligible）、キュー（遅延結果）、年次処理、死亡判定、相続 |
| NPC | src/data/people.ts, ctx.addNpc | 関係種別、好感度、感情、各自の目標（昇進・結婚・独立など）と年次進行 |
| レビュー | src/engine/review.ts | 富・健康・愛・家族・仕事・自由・社会貢献などの多軸スコア、称号（7種以上のエンディング）、ハイライト |
| 実績 | src/engine/achievements.ts | |
| 保存 | src/platform/save.ts | localStorage、SAVE_VERSION=2、v1→v2移行、未来版/破損の拒否、JSON入出力 |
| 広告 | src/platform/ads.ts | 既定無効。H5 adBreak（type `next`）を「人生の区切り」のみで要求、失敗・未表示でも必ず続行 |
| 分析 | src/platform/analytics.ts | no-op。エンドポイント設定かつ同意時のみ |
| UI | src/ui/app.ts, styles.css, chart.ts | タイトル/設定/チュートリアル/本編、タブ：人生・年表(チャート)・お金・人間関係・新聞・その他(家系図・実績・設定) |

## コンテンツ範囲
教育、転職、起業、失業、借金、投資、住宅、恋愛、結婚、離婚、子ども、親の介護、病気、災害、死 — すべてイベント化済み（`docs/events.md`）。職業26種（学歴・年齢・技能要件付き）。

## 非目標（MVPでやらないこと）
ガチャ・課金、オンライン機能、既存ゲームの模倣、英語ローカライズ（構造のみ）。
