'use client';

import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';

export default function Home() {
  const router = useRouter();

  const handleGuestStart = () => {
    // ゲストセッションIDを生成してCookieに保存
    const sessionId = uuidv4();
    Cookies.set('guest_session_id', sessionId, { expires: 30 }); // 30日間有効

    // インタビュワー選択画面へ遷移
    router.push('/select-interviewer');
  };

  const handleLoginStart = () => {
    // ログインページへ遷移
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <main className="flex w-full max-w-4xl flex-col items-center gap-12 text-center">
        {/* ヘッダー */}
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold text-gray-900 md:text-6xl">
            あなたのインタビュワー
          </h1>
          <p className="text-xl text-gray-600 md:text-2xl">
            AIがあなたを有名人のようにインタビュー
          </p>
        </div>

        {/* サービス説明 */}
        <div className="flex max-w-2xl flex-col gap-6 rounded-2xl bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800">
            魅力を引き出すインタビュー体験
          </h2>
          <div className="text-left text-gray-700">
            <p className="mb-4">
              AIインタビュワーがあなたの魅力を引き出し、以下のコンテンツを生成します：
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>雑誌風のインタビュー記事</li>
              <li>就活・転職で使える自己PR文</li>
              <li>マッチングアプリ用プロフィール</li>
              <li>SNSプロフィール</li>
            </ul>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex w-full max-w-md flex-col gap-4">
          <button
            onClick={handleGuestStart}
            className="rounded-full bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
          >
            ゲストとして始める
          </button>
          <button
            onClick={handleLoginStart}
            className="rounded-full border-2 border-blue-600 bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-md transition-all hover:bg-blue-50 hover:shadow-lg"
          >
            ログインして始める
          </button>
        </div>

        {/* 注意事項 */}
        <div className="max-w-2xl text-sm text-gray-500">
          <p>
            ゲスト利用の場合、データはCookieに保存されます。Cookieを削除するとデータが消失しますのでご注意ください。
          </p>
          <p className="mt-2">
            ログインすることで、データを永続的に保存できます。
          </p>
        </div>
      </main>
    </div>
  );
}
