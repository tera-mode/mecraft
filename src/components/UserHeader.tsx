'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface UserHeaderProps {
  showHomeButton?: boolean;
  userNickname?: string; // インタビュー中のニックネーム（オプション）
  showInterviewStatus?: boolean; // インタビュー中ステータスを表示するか
}

export default function UserHeader({
  showHomeButton = true,
  userNickname,
  showInterviewStatus = false,
}: UserHeaderProps) {
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const handleMyPage = () => {
    router.push('/mypage');
  };

  if (!user) {
    return null;
  }

  // 表示する名前を決定
  // 優先順位: インタビュー中のニックネーム > プロフィールのニックネーム > メールアドレス
  const displayName = userNickname || userProfile?.nickname;
  const isGuest = user.isAnonymous;

  return (
    <div className="glass-header px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        {/* ユーザー情報 */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-amber-200 text-lg shadow-sm">
            {displayName ? '😊' : isGuest ? '👤' : '👨‍💼'}
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">
              {displayName
                ? `${displayName}さん`
                : isGuest
                  ? 'ゲストユーザー'
                  : user.email}
            </p>
            {!displayName && isGuest && (
              <p className="text-xs text-stone-500">一時的なセッション</p>
            )}
            {showInterviewStatus && displayName && (
              <p className="text-xs text-orange-600">インタビュー中</p>
            )}
          </div>
        </div>

        {/* ボタン群 */}
        <div className="flex items-center gap-2">
          {showHomeButton && (
            <button
              onClick={() => router.push('/dig')}
              className="rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-semibold text-stone-700 backdrop-blur-sm transition-all hover:bg-orange-50 hover:border-orange-300"
            >
              HOME
            </button>
          )}
          <button
            onClick={handleMyPage}
            className="btn-gradient-primary rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md"
          >
            マイページ
          </button>
        </div>
      </div>
    </div>
  );
}
