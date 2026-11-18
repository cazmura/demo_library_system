# 図書館貸出システム (デモ)

ソフトウェアテストの練習・CI/CDパイプライン構築の練習のためのデモアプリケーションです。
図書館の蔵書管理・会員管理・貸出/返却を行うシンプルなWebアプリとして実装しています。

## 構成

- **backend**: Node.js (Express) + SQLite (`node:sqlite` 組み込みモジュール) によるREST API
- **frontend**: React (Vite) によるSPA
- **e2e**: Playwright によるE2Eテスト
- **CI**: GitHub Actions (`.github/workflows/ci.yml`)
- **デプロイ**: Render ( `render.yaml` のBlueprintで定義。フロントエンドのビルド成果物をExpressから配信する単一サービス構成)

```
backend/   Express API + SQLite (ユニットテスト・統合テスト)
frontend/  React SPA (コンポーネントテスト)
e2e/       Playwright E2Eテスト (ビルド済みアプリに対して実行)
```

## 機能

- 蔵書の一覧・検索・登録・削除
- 会員の一覧・登録
- 本の貸出・返却、延滞判定(貸出期間は14日)
- 貸出中/返却済みの履歴表示

## セットアップ

Node.js 22.5 以上が必要です（組み込みの `node:sqlite` モジュールを使用しているため）。

```bash
npm install
```

## ローカルでの実行

```bash
# バックエンド (http://localhost:3001)
npm run dev:backend

# フロントエンド (http://localhost:5173、/api は backend にプロキシ)
npm run dev:frontend
```

初回起動時に `backend/data/library.db` が作成され、デモ用のシードデータ（本6冊・会員3名）が投入されます。

本番相当で動かす場合（Expressが配信する1サービス構成）:

```bash
npm run build:frontend
npm run dev:backend   # frontend/dist が存在すればExpressが配信する
```

## テスト

| 種別 | コマンド | 内容 |
| --- | --- | --- |
| バックエンド ユニット/統合テスト | `npm run test:backend` | Vitest + Supertest。貸出ロジック、API各エンドポイントの正常系/異常系 |
| フロントエンド コンポーネントテスト | `npm run test:frontend` | Vitest + React Testing Library |
| Lint | `npm run lint:backend` / `npm run lint:frontend` | ESLint |
| E2Eテスト | `npm run build:frontend && npm run e2e` | Playwright。本の追加→会員登録→貸出→返却の一連の流れを検証 |

E2Eテストはビルド済みフロントエンドをExpressから配信した状態のサーバーに対して実行されます
(`e2e/playwright.config.js` の `webServer` 設定でサーバーを自動起動します)。

## CI (GitHub Actions)

`.github/workflows/ci.yml` は `main` へのpushおよびPRで以下を実行します。

1. `backend` ジョブ: バックエンドのlint・テスト
2. `frontend` ジョブ: フロントエンドのlint・テスト・ビルド
3. `e2e` ジョブ: 上記2つが成功した後、Playwrightでe2eテストを実行
4. `deploy` ジョブ: `main` へのpushかつ上記すべてが成功した場合のみ、Renderのデプロイフックを呼び出す
   (`RENDER_DEPLOY_HOOK_URL` という名前のGitHub Secretsが設定されている場合のみ実行されます)

## デプロイ (Render)

このリポジトリには `render.yaml` (Render Blueprint) が含まれています。フロントエンドをビルドし、
Express (backend) がAPIと静的ファイルの両方を配信する単一のWebサービスとしてデプロイされます。

### 初回セットアップ手順

1. [Render](https://render.com) にサインアップ/ログイン (GitHubアカウント連携を推奨)
2. ダッシュボードで **New** → **Blueprint** を選択し、このGitHubリポジトリ (`cazmura/demo_library_system`) を接続
3. `render.yaml` の内容が自動的に読み込まれるので、そのまま **Apply** してサービスを作成
   - Freeプランを使用（`render.yaml` で `plan: free` を指定済み）
   - `autoDeploy: false` にしているため、pushしただけでは自動デプロイされません
4. サービス作成後、Render管理画面の **Settings → Deploy Hook** からデプロイフックURLをコピー
5. GitHubリポジトリの **Settings → Secrets and variables → Actions** で `RENDER_DEPLOY_HOOK_URL` という名前のSecretを登録
6. 以降、`main` ブランチへのpushがCIを通過すると、自動的にRenderへデプロイされます

Secretを設定しない場合でも、Renderのダッシュボードから手動で **Manual Deploy** することで公開できます。

## データについて

SQLiteファイルはコンテナのローカルディスクに保存されます。Render Freeプランは永続ディスクを
使わない構成にしているため、サービスの再起動・再デプロイのたびにデータはリセットされ、シード
データが再投入されます（デモ・テスト練習用途のため、これは意図した挙動です）。
