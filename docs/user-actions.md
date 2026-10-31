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

## v1.1 アセットについて（要確認）
- 立ち絵・背景・OGP画像は画像生成AIで作ったオリジナル。公開前に目視で確認してください（凛は表情差分ごとに髪型が少し違います）。
- 主題歌は歌声なし。歌入りにしたい場合は、無料の VOICEVOX（ローカルで動かす）や NEUTRINO/Sinsy で歌声を作れます。その際は各キャラクターの規約に従い「VOICEVOX:キャラ名」などのクレジットを表記してください（各ボイスの規約は自分で確認してください）。

---

## 『青春クロニクル』v1.2（2026-10-31 JST）
追加で必要な操作は**ありません**。GitHub Pages（https://gamebar777.github.io/ripple-years/）へ自動で公開済みです。
- 試聴用の音源: docs/audio-previews/title.{mp3,ogg}・theme.{mp3,ogg}（各30秒、ゲーム内の音源をそのまま書き出したもの。主題歌はインストゥルメンタル）。
- 任意で確認してほしい点: 実機（スマホ）での BGM の音量感、立ち絵の解像度（元画像を約1.5倍に拡大）。

---

## 主題歌の音源について（2026-10-31 JST・要確認）
- 主題歌は**あなたが提供した音源ファイル**（約2分54秒、ボーカル入り）です。ファイルのメタデータには「made with suno」とあり、曲名・作者名は入っていませんでした。
- public/audio/theme.mp3（128kbps）・theme.ogg として公開サイトに置いています。タイトル画面の「🎵 主題歌」とエンディングで流れます。
- **公開配布できる権利をお持ちかどうか、ご確認ください**（こちらでは確認できません）。Suno の場合、商用利用・公開配布の可否は作成時の契約プランによって変わります（https://suno.com/terms）。権利がなければファイルを削除し、従来の自作インスト曲に戻します。
- 画面の歌詞は音声からの自動書き起こしで、誤りがある可能性があります。正しい歌詞と曲名をいただければ差し替えます。

### 主題歌の権利（2026-10-31 確認）
関本さんより：Suno有料会員プランで作成した楽曲のため商業利用可、との申告を受けた（対応済み）。

---

## 収録ボイス（ElevenLabs）について — 2026-10-31

- ElevenLabs **Creator プラン（$22/月）をあなたが契約済み**です。生成した音声は有料プラン中に作ったものなので商用利用できます（ElevenLabs の規約では、有料プラン期間中に生成した音声は解約後も商用利用可）。
- 音声はすでに `public/voice/` に静的ファイルとして入っているので、**解約しても公開中のボイスは消えません**。台詞を追加・修正して作り直すときだけ、再びプランが必要です（`node scripts/voice/gen.mjs` で差分だけ生成）。
- 自動更新を止めたい場合は https://elevenlabs.io/app/subscription で解約してください（私は解約していません）。
- APIキーは `/workspace/.secrets/elevenlabs.env` にあり、リポジトリにもブラウザにも入れていません。漏れた疑いがあれば ElevenLabs の設定画面でキーを作り直してください。
- **まだ誰も全部は聴いていません。** 自動チェック（無音・音割れ・長さ・声の高さ）は通していますが、漢字の名前の読み間違い・感情の付け方は耳で確認していません。気になる台詞があれば、行IDを教えてもらえれば作り直します。詳しくは docs/voice.md。
