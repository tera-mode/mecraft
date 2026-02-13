'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTraits } from '@/contexts/TraitsContext';
import { TRAIT_CATEGORY_LABELS, TRAIT_CATEGORY_COLORS } from '@/types';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function TraitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { traits, deleteTrait } = useTraits();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const traitId = params.traitId as string;
  const trait = traits.find((t) => t.id === traitId);

  usePageHeader({
    title: '特徴詳細',
    showBackButton: true,
    onBack: () => router.push('/mypage'),
    rightAction: trait ? (
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="rounded-full p-2 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={18} className="text-stone-400 hover:text-red-500" />
      </button>
    ) : undefined,
  });

  if (!trait) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="glass-card mx-auto max-w-md p-8">
          <p className="text-stone-500">特徴が見つかりませんでした</p>
          <button
            onClick={() => router.push('/mypage')}
            className="mt-4 text-emerald-600 underline"
          >
            じぶんページに戻る
          </button>
        </div>
      </div>
    );
  }

  const categoryLabel = TRAIT_CATEGORY_LABELS[trait.category];
  const categoryColors = TRAIT_CATEGORY_COLORS[trait.category];

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTrait(trait.label);
      router.push('/mypage');
    } catch {
      alert('削除に失敗しました。');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          {/* Main card */}
          <div className={`rounded-2xl border-2 p-6 mb-6 ${categoryColors}`}>
            <div className="flex items-center gap-3 mb-4">
              {trait.icon && <span className="text-4xl">{trait.icon}</span>}
              <div>
                <h1 className="text-2xl font-bold">{trait.label}</h1>
                <span className="text-sm opacity-75">{categoryLabel}</span>
              </div>
            </div>

            {trait.intensityLabel && (
              <div className="mb-4">
                <span className="rounded-full bg-white/50 px-3 py-1 text-sm font-medium">
                  {trait.intensityLabel}
                </span>
              </div>
            )}

            {trait.description && (
              <p className="mb-4 text-sm">{trait.description}</p>
            )}

            {trait.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {trait.keywords.map((keyword, i) => (
                  <span key={i} className="rounded-full bg-white/40 px-3 py-1 text-xs">
                    #{keyword}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Meta info */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">確信度</span>
              <span className="font-medium text-stone-800">{Math.round(trait.confidence * 100)}%</span>
            </div>
            {trait.extractedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">発見日</span>
                <span className="font-medium text-stone-800">
                  {new Date(trait.extractedAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
            )}
            {trait.updatedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">更新日</span>
                <span className="font-medium text-stone-800">
                  {new Date(trait.updatedAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="glass-modal w-full max-w-md rounded-3xl p-6">
            <h2 className="mb-4 text-center text-xl font-bold text-stone-800">
              「{trait.label}」を削除しますか？
            </h2>
            <p className="mb-6 text-center text-xs text-stone-500">この操作は取り消せません。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-stone-200 bg-white/80 px-4 py-3 font-semibold text-stone-700 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
