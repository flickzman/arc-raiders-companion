import React from 'react';
import { type GameItem } from '../data/schemas';
import { getLocalized } from '../data/db';

export interface ItemCardProps {
  item: GameItem;
  statusText: string;
  statusVariant: 'keep' | 'salvage' | 'bring' | 'target';
  language: 'es' | 'en';
  onClick?: () => void;
}

/**
 * Tactical Item Card
 * Strictly constrained to under 6 DOM elements for ultra-lean memory & virtualization
 * Structure: 1 root div + 1 info div + 3 spans = exactly 5 DOM elements (< 6)
 */
export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  statusText,
  statusVariant,
  language,
  onClick,
}) => {
  const badgeStyles = {
    keep: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    salvage: 'bg-zinc-800 text-zinc-400 border-zinc-700/60',
    bring: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    target: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs hover:border-zinc-700 hover:bg-zinc-850 transition-colors select-none cursor-pointer"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-semibold text-zinc-200 truncate">
          {getLocalized(item.name, language)}
        </span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
          {item.category}
        </span>
      </div>
      <span
        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${badgeStyles[statusVariant]}`}
      >
        {statusText}
      </span>
    </div>
  );
};
