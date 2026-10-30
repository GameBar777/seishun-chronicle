# 広告・配信プラットフォーム調査（2026-10-30 確認、公式ドキュメントのみ）

> 各URLは 2026-10-30 にアクセス確認済み（HTTP 200 / 本文確認）。規約は変わるため申請前に再確認してください。

## 1. Google AdSense（通常のディスプレイ広告） vs H5 Games Ads（Ad Placement API）

| 項目 | AdSense ディスプレイ | H5 Games Ads |
|---|---|---|
| 形式 | ページ内バナー等 | ゲーム内インタースティシャル/リワード（`adBreak()`）、プリロール |
| 参加条件 | AdSense 審査通過 | **AdSense 承認済みアカウントが前提**で、さらに H5 Games Ads 用の申請（ベータ/申込制、承認保証なし） |
| ゲームとの相性 | 画面占有・誤タップリスクあり | 区切り（レベル間など）に差し込む設計。表示可否・頻度は API 側が決定（inversion of control） |
| 本作の実装 | なし | `src/platform/ads.ts`（既定無効、`type:'next'` を人生の区切りでのみ要求、`adBreakDone` タイムアウト付きで必ず続行） |

根拠:
- Ad Placement API ベータ / 申込方法: https://developers.google.com/ad-placement/docs/beta
- API（`adBreak`/`adConfig` の引数、`adBreakDone` は広告未表示でも必ず呼ばれる、`beforeAd` でミュート・一時停止）: https://developers.google.com/ad-placement/apis
- タグと同一ドキュメントで動かす必要、iframe埋め込み時は `allow="autoplay"`: https://developers.google.com/ad-placement/docs/html5-game-structure
- テストモード `data-adbreak-test="on"`（本番前に削除）: https://developers.google.com/ad-placement/docs/test
- H5 Games Ads 概要・適格性（H5ゲームサイトを所有しAdSenseポリシー遵守）: https://adsense.google.com/start/h5-games-ads/
- 申込: https://adsense.google.com/start/h5-game-ads-apply/
- AdSense 参加資格: https://support.google.com/adsense/answer/1705831
- AdSense プログラムポリシー: https://support.google.com/adsense/answer/48182

**結論**: 自サイト（Cloudflare Pages）配信なら H5 Games Ads が本作に最適。ただし ①AdSense 審査 ②H5 Games Ads 申込 の二段階で、どちらも承認は保証されない。承認前は広告ゼロで運用（コードは無効のまま）。

## 2. CrazyGames: Basic Launch vs Full Launch

| 項目 | Basic Launch | Full Launch |
|---|---|---|
| 目的 | 限定オーディエンスでの検証（7〜21日） | 本公開 |
| 終了条件 | 7日以上 **かつ** 500プレイ以上で指標評価 | — |
| 収益化 | なし（広告無効、収益分配なし） | SDK 経由広告で収益分配 |
| SDK | 不要 | 必須（`gameplayStart` 等） |
| 外部広告 | 不可（**AdSense/H5 Games Ads をCrazyGames版に入れてはいけない**） | CrazyGames SDK 広告のみ |
| サイズ | 初期 ≤50MB、合計 ≤250MB、≤1500ファイル（モバイルホーム掲載は ≤20MB） | 同左 |
| その他 | PEGI12相当、外部ログイン不可、クロスプロモ不可、**英語ローカライズ必須**、独自フルスクリーンボタン不可 | 1クリック以内でゲームプレイへ、AdBlock 環境でもプレイ可能、ミッドゲーム広告は最大3分に1回（SDK側制御） |

根拠:
- 全体: https://docs.crazygames.com/
- Basic Launch 指標: https://docs.crazygames.com/resources/basic-launch-metrics/
- 要件: https://docs.crazygames.com/requirements/intro/
- 技術要件: https://docs.crazygames.com/requirements/technical/
- ゲームプレイ要件（英語必須等）: https://docs.crazygames.com/requirements/gameplay/
- 広告要件: https://docs.crazygames.com/requirements/ads/
- 開発者ポータル: https://developer.crazygames.com/

**本作の適合状況**: ビルド ~170KB で容量は余裕。**英語未対応のため現状は提出不可**（i18n構造はあるので翻訳追加が必要）。CrazyGames 版は `VITE_ADS_PROVIDER` を空にしてビルドし、Full Launch 時に CrazyGames SDK プロバイダを `ads.ts` に追加する必要あり（未実装）。

## 3. 推奨順序
1. Cloudflare Pages で自サイト公開（広告なし）→ 反応確認
2. 英語ローカライズ → CrazyGames Basic Launch 提出（収益なし、検証目的）
3. 並行して AdSense 審査 → H5 Games Ads 申込（自サイト版のみ）
4. Basic Launch 指標が良ければ SDK 実装して Full Launch
