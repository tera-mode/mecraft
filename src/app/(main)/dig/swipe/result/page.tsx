'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTraits } from '@/contexts/TraitsContext';
import { UserTrait } from '@/types';
import { TraitCard } from '@/components/interview';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';
import { Pickaxe, User } from 'lucide-react';

export default function SwipeResultPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshTraits } = useTraits();
  const [resultTraits, setResultTraits] = useState<UserTrait[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  usePageHeader({ title: '診断結果' });

  useEffect(() => {
    const stored = sessionStorage.getItem('swipe-result');
    if (!stored) {
      router.push('/dig/swipe');
      return;
    }
    const traits = JSON.parse(stored) as UserTrait[];
    setResultTraits(traits);

    // Auto-save traits to Firestore
    if (traits.length > 0 && user) {
      saveTraits(traits);
    }
  }, [user]);

  const saveTraits = async (traits: UserTrait[]) => {
    if (isSaving || saved || !user) return;
    setIsSaving(true);
    try {
      // 1. Create an interview document first via save-interview
      const saveResponse = await authenticatedFetch('/api/save-interview', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.uid,
          interviewData: { fixed: {}, dynamic: {} },
          messages: [{ role: 'assistant', content: 'スワイプ診断', timestamp: new Date() }],
          interviewerId: 'female_01',
          mode: 'basic',
          sessionId: `swipe-${Date.now()}`,
          status: 'completed',
        }),
      });

      if (!saveResponse.ok) throw new Error('Failed to create interview');
      const { interviewId } = await saveResponse.json();

      // 2. Save traits to the created interview document
      const traitResponse = await fetch('/api/save-traits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId, traits }),
      });

      if (traitResponse.ok) {
        setSaved(true);
        await refreshTraits();
      }
    } catch (error) {
      console.error('Error saving swipe traits:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-4 py-6">
        <div className="mx-auto max-w-md">
          <div className="mb-6 text-center">
            <div className="mb-3 text-4xl">🎉</div>
            <h2 className="text-2xl font-bold text-stone-800">あなたの特徴が見つかりました！</h2>
            <p className="mt-2 text-sm text-stone-500">スワイプ診断から{resultTraits.length}個の特徴を発見</p>
          </div>

          {/* Trait cards with animation */}
          <div className="space-y-4 mb-8">
            {resultTraits.map((trait, index) => (
              <div
                key={trait.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <TraitCard trait={trait} size="full" isNew />
              </div>
            ))}
          </div>

          {/* Save status */}
          {isSaving && (
            <p className="mb-4 text-center text-sm text-stone-500">特徴を保存中...</p>
          )}
          {saved && (
            <p className="mb-4 text-center text-sm text-emerald-600">特徴を保存しました</p>
          )}

          {/* CTAs */}
          <div className="space-y-3">
            <button
              onClick={() => {
                sessionStorage.removeItem('swipe-result');
                router.push('/dig');
              }}
              className="btn-gradient-secondary w-full rounded-xl py-3 font-semibold text-white flex items-center justify-center gap-2"
            >
              <Pickaxe size={18} />
              もっとほる
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem('swipe-result');
                router.push('/mypage');
              }}
              className="w-full rounded-xl border border-emerald-200 bg-white/80 py-3 font-semibold text-stone-700 flex items-center justify-center gap-2 hover:bg-emerald-50"
            >
              <User size={18} />
              じぶんを見る
            </button>
          </div>
        </div>
      </div>
  );
}
