'use client';

import Image from 'next/image';

interface RarityData {
  rank: 'SSR' | 'SR' | 'R' | 'N';
  rankLabel: string;
  percentage: number;
  rareCombinations: Array<{ traitLabels: string[] }>;
}

interface CatchcopyData {
  catchcopy: string;
}

interface SelfImageData {
  imageUrl: string;
}

type ShareCardProps =
  | { type: 'rarity'; data: RarityData; nickname: string }
  | { type: 'catchcopy'; data: CatchcopyData; nickname: string }
  | { type: 'self-image'; data: SelfImageData; nickname: string };

const RANK_EMOJI: Record<string, string> = {
  SSR: '✨',
  SR: '💜',
  R: '💙',
  N: '⬜',
};

export default function ShareCard({ type, data, nickname }: ShareCardProps) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[375px] overflow-hidden rounded-2xl shadow-xl">
      {type === 'rarity' && (
        <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-violet-600 to-fuchsia-700 p-8 text-center text-white">
          <div className="mb-2 text-5xl">{RANK_EMOJI[data.rank]}</div>
          <div className="mb-1 text-6xl font-black">{data.rank}</div>
          <div className="mb-4 text-xl font-semibold opacity-90">{data.rankLabel}</div>
          <div className="mb-6 rounded-2xl bg-white/20 px-6 py-3 backdrop-blur-sm">
            <div className="text-lg font-bold">日本人口の上位 {data.percentage}%</div>
          </div>
          {data.rareCombinations[0] && (
            <div className="text-sm opacity-80">
              {data.rareCombinations[0].traitLabels.join(' × ')}
            </div>
          )}
          <div className="mt-4 text-xs opacity-50">#じぶんクラフト #AI自己分析</div>
          <div className="absolute bottom-3 right-3 text-xs font-semibold text-white/30">
            mecraft.life
          </div>
        </div>
      )}

      {type === 'catchcopy' && (
        <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-center text-white">
          <div className="mb-6 text-2xl font-black leading-snug">
            &ldquo;{data.catchcopy}&rdquo;
          </div>
          <div className="mb-8 text-sm opacity-80">AIが分析した、私だけのコピー</div>
          <div className="text-xs opacity-50">#じぶんクラフト #キャッチコピー</div>
          <div className="absolute bottom-3 right-3 text-xs font-semibold text-white/30">
            mecraft.life
          </div>
        </div>
      )}

      {type === 'self-image' && (
        <div className="relative h-full w-full">
          <Image src={data.imageUrl} alt="自分画像" fill className="object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-6 py-4">
            <div className="text-sm font-bold text-white">{nickname}</div>
            <div className="text-xs text-white/60">#じぶんクラフト</div>
          </div>
        </div>
      )}
    </div>
  );
}
