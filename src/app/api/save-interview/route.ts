import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import {
  FixedUserData,
  InterviewSession,
  ChatMessage,
  InterviewerId,
  InterviewData,
} from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { userId, interviewData, messages, interviewerId, sessionId } =
      await request.json();

    // userIdはオプショナル（ゲストユーザーの場合はundefined）
    if (!interviewData || !messages || !interviewerId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // インタビューセッションデータを作成
    const interviewSession: Omit<InterviewSession, 'id'> = {
      userId,
      interviewerId: interviewerId as InterviewerId,
      messages: messages.map((msg: ChatMessage) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
      data: {
        fixed: interviewData.fixed as FixedUserData, // 固定情報
        dynamic: interviewData.dynamic || {}, // 深掘り情報
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Firestoreにインタビューセッションを保存
    const interviewRef = await adminDb
      .collection('interviews')
      .add(interviewSession);

    // ログインユーザーの場合のみユーザードキュメントを更新または作成
    if (userId) {
      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        // 既存ユーザー：最終ログイン日時を更新
        await userRef.update({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // 新規ユーザー：ドキュメントを作成
        await userRef.set({
          uid: userId,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      interviewId: interviewRef.id,
    });
  } catch (error) {
    console.error('Error saving interview:', error);
    return NextResponse.json(
      { error: 'Failed to save interview' },
      { status: 500 }
    );
  }
}
