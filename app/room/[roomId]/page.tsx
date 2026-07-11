"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "../../hooks/useRoom";
import { useAuth } from "../../contexts/AuthContext";
import RoomHeader from "../../components/lobby/RoomHeader";
import PlayerList from "../../components/lobby/PlayerList";
import HostControls from "../../components/lobby/HostControls";

export default function LobbyPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { room, loading: roomLoading, error } = useRoom(roomId);

  useEffect(() => {
    if (!roomLoading) {
      if (error || !room) {
        router.replace("/");
      } else if (room.status === "playing") {
        router.push(`/room/${roomId}/play`);
      }
    }
  }, [room, roomLoading, error, router, roomId]);

  if (authLoading || roomLoading) {
    return <div className="flex flex-1 items-center justify-center">Loading...</div>;
  }

  if (error || !room) {
    return <div className="flex flex-1 items-center justify-center">部屋が存在しないため、ロビーに戻ります...</div>;
  }

  const isHost = user?.uid === room.hostId;

  return (
    <div className="flex flex-col flex-1 items-center p-4 py-8">
      <main className="w-full max-w-2xl space-y-6">
        <RoomHeader roomId={roomId} />
        
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold mb-4">参加プレイヤー ({Object.keys(room.players).length}/{room.settings.maxPlayers})</h2>
          <PlayerList players={room.players} maxPlayers={room.settings.maxPlayers} currentUserId={user?.uid} roomId={roomId} />
        </div>

        {isHost && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4">ホストメニュー</h2>
            <HostControls roomId={roomId} room={room} />
          </div>
        )}
      </main>
    </div>
  );
}
