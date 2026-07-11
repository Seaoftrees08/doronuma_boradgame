# 泥沼ボードゲームシリーズ (doronuma_boradgame)

お互いに罵り合いながら邪魔をし合う、妨害が中心のオンラインボードゲームシリーズ。

---

## 第一弾：泥沼の妨害 (doronuma_sabotage)

> 全員がマイナス点で終わることがほとんど。最もマイナスが少ない人が勝利する、妨害特化のボードゲーム。

### ゲームの特徴

- **プレイ人数:** 3〜5人
- **勝利条件:** ゲーム終了時に最もマイナスが少ない人の勝利
- **コンセプト:** 他のプレイヤーに勝利点カード（ほぼマイナス）を引かせて妨害し合う
- **割り込みシステム:** 相手の行動に対してカウンターを仕掛ける、後出し有利のスタック処理
- **突然死:** 山札の後半に混ざる1枚のカードが引かれると、ゲーム終了のカウントダウンが始まる

### 行動カードの種類

| カード名 | 枚数 | 効果 |
|:---|:---:|:---|
| 単なる嫌がらせ | 15 | 指定した1人に勝利点カードを1枚引かせる |
| 道連れ | 8 | 自分以外の全員に勝利点カードを1枚ずつ引かせる |
| 集中砲火 | 4 | 指定した1人に勝利点カードを2枚引かせる |
| 完全無効 | 7 | 相手の行動カードの効果を完全に打ち消す |
| なすりつけ | 6 | 自分への攻撃を別の人にそらす |
| 倍返し | 4 | 攻撃を無効にし、攻撃者に2枚引かせる |
| 強奪 | 3 | 相手のプラスの勝利点カードを1枚奪う |
| 出る杭を打つ | 2 | プラス点のプレイヤー全員のプラスカードを捨てさせる |
| 突然死 | 1 | 引いた本人が勝利点カード3枚のペナルティ＋ゲーム終了トリガー |

---

## 技術スタック

| レイヤー | 技術 |
|:---|:---|
| フロントエンド | Next.js 16 + TypeScript + TailwindCSS v4 |
| ホスティング | Firebase Hosting |
| リアルタイム通信 | Cloud Firestore (onSnapshot) |
| ゲームサーバー | Cloud Run (Node.js / Express) |
| 認証 | Firebase Anonymous Authentication |
| 時間管理 | Cloud Scheduler |
| CI/CD | Cloud Build + GitHub |

---

## プロジェクト構成

```
doronuma_boradgame/
├── app/                    # Next.js フロントエンド
├── packages/
│   ├── shared/             # 共有型定義・定数・バリデーション
│   └── backend/            # Cloud Run ゲームサーバー
├── docs/                   # ドキュメント
└── ...
```

---

## ドキュメント

### 開発者向け

| ドキュメント | 内容 |
|:---|:---|
| [docs/environment.md](docs/environment.md) | 開発環境構築ガイド（Node.js, Firebase CLI, Docker 等のセットアップ手順） |
| [docs/infrastructure.md](docs/infrastructure.md) | GCP / Firebase インフラ構築ガイド（プロジェクト作成〜デプロイまでの全手順） |
| [docs/debug.md](docs/debug.md) | LAN内の他デバイスからのアクセス・デバッグ方法 |

### ゲーム仕様

| ドキュメント | 内容 |
|:---|:---|
| [docs/sabotage/doronuma_sabotage_game_spec.md](docs/sabotage/doronuma_sabotage_game_spec.md) | ゲームルール・カード一覧・勝利条件の詳細仕様 |
| [docs/sabotage/doronuma_sabotage_game_system.md](docs/sabotage/doronuma_sabotage_game_system.md) | システム構成・ロビー機能・自動進行の技術仕様 |
| [docs/sabotage/doronuma_sabotage_playing.md](docs/sabotage/doronuma_sabotage_playing.md) | ゲーム画面の UI 設計・画面遷移仕様 |
| [docs/sabotage/doronuma_sabotage_lobby.md](docs/sabotage/doronuma_sabotage_lobby.md) | ロビー画面の UI 設計 |

---

## クイックスタート

### 1. リポジトリのクローン

```bash
git clone https://github.com/Seaoftrees08/doronuma_boradgame.git
cd doronuma_boradgame
```

### 2. 依存パッケージのインストールと環境設定

```bash
npm install
```

また、`.env` ファイルを作成し、Firebase エミュレータ接続用の環境変数が有効になっていることを確認してください（`.env_sample` をコピーして利用できます）。
```bash
cp .env_sample .env
```

### 3. 開発サーバーとエミュレータの起動

ローカル環境での開発には、フロントエンド、バックエンド、および Firebase エミュレータの起動が必要です（※エミュレータの動作には Java v11 以上が必要です）。

#### 3.1 Firebase ローカルエミュレータの起動

```bash
# Firebase CLI のインストール (未インストールの場合)
npm install -g firebase-tools

# Firebase 実験的機能の有効化 (初回のみ)
firebase experiments:enable webframeworks

# エミュレータの起動
firebase emulators:start --only auth,firestore
```

*   **Firestore エミュレータ**: `localhost:8080` (firebase.json 設定値)
*   **Auth エミュレータ**: `localhost:9099` (firebase.json 設定値)
*   **エミュレータ UI**: エミュレータ起動時に表示されるURL（通常 `localhost:4000`）から、データの確認や認証ユーザーの管理が行えます。

#### 3.2 バックエンドサーバーの起動

```bash
npm run dev --workspace=@doronuma/backend
```

#### 3.3 フロントエンドサーバーの起動

```bash
npm run dev
```

起動後、http://localhost:3000 にアクセスして動作確認が行えます。

> **LAN内の別デバイスからテストしたい場合**:
> スマホや別のPCからアクセスしてデバッグする方法については、[LAN内の他デバイスからのアクセス・デバッグガイド](docs/debug.md) を参照してください。

> ※詳細なセットアップ手順やトラブルシューティングは、[開発環境構築ガイド](docs/environment.md) および [インフラストラクチャ・デプロイガイド](docs/infrastructure.md) を参照してください。

---

## 📄 ライセンス

[MIT License](LICENSE)
