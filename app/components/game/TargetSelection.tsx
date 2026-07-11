"use client";

import React from 'react';

interface PlayerInfo {
  id: string;
  name: string;
  status: 'playing' | 'afk' | 'waiting' | 'ready' | 'observer';
}

interface Props {
  players: PlayerInfo[];
  onSelectTarget: (playerId: string) => void;
}

export function TargetSelection({ players, onSelectTarget }: Props) {
  return (
    <div className="flex flex-col space-y-3 w-full bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
      <div className="text-sm font-bold text-zinc-400 mb-2">対象プレイヤーを選択してください</div>
      <div className="flex flex-col space-y-2">
        {players.map((player) => {
          const isAfk = player.status === 'afk';
          return (
            <div 
              key={player.id} 
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isAfk ? 'border-zinc-850 bg-zinc-900/20 opacity-50' : 'border-zinc-800 bg-zinc-900/60'
              }`}
            >
              <span className="font-bold text-white">
                {player.name} {isAfk && <span className="text-xs text-red-500 font-bold ml-1.5">(空席 / 攻撃対象外)</span>}
              </span>
              {!isAfk && (
                <button
                  data-testid={`target-button-${player.id}`}
                  onClick={() => onSelectTarget(player.id)}
                  className="py-1.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  決定
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
