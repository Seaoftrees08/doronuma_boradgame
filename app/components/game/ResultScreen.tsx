"use client";

import { GameState, Player } from "@doronuma/shared";
import { useRouter } from "next/navigation";

interface Props {
  gameState: GameState;
  players: Record<string, Player>;
  currentUserId?: string;
}

export default function ResultScreen({ gameState, players, currentUserId }: Props) {
  const router = useRouter();
  
  if (gameState.phase !== 'finished') return null;

  const sortedPlayers = Object.values(players)
    .filter(p => p.status !== 'observer')
    .sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-2xl w-full text-center space-y-8 shadow-2xl">
        <div>
          <h2 className="text-4xl font-black text-red-600 mb-2">ゲーム終了</h2>
          {gameState.suddenDeathTriggered && (
            <p className="text-yellow-500 font-bold">
              {players[gameState.suddenDeathTriggeredBy || '']?.name} によってサドンデスが発動しました！
            </p>
          )}
        </div>

        <div className="space-y-3">
          {sortedPlayers.map((player, index) => (
            <div 
              key={player.playerId}
              className={`flex items-center justify-between p-4 rounded-xl border ${
                player.playerId === currentUserId 
                  ? 'bg-zinc-800 border-zinc-600' 
                  : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <div className="flex items-center space-x-4">
                <span className={`text-2xl font-black w-8 ${
                  index === 0 ? 'text-yellow-500' : 
                  index === 1 ? 'text-zinc-300' : 
                  index === 2 ? 'text-orange-600' : 'text-zinc-600'
                }`}>
                  {index + 1}
                </span>
                <span className="font-bold text-lg">
                  {player.name} 
                  {player.status === 'afk' && <span className="text-red-500 text-sm ml-2">(AFK)</span>}
                  {player.playerId === currentUserId && <span className="text-zinc-500 text-sm ml-2">(あなた)</span>}
                </span>
              </div>
              <span className="text-2xl font-black">{player.score} pt</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
        >
          トップに戻る
        </button>
      </div>
    </div>
  );
}
