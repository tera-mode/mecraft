'use client';

import { UserTrait, TRAIT_CATEGORY_LABELS, TraitCategory } from '@/types';
import TraitCard from './TraitCard';

interface TraitCardListProps {
  traits: UserTrait[];
  newTraitIds?: string[];
  updatedTraitIds?: string[];
  isLoading?: boolean;
}

export default function TraitCardList({
  traits,
  newTraitIds = [],
  updatedTraitIds = [],
  isLoading = false,
}: TraitCardListProps) {
  // カテゴリごとにグループ化
  const groupedTraits = traits.reduce(
    (acc, trait) => {
      if (!acc[trait.category]) {
        acc[trait.category] = [];
      }
      acc[trait.category].push(trait);
      return acc;
    },
    {} as Record<TraitCategory, UserTrait[]>
  );

  const categories = Object.keys(groupedTraits) as TraitCategory[];

  return (
    <div className="glass flex h-full w-80 flex-col border-l border-orange-100">
      {/* ヘッダー */}
      <div className="glass-header px-4 py-3">
        <h2 className="font-bold text-stone-800">あなたの特徴</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          インタビューから抽出された特徴 ({traits.length}件)
        </p>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {traits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-stone-400">
            {isLoading ? (
              <>
                <div className="w-8 h-8 border-2 spinner-warm rounded-full animate-spin mb-2" />
                <p className="text-sm">特徴を分析中...</p>
              </>
            ) : (
              <>
                <span className="text-3xl mb-2">💭</span>
                <p className="text-sm text-center">
                  インタビューを進めると
                  <br />
                  あなたの特徴が表示されます
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2 px-1">
                  {TRAIT_CATEGORY_LABELS[category]}
                </h3>
                <div className="space-y-2">
                  {groupedTraits[category].map((trait) => (
                    <TraitCard
                      key={trait.id}
                      trait={trait}
                      size="compact"
                      isNew={newTraitIds.includes(trait.id)}
                      isUpdated={updatedTraitIds.includes(trait.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* フッター（ローディング中のインジケーター） */}
      {isLoading && traits.length > 0 && (
        <div className="glass-header px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-orange-600">
            <div className="w-3 h-3 border spinner-warm rounded-full animate-spin" />
            <span>新しい特徴を分析中...</span>
          </div>
        </div>
      )}
    </div>
  );
}
