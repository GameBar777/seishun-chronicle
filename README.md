# 人生の残響 — RIPPLE YEARS

18歳から80歳超までを1年1ターンで生きるブラウザ人生シミュレーション（Vite + TypeScript、バックエンド・AI API なし）。
選択の「残響（echo）」が数年後に返ってくる因果システム、架空の世界経済、NPCの感情と目標、世代継承、多軸の人生レビューを備えます。

- イベント 114 / 職業 26（一覧: `docs/events.md`）
- シード付き決定論的エンジン（mulberry32）
- 保存: localStorage（スキーマバージョン + マイグレーション）、JSONエクスポート/インポート
- モバイルファースト（390x844 基準）、i18n 対応構造（日本語のみ実装）
- 広告（H5 Games Ads / adBreak）と分析は **既定で無効**。有効化してもプレイを妨げない設計

## 開発
```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # vitest（多数人生シミュ・金銭計算・反復・マイグレーション）
npm run build      # 型チェック + dist/ 生成
npm run preview    # http://localhost:4173 でビルド確認
node scripts/e2e.mjs http://localhost:4173   # Playwright（preview 起動中に実行）
node scripts/assets.mjs                      # アイコン・サムネ再生成
npm run eventlist                            # docs/events.md 再生成
```

## 環境変数（すべて任意、`.env.example` 参照）
| 変数 | 意味 |
|---|---|
| `VITE_ADS_PROVIDER` | `h5` で Google H5 Games Ads を有効化。空なら広告コードは一切読み込まれない |
| `VITE_ADSENSE_CLIENT` | `ca-pub-…`。形式不正なら無効扱い |
| `VITE_ADS_TEST` | `1` でテストモード（`data-adbreak-test="on"`）。本番では外す |
| `VITE_ANALYTICS_ENDPOINT` | 設定時のみ、かつプレイヤーが設定で同意した場合のみ送信。個人情報は送らない |

秘密情報はリポジトリに含めないこと。`.env*` は `.gitignore` 済み（`.env.example` のみ追跡）。

## 公開（GitHub Pages）
- 公開URL: https://gamebar777.github.io/ripple-years/ （リポジトリ: https://github.com/GameBar777/ripple-years ）
- `main` に push すると `.github/workflows/deploy.yml` が `npm ci → npm test → npm run build → Pages へデプロイ` を自動実行
- サブパス対応: `BASE_PATH`（例 `/ripple-years/`）で Vite の base を設定、`VITE_SITE_URL` で canonical / og:url / og:image を絶対URL化。静的ページ・manifest・ゲーム内リンクは相対パス
- ローカル確認: `BASE_PATH=/ripple-years/ npm run build && npx vite preview --base /ripple-years/`
- 公開URLに対するE2E: `E2E_OUT=docs/screenshots-live E2E_RESULTS=docs/e2e-results-live.json node scripts/e2e.mjs https://gamebar777.github.io/ripple-years`
- 秘密情報は不要（ワークフローは GitHub 標準の権限のみ使用）

## Cloudflare Pages へのデプロイ（未実施・手順のみ）
公式: https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/
1. GitHub 等にリポジトリを push（**あなたの操作**）。
2. https://dash.cloudflare.com/ → Workers & Pages → Create → Pages → Git に接続。
3. Build command: `npm run build` / Build output directory: `dist` / 環境変数 `NODE_VERSION=22` 推奨。
4. 広告を使う場合のみ Settings → Environment variables に上記 `VITE_*` を設定し再デプロイ。
5. 独自ドメインは任意（購入は有料・あなたの判断）。`*.pages.dev` で無料運用可能。
CLI の場合: `npx wrangler pages deploy dist`（Cloudflare ログインが必要）。

## バックアップと更新
- コード: git リモートへ push が一次バックアップ。タグ付け例 `git tag v0.1.0 && git push --tags`。
- プレイヤーデータ: 各ブラウザの localStorage のみ（サーバーなし）。ゲーム内「設定 → エクスポート」で JSON を保存/復元できる旨をFAQで案内済み。
- 更新: 変更 → `npm test` → `npm run build` → e2e → commit/push（Pages が自動デプロイ）。Pages ダッシュボードから過去デプロイへロールバック可能。
- セーブ形式を変える場合は `src/engine/game.ts` の `SAVE_VERSION`（移行は `src/platform/save.ts` の `MIGRATIONS`） を上げ、マイグレーションと `tests/sim.test.ts` の移行テストを追加。

## ドキュメント
`docs/spec.md` 仕様 / `docs/events.md` イベント一覧 / `docs/test-results.md` テスト結果 / `docs/revenue-sim.md` 収益試算 / `docs/marketing.md` / `docs/ads-platform-research.md` / `docs/legal-checklist.md` / `docs/user-actions.md` / `docs/screenshots/` / `docs/assets/`

## イラストの追加
1. `public/illustrations/<key>-480.webp` と `<key>-800.webp` を置く（16:9推奨、WebP q≈68、1枚 80KB 未満。テストで検査）
2. `src/data/illustrations.ts` の `ART` にキーと日本語altを追加
3. カテゴリ単位なら `BY_CATEGORY`、特定イベントなら `BY_EVENT` に割り当て（イベント指定が優先）
4. `npm test` で欠落・未知IDを検出
イラストは本プロジェクト用に新規生成したオリジナル（既存IP・実在人物なし）。
