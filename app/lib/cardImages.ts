import { CardType, VictoryCardType } from "@doronuma/shared";

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
