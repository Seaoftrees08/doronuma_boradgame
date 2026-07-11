"use client";

import { VictoryPointCard } from '@doronuma/shared';

interface Props {
  victoryCards: VictoryPointCard[];
  onSynthesize: (type: 'small' | 'large') => void;
  onSkip: () => void;
  disabled?: boolean;
}

export function SynthesisPanel({ victoryCards, onSynthesize, onSkip, disabled = false }: Props) {
  const counts = {
    PlusOne: 0,
    PlusThree: 0,
    PlusFive: 0,
    MinusThree: 0
  };

  for (const card of victoryCards) {
    if (card.type in counts) {
      counts[card.type]++;
    }
  }

  const canSmall = counts.PlusOne >= 2;
  const canLarge = counts.PlusThree >= 2 && counts.MinusThree >= 1;

  return (
    <div 
      data-testid="synthesis-panel"
      className="flex flex-col items-center w-full mt-6 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/80 max-w-2xl mx-auto shadow-xl backdrop-blur-sm animate-fadeIn"
    >
      <div className="text-emerald-400 font-bold text-sm tracking-wider uppercase mb-2 flex items-center gap-1.5 animate-pulse">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        合成フェーズ
      </div>
      
      <div className="text-xl font-black text-white text-center mb-4 tracking-wide">
        ✨ +1点カードを受け取りました！
      </div>

      <div className="w-full bg-zinc-950/60 rounded-xl p-4 border border-zinc-800/40 mb-5">
        <div className="text-xs text-zinc-500 font-bold mb-3 tracking-wider text-center uppercase">手持ちの勝利点カード</div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-zinc-900/80 rounded-lg p-2.5 border border-zinc-800">
            <div className="text-[10px] text-zinc-400 font-bold mb-1">+1点</div>
            <div className="text-lg font-black text-white">{counts.PlusOne}枚</div>
          </div>
          <div className="bg-zinc-900/80 rounded-lg p-2.5 border border-zinc-800">
            <div className="text-[10px] text-zinc-400 font-bold mb-1">+3点</div>
            <div className="text-lg font-black text-emerald-400">{counts.PlusThree}枚</div>
          </div>
          <div className="bg-zinc-900/80 rounded-lg p-2.5 border border-zinc-800">
            <div className="text-[10px] text-zinc-400 font-bold mb-1">+5点</div>
            <div className="text-lg font-black text-yellow-400">{counts.PlusFive}枚</div>
          </div>
          <div className="bg-zinc-900/80 rounded-lg p-2.5 border border-zinc-800">
            <div className="text-[10px] text-zinc-400 font-bold mb-1">-3点</div>
            <div className="text-lg font-black text-red-500">{counts.MinusThree}枚</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button
          disabled={disabled || !canSmall}
          onClick={() => onSynthesize('small')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold border transition-all ${
            canSmall
              ? 'bg-zinc-800 text-white hover:bg-zinc-700 hover:border-zinc-600 cursor-pointer border-zinc-700 shadow-md'
              : 'bg-zinc-900/40 text-zinc-650 border-zinc-900 opacity-40 cursor-not-allowed'
          }`}
        >
          昇格（小）: +1×2 → +3
        </button>

        <button
          disabled={disabled || !canLarge}
          onClick={() => onSynthesize('large')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold border transition-all ${
            canLarge
              ? 'bg-zinc-800 text-white hover:bg-zinc-700 hover:border-zinc-600 cursor-pointer border-zinc-700 shadow-md'
              : 'bg-zinc-900/40 text-zinc-650 border-zinc-900 opacity-40 cursor-not-allowed'
          }`}
        >
          昇格（大）: +3×2 + -3×1 → +5
        </button>
      </div>

      <button
        disabled={disabled}
        onClick={onSkip}
        className="w-full mt-4 py-2.5 rounded-xl font-bold bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300 border border-zinc-850 hover:border-zinc-750 transition-all cursor-pointer text-sm"
      >
        合成しない（スキップ）
      </button>
    </div>
  );
}
