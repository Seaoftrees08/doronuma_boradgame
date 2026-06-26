# 開発環境構築ガイド

このドキュメントは、「泥沼の妨害 (Doronuma Sabotage)」の開発環境をゼロから構築するための手順書です。
外部サイトを検索しなくても、この手順に沿って進めるだけで開発環境が完成します。

## 前提条件
以下のソフトウェアがPCにインストールされている必要があります。
*   **OS**: Windows 10/11, macOS, Linux いずれでも可
*   **Node.js**: v20.0.0 以上 (v20のLTSバージョンを推奨)
*   **npm**: v10.0.0 以上 (Node.jsに同梱)
*   **Git**: 最新版

## 1. リポジトリのクローンと依存関係のインストール

1. ターミナル（またはコマンドプロンプト、PowerShell）を開きます。
2. 任意のディレクトリでリポジトリをクローンします。
   ```bash
   git clone <リポジトリのURL> doronuma_boardgame
   cd doronuma_boardgame
   ```
3. 依存関係をインストールします。このプロジェクトは npm workspaces を利用したモノレポ構成です。ルートディレクトリで一度コマンドを実行するだけで、フロントエンド・バックエンド・共有パッケージすべての依存関係がインストールされます。
   ```bash
   npm install
   ```

## 2. Firebase プロジェクトの設定とCLIツールの導入

ローカルで開発する場合でも、Firebaseの設定が必要です。本番環境（または開発用のテスト環境）のFirebaseプロジェクトと連携するか、ローカルエミュレータを利用します。

### 2.1 Firebase CLI のインストール
Firebaseプロジェクトを管理するために、Firebase CLIをグローバルにインストールします。
```bash
npm install -g firebase-tools
```

### 2.2 Firebase へのログイン
以下のコマンドを実行し、Googleアカウントでログインします。
```bash
firebase login
```
ブラウザが開くので、Firebaseプロジェクト権限を持つGoogleアカウントで許可してください。

## 3. 環境変数の設定

フロントエンドとバックエンドのそれぞれで、環境変数ファイルが必要です。

### 3.1 フロントエンド (.env.local)
ルートディレクトリの直下に `.env.local` という名前のファイルを作成し、以下の内容を記述します。
値は Firebase コンソールの「プロジェクトの設定」>「全般」>「マイアプリ」から取得した情報を入力してください。

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### 3.2 バックエンド (開発時は環境変数が自動で読み込まれます)
Firebase Admin SDK は、`firebase-tools` 経由で実行した場合、自動的に認証情報を取得します。
本番環境やローカルで単独実行する場合は `GOOGLE_APPLICATION_CREDENTIALS` を設定する必要がありますが、後述の開発用コマンドを使う場合は不要です。

## 4. 開発サーバーの起動

このプロジェクトは、フロントエンド（Next.js）とバックエンド（Express + Firebase Admin）が分かれています。
それぞれを同時に起動する必要があります。

### 4.1 バックエンドの開発サーバー起動
ターミナルを新しく開き、ルートディレクトリで以下のコマンドを実行します。
これにより、TypeScriptの自動コンパイルとサーバーの自動再起動が有効になります。
```bash
npm run dev --workspace=@doronuma/backend
```
デフォルトでは `http://localhost:8080` でサーバーが起動します。

### 4.2 フロントエンドの開発サーバー起動
もう一つ別のターミナルを開き、ルートディレクトリで以下のコマンドを実行します。
```bash
npm run dev
```
デフォルトでは `http://localhost:3000` でNext.jsアプリが起動します。

## 5. Firebase ローカルエミュレータの使用（推奨）

Firestore のデータをローカルで安全にテストしたい場合は、Firebaseエミュレータを使用できます。

1. エミュレータの起動
   ```bash
   firebase emulators:start
   ```
2. エミュレータを有効にするには、フロントエンドおよびバックエンドのコードでエミュレータのホストに向くように設定を一部書き換えるか、環境変数 `FIRESTORE_EMULATOR_HOST=localhost:8080` 等を設定してサーバーを起動します。

## 6. トラブルシューティング

*   **パッケージが見つからないエラーが出る場合**: 
    ルートディレクトリで `npm install` を再度実行してください。npm workspaces では各パッケージ間のリンク付けが必要です。
*   **Firebase の権限エラーが出る場合**:
    `firebase login` で正しいアカウントにログインしているか確認してください。
*   **Next.js のコンパイルエラー**:
    共有パッケージ `@doronuma/shared` を変更した場合は、ルートディレクトリで `npm run build --workspace=@doronuma/shared` を実行して再コンパイルしてください。（バックエンドの `npm run dev` は自動的に共有パッケージの変更を検知しない場合があります）
