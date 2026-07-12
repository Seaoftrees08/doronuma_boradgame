import { CardType, TurnActionType } from "@doronuma/shared";
import jaTranslations from "../../language/ja.json";

// 将来的に英語などを追加する場合は、こちらにインポートまたは動的読み込みを追加します。
const translations: Record<string, typeof jaTranslations> = {
  ja: jaTranslations,
};

export interface CardI18n {
  name: string;
  description: string;
}

export function getCardI18n(cardType: CardType, locale: string = "ja"): CardI18n {
  const lang = translations[locale] || translations["ja"];
  const cardData = lang.cards[cardType];
  
  if (!cardData) {
    return {
      name: cardType,
      description: "",
    };
  }
  
  return {
    name: cardData.name,
    description: cardData.description,
  };
}

export function getUiTranslation(locale: string = "ja") {
  const lang = translations[locale] || translations["ja"];
  return lang.ui;
}

export function getActionName(type: TurnActionType): string {
  switch (type) {
    case 'drawTwo': return '2枚引いて終了';
    case 'drawOnePlayOne': return '1枚引いて1枚使う';
    case 'discardPlayTwo': return '行動カードを1枚捨てて2枚まで使う';
    case 'pass': return 'パス（何もしない）';
    default: return '';
  }
}
