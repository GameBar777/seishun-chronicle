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

---

## 『青春クロニクル』の有料オプション（任意・未契約）

いまの公開版は**すべて無料の範囲**で動きます。声はブラウザ内蔵の読み上げ機能（Web Speech API）、会話は端末の中でのキーワード判定です。AI音声やLLMは使っていません。
下のサービスは、より高い品質が必要になったときの選択肢です。**どれも契約していません**。価格は 2026-10-31（日本時間）に公式ページなどで確認したもので、税別です。

| 目的 | サービス | 価格 | 備考 |
|---|---|---|---|
| 自由会話をLLMにする | OpenAI API（https://developers.openai.com/api/docs/pricing） | 例：gpt-5-mini は入力 $0.25／出力 $2.00（100万トークンあたり）。gpt-4o-mini は $0.15／$0.60。gpt-5-mini は 2026-12-11 に廃止予定と表示 | **APIキーをブラウザに置けない**ため、自前のサーバー（Cloudflare Workers など）が必要。1回の会話は約1〜2千トークンなので、1周（会話100回程度）で約$0.05〜0.5の見込み |
| 高品質のAI音声 | ElevenLabs（https://elevenlabs.io/pricing） | Free $0（1万クレジット・**商用不可**）／Starter $6/月（3万）／Creator $22/月（12.1万）／Pro $99/月（60万）。読み上げは1文字＝約1クレジット | 台詞の総量は約1,050行・推定5〜7万字。事前に生成するなら Creator を1か月契約すれば全台詞がほぼ収まる見込み。名前の読み上げは名前ごとに生成が必要なので、事前生成はできない |
| 日本語のキャラクター音声（無料） | VOICEVOX（https://voicevox.hiroshiba.jp/term/） | ソフトは無料。商用・非商用で利用可 | キャラクターごとの規約に従い「VOICEVOX:ずんだもん」などの**クレジット表記が必須**。一部のキャラクターは商用・ゲームでの利用に事前確認が必要。ブラウザ単体では動かないので、音声を事前に生成してファイルとして同梱するのが現実的（名前の読み上げはできなくなる） |

### あなたが行う必要がある操作（青春クロニクル）
1. 公開ページ https://gamebar777.github.io/ripple-years/ を実際に開いて遊び、⚙設定の「試聴」で声が出るか確認する。日本語音声の有無は端末によって違う
2. URLが ripple-years のままです。名前を変えたい場合は GitHub のリポジトリ名を変更し、`vite.config.ts` の `VITE_SITE_URL` と workflow の `BASE_PATH` を合わせる
3. `public/thumbnail.png`（OGP画像）と `public/illustrations/` は旧作のものです。差し替えが必要
4. `public/privacy.html` と `public/terms.html` のプレースホルダ（運営者名・問い合わせ先）を記入する
5. 上の有料オプションを使う場合だけ、各サービスで契約し、APIキーをサーバー側に設定する（私は契約していません）
