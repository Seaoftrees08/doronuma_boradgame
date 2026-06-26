"use client";

import { Player, GameState } from "@doronuma/shared";

interface Props {
  players: Record<string, Player>;
  gameState: GameState;
  currentUserId?: string;
  onSelectTarget?: (playerId: string) => void;
  selectedTargetId?: string | null;
  canTarget?: boolean;
}

export default function OpponentList({ 
  players, 
  gameState, 
  currentUserId, 
  onSelectTarget, 
  selectedTargetId,
  canTarget 
}: Props) {
  const turnOrder = gameState.turnOrder;
  
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {turnOrder.map(playerId => {
        if (playerId === currentUserId) return null;
        const player = players[playerId];
        if (!player) return null;
        
        const isCurrentTurn = gameState.currentTurnPlayerId === playerId;
        const isTargeted = selectedTargetId === playerId;
        const isAfk = player.status === 'afk';
        const isFinished = gameState.phase === 'finished';

        return (
          <div 
            key={playerId}
            onClick={() => {
              if (canTarget && !isAfk && !isFinished) {
                onSelectTarget?.(playerId);
              }
            }}
            className={`
              relative p-4 rounded-xl border-2 transition-all w-32 flex flex-col items-center
              ${isTargeted ? 'border-red-500 bg-red-950/20 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'border-zinc-800 bg-zinc-900'}
              ${isCurrentTurn ? 'ring-2 ring-zinc-400' : ''}
              ${canTarget && !isAfk && !isFinished ? 'cursor-pointer hover:border-red-400' : ''}
              ${isAfk ? 'opacity-50' : ''}
            `}
          >
            {isCurrentTurn && (
              <div className="absolute -top-3 bg-white text-black text-xs font-bold px-2 py-0.5 rounded-full">
                Thinking...
              </div>
            )}
            {isAfk && (
              <div className="absolute -top-3 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                AFK
              </div>
            )}
            <div className="font-bold text-center mb-2 truncate w-full text-zinc-100">{player.name}</div>
            <div className="text-sm font-medium text-zinc-400">
              手札: <span className="text-white">{player.handCount}</span>
            </div>
            {isFinished && (
              <div className="mt-2 text-sm font-black text-red-400">
                Score: {player.score}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
