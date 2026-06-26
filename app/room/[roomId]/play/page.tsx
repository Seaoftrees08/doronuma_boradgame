"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "../../../hooks/useRoom";
import { GameProvider } from "../../../contexts/GameContext";
import GameBoard from "../../../components/game/GameBoard";

export default function PlayPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { room, loading } = useRoom(roomId);

  useEffect(() => {
    if (!loading && room) {
      if (room.status === "lobby") {
        router.push(`/room/${roomId}`);
      }
    }
  }, [room, loading, router, roomId]);

  if (loading || !room) {
    return <div className="flex flex-1 items-center justify-center">Loading game...</div>;
  }

  return (
    <GameProvider roomId={roomId}>
      <GameBoard />
    </GameProvider>
  );
}
