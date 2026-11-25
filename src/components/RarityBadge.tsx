import React from 'react';
import { Sparkles } from 'lucide-react';
import { getRarityMeta } from '../constants/rarity';

interface RarityBadgeProps {
  rarity: string;
  size?: 'sm' | 'md';
  showRate?: boolean;
}

export const RarityBadge: React.FC<RarityBadgeProps> = ({
  rarity,
  size = 'sm',
  showRate = false,
}) => {
  const meta = getRarityMeta(rarity);
  const isHighTier = meta.tier === 'HUYỀN THOẠI' || meta.tier === 'CỔ VẬT';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold tracking-wide uppercase whitespace-nowrap ${
        meta.bgClass
      } ${meta.textClass} ${meta.borderClass} ${
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      }`}
      style={isHighTier ? { boxShadow: `0 0 12px ${meta.glowColor}` } : undefined}
    >
      {isHighTier ? (
        <Sparkles className="w-3 h-3 shrink-0" />
      ) : (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: meta.color }}
        />
      )}
      <span>{meta.tier}</span>
      {showRate && <span className="opacity-75 font-medium">({meta.dropRate}%)</span>}
    </span>
  );
};
