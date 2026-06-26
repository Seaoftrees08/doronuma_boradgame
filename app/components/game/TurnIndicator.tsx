"use client";

import { GameState, Player } from "@doronuma/shared";

interface Props {
  gameState: GameState;
  players: Record<string, Player>;
  currentUserId?: string;
}

export default function TurnIndicator({ gameState, players, currentUserId }: Props) {
  const isMyTurn = gameState.currentTurnPlayerId === currentUserId;
  const currentPlayer = players[gameState.currentTurnPlayerId];

  // A very basic remaining seconds display (might need interval update in real implementation)
  const remainingMs = Math.max(0, gameState.turnDeadline - Date.now());
  const remainingSec = Math.ceil(remainingMs / 1000);

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <h2 className={`text-3xl font-black mb-2 tracking-tight transition-colors ${isMyTurn ? 'text-red-500' : 'text-white'}`}>
        {isMyTurn ? "あなたの番です！" : `${currentPlayer?.name || '???'} の番です`}
      </h2>
      <div className="flex items-center space-x-2">
        <span className="text-zinc-400 text-sm font-bold">残り時間</span>
        <span className={`font-mono text-2xl font-black ${remainingSec <= 5 ? 'text-red-500 animate-pulse' : 'text-zinc-300'}`}>
          {remainingSec}
        </span>
        <span className="text-zinc-400 text-sm font-bold">秒</span>
      </div>
      {gameState.phase === 'interrupt' && (
        <div className="mt-2 text-yellow-500 font-bold animate-bounce">
          割り込み待機中...
        </div>
      )}
    </div>
  );
}
