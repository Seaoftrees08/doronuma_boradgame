# カード画像 一覧・ディレクトリ定義

このファイルは、行動カードおよび勝利点カードの画像ファイルを配置するディレクトリ構造と、
コード上の `CardType` / `VictoryCardType` との対応を定義します。

---

## ディレクトリ構造

画像は Next.js の `public/` ディレクトリ以下に配置します。

```
public/
└── images/
    └── doronuma_sabotage/
        ├── cards/                    # 行動カード
        │   ├── gain_one.png          # 1点獲得
        │   ├── gain_two.png          # 2点獲得
        │   ├── gain_three.png        # 3点獲得
        │   ├── harassment.png        # 単なる嫌がらせ
        │   ├── accomplice.png        # 道連れ
        │   ├── barrage.png           # 集中砲火
        │   ├── quagmire_drag.png     # 泥沼引き込み
        │   ├── nullify.png           # 完全無効
        │   ├── deflect.png           # なすりつけ
        │   ├── double_back.png       # 倍返し
        │   ├── repel.png             # はじき返し
        │   ├── plunder.png           # 強奪
        │   ├── hand_raid.png         # 手札狙い
        │   ├── cut_down.png          # 出る杭を打つ
        │   ├── share.png             # お裾分け
        │   └── sudden_death.png      # 突然死
        └── victory_cards/            # 勝利点カード
            ├── plus_one.png          # +1点カード
            ├── plus_three.png        # +3点カード
            ├── plus_five.png         # +5点カード
            └── minus_three.png       # -3点カード
```

---

## 行動カード：CardType・ファイルパス 対応表

| 和名（表示名）   | カテゴリ       | `CardType` (コード上の識別子) | 画像ファイルパス（`public/` 基準）                              | 枚数 |
| :--------------- | :------------- | :---------------------------- | :-------------------------------------------------------------- | ---: |
| 1点獲得          | 得点取得系     | `GainOne`                     | `/images/doronuma_sabotage/cards/gain_one.png`                  |    5 |
| 2点獲得          | 得点取得系     | `GainTwo`                     | `/images/doronuma_sabotage/cards/gain_two.png`                  |    3 |
| 3点獲得          | 得点取得系     | `GainThree`                   | `/images/doronuma_sabotage/cards/gain_three.png`                |    2 |
| 単なる嫌がらせ   | 妨害系         | `Harassment`                  | `/images/doronuma_sabotage/cards/harassment.png`                |    8 |
| 道連れ           | 妨害系         | `Accomplice`                  | `/images/doronuma_sabotage/cards/accomplice.png`                |    4 |
| 集中砲火         | 妨害系         | `Barrage`                     | `/images/doronuma_sabotage/cards/barrage.png`                   |    4 |
| 泥沼引き込み     | 妨害系         | `QuagmireDrag`                | `/images/doronuma_sabotage/cards/quagmire_drag.png`             |    4 |
| 完全無効         | 妨害への対抗   | `Nullify`                     | `/images/doronuma_sabotage/cards/nullify.png`                   |    2 |
| なすりつけ       | 妨害への対抗   | `Deflect`                     | `/images/doronuma_sabotage/cards/deflect.png`                   |    2 |
| 倍返し           | 妨害への対抗   | `DoubleBack`                  | `/images/doronuma_sabotage/cards/double_back.png`               |    1 |
| はじき返し       | 妨害への対抗   | `Repel`                       | `/images/doronuma_sabotage/cards/repel.png`                     |    5 |
| 強奪             | 強奪・妨害     | `Plunder`                     | `/images/doronuma_sabotage/cards/plunder.png`                   |    3 |
| 手札狙い         | 強奪・妨害     | `HandRaid`                    | `/images/doronuma_sabotage/cards/hand_raid.png`                 |    2 |
| 出る杭を打つ     | 強奪・妨害     | `CutDown`                     | `/images/doronuma_sabotage/cards/cut_down.png`                  |    2 |
| お裾分け         | 強奪・妨害     | `Share`                       | `/images/doronuma_sabotage/cards/share.png`                     |    2 |
| 突然死           | 特殊           | `SuddenDeath`                 | `/images/doronuma_sabotage/cards/sudden_death.png`              |    1 |

**合計：50枚**

---

## 勝利点カード：VictoryCardType・ファイルパス 対応表

| 和名（表示名） | `VictoryCardType` (コード上の識別子) | 画像ファイルパス（`public/` 基準）                                  | 得点 |
| :------------- | :----------------------------------- | :------------------------------------------------------------------ | ---: |
| +1点カード     | `PlusOne`                            | `/images/doronuma_sabotage/victory_cards/plus_one.png`              |   +1 |
| +3点カード     | `PlusThree`                          | `/images/doronuma_sabotage/victory_cards/plus_three.png`            |   +3 |
| +5点カード     | `PlusFive`                           | `/images/doronuma_sabotage/victory_cards/plus_five.png`             |   +5 |
| -3点カード     | `MinusThree`                         | `/images/doronuma_sabotage/victory_cards/minus_three.png`           |   -3 |

---

## 画像仕様（依頼時の推奨フォーマット）

| 項目           | 推奨値                         |
| :------------- | :----------------------------- |
| フォーマット   | PNG（透過対応）                |
| サイズ         | 800 × 1120 px                  |
| 解像度         | 72 dpi                         |
| 色空間         | sRGB                           |

---

## カード効果の概要（画像制作の参考用）

### 行動カード

| 和名               | カテゴリ     | 効果の概要                                                                                                       |
| :----------------- | :----------- | :--------------------------------------------------------------------------------------------------------------- |
| 1点獲得            | 得点取得系   | 自分の手札に +1点カードを1枚加える。                                                                             |
| 2点獲得            | 得点取得系   | 自分の手札に +1点カードを2枚加える。                                                                             |
| 3点獲得            | 得点取得系   | 自分の手札に +1点カードを3枚加える。                                                                             |
| 単なる嫌がらせ     | 妨害系       | 指定した1人に -3点カードを1枚引かせる。                                                                          |
| 道連れ             | 妨害系       | 自分以外の全員に -3点カードを1枚ずつ引かせる。                                                                   |
| 集中砲火           | 妨害系       | 指定した1人に -3点カードを2枚引かせる。                                                                          |
| 泥沼引き込み       | 妨害系       | 指定した1人に -3点カードを1枚引かせる。追加で自分以外の全員に -3点カードを1枚ずつ引かせる。                        |
| 完全無効           | 妨害への対抗 | 相手の妨害系カードの効果を完全に打ち消す。全体攻撃の場合は自分への攻撃のみを無効化する。                         |
| なすりつけ         | 妨害への対抗 | 自分への妨害系カードの効果を、指定した別の人にそらす。                                                           |
| 倍返し             | 妨害への対抗 | -3点カードを引かされそうになった時、攻撃者自身に効果を二倍にして返す。                                           |
| はじき返し         | 妨害への対抗 | 自分に向けられた妨害系カードの効果を攻撃者本人に返す。                                                           |
| 強奪               | 強奪・妨害   | 相手1人を指定し、その人の勝利点カードを2枚ランダムに奪う。                                               |
| 手札狙い           | 強奪・妨害   | 相手1人を指定し、その人の行動カードの手札から1枚奪う。奪ったカードは自分の手札に加わる。                         |
| 出る杭を打つ       | 強奪・妨害   | +5点カードを持っているプレイヤーは全員、+5点カードを1枚捨てる。                                                  |
| お裾分け           | 強奪・妨害   | 自分の任意の勝利点カードを1枚、指定した相手に押し付ける。                                                        |
| 突然死             | 特殊         | 引いた瞬間にペナルティ発動。引いた本人が -3点カードを1枚受け取り、そのラウンド終了時にゲーム終了。               |

### 勝利点カード

| 和名       | 効果の概要                                                                                                       |
| :--------- | :--------------------------------------------------------------------------------------------------------------- |
| +1点カード | 合成フェーズ開始時に自動付与。合成（昇格・小）の素材になる。ゲーム終了時に +1点として計算される。                |
| +3点カード | 合成（昇格・小）で生成される。合成（昇格・大）の素材になる。ゲーム終了時に +3点として計算される。                |
| +5点カード | 合成（昇格・大）で生成される。ゲーム終了時に +5点として計算される。                                              |
| -3点カード | 妨害系カードの効果で付与される。合成（昇格・大）の素材になる。ゲーム終了時に -3点として計算される。              |

---

## 実装側の参照方法

`CardType` / `VictoryCardType` から画像パスへのマッピングは、フロントエンドで以下のような定数オブジェクトとして管理する予定です。
（実際の実装は `app/lib/cardImages.ts` などに配置する。）

```typescript
// 例: app/lib/cardImages.ts
import type { CardType, VictoryCardType } from "@doronuma/shared";

export const CARD_IMAGE_PATHS: Record<CardType, string> = {
  // 得点取得系
  GainOne:       "/images/doronuma_sabotage/cards/gain_one.png",
  GainTwo:       "/images/doronuma_sabotage/cards/gain_two.png",
  GainThree:     "/images/doronuma_sabotage/cards/gain_three.png",
  // 妨害系
  Harassment:    "/images/doronuma_sabotage/cards/harassment.png",
  Accomplice:    "/images/doronuma_sabotage/cards/accomplice.png",
  Barrage:       "/images/doronuma_sabotage/cards/barrage.png",
  QuagmireDrag:  "/images/doronuma_sabotage/cards/quagmire_drag.png",
  // 妨害への対抗
  Nullify:       "/images/doronuma_sabotage/cards/nullify.png",
  Deflect:       "/images/doronuma_sabotage/cards/deflect.png",
  DoubleBack:    "/images/doronuma_sabotage/cards/double_back.png",
  Repel:         "/images/doronuma_sabotage/cards/repel.png",
  // 強奪・妨害
  Plunder:       "/images/doronuma_sabotage/cards/plunder.png",
  HandRaid:      "/images/doronuma_sabotage/cards/hand_raid.png",
  CutDown:       "/images/doronuma_sabotage/cards/cut_down.png",
  Share:         "/images/doronuma_sabotage/cards/share.png",
  // 特殊
  SuddenDeath:   "/images/doronuma_sabotage/cards/sudden_death.png",
};

export const VICTORY_CARD_IMAGE_PATHS: Record<VictoryCardType, string> = {
  PlusOne:    "/images/doronuma_sabotage/victory_cards/plus_one.png",
  PlusThree:  "/images/doronuma_sabotage/victory_cards/plus_three.png",
  PlusFive:   "/images/doronuma_sabotage/victory_cards/plus_five.png",
  MinusThree: "/images/doronuma_sabotage/victory_cards/minus_three.png",
};
```
