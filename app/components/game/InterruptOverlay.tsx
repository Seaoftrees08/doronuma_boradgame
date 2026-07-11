"use client";

import React from 'react';
import { CardType, ActionCard } from '@doronuma/shared';
import { SABOTAGE_CARDS, COUNTER_CARDS } from '@doronuma/shared';

interface Props {
  currentCardType: CardType | null;
  playerHand: ActionCard[];
  isActive: boolean;
  onInterrupt?: (cardId: string) => void;
  onSkip?: () => void;
}

export function InterruptOverlay({ currentCardType, playerHand, isActive, onInterrupt, onSkip }: Props) {
  if (!isActive || !currentCardType) return null;

  const isSabotage = SABOTAGE_CARDS.includes(currentCardType);
  if (!isSabotage) return null;

  const counterCards = playerHand.filter(card => COUNTER_CARDS.includes(card.type));

  const getCardJapaneseName = (type: CardType) => {
    switch (type) {
      case 'Nullify': return '完全無効';
      case 'Deflect': return 'なすりつけ';
      case 'DoubleBack': return '倍返し';
      case 'Repel': return 'はじき返し';
      default: return type;
    }
  };

  return (
    <div 
      data-testid="interrupt-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
    >
      <div className="bg-zinc-900 border-2 border-yellow-600/50 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
        <div className="text-center">
          <div className="text-yellow-500 font-bold text-sm tracking-wider uppercase mb-1">
            ⚠️ 割り込みチャンス
          </div>
          <h3 className="text-xl font-black text-white">
            相手の妨害カードに対抗しますか？
          </h3>
          <p className="text-xs text-zinc-400 mt-1.5">
            現在使用されているカード: <span className="text-red-400 font-bold">{currentCardType}</span>
          </p>
        </div>

        <div className="space-y-2">
          {counterCards.length === 0 ? (
            <div className="text-center py-4 text-sm text-zinc-500 italic">
              使用できる対抗カードがありません
            </div>
          ) : (
            counterCards.map((card) => (
              <button
                key={card.id}
                onClick={() => onInterrupt?.(card.id)}
                className="w-full p-3 bg-zinc-800 hover:bg-zinc-750 text-white hover:text-yellow-400 border border-zinc-700 hover:border-yellow-600/40 rounded-xl font-bold transition-all text-left flex justify-between items-center cursor-pointer shadow-md"
              >
                <span>{getCardJapaneseName(card.type)}</span>
                <span className="text-[10px] text-zinc-500 font-mono">{card.type}</span>
              </button>
            ))
          )}
        </div>

        <button
          onClick={onSkip}
          className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-300 border border-zinc-850 rounded-xl font-bold text-sm transition-all cursor-pointer"
        >
          割り込まない（パス）
        </button>
      </div>
    </div>
  );
}
