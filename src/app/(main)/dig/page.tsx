'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pickaxe, MessageSquare, ArrowRight } from 'lucide-react';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { MenuCard } from '@/components/ui';

export default function DigPage() {
  const router = useRouter();
  usePageHeader({ title: 'ほる' });

  const [isSwipeUsedToday, setIsSwipeUsedToday] = useState(false);

  useEffect(() => {
    const lastDate = localStorage.getItem('lastSwipeDate');
    if (lastDate === new Date().toISOString().slice(0, 10)) {
      setIsSwipeUsedToday(true);
    }
  }, []);

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-lg">
        <p className="mb-6 text-center text-sm text-stone-500">2つの方法であなたの特徴を発見</p>

        <div className="space-y-4">
          <MenuCard
            title="1分じぶん掘り"
            description="スワイプ診断でじぶん発見"
            icon={Pickaxe}
            iconColor="text-amber-600"
            bgGradient="from-amber-200 to-yellow-200"
            buttonGradient="from-amber-500 to-yellow-500"
            href="/dig/swipe"
            disabled={isSwipeUsedToday}
            disabledMessage="本日の利用回数に達しました。次回は明日ご利用できます"
          />

          <MenuCard
            title="AIインタビュー"
            description="じっくり深掘り"
            icon={MessageSquare}
            iconColor="text-emerald-600"
            bgGradient="from-emerald-200 to-teal-200"
            buttonGradient="from-emerald-500 to-teal-500"
            href="/dig/interview/select-mode"
          />

          {/* 次のステップへのナビゲーション */}
          <button
            onClick={() => router.push('/mypage')}
            className="mt-2 flex w-full items-center justify-between rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3 transition-all hover:bg-emerald-50"
          >
            <span className="text-sm text-emerald-700">掘り出した特徴を見にいく</span>
            <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
              じぶん <ArrowRight size={14} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
