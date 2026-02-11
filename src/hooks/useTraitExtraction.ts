'use client';

import { useState, useCallback, useRef } from 'react';
import { UserTrait, ExtractTraitsResponse } from '@/types';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

interface UseTraitExtractionOptions {
  onTraitExtracted?: (newTraits: UserTrait[], updatedTraits: UserTrait[]) => void;
  onTraitsChanged?: (allTraits: UserTrait[]) => void;
}

interface UseTraitExtractionReturn {
  traits: UserTrait[];
  newTraitIds: string[];
  updatedTraitIds: string[];
  isExtracting: boolean;
  extractTraits: (
    userMessage: string,
    assistantMessage: string,
    messageIndex: number,
    recentMessages?: { role: string; content: string }[]
  ) => Promise<void>;
  clearHighlights: () => void;
  setTraits: (traits: UserTrait[]) => void;
}

export function useTraitExtraction(
  options: UseTraitExtractionOptions = {}
): UseTraitExtractionReturn {
  const { onTraitExtracted, onTraitsChanged } = options;
  const [traits, setTraits] = useState<UserTrait[]>([]);
  const [newTraitIds, setNewTraitIds] = useState<string[]>([]);
  const [updatedTraitIds, setUpdatedTraitIds] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const extractionQueue = useRef<Promise<void>>(Promise.resolve());

  // コールバックをrefで保持してクロージャの問題を避ける
  const onTraitsChangedRef = useRef(onTraitsChanged);
  onTraitsChangedRef.current = onTraitsChanged;
  const onTraitExtractedRef = useRef(onTraitExtracted);
  onTraitExtractedRef.current = onTraitExtracted;

  const extractTraits = useCallback(
    async (
      userMessage: string,
      assistantMessage: string,
      messageIndex: number,
      recentMessages?: { role: string; content: string }[]
    ) => {
      // キューに追加して順番に処理
      extractionQueue.current = extractionQueue.current.then(async () => {
        setIsExtracting(true);

        try {
          // 最新のtraitsを取得（クロージャの問題を避けるため）
          const currentTraits = await new Promise<UserTrait[]>((resolve) => {
            setTraits((prev) => {
              resolve(prev);
              return prev;
            });
          });

          const response = await authenticatedFetch('/api/extract-traits', {
            method: 'POST',
            body: JSON.stringify({
              userMessage,
              assistantMessage,
              messageIndex,
              existingTraits: currentTraits,
              recentMessages: recentMessages || [],
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to extract traits');
          }

          const data: ExtractTraitsResponse = await response.json();

          // 新規タグを処理
          const extractedNewTraits = (data.newTraits || []).map((trait) => ({
            ...trait,
            extractedAt: new Date(trait.extractedAt),
          }));

          // 更新タグを処理
          const extractedUpdatedTraits = (data.updatedTraits || []).map((trait) => ({
            ...trait,
            extractedAt: new Date(trait.extractedAt),
            updatedAt: trait.updatedAt ? new Date(trait.updatedAt) : undefined,
          }));

          if (extractedNewTraits.length > 0 || extractedUpdatedTraits.length > 0) {
            // 新しいリストを先に計算
            let updatedList = currentTraits.map((existing) => {
              const updated = extractedUpdatedTraits.find((u) => u.id === existing.id);
              return updated || existing;
            });
            updatedList = [...updatedList, ...extractedNewTraits];

            setTraits(updatedList);

            // ハイライト用のIDを設定
            setNewTraitIds(extractedNewTraits.map((t) => t.id));
            setUpdatedTraitIds(extractedUpdatedTraits.map((t) => t.id));

            // 3秒後にハイライトを解除
            setTimeout(() => {
              setNewTraitIds([]);
              setUpdatedTraitIds([]);
            }, 3000);

            // 全特徴が変わったことを通知（保存用）
            onTraitsChangedRef.current?.(updatedList);
            onTraitExtractedRef.current?.(extractedNewTraits, extractedUpdatedTraits);
          }
        } catch (error) {
          console.error('Error extracting traits:', error);
        } finally {
          setIsExtracting(false);
        }
      });
    },
    []
  );

  const clearHighlights = useCallback(() => {
    setNewTraitIds([]);
    setUpdatedTraitIds([]);
  }, []);

  return {
    traits,
    newTraitIds,
    updatedTraitIds,
    isExtracting,
    extractTraits,
    clearHighlights,
    setTraits,
  };
}
