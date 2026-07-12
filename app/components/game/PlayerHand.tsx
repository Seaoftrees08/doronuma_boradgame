"use client";

import { ActionCard, CardType } from "@doronuma/shared";
import { useState } from "react";
import Image from "next/image";
import { CARD_IMAGE_PATHS } from "../../lib/cardImages";
import CardDetailModal from "./CardDetailModal";

interface Props {
  hand: ActionCard[];
  onCardSelect?: (cardId: string) => void;
  selectedCardIds: string[];
  disabled?: boolean;
}

export default function PlayerHand({ hand, onCardSelect, selectedCardIds, disabled }: Props) {
  const [detailCardType, setDetailCardType] = useState<CardType | null>(null);

  return (
    <div className="flex gap-2 overflow-x-auto p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      {hand.length === 0 && (
        <div className="text-zinc-500 italic p-4 text-center w-full">手札がありません</div>
      )}
      {hand.map((card) => {
        const isSelected = selectedCardIds.includes(card.id);
        const imagePath = CARD_IMAGE_PATHS[card.type];
        return (
          <div
            key={card.id}
            className={`
              relative min-w-[100px] h-[140px] transition-all
              ${isSelected ? '-translate-y-4' : 'hover:-translate-y-2'}
            `}
          >
            <button
              onClick={() => {
                onCardSelect?.(card.id);
                if (!isSelected && selectedCardIds.length === 0) {
                  setDetailCardType(card.type);
                }
              }}
              disabled={disabled}
              title="クリックでカードを選択・説明を表示"
              className={`
                w-full h-full rounded-lg transition-all
                flex flex-col items-center justify-center text-center overflow-hidden
                ${isSelected ? 'ring-4 ring-red-500' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                bg-zinc-800 border-2 border-zinc-700
              `}
            >
              {imagePath ? (
                <div className="relative w-full h-full">
                  <Image
                    src={imagePath}
                    alt={card.type}
                    fill
                    sizes="100px"
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <span className="font-bold text-white mb-2">{card.type}</span>
              )}
            </button>
            
            {/* Help/Detail Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDetailCardType(card.type);
              }}
              title="詳細説明を表示"
              className="absolute -top-1 -right-1 z-30 w-5 h-5 rounded-full bg-zinc-950 border border-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              ?
            </button>
          </div>
        );
      })}

      {detailCardType && (
        <CardDetailModal
          cardType={detailCardType}
          isOpen={true}
          onClose={() => setDetailCardType(null)}
        />
      )}
    </div>
  );
}
