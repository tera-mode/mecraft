'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface UserHeaderProps {
  showHomeButton?: boolean;
  userNickname?: string; // ユーザーの呼び名
}

export default function UserHeader({ showHomeButton = true, userNickname }: UserHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();

  const handleMyPage = () => {
    router.push('/mypage');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="border-b bg-white px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        {/* ユーザー情報 */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-lg">
            {userNickname ? '😊' : user.isAnonymous ? '👤' : '👨‍💼'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {userNickname ? `${userNickname}さん` : user.isAnonymous ? 'ゲストユーザー' : user.email}
            </p>
            {!userNickname && user.isAnonymous && (
              <p className="text-xs text-gray-500">一時的なセッション</p>
            )}
            {userNickname && (
              <p className="text-xs text-gray-500">インタビュー中</p>
            )}
          </div>
        </div>

        {/* ボタン群 */}
        <div className="flex items-center gap-2">
          {showHomeButton && (
            <button
              onClick={() => router.push('/home')}
              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              HOME
            </button>
          )}
          <button
            onClick={handleMyPage}
            className="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
          >
            マイページ
          </button>
        </div>
      </div>
    </div>
  );
}
