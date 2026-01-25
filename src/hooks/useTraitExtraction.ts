'use client';

import { useState, useCallback, useRef } from 'react';
import { UserTrait, ExtractTraitsResponse } from '@/types';

interface UseTraitExtractionOptions {
  onTraitExtracted?: (newTraits: UserTrait[], updatedTraits: UserTrait[]) => void;
}

interface UseTraitExtractionReturn {
  traits: UserTrait[];
  newTraitIds: string[];
  updatedTraitIds: string[];
  isExtracting: boolean;
  extractTraits: (
    userMessage: string,
    assistantMessage: string,
    messageIndex: number
  ) => Promise<void>;
  clearHighlights: () => void;
  setTraits: (traits: UserTrait[]) => void;
}

export function useTraitExtraction(
  options: UseTraitExtractionOptions = {}
): UseTraitExtractionReturn {
  const { onTraitExtracted } = options;
  const [traits, setTraits] = useState<UserTrait[]>([]);
  const [newTraitIds, setNewTraitIds] = useState<string[]>([]);
  const [updatedTraitIds, setUpdatedTraitIds] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const extractionQueue = useRef<Promise<void>>(Promise.resolve());

  const extractTraits = useCallback(
    async (
      userMessage: string,
      assistantMessage: string,
      messageIndex: number
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

          const response = await fetch('/api/extract-traits', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userMessage,
              assistantMessage,
              messageIndex,
              existingTraits: currentTraits,
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
            setTraits((prevTraits) => {
              // 更新されたタグを置き換え
              let updatedList = prevTraits.map((existing) => {
                const updated = extractedUpdatedTraits.find((u) => u.id === existing.id);
                return updated || existing;
              });

              // 新規タグを追加
              updatedList = [...updatedList, ...extractedNewTraits];

              return updatedList;
            });

            // ハイライト用のIDを設定
            setNewTraitIds(extractedNewTraits.map((t) => t.id));
            setUpdatedTraitIds(extractedUpdatedTraits.map((t) => t.id));

            // 3秒後にハイライトを解除
            setTimeout(() => {
              setNewTraitIds([]);
              setUpdatedTraitIds([]);
            }, 3000);

            if (onTraitExtracted) {
              onTraitExtracted(extractedNewTraits, extractedUpdatedTraits);
            }
          }
        } catch (error) {
          console.error('Error extracting traits:', error);
        } finally {
          setIsExtracting(false);
        }
      });
    },
    [onTraitExtracted]
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
