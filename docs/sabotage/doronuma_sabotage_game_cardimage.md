# カード画像 一覧・ディレクトリ定義

このファイルは、行動カードの画像ファイルを配置するディレクトリ構造と、
コード上の `CardType` との対応を定義します。

---

## ディレクトリ構造

画像は Next.js の `public/` ディレクトリ以下に配置します。

```
public/
└── images/
    └── doronuma_sabotage/
        └── cards/
            ├── harassment.png        # 単なる嫌がらせ
            ├── accomplice.png        # 道連れ
            ├── barrage.png           # 集中砲火
            ├── nullify.png           # 完全無効
            ├── deflect.png           # なすりつけ
            ├── double_back.png       # 倍返し
            ├── plunder.png           # 強奪
            ├── cut_down.png          # 出る杭を打つ
            └── sudden_death.png      # 突然死
```

---

## カード名・CardType・ファイルパス 対応表

| 和名（表示名）     | `CardType` (コード上の識別子) | 画像ファイルパス（`public/` 基準）                        | 枚数 |
| :----------------- | :---------------------------- | :-------------------------------------------------------- | ---: |
| 単なる嫌がらせ     | `Harassment`                  | `/images/doronuma_sabotage/cards/harassment.png`          |   15 |
| 道連れ             | `Accomplice`                  | `/images/doronuma_sabotage/cards/accomplice.png`          |    8 |
| 集中砲火           | `Barrage`                     | `/images/doronuma_sabotage/cards/barrage.png`             |    4 |
| 完全無効           | `Nullify`                     | `/images/doronuma_sabotage/cards/nullify.png`             |    7 |
| なすりつけ         | `Deflect`                     | `/images/doronuma_sabotage/cards/deflect.png`             |    6 |
| 倍返し             | `DoubleBack`                  | `/images/doronuma_sabotage/cards/double_back.png`         |    4 |
| 強奪               | `Plunder`                     | `/images/doronuma_sabotage/cards/plunder.png`             |    3 |
| 出る杭を打つ       | `CutDown`                     | `/images/doronuma_sabotage/cards/cut_down.png`            |    2 |
| 突然死             | `SuddenDeath`                 | `/images/doronuma_sabotage/cards/sudden_death.png`        |    1 |

**合計：50枚**

---

## 画像仕様（依頼時の推奨フォーマット）

| 項目           | 推奨値                         |
| :------------- | :----------------------------- |
| フォーマット   | PNG（透過対応）                |
| サイズ         | 200 × 280 px（縦長カード比率） |
| 解像度         | 72 dpi（Web用）                |
| 色空間         | sRGB                           |

---

## カード効果の概要（画像制作の参考用）

| 和名               | 効果の概要                                                                                                       |
| :----------------- | :--------------------------------------------------------------------------------------------------------------- |
| 単なる嫌がらせ     | 指定した1人に勝利点カードを1枚引かせる。                                                                         |
| 道連れ             | 自分以外の全員に勝利点カードを1枚ずつ引かせる。                                                                  |
| 集中砲火           | 指定した1人に勝利点カードを2枚引かせる。                                                                         |
| 完全無効           | 相手の行動カードの効果を完全に打ち消す。自分への攻撃のみ無効化。強奪などへの使用でその行動自体をキャンセル。      |
| なすりつけ         | 自分への行動カードの効果を、指定した別の人にそらす。                                                             |
| 倍返し             | 勝利点カードを引かされそうになった時、それを無効にして攻撃者に2枚引かせる。                                      |
| 強奪               | 相手1人を指定し、その人が持っている「プラスの勝利点カード」を1枚奪う。                                           |
| 出る杭を打つ       | 現在プラス点になっているプレイヤー全員の、プラスの勝利点カードをすべて捨てさせる。                                |
| 突然死             | 引いた瞬間にペナルティ発動。引いた本人が勝利点カードを3枚引き、そのラウンド終了時にゲーム終了。                   |

---

## 実装側の参照方法

`CardType` から画像パスへのマッピングは、フロントエンドで以下のような定数オブジェクトとして管理する予定です。
（実際の実装は `app/lib/cardImages.ts` などに配置する。）

```typescript
// 例: app/lib/cardImages.ts
import { CardType } from "@doronuma/shared";

export const CARD_IMAGE_PATHS: Record<CardType, string> = {
  Harassment:  "/images/doronuma_sabotage/cards/harassment.png",
  Accomplice:  "/images/doronuma_sabotage/cards/accomplice.png",
  Barrage:     "/images/doronuma_sabotage/cards/barrage.png",
  Nullify:     "/images/doronuma_sabotage/cards/nullify.png",
  Deflect:     "/images/doronuma_sabotage/cards/deflect.png",
  DoubleBack:  "/images/doronuma_sabotage/cards/double_back.png",
  Plunder:     "/images/doronuma_sabotage/cards/plunder.png",
  CutDown:     "/images/doronuma_sabotage/cards/cut_down.png",
  SuddenDeath: "/images/doronuma_sabotage/cards/sudden_death.png",
};
```
