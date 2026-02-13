'use client';

import { Users, Sparkles } from 'lucide-react';
import { usePageHeader } from '@/contexts/PageHeaderContext';

export default function EveryonePage() {
  usePageHeader({ title: 'みんな' });

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="gradient-orb gradient-orb-emerald absolute -right-40 top-20 h-96 w-96" />
      <div className="gradient-orb gradient-orb-amber absolute -left-40 bottom-20 h-80 w-80" />

      <div className="relative z-10 px-4 py-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-200 to-pink-200">
              <Users size={40} className="text-rose-600" />
            </div>
          </div>
          <p className="mb-8 text-stone-500">みんなの特徴を見て刺激をもらおう</p>

          <div className="glass-card mx-auto max-w-md p-8">
            <Sparkles size={32} className="mx-auto mb-4 text-rose-400" />
            <h3 className="mb-2 text-lg font-semibold text-stone-800">Coming Soon</h3>
            <p className="text-stone-500">この機能は近日公開予定です</p>
            <p className="mt-2 text-sm text-stone-400">
              他のユーザーの特徴やアウトプットを閲覧・共有できるようになります
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
