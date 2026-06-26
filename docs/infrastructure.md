# インフラストラクチャ・デプロイガイド

このドキュメントは、「泥沼の妨害 (Doronuma Sabotage)」のGoogle Cloud Platform (GCP) および Firebase の本番環境構築・デプロイ手順を解説します。
この手順を上から順に実行するだけで、一切調べ物をせずにCI/CDパイプラインを含めた本番環境の構築が完了します。

## 構成概要
*   **フロントエンド**: Firebase Hosting (Next.js 16)
*   **バックエンド**: Google Cloud Run (min-instances=0)
*   **データベース**: Firebase Firestore
*   **認証**: Firebase Authentication (匿名認証)
*   **CI/CD**: Google Cloud Build

---

## 第1章: GCP / Firebase プロジェクトの初期設定

### 1. Firebaseプロジェクトの作成
1. [Firebase Console](https://console.firebase.google.com/) にアクセスします。
2. 「プロジェクトを追加」をクリックします。
3. プロジェクト名（例: `doronuma-sabotage-prod`）を入力します。
4. Google Analyticsの有効化は任意です（推奨）。
5. 完了すると、GCP上にも同名のプロジェクトが自動生成されます。

### 2. Firebase 各種サービスの有効化
Firebase Consoleの左側メニューから以下のサービスを有効にします。

1. **Firestore Database**:
   - 「データベースの作成」をクリック。
   - ロケーションはユーザーに最も近いリージョン（例: `asia-northeast1` (東京)）を選択。
   - ルールは「本番環境モードで開始する」を選択。
2. **Authentication**:
   - 「始める」をクリック。
   - 「Sign-in method」タブから「匿名（Anonymous）」を有効にします。
3. **Hosting**:
   - 「始める」をクリック。
   - 画面の指示に従い、Nextをクリックして完了させます（デプロイ自体は後でCI/CDから行います）。

### 3. GCP APIの有効化
[Google Cloud Console](https://console.cloud.google.com/) に移動し、上記で作成したプロジェクトを選択します。
画面上部の検索バーで以下のAPIを検索し、それぞれ「有効にする」をクリックします。
- **Cloud Run API**
- **Cloud Build API**
- **Secret Manager API**

---

## 第2章: GitHubとCloud Buildの連携設定 (CI/CD)

Cloud Build を使って、GitHubのリポジトリにプッシュされた際に自動的にデプロイが行われるように設定します。

### 1. Cloud Build リポジトリの接続
1. GCP Console のメニューから「Cloud Build」>「リポジトリ」を開きます。
2. 「リポジトリを接続」をクリックします。
3. 「GitHub」を選択し、認証を行います。
4. `doronuma_boardgame` のリポジトリを選択し、接続を完了します。

### 2. Cloud Build トリガーの作成
1. GCP Console のメニューから「Cloud Build」>「トリガー」を開きます。
2. 「トリガーを作成」をクリックします。
3. 以下の設定を入力します:
   - **名前**: `deploy-production`
   - **イベント**: `ブランチにpushする`
   - **ソース**: 対象のリポジトリとブランチ（例: `main`）を選択
   - **構成**: `Cloud Build 構成ファイル (yaml または json)`
   - **場所**: `リポジトリ`
   - **Cloud Build 構成ファイルの場所**: `/cloudbuild.yaml`
4. 「作成」をクリックします。

### 3. Cloud Build サービスアカウントの権限付与
Cloud BuildがCloud RunとFirebase Hostingにデプロイするために、権限を付与する必要があります。

1. GCP Console のメニューから「IAMと管理」>「IAM」を開きます。
2. `<プロジェクト番号>@cloudbuild.gserviceaccount.com` というサービスアカウントを見つけて、右側の「プリンシパルを編集（鉛筆アイコン）」をクリックします。
3. 「別のロールを追加」をクリックし、以下のロールを追加します:
   - **Cloud Run 管理者**
   - **サービス アカウント ユーザー**
   - **Firebase 開発者**
   - **Secret Manager のシークレット アクセサー**
4. 保存します。

---

## 第3章: ローカルリポジトリ側の設定 (各種設定ファイル)

リポジトリ直下に以下のファイルが必要です。

### 1. `.firebaserc` の設定
ルートディレクトリの `.firebaserc` を以下のように設定します。
```json
{
  "projects": {
    "default": "あなたのFirebaseプロジェクトID"
  }
}
```

### 2. `firebase.json` の設定
Firestoreルール、インデックス、Hostingの設定を記述します。
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "source": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "frameworksBackend": {
      "region": "asia-northeast1"
    }
  }
}
```

### 3. `cloudbuild.yaml` の設定
CI/CDのフローを記述します。これはルートディレクトリに配置します。

```yaml
steps:
  # 1. 共有パッケージのビルド
  - name: 'node:20-slim'
    entrypoint: 'npm'
    args: ['ci']
  - name: 'node:20-slim'
    entrypoint: 'npm'
    args: ['run', 'build', '--workspace=@doronuma/shared']

  # 2. バックエンド(Cloud Run)のビルドとデプロイ
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/doronuma-backend', '-f', 'packages/backend/Dockerfile', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/doronuma-backend']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'doronuma-backend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/doronuma-backend'
      - '--region'
      - 'asia-northeast1'
      - '--allow-unauthenticated'
      - '--min-instances'
      - '0'

  # 3. Firestoreルールとインデックスのデプロイ
  - name: 'gcr.io/$PROJECT_ID/firebase'
    entrypoint: 'sh'
    args:
      - '-c'
      - 'npm install -g firebase-tools && firebase deploy --only firestore --project $PROJECT_ID'

  # 4. フロントエンド(Hosting)のデプロイ
  - name: 'gcr.io/$PROJECT_ID/firebase'
    entrypoint: 'sh'
    args:
      - '-c'
      - 'npm install -g firebase-tools && firebase deploy --only hosting --project $PROJECT_ID'

options:
  logging: CLOUD_LOGGING_ONLY
```

---

## 第4章: カスタムドメインの設定 (不要)

ユーザーの要望により、**カスタムドメインは設定せず、デフォルトのドメイン（Firebase Hostingが提供する `.web.app` または `.firebaseapp.com`）を採用**します。
したがって、DNS設定などの作業は一切不要です。

---

## 第5章: デプロイの実行

すべての準備が整いました。以下の操作で本番環境への自動デプロイが走ります。

1. ローカルでの変更をコミットします。
   ```bash
   git add .
   git commit -m "Configure CI/CD and infrastructure"
   ```
2. GitHubの `main` ブランチにプッシュします。
   ```bash
   git push origin main
   ```
3. GCP Consoleの Cloud Build > 履歴 ページを開くと、ビルドが実行されているのが確認できます。
4. ビルドが成功すると、Firebase HostingのURL（例: `https://your-project-id.web.app`）にアクセスしてゲームをプレイできます。

以上でインフラとCI/CDの構築は完了です。
