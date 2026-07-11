"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "../../../hooks/useRoom";
import { GameProvider } from "../../../contexts/GameContext";
import GameBoard from "../../../components/game/GameBoard";

export default function PlayPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { room, loading, error } = useRoom(roomId);

  useEffect(() => {
    if (!loading) {
      if (error || !room) {
        router.replace("/");
      } else if (room.status === "lobby") {
        router.push(`/room/${roomId}`);
      }
    }
  }, [room, loading, error, router, roomId]);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center">Loading game...</div>;
  }

  if (error || !room) {
    return <div className="flex flex-1 items-center justify-center">部屋が存在しないため、ロビーに戻ります...</div>;
  }

  return (
    <GameProvider roomId={roomId}>
      <GameBoard />
    </GameProvider>
  );
}
