'use client';

import { UserTrait, TRAIT_CATEGORY_COLORS } from '@/types';
import IntensityLabel from './IntensityLabel';

interface TraitCardCollapsibleProps {
  traits: UserTrait[];
  newTraitIds?: string[];
  updatedTraitIds?: string[];
  isLoading?: boolean;
}

export default function TraitCardCollapsible({
  traits,
  newTraitIds = [],
  updatedTraitIds = [],
  isLoading = false,
}: TraitCardCollapsibleProps) {
  return (
    <div className="glass border-b border-orange-100">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-orange-100/50">
        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-800 text-sm">あなたの特徴</span>
          {traits.length > 0 && (
            <span className="rounded-full bg-gradient-to-r from-orange-100 to-amber-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              {traits.length}
            </span>
          )}
          {isLoading && (
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <div className="w-3 h-3 border-2 spinner-warm rounded-full animate-spin" />
              <span>分析中</span>
            </div>
          )}
        </div>
      </div>

      {/* コンテンツ（横並びタグ形式） */}
      <div className="max-h-32 overflow-y-auto px-3 py-2">
        {traits.length === 0 ? (
          <div className="flex items-center justify-center py-4 text-stone-400">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 spinner-warm rounded-full animate-spin" />
                <span className="text-sm">特徴を分析中...</span>
              </div>
            ) : (
              <p className="text-sm text-center">
                💭 インタビューを進めると特徴が表示されます
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {traits.map((trait) => {
              const isNew = newTraitIds.includes(trait.id);
              const isUpdated = updatedTraitIds.includes(trait.id);
              const categoryColors = TRAIT_CATEGORY_COLORS[trait.category];

              const highlightClass = isNew
                ? 'ring-2 ring-orange-400 ring-opacity-60 animate-pulse'
                : isUpdated
                ? 'ring-2 ring-amber-400 ring-opacity-60'
                : '';

              return (
                <div
                  key={trait.id}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm backdrop-blur-sm ${categoryColors} ${highlightClass}`}
                >
                  {trait.icon && <span className="text-base">{trait.icon}</span>}
                  <span className="font-medium">{trait.label}</span>
                  <IntensityLabel intensityLabel={trait.intensityLabel} size="sm" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
