import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { CardType } from "@doronuma/shared";
import { CARD_IMAGE_PATHS } from "../../lib/cardImages";
import { getCardI18n, getUiTranslation } from "../../lib/i18n";

interface Props {
  cardType: CardType;
  isOpen: boolean;
  onClose: () => void;
}

export default function CardDetailModal({ cardType, isOpen, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;
  if (!mounted) return null;

  const { name, description } = getCardI18n(cardType);
  const ui = getUiTranslation();
  const imagePath = CARD_IMAGE_PATHS[cardType];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl z-10 flex flex-col items-center text-center animate-fadeIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Card Image */}
        <div className="relative w-[180px] h-[252px] bg-zinc-800 border-2 border-zinc-700 rounded-xl overflow-hidden shadow-lg mb-6">
          {imagePath ? (
            <Image
              src={imagePath}
              alt={name}
              fill
              sizes="180px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 italic">
              No Image
            </div>
          )}
        </div>

        {/* Card Name */}
        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
          {name}
        </h3>
        
        {/* Card Type Identifier */}
        <span className="text-xs font-mono text-zinc-500 mb-4 bg-zinc-800 px-2 py-1 rounded">
          {cardType}
        </span>

        {/* Card Description Title */}
        <div className="w-full text-left mb-2 border-b border-zinc-800 pb-1">
          <span className="text-xs font-bold text-zinc-500 tracking-wider uppercase">
            {ui.cardDetail.effectLabel}
          </span>
        </div>

        {/* Card Description */}
        <p className="text-zinc-300 text-sm leading-relaxed mb-6 text-left w-full">
          {description}
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-zinc-855 hover:bg-zinc-750 text-white font-bold rounded-xl transition-colors border border-zinc-700 cursor-pointer"
        >
          {ui.cardDetail.close}
        </button>
      </div>
    </div>,
    document.body
  );
}
