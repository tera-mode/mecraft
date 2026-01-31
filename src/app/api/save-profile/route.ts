import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { UserProfile, UserInterviewer } from '@/types';
import { verifyAuth } from '@/lib/auth/verifyAuth';

// 管理者メールアドレス（サーバーサイドのみ）
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];

export async function POST(request: NextRequest) {
  try {
    // 認証検証
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, profile, interviewer } = await request.json();

    // リクエストのuserIdと認証されたuidが一致するか検証
    if (userId !== authResult.uid) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const now = new Date();

    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    if (profile) {
      updateData.profile = profile as UserProfile;
    }

    if (interviewer) {
      updateData.interviewer = interviewer as UserInterviewer;
    }

    if (userDoc.exists) {
      await userRef.update(updateData);
    } else {
      await userRef.set({
        uid: userId,
        ...updateData,
        interviews: [],
        createdAt: now,
        lastLoginAt: now,
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 認証検証
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // リクエストのuserIdと認証されたuidが一致するか検証
    if (userId !== authResult.uid) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    // 管理者判定（サーバーサイドで安全に判定）
    const userEmail = authResult.email || '';
    const isAdmin = ADMIN_EMAILS.includes(userEmail);

    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({
        success: true,
        profile: null,
        interviewer: null,
        isAdmin,
      });
    }

    const data = userDoc.data();

    return NextResponse.json({
      success: true,
      profile: data?.profile || null,
      interviewer: data?.interviewer || null,
      isAdmin,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
