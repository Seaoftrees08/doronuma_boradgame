"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "../../../hooks/useRoom";
import { GameProvider } from "../../../contexts/GameContext";
import GameBoard from "../../../components/game/GameBoard";

export default function PlayPage({ params }: { params: { roomId: string } }) {
  const router = useRouter();
  const { room, loading } = useRoom(params.roomId);

  useEffect(() => {
    if (!loading && room) {
      if (room.status === "lobby") {
        router.push(`/room/${params.roomId}`);
      }
    }
  }, [room, loading, router, params.roomId]);

  if (loading || !room) {
    return <div className="flex flex-1 items-center justify-center">Loading game...</div>;
  }

  return (
    <GameProvider roomId={params.roomId}>
      <GameBoard />
    </GameProvider>
  );
}
