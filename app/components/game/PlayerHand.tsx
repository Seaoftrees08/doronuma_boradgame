"use client";

import { ActionCard } from "@doronuma/shared";

interface Props {
  hand: ActionCard[];
  onCardSelect?: (cardId: string) => void;
  selectedCardIds: string[];
  disabled?: boolean;
}

export default function PlayerHand({ hand, onCardSelect, selectedCardIds, disabled }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      {hand.length === 0 && (
        <div className="text-zinc-500 italic p-4 text-center w-full">手札がありません</div>
      )}
      {hand.map((card) => {
        const isSelected = selectedCardIds.includes(card.id);
        return (
          <button
            key={card.id}
            onClick={() => onCardSelect?.(card.id)}
            disabled={disabled}
            className={`
              relative min-w-[100px] h-[140px] rounded-lg p-3 transition-all
              flex flex-col items-center justify-center text-center
              ${isSelected ? 'ring-4 ring-red-500 -translate-y-4' : 'hover:-translate-y-2'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              bg-zinc-800 border-2 border-zinc-700
            `}
          >
            <span className="font-bold text-white mb-2">{card.type}</span>
          </button>
        );
      })}
    </div>
  );
}
