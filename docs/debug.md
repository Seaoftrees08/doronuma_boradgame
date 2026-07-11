# LAN内の他デバイスからのアクセス・デバッグ方法

Next.jsの開発サーバーに、同じWi-Fi（LAN）内にある別のデバイス（スマートフォンや別のPC）からアクセスしてデバッグする方法を解説します。

デフォルトの設定では、セキュリティ上の理由から「開発を実行しているPC自身（localhost）」からのアクセスしか受け付けないようになっています。他のデバイスからテストしたい場合は、以下の手順に従って設定を行ってください。

---

## 接続の手順

### 1. 開発サーバーの起動コマンドを変更する
PC側で操作を行います。
通常は `npm run dev` で起動しますが、これをすべてのアクセスを受け付ける設定（IPアドレス: `0.0.0.0`）で起動します。

ターミナルで以下のようにコマンドを入力して実行してください。

```bash
npx next dev -H 0.0.0.0
```

または、`package.json` の `scripts` 欄にある `dev` を `"dev": "next dev -H 0.0.0.0"` に書き換えてから `npm run dev` を実行しても同じ効果があります。

---

### 2. 開発用PCの「ローカルIPアドレス」を確認する
PC側で操作を行います。開発しているPCのLAN内での住所（IPアドレス）を調べます。

#### Windows の場合
コマンドプロンプトやPowerShellで以下のコマンドを実行し、「IPv4 アドレス」の欄を確認します。
```cmd
ipconfig
```
※一般的に `192.168.x.x` や `10.0.x.x` のような形式の数字の羅列です。

#### macOS / Linux の場合
ターミナルで以下のコマンドを実行する、または「システム設定 ＞ Wi-Fi ＞ 詳細」からIPアドレスを確認します。
```bash
ipconfig getifaddr en0
```

---

### 3. 別デバイスからブラウザでアクセスする
スマートフォンや別のPC側で操作を行います。

1. アクセスしたいデバイス（スマホ等）を、開発PCと**同じWi-Fi（LAN）**に接続します。
2. ブラウザを起動し、URL欄に以下のように入力します。

```text
http://[手順2で調べたIPアドレス]:3000
```

**例：**
PCのIPアドレスが `192.168.1.5` だった場合は、以下のURLにアクセスします。
[http://192.168.1.5:3000](http://192.168.1.5:3000)

---

## トラブルシューティング: 「Blocked cross-origin request...」と表示される場合

Next.js 15以降では、セキュリティ上の理由から開発用アセット（Fast Refresh/HMR用のWebSocket通信など）へのクロスオリジンアクセスが制限されています。スマホなど外部デバイスから接続した際、ターミナルに以下のような警告が表示され、接続がブロックされることがあります。

> **Blocked cross-origin request to Next.js dev resource ...**

### 解決方法
本プロジェクトでは、この問題を解決するために [next.config.ts](file:///c:/GitHub/doronuma_boradgame/next.config.ts) 内でPCのローカルIPアドレスを自動的に検出し、`allowedDevOrigins` に追加する設定を組み込んでいます。

そのため、開発サーバーを再起動するだけで自動的にブロックが解除されます。
もしそれでもブロックされる場合は、PC側で起動している開発サーバーを一度停止し、再度 `npx next dev -H 0.0.0.0` を実行して再起動してください。

---

## トラブルシューティング: 「FirebaseError: Firebase: Error (auth/network-request-failed)」と表示される場合

スマートフォンなどの外部デバイスからアクセスした際、画面のローディングが終わらない、またはコンソールに以下のエラーが出力されてサインイン（アノニマス認証など）に失敗することがあります。

> **FirebaseError: Firebase: Error (auth/network-request-failed)**

### 原因
デフォルトのままだと、以下の2つの問題が発生します。
1. **エミュレータ側の待ち受け設定**: Firebase Emulator（Auth/Firestore等）がデフォルトで `localhost` (127.0.0.1) のみで動作しているため、外部デバイス（スマホ）からの通信をPCが拒否してしまう。
2. **クライアント側の接続先設定**: アプリのクライアント側コードがエミュレータの接続先として `127.0.0.1` を指しているため、スマホ自身の中でエミュレータを探そうとして失敗してしまう。

### 解決方法
本プロジェクトでは、この問題を回避するために以下の対策を適用しています。

1. **`firebase.json` の設定**: 
   `emulators` 内の各サービス（`auth`, `firestore`, `ui`）に `"host": "0.0.0.0"` を追加し、ローカルネットワーク上のすべての接続を受け付けるようにしています。
2. **初期化コードの修正**: 
   [app/lib/firebase/auth.ts](file:///c:/GitHub/doronuma_boradgame/app/lib/firebase/auth.ts) および [app/lib/firebase/firestore.ts](file:///c:/GitHub/doronuma_boradgame/app/lib/firebase/firestore.ts) 内で、接続先を `127.0.0.1` 固定ではなく、ブラウザのアクセス元ホスト名（`window.location.hostname`）を動的に利用して接続するように修正しています。

**※注意**: 設定を反映させるため、**Firebase Emulator を一度停止し、再起動**してください。
```bash
# 一度 Ctrl + C で停止した後、再起動
firebase emulators:start --only auth,firestore
```

---

## トラブルシューティング: Windows ファイアウォールでブロックされる場合

外部デバイス（スマートフォンなど）からPC上のエミュレータ（ポート `9099` や `8080`）への通信が、Windows Defender ファイアウォールによってブロックされている場合があります。この場合、接続エラー（`auth/network-request-failed` など）が発生します。

### 解決方法

PCの管理者権限を持つターミナル（PowerShell）を開き、以下のコマンドを実行して Firebase エミュレータの通信ポートを受信規則として許可してください。

#### 1. PowerShell（管理者）を開く
- スタートボタンを右クリックし、「ターミナル（管理者）」または「PowerShell（管理者）」を選択します。

#### 2. ポートの許可ルールを追加する
以下のコマンドを実行して、ポート `9099` (Auth) と `8080` (Firestore) の受信通信を許可します。

```powershell
New-NetFirewallRule -DisplayName "Firebase Emulator Auth" -Direction Inbound -LocalPort 9099 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Firebase Emulator Firestore" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

コマンド実行後、スマホ側のブラウザでページをリロードし、接続エラーが解消されるか確認してください。


