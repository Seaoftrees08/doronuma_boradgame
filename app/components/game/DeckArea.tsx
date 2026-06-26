"use client";

interface Props {
  deckRemaining: number;
  discardCount: number;
}

export default function DeckArea({ deckRemaining, discardCount }: Props) {
  return (
    <div className="flex gap-8 justify-center items-center py-8">
      <div className="relative w-24 h-36 bg-zinc-800 border-2 border-zinc-700 rounded-xl flex items-center justify-center shadow-lg">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-900 rounded-xl blur opacity-20" />
        <div className="relative text-center">
          <div className="text-xs text-zinc-400 font-bold mb-1">山札</div>
          <div className="text-3xl font-black text-white">{deckRemaining}</div>
        </div>
      </div>
      
      <div className="relative w-24 h-36 bg-zinc-900 border-2 border-zinc-800 border-dashed rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="text-xs text-zinc-500 font-bold mb-1">捨て札</div>
          <div className="text-xl font-bold text-zinc-600">{discardCount}</div>
        </div>
      </div>
    </div>
  );
}
