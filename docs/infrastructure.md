# GCP / Firebase インフラ構築ガイド (infrastructure.md)

このドキュメントでは、`doronuma_boradgame` の本番環境・ステージング環境に必要な GCP および Firebase のすべてのリソースを、ゼロから構築する手順を記載します。

---

## 目次

1. [前提条件](#1-前提条件)
2. [GCP プロジェクトの作成](#2-gcp-プロジェクトの作成)
3. [Firebase プロジェクトの設定](#3-firebase-プロジェクトの設定)
4. [Firebase Authentication の設定](#4-firebase-authentication-の設定)
5. [Cloud Firestore の設定](#5-cloud-firestore-の設定)
6. [Firebase Hosting の設定](#6-firebase-hosting-の設定)
7. [Cloud Run の設定](#7-cloud-run-の設定)
8. [IAM とサービスアカウントの設定](#8-iam-とサービスアカウントの設定)
9. [Cloud Build (CI/CD) の設定](#9-cloud-build-cicd-の設定)
10. [本番デプロイ手順](#10-本番デプロイ手順)
11. [コスト見積もりと無料枠](#11-コスト見積もりと無料枠)
12. [セキュリティチェックリスト](#12-セキュリティチェックリスト)

---

## 1. 前提条件

| 項目 | 要件 |
|:---|:---|
| Google アカウント | GCP の課金が有効な Google アカウント |
| gcloud CLI | インストール済み（[environment.md](./environment.md) 参照） |
| Firebase CLI | インストール済み（`npm install -g firebase-tools`） |
| 支払い方法 | GCP コンソールでクレジットカードまたは請求先アカウントが登録済み |

> **注意:** Cloud Run は無料枠内で開発・小規模運用が可能ですが、課金の有効化が必須です。

---

## 2. GCP プロジェクトの作成

### 2.1 プロジェクト作成

```bash
# プロジェクトの作成
gcloud projects create doronuma-sabotage --name="泥沼の妨害"

# 作成したプロジェクトを現在のプロジェクトに設定
gcloud config set project doronuma-sabotage

# 確認
gcloud config get-value project
# doronuma-sabotage と表示されること
```

> **プロジェクトID の命名規則:** 小文字・数字・ハイフンのみ使用可能。6〜30文字。グローバルで一意である必要があります。`doronuma-sabotage` が取得済みの場合はサフィックス（例: `doronuma-sabotage-dev`）を付けてください。

### 2.2 課金の有効化

```bash
# 請求先アカウントの一覧を表示
gcloud billing accounts list

# プロジェクトに請求先アカウントをリンク
gcloud billing projects link doronuma-sabotage \
  --billing-account=YOUR_BILLING_ACCOUNT_ID
```

または、[GCP コンソール](https://console.cloud.google.com/billing) から GUI で設定できます：

1. GCP コンソール → 「お支払い」
2. 「マイプロジェクト」タブ
3. `doronuma-sabotage` の「アクション」→「お支払い情報を変更」
4. 請求先アカウントを選択

### 2.3 必要な API の有効化

```bash
gcloud services enable \
  firestore.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firebase.googleapis.com \
  identitytoolkit.googleapis.com \
  firebasehosting.googleapis.com
```

> **補足:** 時間管理（タイムアウト処理）は Cloud Run 内蔵タイマーで実現するため、Cloud Scheduler は不要です。

API の有効化には数分かかることがあります。以下で確認：

```bash
gcloud services list --enabled --filter="config.name:(firestore OR run OR cloudbuild OR artifactregistry OR firebase)"
```

---

## 3. Firebase プロジェクトの設定

### 3.1 Firebase の追加

既存の GCP プロジェクトに Firebase を追加します。

```bash
firebase login
firebase projects:addfirebase doronuma-sabotage
```

または [Firebase コンソール](https://console.firebase.google.com/) から：

1. 「プロジェクトを追加」
2. 「既存の Google Cloud プロジェクトに Firebase を追加」を選択
3. `doronuma-sabotage` を選択
4. Google アナリティクスは任意（不要であれば無効化）

### 3.2 Firebase ウェブアプリの登録

```bash
firebase apps:create WEB "doronuma-sabotage-web"
```

登録後、設定値を取得します：

```bash
firebase apps:sdkconfig WEB
```

以下のような出力が表示されます。これを `.env.local` に設定します：

```javascript
firebase.initializeApp({
  apiKey: "AIzaSy...",
  authDomain: "doronuma-sabotage.firebaseapp.com",
  projectId: "doronuma-sabotage",
  storageBucket: "doronuma-sabotage.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
});
```

### 3.3 ローカルプロジェクトの初期化

リポジトリのルートで以下を実行します：

```bash
firebase init
```

選択する機能：
- ✅ Firestore: Configure security rules and indexes files
- ✅ Hosting: Configure files for Firebase Hosting
- ❌ その他は選択不要（個別に設定します）

設定値：
- Firestore Rules file: `firestore.rules`（デフォルト）
- Firestore Indexes file: `firestore.indexes.json`（デフォルト）
- Public directory: `out`（Next.js の静的エクスポート先）
- Single-page app: `Yes`
- GitHub automatic deploys: `No`（Cloud Build で設定するため）

### 3.4 .firebaserc の確認

```json
{
  "projects": {
    "default": "doronuma-sabotage"
  }
}
```

---

## 4. Firebase Authentication の設定

### 4.1 匿名認証の有効化

[Firebase コンソール](https://console.firebase.google.com/) → Authentication → Sign-in method：

1. 「ログイン プロバイダ」タブを開く
2. 「匿名」を選択
3. 「有効にする」をオンにして「保存」

**CLI では設定不可のため、必ず Firebase コンソールから設定してください。**

### 4.2 動作確認

Firebase Emulator を起動して匿名認証をテスト：

```bash
firebase emulators:start --only auth
```

ブラウザで `http://localhost:4000/auth` にアクセスし、Emulator UI から匿名ユーザーの追加・管理ができることを確認します。

---

## 5. Cloud Firestore の設定

### 5.1 Firestore データベースの作成

```bash
gcloud firestore databases create \
  --location=asia-northeast1 \
  --type=firestore-native
```

> **リージョンの選択:** `asia-northeast1`（東京）を推奨します。一度設定したリージョンは変更できないため注意してください。

### 5.2 Security Rules の設定

プロジェクトルートの `firestore.rules` ファイルにセキュリティルールを記述します：

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ルーム情報: 認証済みユーザーは読み取り可能、書き込みはサーバーのみ
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if false; // Cloud Run 経由のみ

      // プレイヤー情報: 認証済みユーザーは読み取り可能
      match /players/{playerId} {
        allow read: if request.auth != null;
        allow write: if false;
      }

      // ゲーム状態: 認証済みユーザーは読み取り可能
      match /gameState/{docId} {
        allow read: if request.auth != null;
        allow write: if false;
      }

      // 手札: 本人のみ読み取り可能
      match /hands/{playerId} {
        allow read: if request.auth != null && request.auth.uid == playerId;
        allow write: if false;
      }

      // 行動ログ: 認証済みユーザーは読み取り可能
      match /actionLog/{logId} {
        allow read: if request.auth != null;
        allow write: if false;
      }
    }
  }
}
```

デプロイ：

```bash
firebase deploy --only firestore:rules
```

### 5.3 インデックスの設定

`firestore.indexes.json` に複合インデックスを定義します：

```json
{
  "indexes": [
    {
      "collectionGroup": "actionLog",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

デプロイ：

```bash
firebase deploy --only firestore:indexes
```

---

## 6. Firebase Hosting の設定

### 6.1 firebase.json の設定

```json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

### 6.2 Next.js の静的エクスポート設定

`next.config.ts` に以下を追加：

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",  // 静的 HTML エクスポート
};

export default nextConfig;
```

### 6.3 デプロイテスト

```bash
npm run build
firebase deploy --only hosting
```

デプロイ後、表示される URL（`https://doronuma-sabotage.web.app`）でアクセスできることを確認します。

> **ドメイン:** デフォルトの `*.web.app` ドメインを使用します。カスタムドメインは設定しません。

---

## 7. Cloud Run の設定

### 7.1 Artifact Registry リポジトリの作成

Docker イメージを保存するリポジトリを作成します。

```bash
gcloud artifacts repositories create doronuma-repo \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="泥沼ボードゲーム Docker リポジトリ"
```

### 7.2 Docker イメージのビルドとプッシュ

```bash
# Docker 認証設定
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# イメージのビルド
docker build -t asia-northeast1-docker.pkg.dev/doronuma-sabotage/doronuma-repo/game-server:latest ./packages/backend

# イメージのプッシュ
docker push asia-northeast1-docker.pkg.dev/doronuma-sabotage/doronuma-repo/game-server:latest
```

### 7.3 Cloud Run サービスのデプロイ

```bash
gcloud run deploy doronuma-game-server \
  --image=asia-northeast1-docker.pkg.dev/doronuma-sabotage/doronuma-repo/game-server:latest \
  --region=asia-northeast1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars="GCP_PROJECT_ID=doronuma-sabotage" \
  --service-account=doronuma-game-server@doronuma-sabotage.iam.gserviceaccount.com
```

> **`--min-instances=0` について:** 時間管理は遅延評価（Lazy Evaluation）方式を採用しているため、Cloud Run がスリープ状態でもタイマーの正確性に影響しません（詳しくはセクション 7.6 を参照）。これにより、ゲームが行われていない間の課金を完全にゼロにできます。

### 7.4 Cloud Run の URL 確認

```bash
gcloud run services describe doronuma-game-server \
  --region=asia-northeast1 \
  --format='value(status.url)'
```

表示された URL を `.env.local` の `NEXT_PUBLIC_API_BASE_URL` に設定します。

### 7.5 CORS の設定

Cloud Run のバックエンドで、Firebase Hosting のドメインからのリクエストを許可する CORS 設定が必要です。これはバックエンドの Express アプリ内で設定します（`packages/backend/src/index.ts`）。

```typescript
import cors from 'cors';

app.use(cors({
  origin: [
    'https://doronuma-sabotage.web.app',
    'https://doronuma-sabotage.firebaseapp.com',
    'http://localhost:3000', // ローカル開発用
  ],
  credentials: true,
}));
```

### 7.6 時間管理（遅延評価方式）のアーキテクチャ

ターンのタイムアウトや割り込みの制限時間の管理には、**遅延評価（Lazy Evaluation）方式** を採用します。サーバー側の `setTimeout` や外部サービス（Cloud Scheduler 等）は使用しません。

> **なぜ `setTimeout` を使わないのか:** Cloud Run はリクエストが来ない間はインスタンスがスリープ状態（CPU 未割り当て）になるため、`setTimeout` は予定通りの時間に発火しません。`min-instances=1` で常時稼働させればこの問題は回避できますが、コストが大幅に増加します。

#### 仕組み

Firestore に記録した `turnDeadline`（期限タイムスタンプ）を **真実の源泉（Source of Truth）** とし、次にリクエストが届いた時点で期限超過を遡って処理します。

```
[ターン開始]
  │
  ├─→ サーバー: Firestore に turnDeadline を書き込む
  ├─→ クライアント全員: turnDeadline を受信し、カウントダウン表示を開始
  │
  ├─ (a) プレイヤーが時間内に行動した場合:
  │     └─→ サーバー: 行動を処理、次のターンへ
  │
  └─ (b) 制限時間を超過した場合:
        ├─→ クライアント（他のプレイヤー）: カウントダウンが 0 になった時点で
        │   自動的に POST /api/games/:roomId/check-timeout を送信
        └─→ サーバー: Firestore の turnDeadline と現在時刻を比較
              ├─ 期限超過している → タイムアウト処理を実行
              └─ 期限超過していない → 何もしない（不正なリクエスト）
```

#### 詳細な処理フロー

1. **ターン開始時（サーバー）:** Firestore の `gameState.turnDeadline` に `現在時刻 + 制限時間` のタイムスタンプを書き込む
2. **クライアント側:** Firestore の `onSnapshot` で `turnDeadline` を受信し、ローカルでカウントダウン表示を開始。カウントダウンが 0 に達したら、`/api/games/:roomId/check-timeout` を自動送信
3. **サーバー側（全リクエスト共通）:** ゲーム関連の全 API エンドポイントに **期限チェックミドルウェア** を設置。リクエスト処理の前に `turnDeadline` を確認し、期限超過していればタイムアウト処理を先に実行してから本来のリクエストを処理する
4. **全員切断時:** 誰も操作しないためサーバーに一切リクエストが届かないが、誰かが再接続した瞬間に期限チェックミドルウェアが動作し、過去の未処理タイムアウトをすべて遡って処理する（連鎖的に複数ターン分処理される場合もある）

#### この方式のメリット

- **追加コストゼロ:** Cloud Scheduler も `min-instances=1` も不要
- **正確性:** Firestore のサーバータイムスタンプが基準のため、クライアント時刻に依存しない
- **復元不要:** 状態が Firestore に永続化されているため、インスタンスの再起動やスケールダウンの影響を受けない
- **チート耐性:** 期限判定はサーバー側で行うため、クライアントがカウントダウンを改ざんしても無効

---

## 8. IAM とサービスアカウントの設定

### 8.1 Cloud Run 用サービスアカウントの作成

```bash
# サービスアカウントの作成
gcloud iam service-accounts create doronuma-game-server \
  --display-name="泥沼ゲームサーバー"
```

### 8.2 必要なロールの付与

```bash
PROJECT_ID=doronuma-sabotage
SA_EMAIL=doronuma-game-server@${PROJECT_ID}.iam.gserviceaccount.com

# Firestore への読み書き
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/datastore.user"

# Firebase Auth のトークン検証
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/firebase.sdkAdminServiceAgent"
```

> **補足:** Cloud Scheduler は使用しないため、`roles/cloudscheduler.admin` ロールは不要です。

### 8.3 ローカル開発用のサービスアカウントキー（オプション）

> **注意:** Firebase Emulator を使用する場合、サービスアカウントキーは不要です。本番環境に直接アクセスしてテストする場合のみ使用します。

```bash
gcloud iam service-accounts keys create ./service-account-key.json \
  --iam-account=doronuma-game-server@doronuma-sabotage.iam.gserviceaccount.com
```

> **重要:** `service-account-key.json` は `.gitignore` に含まれています。絶対に Git にコミットしないでください。

---

## 9. Cloud Build (CI/CD) の設定

### 9.1 概要

`main` ブランチへの push をトリガーとして、以下を自動実行します：

1. 共有パッケージ (`@doronuma/shared`) のビルド
2. フロントエンド (Next.js) のビルド → Firebase Hosting へデプロイ
3. Firestore Security Rules / Indexes のデプロイ
4. バックエンド (Cloud Run) の Docker ビルド → Cloud Run へデプロイ

### 9.2 GitHub リポジトリとの連携

#### 方法 A: GCP コンソール（GUI）

1. [GCP コンソール](https://console.cloud.google.com/cloud-build/triggers) にアクセス
2. プロジェクト `doronuma-sabotage` を選択
3. 左メニュー → 「Cloud Build」→「トリガー」
4. 「リポジトリを接続」をクリック
5. 「ソース」で「GitHub（Cloud Build GitHub アプリ）」を選択し、「続行」
6. GitHub の認証画面が表示されるので、`Seaoftrees08` アカウントで認証
7. 「リポジトリを選択」で `Seaoftrees08/doronuma_boradgame` を選択
8. 利用規約にチェックを入れて「接続」

#### 方法 B: gcloud CLI

```bash
# GitHub リポジトリの接続（初回のみ、ブラウザが開きます）
gcloud builds triggers create github \
  --repo-name=doronuma_boradgame \
  --repo-owner=Seaoftrees08 \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --name="deploy-on-main-push" \
  --description="main ブランチへの push で自動デプロイ"
```

> **注意:** CLI で GitHub リポジトリを初めて接続する場合、ブラウザが開いて OAuth 認証が求められます。認証完了後に再度コマンドを実行してください。

### 9.3 cloudbuild.yaml の作成

プロジェクトルートに `cloudbuild.yaml` を作成します：

```yaml
# cloudbuild.yaml - CI/CD パイプライン定義
# main ブランチへの push で自動実行される

steps:
  # ===== Step 1: 依存パッケージのインストール =====
  - id: 'install-dependencies'
    name: 'node:22'
    entrypoint: 'npm'
    args: ['ci']

  # ===== Step 2: 共有パッケージのビルド =====
  - id: 'build-shared'
    name: 'node:22'
    entrypoint: 'npm'
    args: ['run', 'build', '--workspace=packages/shared']
    waitFor: ['install-dependencies']

  # ===== Step 3: Lint & Type Check =====
  - id: 'lint'
    name: 'node:22'
    entrypoint: 'npm'
    args: ['run', 'lint']
    waitFor: ['build-shared']

  - id: 'type-check'
    name: 'node:22'
    entrypoint: 'npx'
    args: ['tsc', '--noEmit']
    waitFor: ['build-shared']

  # ===== Step 4: テストの実行 =====
  - id: 'test-shared'
    name: 'node:22'
    entrypoint: 'npm'
    args: ['run', 'test', '--workspace=packages/shared', '--if-present']
    waitFor: ['build-shared']

  - id: 'test-backend'
    name: 'node:22'
    entrypoint: 'npm'
    args: ['run', 'test', '--workspace=packages/backend', '--if-present']
    waitFor: ['build-shared']

  # ===== Step 5: フロントエンドのビルド =====
  - id: 'build-frontend'
    name: 'node:22'
    entrypoint: 'npm'
    args: ['run', 'build']
    waitFor: ['lint', 'type-check', 'test-shared']
    env:
      - 'NEXT_PUBLIC_FIREBASE_API_KEY=${_FIREBASE_API_KEY}'
      - 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${_FIREBASE_AUTH_DOMAIN}'
      - 'NEXT_PUBLIC_FIREBASE_PROJECT_ID=${_FIREBASE_PROJECT_ID}'
      - 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${_FIREBASE_STORAGE_BUCKET}'
      - 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${_FIREBASE_MESSAGING_SENDER_ID}'
      - 'NEXT_PUBLIC_FIREBASE_APP_ID=${_FIREBASE_APP_ID}'
      - 'NEXT_PUBLIC_API_BASE_URL=${_API_BASE_URL}'

  # ===== Step 6: Firebase Hosting + Firestore Rules デプロイ =====
  - id: 'deploy-firebase'
    name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        npm install -g firebase-tools
        firebase deploy --only hosting,firestore --project=$PROJECT_ID
    waitFor: ['build-frontend']

  # ===== Step 7: バックエンド Docker イメージのビルド =====
  - id: 'build-backend-image'
    name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'asia-northeast1-docker.pkg.dev/$PROJECT_ID/doronuma-repo/game-server:$COMMIT_SHA'
      - '-t'
      - 'asia-northeast1-docker.pkg.dev/$PROJECT_ID/doronuma-repo/game-server:latest'
      - './packages/backend'
    waitFor: ['test-backend']

  # ===== Step 8: Docker イメージの Push =====
  - id: 'push-backend-image'
    name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '--all-tags'
      - 'asia-northeast1-docker.pkg.dev/$PROJECT_ID/doronuma-repo/game-server'
    waitFor: ['build-backend-image']

  # ===== Step 9: Cloud Run デプロイ =====
  - id: 'deploy-cloud-run'
    name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args:
      - 'run'
      - 'deploy'
      - 'doronuma-game-server'
      - '--image'
      - 'asia-northeast1-docker.pkg.dev/$PROJECT_ID/doronuma-repo/game-server:$COMMIT_SHA'
      - '--region'
      - 'asia-northeast1'
    waitFor: ['push-backend-image']

# ビルドされたイメージを Artifact Registry に保存
images:
  - 'asia-northeast1-docker.pkg.dev/$PROJECT_ID/doronuma-repo/game-server:$COMMIT_SHA'
  - 'asia-northeast1-docker.pkg.dev/$PROJECT_ID/doronuma-repo/game-server:latest'

# ビルドの設定オプション
options:
  logging: CLOUD_LOGGING_ONLY
  machineType: 'E2_HIGHCPU_8'  # ビルド高速化

# 変数置換（トリガー作成時に設定）
substitutions:
  _FIREBASE_API_KEY: ''
  _FIREBASE_AUTH_DOMAIN: ''
  _FIREBASE_PROJECT_ID: ''
  _FIREBASE_STORAGE_BUCKET: ''
  _FIREBASE_MESSAGING_SENDER_ID: ''
  _FIREBASE_APP_ID: ''
  _API_BASE_URL: ''

# タイムアウト（デフォルト10分、余裕を持って20分に設定）
timeout: '1200s'
```

### 9.4 Cloud Build サービスアカウントへの権限付与

Cloud Build が各サービスにデプロイするために、以下の権限を付与する必要があります。

```bash
# プロジェクト番号を取得
PROJECT_NUMBER=$(gcloud projects describe doronuma-sabotage --format='value(projectNumber)')
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# 1. Firebase Hosting のデプロイ権限
gcloud projects add-iam-policy-binding doronuma-sabotage \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/firebasehosting.admin"

# 2. Cloud Run のデプロイ権限
gcloud projects add-iam-policy-binding doronuma-sabotage \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/run.admin"

# 3. Artifact Registry への Push 権限
gcloud projects add-iam-policy-binding doronuma-sabotage \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/artifactregistry.writer"

# 4. サービスアカウントの使用権限（Cloud Run デプロイ時に必要）
gcloud iam service-accounts add-iam-policy-binding \
  doronuma-game-server@doronuma-sabotage.iam.gserviceaccount.com \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/iam.serviceAccountUser"

# 5. Firebase のプロジェクト管理権限（Firestore Rules デプロイに必要）
gcloud projects add-iam-policy-binding doronuma-sabotage \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/firebase.admin"
```

### 9.5 ビルドトリガーへの環境変数の設定

cloudbuild.yaml 内の変数置換（`substitutions`）に Firebase の設定値を登録します。

#### GCP コンソールから設定（推奨）

1. [Cloud Build トリガー](https://console.cloud.google.com/cloud-build/triggers) にアクセス
2. `deploy-on-main-push` トリガーの「編集」をクリック
3. 「変数」セクションで以下を設定：

| 変数名 | 値 |
|:---|:---|
| `_FIREBASE_API_KEY` | Firebase コンソールから取得した API キー |
| `_FIREBASE_AUTH_DOMAIN` | `doronuma-sabotage.firebaseapp.com` |
| `_FIREBASE_PROJECT_ID` | `doronuma-sabotage` |
| `_FIREBASE_STORAGE_BUCKET` | `doronuma-sabotage.firebasestorage.app` |
| `_FIREBASE_MESSAGING_SENDER_ID` | Firebase コンソールから取得 |
| `_FIREBASE_APP_ID` | Firebase コンソールから取得 |
| `_API_BASE_URL` | Cloud Run の URL（セクション7.4 で取得） |

#### gcloud CLI から設定

```bash
gcloud builds triggers update deploy-on-main-push \
  --substitutions=\
_FIREBASE_API_KEY=your-api-key,\
_FIREBASE_AUTH_DOMAIN=doronuma-sabotage.firebaseapp.com,\
_FIREBASE_PROJECT_ID=doronuma-sabotage,\
_FIREBASE_STORAGE_BUCKET=doronuma-sabotage.firebasestorage.app,\
_FIREBASE_MESSAGING_SENDER_ID=your-sender-id,\
_FIREBASE_APP_ID=your-app-id,\
_API_BASE_URL=https://doronuma-game-server-xxxxx.a.run.app
```

### 9.6 CI/CD パイプラインの動作確認

設定完了後、テスト用のコミットを push して動作確認します。

```bash
# テスト用の変更をコミット
git add .
git commit -m "ci: Cloud Build パイプラインの設定"
git push origin main
```

ビルドの進捗は以下で確認できます：

```bash
# 最新のビルド一覧
gcloud builds list --limit=5

# 特定のビルドの詳細ログ
gcloud builds log BUILD_ID
```

または [GCP コンソール](https://console.cloud.google.com/cloud-build/builds) からリアルタイムでログを確認できます。

### 9.7 ビルドが失敗した場合のトラブルシューティング

| エラー | 原因 | 対処 |
|:---|:---|:---|
| `Permission denied` (Firebase deploy) | Cloud Build SA に `firebase.admin` ロールがない | セクション 9.4 の手順5を確認 |
| `Permission denied` (Cloud Run deploy) | Cloud Build SA に `run.admin` ロールがない | セクション 9.4 の手順2を確認 |
| `NOT_FOUND` (Artifact Registry) | Docker リポジトリが未作成 | セクション 7.1 を実行 |
| `substitution variable not set` | トリガーに環境変数が未設定 | セクション 9.5 を確認 |
| `npm ci` 失敗 | `package-lock.json` が最新でない | ローカルで `npm install` → commit → push |

---

## 10. 本番デプロイ手順

### 10.1 自動デプロイ（推奨）

`main` ブランチに push すると、Cloud Build が自動的にビルド・デプロイを実行します。

```bash
git add .
git commit -m "feat: 新しい機能を追加"
git push origin main
```

> デプロイの進捗は `gcloud builds list --limit=1` または [GCP コンソール](https://console.cloud.google.com/cloud-build/builds) で確認できます。

### 10.2 手動デプロイ（CI/CD トラブル時のみ）

CI/CD が動作しない場合、以下の手順で手動デプロイできます。

```bash
# 1. 共有パッケージのビルド
npm run build --workspace=packages/shared

# 2. フロントエンドのビルド
npm run build

# 3. Firebase Hosting + Firestore Rules のデプロイ
firebase deploy --only hosting,firestore

# 4. バックエンドの Docker ビルド & プッシュ
docker build -t asia-northeast1-docker.pkg.dev/doronuma-sabotage/doronuma-repo/game-server:latest ./packages/backend
docker push asia-northeast1-docker.pkg.dev/doronuma-sabotage/doronuma-repo/game-server:latest

# 5. Cloud Run の更新
gcloud run deploy doronuma-game-server \
  --image=asia-northeast1-docker.pkg.dev/doronuma-sabotage/doronuma-repo/game-server:latest \
  --region=asia-northeast1
```

### 10.3 デプロイ後の確認

```bash
# Firebase Hosting の URL
echo "https://doronuma-sabotage.web.app"

# Cloud Run の URL
gcloud run services describe doronuma-game-server \
  --region=asia-northeast1 \
  --format='value(status.url)'

# Cloud Run のログ確認（直近のエラーがないか）
gcloud run services logs read doronuma-game-server \
  --region=asia-northeast1 \
  --limit=20

# Firestore Rules のバージョン確認
firebase firestore:rules:list
```

---

## 11. コスト見積もりと無料枠

### Firebase 無料枠 (Blaze プラン - 従量課金)

| サービス | 無料枠 | 推定使用量（小規模） |
|:---|:---|:---|
| Authentication | 月 10,000 匿名ユーザー | ✅ 枠内 |
| Firestore 読み取り | 日 50,000 回 | ✅ 枠内 |
| Firestore 書き込み | 日 20,000 回 | ✅ 枠内 |
| Firestore 保存容量 | 1 GiB | ✅ 枠内 |
| Hosting 保存容量 | 10 GiB | ✅ 枠内 |
| Hosting 転送量 | 月 360 MB/日 | ✅ 枠内 |

### GCP 無料枠

| サービス | 無料枠 | 推定使用量（小規模） |
|:---|:---|:---|
| Cloud Run CPU | 月 180,000 vCPU秒 | ✅ 枠内（リクエスト処理時のみ課金） |
| Cloud Run メモリ | 月 360,000 GiB秒 | ✅ 枠内（リクエスト処理時のみ課金） |
| Cloud Run リクエスト | 月 200万回 | ✅ 枠内 |
| Artifact Registry | 月 500 MB | ✅ 枠内 |
| Cloud Build | 日 120 分 | ✅ 枠内 |

> **コストが低い理由:** 遅延評価（Lazy Evaluation）方式の採用により、`min-instances=0`（ゲームが行われていない間はインスタンスを完全に停止）が可能です。サーバー側で `setTimeout` を常駐させる必要がないため、リクエスト処理時のみ課金が発生し、小規模運用であれば **すべて無料枠内** で収まります。

---

## 12. セキュリティチェックリスト

本番環境へのデプロイ前に、以下を確認してください。

- [ ] **Firestore Security Rules** が適切に設定されている（テストモードになっていない）
- [ ] **サービスアカウントキー**（`service-account-key.json`）が `.gitignore` に含まれている
- [ ] **環境変数ファイル**（`.env.local`, `.env`）が `.gitignore` に含まれている
- [ ] **Firebase API キー**の HTTP リファラー制限が設定されている（GCP コンソール → API とサービス → 認証情報）
- [ ] **Cloud Run** の `--allow-unauthenticated` が意図的な設定であること（クライアントから直接呼び出すため必要）
- [ ] **CORS** の `origin` に本番ドメインのみが含まれている（本番デプロイ時に `localhost` を削除）
- [ ] **匿名認証アカウント**の自動クリーンアップが設定されている（Firebase コンソール → Authentication → 設定 → ユーザーアクション）
- [ ] **Cloud Build** の環境変数（Firebase API キー等）が正しく設定されている

---

## 次のステップ

- 開発環境の構築 → [environment.md](./environment.md)
- ゲーム仕様の確認 → [docs/sabotage/doronuma_sabotage_game_spec.md](./sabotage/doronuma_sabotage_game_spec.md)
