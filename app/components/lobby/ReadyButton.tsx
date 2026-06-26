"use client";

import { useGameActions } from "../../hooks/useGameActions";
import { useState } from "react";

interface Props {
  roomId: string;
  isReady: boolean;
  disabled?: boolean;
}

export default function ReadyButton({ roomId, isReady, disabled }: Props) {
  const actions = useGameActions(roomId);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      await actions.toggleReady();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || loading}
      className={`px-4 py-2 rounded font-bold text-white transition-colors ${
        disabled ? "bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed" :
        isReady ? "bg-green-600 hover:bg-green-700" : "bg-zinc-500 hover:bg-zinc-600"
      }`}
    >
      {loading ? "..." : isReady ? "準備完了" : "準備する"}
    </button>
  );
}
