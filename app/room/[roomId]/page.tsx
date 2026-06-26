"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "../../hooks/useRoom";
import { useAuth } from "../../contexts/AuthContext";
import RoomHeader from "../../components/lobby/RoomHeader";
import PlayerList from "../../components/lobby/PlayerList";
import HostControls from "../../components/lobby/HostControls";

export default function LobbyPage({ params }: { params: { roomId: string } }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { room, loading: roomLoading, error } = useRoom(params.roomId);

  useEffect(() => {
    if (!roomLoading && room) {
      if (room.status === "playing") {
        router.push(`/room/${params.roomId}/play`);
      }
    }
  }, [room, roomLoading, router, params.roomId]);

  if (authLoading || roomLoading) {
    return <div className="flex flex-1 items-center justify-center">Loading...</div>;
  }

  if (error || !room) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center space-y-4">
        <p className="text-xl">部屋が見つかりません</p>
        <button onClick={() => router.push("/")} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 rounded">
          トップに戻る
        </button>
      </div>
    );
  }

  const isHost = user?.uid === room.hostId;

  return (
    <div className="flex flex-col flex-1 items-center p-4 py-8">
      <main className="w-full max-w-2xl space-y-6">
        <RoomHeader roomId={params.roomId} />
        
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold mb-4">参加プレイヤー ({Object.keys(room.players).length}/{room.settings.maxPlayers})</h2>
          <PlayerList players={room.players} maxPlayers={room.settings.maxPlayers} currentUserId={user?.uid} roomId={params.roomId} />
        </div>

        {isHost && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4">ホストメニュー</h2>
            <HostControls roomId={params.roomId} room={room} />
          </div>
        )}
      </main>
    </div>
  );
}
