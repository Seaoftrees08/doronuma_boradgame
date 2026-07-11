"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";

export default function Home() {
  const [hostName, setHostName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { user, loading, error: authError } = useAuth();

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim() || !user) return;
    setIsCreating(true);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ hostName }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (_) {}

      if (response.ok && data?.roomId) {
        router.push(`/room/${data.roomId}`);
      } else {
        const errorMsg = data?.error ? ` (${data.error})` : "";
        alert(`部屋の作成に失敗しました${errorMsg}`);
      }
    } catch (error: any) {
      console.error(error);
      alert(`エラーが発生しました: ${error.message || error}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoomId = roomId.trim().toUpperCase();
    if (!cleanRoomId || !playerName.trim() || !user) return;
    setIsCreating(true);
    try {
      const response = await fetch(`/api/rooms/${cleanRoomId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ playerName }),
      });

      let data;
      try {
        data = await response.json();
      } catch (_) {}

      if (response.ok) {
        router.push(`/room/${cleanRoomId}`);
      } else {
        const errorMsg = data?.error ? ` (${data.error})` : "";
        alert(`部屋への参加に失敗しました。合言葉（部屋ID）を確認するか、既にゲームが開始されている可能性があります。${errorMsg}`);
      }
    } catch (error: any) {
      console.error(error);
      alert(`エラーが発生しました: ${error.message || error}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <div className="flex flex-1 items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-4">
      <main className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-red-600 dark:text-red-500 mb-2 tracking-tight">泥沼の妨害</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Doronuma Sabotage</p>
        </div>

        {authError && (
          <div className="p-4 bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 rounded-lg text-sm text-red-600 dark:text-red-400 space-y-1">
            <p className="font-bold text-left">接続エラーが発生しました</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-left">
              PC上のFirebaseエミュレータ（ポート 9099/8080）への接続に失敗している可能性があります。
              PCのファイアウォール設定や、同じWi-Fiに接続されているか確認してください。
            </p>
            <p className="text-xs font-mono bg-white/50 dark:bg-black/20 p-1 rounded overflow-x-auto text-left">
              {authError.message || String(authError)}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* 部屋を作成 */}
          <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-4 bg-zinc-50 dark:bg-zinc-950/50">
            <h2 className="font-bold text-lg">新しく部屋を作る</h2>
            <form onSubmit={handleCreateRoom} className="space-y-3">
              <input
                type="text"
                placeholder="あなたの名前"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md dark:bg-black dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                disabled={!hostName.trim() || isCreating || !user}
                className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-400 text-white font-bold rounded-md transition-colors"
              >
                部屋を作成
              </button>
            </form>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-300 dark:border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">または</span>
            </div>
          </div>

          {/* 部屋に参加 */}
          <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-4">
            <h2 className="font-bold text-lg">合言葉で参加する</h2>
            <form onSubmit={handleJoinRoom} className="space-y-3">
              <input
                type="text"
                placeholder="合言葉 (ルームID)"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                required
                className="w-full px-4 py-2 border rounded-md dark:bg-black dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="text"
                placeholder="あなたの名前"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md dark:bg-black dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                disabled={!roomId.trim() || !playerName.trim() || isCreating || !user}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 disabled:bg-zinc-400 text-white font-bold rounded-md transition-colors"
              >
                部屋に参加
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
