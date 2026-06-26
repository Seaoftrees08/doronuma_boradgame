"use client";

import { useState } from "react";

export default function RoomHeader({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="bg-red-600 text-white rounded-xl shadow-sm p-6 flex flex-col items-center sm:flex-row sm:justify-between">
      <div>
        <h1 className="text-2xl font-black mb-1">合言葉 (ルームID)</h1>
        <p className="text-red-200 text-sm">この合言葉を友達に教えて参加してもらおう</p>
      </div>
      <div className="mt-4 sm:mt-0 flex items-center bg-black/20 rounded-lg p-2">
        <span className="text-3xl font-mono tracking-widest px-4 font-bold">{roomId}</span>
        <button 
          onClick={handleCopy}
          className="ml-2 p-2 bg-white/20 hover:bg-white/30 rounded transition-colors text-sm font-bold"
        >
          {copied ? "コピー完了!" : "コピー"}
        </button>
      </div>
    </div>
  );
}
