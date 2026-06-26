# 開発環境構築ガイド

このドキュメントは、「泥沼の妨害 (Doronuma Sabotage)」の開発環境をゼロから構築するための手順書です。
外部サイトを検索しなくても、この手順に沿って進めるだけで開発環境が完成します。

## 前提条件
以下のソフトウェアがPCにインストールされている必要があります。
*   **OS**: Windows 10/11, macOS, Linux いずれでも可
*   **Node.js**: v20.0.0 以上 (v20のLTSバージョンを推奨)
*   **npm**: v10.0.0 以上 (Node.jsに同梱)
*   **Git**: 最新版
*   **Java (JRE または JDK)**: v11 以上 (ローカルエミュレータを利用して動作させる場合に必須)
    *   **インストールの手順 (Windows)**:
        1. [Adoptium (Temurin)](https://adoptium.net/temurin/releases/) から Java 17 または 21 の `.msi` インストーラーをダウンロードします。
        2. インストーラーを実行し、セットアップ画面で **「Add to PATH」** が選択されていることを確認してインストールします（通常はデフォルトで有効です）。
        3. インストール完了後、**新しく起動した**コマンドプロンプトやPowerShellで `java -version` コマンドを実行し、Javaのバージョンが表示されれば完了です。

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

ルートディレクトリの直下に `.env.local` という名前のファイルを作成します。
ここにはFirebaseプロジェクトと連携するための設定値を記述します。以下の手順で値を取得してください。

#### Firebase設定値の取得手順
1. [Firebase Console](https://console.firebase.google.com/) にアクセスし、Googleアカウントでログインします。
2. 開発に使用するプロジェクトをクリックして開きます。（プロジェクトがない場合は「プロジェクトを追加」から作成してください）
3. 左側のメニュー上部にある**設定** にカーソルを当て、**全般**を選択します。
4. **全般**タブが開いたら、ページの一番下までスクロールして**「マイアプリ」**のセクションを見つけます。
   - ※まだウェブアプリが登録されていない場合は、**</>** をクリックしてアプリのニックネーム（例: doronuma-web）を入力し、「アプリを登録」をクリックしてください。
5. マイアプリの項目内にある「SDK の設定と構成」の下のラジオボタンで**「構成」**または**「npm」**を選択すると、以下のようなコードブロックが表示されます。

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

6. このコードブロック内の各値を、先ほど作成した `.env.local` ファイルに以下のように対応させて貼り付けてください。ダブルクォーテーション (`"`) で囲むのを忘れないようにしてください。

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
デフォルトでは `http://localhost:8081` でサーバーが起動します。

### 4.2 フロントエンドの開発サーバー起動
もう一つ別のターミナルを開き、ルートディレクトリで以下のコマンドを実行します。
```bash
npm run dev
```
デフォルトでは `http://localhost:3000` でNext.jsアプリが起動します。

## 5. Firebase ローカルエミュレータの使用（推奨）

Firestore のデータをローカルで安全にテストしたい場合は、Firebaseエミュレータを使用できます。

### 5.1 エミュレータの起動

必ず**プロジェクトのルートディレクトリ（`firebase.json` が存在するディレクトリ）**で以下のコマンドを実行してください。

```bash
# プロジェクトルートに移動していることを確認
cd doronuma_boardgame 

# Firebase CLI の Next.js 連携に関する警告・エラーを回避するため、実験的機能を有効にします（初回のみ）
firebase experiments:enable webframeworks

# エミュレータの起動 (必要なサービスのみ指定して起動します)
firebase emulators:start --only auth,firestore
```

### 5.2 アプリケーションからエミュレータに接続する

バックエンドおよびフロントエンドは、開発モード（`development`）で起動された場合、ルートの `.env` ファイルに記述された `FIRESTORE_EMULATOR_HOST` 設定を自動的に読み込んでローカルエミュレータに接続します。

そのため、通常は以下の開発起動コマンドを実行するだけで自動的にエミュレータに接続されます（端末側での環境変数の手動設定は不要です）。

```bash
npm run dev --workspace=@doronuma/backend
```

もし手動で環境変数を指定して上書き接続したい場合は、以下のコマンドを使用してください。

#### Windows (PowerShell)
```powershell
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
npm run dev --workspace=@doronuma/backend
```

#### Mac / Linux (ターミナル)
```bash
export FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
npm run dev --workspace=@doronuma/backend
```

> **Note**: `127.0.0.1:8080` のポート番号 `8080` は、`firebase.json` 内の Firestore エミュレータのポート設定に合わせて変更してください（デフォルトは 8080 です）。また、Authエミュレータはデフォルトの `9099` ポートへ自動接続されます。
## 6. トラブルシューティング

*   **パッケージが見つからないエラーが出る場合**: 
    ルートディレクトリで `npm install` を再度実行してください。npm workspaces では各パッケージ間のリンク付けが必要です。
*   **Firebase の権限エラーが出る場合**:
    `firebase login` で正しいアカウントにログインしているか確認してください。
*   **Next.js のコンパイルエラー**:
    共有パッケージ `@doronuma/shared` を変更した場合は、ルートディレクトリで `npm run build --workspace=@doronuma/shared` を実行して再コンパイルしてください。（バックエンドの `npm run dev` は自動的に共有パッケージの変更を検知しない場合があります）
*   **「Failed to proxy http://localhost:8081/api/... ECONNREFUSED」エラーが出る場合**:
    バックエンドのサーバーが起動していない、あるいは起動に失敗しています。`npm run dev --workspace=@doronuma/backend` を実行しているターミナルにエラーが出ていないか確認してください。また、古い設定のまま `tsc -w` だけが実行され、Express サーバー本体の起動プロセスがブロックされている可能性があるため、一度ターミナルを閉じて新しく開き直してからコマンドを再実行してください。
