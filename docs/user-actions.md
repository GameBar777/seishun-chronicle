# あなた（運営者）が行う必要がある操作

私（エージェント）は以下を**実行していません**。いずれも本人確認・契約・承認が必要なためです。

| # | 操作 | URL | 費用 | 備考 |
|---|---|---|---|---|
| 1 | リポジトリをGitHub等に作成・push | https://github.com/new | 無料 | 公開/非公開はご判断。`.env` を含めない |
| 2 | Cloudflare アカウント作成・Pages プロジェクト作成 | https://dash.cloudflare.com/ ／手順 https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/ | 無料枠あり | Build `npm run build`, Output `dist` |
| 3 | （任意）独自ドメイン購入 | https://www.cloudflare.com/products/registrar/ | 有料 | 未購入でも `*.pages.dev` で公開可 |
| 4 | privacy/terms のプレースホルダ記入 | public/privacy.html, public/terms.html, public/about.html | — | 個人情報の公開範囲はあなたが決定 |
| 5 | （任意）Search Console 登録 | https://search.google.com/search-console/about | 無料 | |
| 6 | AdSense 申請（本人確認・税務情報・銀行口座） | 参加資格 https://support.google.com/adsense/answer/1705831 | 無料 | 承認保証なし |
| 7 | H5 Games Ads 申込（AdSense 承認後） | https://adsense.google.com/start/h5-game-ads-apply/ | 無料 | 承認後 Pages 環境変数に `VITE_ADS_PROVIDER=h5`, `VITE_ADSENSE_CLIENT=ca-pub-…` を設定し再デプロイ。まず `VITE_ADS_TEST=1` で確認 |
| 8 | CrazyGames 開発者登録・提出 | https://developer.crazygames.com/ ／要件 https://docs.crazygames.com/requirements/intro/ | 無料 | **英語化が先に必要**。外部広告なしビルドで提出 |
| 9 | 商標調査（任意） | https://www.j-platpat.inpit.go.jp/ | 調査無料／出願有料 | |
| 10 | 有料広告出稿 | — | 有料 | 実施しない限り発生しません |
