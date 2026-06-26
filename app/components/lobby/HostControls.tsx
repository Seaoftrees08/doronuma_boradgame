"use client";

import { useState } from "react";
import { useGameActions } from "../../hooks/useGameActions";
import GameSettings from "./GameSettings";
import { GameRoom } from "@doronuma/shared";

interface Props {
  roomId: string;
  room: GameRoom;
}

export default function HostControls({ roomId, room }: Props) {
  const actions = useGameActions(roomId);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const activePlayers = Object.values(room.players).filter(p => p.status !== "observer");
  const allReady = activePlayers.length > 0 && activePlayers.every(p => p.status === "ready");
  
  // Need at least MIN_PLAYERS to start
  const canStart = allReady && activePlayers.length >= 3;

  const handleStart = async () => {
    if (!canStart || loading) return;
    setLoading(true);
    try {
      await actions.startGame();
    } catch (error) {
      console.error(error);
      alert("ゲーム開始に失敗しました");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-bold rounded-lg transition-colors"
        >
          {showSettings ? "設定を閉じる" : "ルール設定を開く"}
        </button>
        <button
          onClick={handleStart}
          disabled={!canStart || loading}
          className={`flex-1 py-3 px-4 font-bold rounded-lg transition-colors text-white ${
            !canStart 
              ? "bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed" 
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading ? "開始中..." : "ゲーム開始"}
        </button>
      </div>
      
      {!canStart && (
        <p className="text-sm text-center text-zinc-500">
          {activePlayers.length < 3 
            ? "ゲームを開始するには3人以上必要です" 
            : "全員が「準備完了」になるまで開始できません"}
        </p>
      )}

      {showSettings && (
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <GameSettings roomId={roomId} settings={room.settings} />
        </div>
      )}
    </div>
  );
}
