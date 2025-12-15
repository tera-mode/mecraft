import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Firestoreからユーザーのインタビューを取得
    const interviewsRef = adminDb.collection('interviews');
    const snapshot = await interviewsRef
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const interviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }));

    return NextResponse.json({ interviews });
  } catch (error) {
    console.error('Error getting interviews:', error);
    return NextResponse.json(
      { error: 'Failed to get interviews' },
      { status: 500 }
    );
  }
}
