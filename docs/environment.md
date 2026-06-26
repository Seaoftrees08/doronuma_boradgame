# 開発環境構築ガイド (environment.md)

このドキュメントでは、`doronuma_boradgame` リポジトリをクローンした人が、ゼロから開発環境を構築する手順を記載します。

---

## 目次

1. [前提条件](#1-前提条件)
2. [必須ソフトウェアのインストール](#2-必須ソフトウェアのインストール)
3. [リポジトリのクローンと初期セットアップ](#3-リポジトリのクローンと初期セットアップ)
4. [環境変数の設定](#4-環境変数の設定)
5. [Firebase Emulator のセットアップ](#5-firebase-emulator-のセットアップ)
6. [開発サーバーの起動](#6-開発サーバーの起動)
7. [エディタの設定（推奨）](#7-エディタの設定推奨)
8. [トラブルシューティング](#8-トラブルシューティング)

---

## 1. 前提条件

| 項目 | 最低バージョン | 確認コマンド |
|:---|:---|:---|
| OS | Windows 10 / macOS 12 / Ubuntu 20.04 以降 | - |
| Git | 2.30 以降 | `git --version` |
| Node.js | 20.x LTS 以降（推奨: 22.x LTS） | `node --version` |
| npm | 10.x 以降（Node.js に同梱） | `npm --version` |
| Java | JDK 11 以降（Firebase Emulator に必要） | `java -version` |
| Docker | 24.x 以降（バックエンド開発時に必要） | `docker --version` |

---

## 2. 必須ソフトウェアのインストール

### 2.1 Node.js

**推奨: nvm（Node Version Manager）を使用**

#### Windows の場合

1. [nvm-windows](https://github.com/coreybutler/nvm-windows/releases) から最新のインストーラー（`nvm-setup.exe`）をダウンロード
2. インストーラーを実行
3. PowerShell を**管理者権限**で開き、以下を実行：

```powershell
nvm install 22
nvm use 22
node --version   # v22.x.x と表示されること
npm --version    # 10.x.x と表示されること
```

#### macOS の場合

```bash
# Homebrew が未インストールの場合は先にインストール
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# nvm のインストール
brew install nvm

# シェル設定ファイル (~/.zshrc) に追加
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$(brew --prefix nvm)/nvm.sh" ] && \. "$(brew --prefix nvm)/nvm.sh"' >> ~/.zshrc
source ~/.zshrc

# Node.js のインストール
nvm install 22
nvm use 22
```

#### Linux (Ubuntu/Debian) の場合

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

### 2.2 Java (JDK)

Firebase Emulator Suite の実行に必要です。

#### Windows

1. [Adoptium (Temurin)](https://adoptium.net/) から JDK 21 のインストーラーをダウンロード
2. インストーラーを実行（PATH への追加オプションにチェック）
3. PowerShell を再起動して確認：

```powershell
java -version
# openjdk version "21.x.x" と表示されること
```

#### macOS

```bash
brew install --cask temurin
java -version
```

#### Linux

```bash
sudo apt update
sudo apt install -y openjdk-21-jdk
java -version
```

### 2.3 Firebase CLI

```bash
npm install -g firebase-tools
firebase --version   # 14.x.x と表示されること
```

### 2.4 Google Cloud CLI（gcloud）

バックエンド（Cloud Run）の開発・デプロイに必要です。

#### Windows

1. [Google Cloud SDK インストーラー](https://cloud.google.com/sdk/docs/install?hl=ja#windows) をダウンロード
2. インストーラーを実行
3. インストール完了後、表示されるターミナルで初期化：

```powershell
gcloud init
gcloud --version
```

#### macOS

```bash
brew install --cask google-cloud-sdk
gcloud init
```

#### Linux

```bash
sudo apt-get install apt-transport-https ca-certificates gnupg curl
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee /etc/apt/sources.list.d/google-cloud-sdk.list
sudo apt-get update && sudo apt-get install google-cloud-cli
gcloud init
```

### 2.5 Docker（バックエンド開発用）

#### Windows

1. [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) をダウンロードしてインストール
2. WSL 2 バックエンドを有効化（インストーラーの指示に従う）
3. Docker Desktop を起動して確認：

```powershell
docker --version
docker compose version
```

#### macOS

```bash
brew install --cask docker
# Docker Desktop を起動
docker --version
```

#### Linux

```bash
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
# ログアウトして再ログイン
docker --version
```

---

## 3. リポジトリのクローンと初期セットアップ

### 3.1 クローン

```bash
git clone https://github.com/Seaoftrees08/doronuma_boradgame.git
cd doronuma_boradgame
```

### 3.2 依存パッケージのインストール

npm workspaces を使用しているため、ルートで `npm install` を実行するとすべてのワークスペース（frontend / backend / shared）の依存パッケージがまとめてインストールされます。

```bash
npm install
```

### 3.3 共有パッケージのビルド

バックエンドやフロントエンドが参照する `@doronuma/shared` パッケージをビルドします。

```bash
npm run build --workspace=packages/shared
```

### 3.4 インストール確認

```bash
# フロントエンドの型チェック
npx tsc --noEmit

# Lint チェック
npm run lint
```

---

## 4. 環境変数の設定

### 4.1 フロントエンド（Next.js）用

プロジェクトルートに `.env.local` ファイルを作成します。

```bash
cp .env.example .env.local
```

`.env.local` の内容：

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Cloud Run Backend URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# Emulator Settings (development only)
NEXT_PUBLIC_USE_EMULATORS=true
```

> **重要:** `.env.local` は `.gitignore` に含まれているため、Git にはコミットされません。  
> Firebase の設定値は Firebase Console → プロジェクトの設定 → ウェブアプリ で確認できます。  
> 詳しくは [infrastructure.md](./infrastructure.md) を参照してください。

### 4.2 バックエンド（Cloud Run）用

`packages/backend/.env` ファイルを作成します。

```bash
cp packages/backend/.env.example packages/backend/.env
```

```env
# GCP Configuration
GCP_PROJECT_ID=your-project-id
PORT=8080

# Firebase Admin (Emulator 使用時は不要)
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# Emulator Settings (development only)
FIRESTORE_EMULATOR_HOST=localhost:8081
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

---

## 5. Firebase Emulator のセットアップ

ローカル開発では Firebase Emulator Suite を使用し、実際の Firebase プロジェクトに影響を与えずに開発できます。

### 5.1 Emulator のインストール

```bash
firebase init emulators
```

以下の Emulator を選択してインストール:
- **Authentication Emulator** (ポート: 9099)
- **Firestore Emulator** (ポート: 8081)
- **Emulator Suite UI** (ポート: 4000)

### 5.2 Emulator の起動

```bash
firebase emulators:start
```

起動後、以下の URL でアクセスできます：

| サービス | URL |
|:---|:---|
| Emulator Suite UI | http://localhost:4000 |
| Authentication Emulator | http://localhost:9099 |
| Firestore Emulator | http://localhost:8081 |

### 5.3 Emulator データの永続化（オプション）

Emulator のデータをセッション間で保持したい場合：

```bash
# エクスポート先ディレクトリを指定して起動
firebase emulators:start --export-on-exit=./emulator-data --import=./emulator-data
```

> `emulator-data/` ディレクトリは `.gitignore` に追加されています。

---

## 6. 開発サーバーの起動

### 6.1 全サービスの一括起動（推奨）

ターミナルを **3つ** 開いて、以下をそれぞれ実行します。

**ターミナル 1: Firebase Emulator**
```bash
firebase emulators:start
```

**ターミナル 2: バックエンド（Cloud Run ローカル）**
```bash
npm run dev --workspace=packages/backend
```

**ターミナル 3: フロントエンド（Next.js）**
```bash
npm run dev
```

### 6.2 アクセス先

| サービス | URL |
|:---|:---|
| フロントエンド | http://localhost:3000 |
| バックエンド API | http://localhost:8080 |
| Firebase Emulator UI | http://localhost:4000 |

---

## 7. エディタの設定（推奨）

### 7.1 VS Code

推奨拡張機能（`.vscode/extensions.json` に定義予定）：

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "firebase.firebase-vscode"
  ]
}
```

推奨設定（`.vscode/settings.json`）：

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.configFile": null
}
```

### 7.2 Cursor / その他のエディタ

VS Code 互換のエディタであれば、上記の設定がそのまま使えます。

---

## 8. トラブルシューティング

### `npm install` でエラーが出る

```bash
# キャッシュをクリアして再インストール
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Firebase Emulator が起動しない

```bash
# Java がインストールされているか確認
java -version

# ポートが競合していないか確認 (Windows)
netstat -ano | findstr :8081

# ポートが競合していないか確認 (macOS/Linux)
lsof -i :8081
```

### `NEXT_PUBLIC_` 環境変数が読み取れない

- `.env.local` ファイルがプロジェクトルートに存在するか確認
- 変数名が `NEXT_PUBLIC_` で始まっているか確認
- 開発サーバーを再起動（環境変数の変更は再起動が必要）

### TypeScript のパス解決エラー

```bash
# 共有パッケージを再ビルド
npm run build --workspace=packages/shared

# TypeScript のキャッシュをクリア
npx tsc --build --clean
```

### Docker が起動しない（Windows）

- WSL 2 が有効になっているか確認：`wsl --status`
- Docker Desktop が起動しているか確認
- Hyper-V が有効になっているか確認（Windows の機能の有効化）

---

## 次のステップ

- GCP / Firebase プロジェクトの作成と設定 → [infrastructure.md](./infrastructure.md)
- ゲーム仕様の確認 → [docs/sabotage/doronuma_sabotage_game_spec.md](./sabotage/doronuma_sabotage_game_spec.md)
