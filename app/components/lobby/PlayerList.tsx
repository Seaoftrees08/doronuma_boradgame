"use client";

import { Player } from "@doronuma/shared";
import ReadyButton from "./ReadyButton";

interface Props {
  players: Record<string, Player>;
  maxPlayers: number;
  currentUserId?: string;
  roomId: string;
}

export default function PlayerList({ players, maxPlayers, currentUserId, roomId }: Props) {
  const playerList = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt);
  const activePlayers = playerList.filter(p => p.status !== "observer");
  const observers = playerList.filter(p => p.status === "observer");

  const slots = Array.from({ length: maxPlayers }).map((_, i) => activePlayers[i] || null);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {slots.map((player, index) => (
          <div key={player?.playerId || `slot-${index}`} 
            className={`flex items-center justify-between p-3 rounded-lg border ${
              player 
                ? player.playerId === currentUserId 
                  ? "border-red-500 bg-red-50 dark:bg-red-950/20" 
                  : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
                : "border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-400"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                player ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400" : "bg-zinc-100 dark:bg-zinc-800"
              }`}>
                {index + 1}
              </div>
              <span className={`font-medium ${!player && "italic"}`}>
                {player ? player.name : "空きスロット"}
                {player && player.playerId === currentUserId && " (あなた)"}
              </span>
            </div>
            
            {player && (
              <div>
                {player.playerId === currentUserId ? (
                  <ReadyButton roomId={roomId} isReady={player.status === "ready"} />
                ) : (
                  <span className={`px-3 py-1 rounded text-sm font-bold ${
                    player.status === "ready" 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}>
                    {player.status === "ready" ? "準備完了" : "準備中"}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {observers.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">見学者 (オブザーバー)</h3>
          <div className="flex flex-wrap gap-2">
            {observers.map(obs => (
              <span key={obs.playerId} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-sm">
                {obs.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
