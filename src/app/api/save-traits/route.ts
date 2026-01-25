import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import {
  UserTrait,
  TraitsSummary,
  TraitCategory,
  SaveTraitsRequest,
  SaveTraitsResponse,
} from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: SaveTraitsRequest = await request.json();
    const { interviewId, traits } = body;

    if (!interviewId) {
      return NextResponse.json<SaveTraitsResponse>(
        { success: false, error: 'Interview ID is required' },
        { status: 400 }
      );
    }

    if (!traits || !Array.isArray(traits)) {
      return NextResponse.json<SaveTraitsResponse>(
        { success: false, error: 'Traits array is required' },
        { status: 400 }
      );
    }

    // サマリーを生成
    const summary = generateTraitsSummary(traits);

    // Firestoreに保存
    const interviewRef = adminDb.collection('interviews').doc(interviewId);

    await interviewRef.update({
      traits: traits.map((trait) => ({
        ...trait,
        extractedAt:
          trait.extractedAt instanceof Date
            ? trait.extractedAt
            : new Date(trait.extractedAt),
      })),
      traitsSummary: summary,
      updatedAt: new Date(),
    });

    return NextResponse.json<SaveTraitsResponse>({ success: true });
  } catch (error) {
    console.error('Error saving traits:', error);
    return NextResponse.json<SaveTraitsResponse>(
      { success: false, error: 'Failed to save traits' },
      { status: 500 }
    );
  }
}

function generateTraitsSummary(traits: UserTrait[]): TraitsSummary {
  // カテゴリごとの件数をカウント
  const categoryBreakdown: Partial<Record<TraitCategory, number>> = {};

  traits.forEach((trait) => {
    categoryBreakdown[trait.category] =
      (categoryBreakdown[trait.category] || 0) + 1;
  });

  // 確信度でソートしてトップ3を取得
  const sortedTraits = [...traits].sort((a, b) => {
    return b.confidence - a.confidence;
  });

  const topTraits = sortedTraits.slice(0, 3).map((t) => t.label);

  return {
    totalCount: traits.length,
    categoryBreakdown,
    topTraits,
  };
}
