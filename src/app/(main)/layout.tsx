'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Settings } from 'lucide-react';
import { PageHeaderProvider, usePageHeaderConfig } from '@/contexts/PageHeaderContext';
import AppHeader from '@/components/navigation/AppHeader';
import BottomNav from '@/components/navigation/BottomNav';

function MainContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const headerConfig = usePageHeaderConfig();

  // Hide BottomNav during interview chat
  const isInterviewChat = pathname.startsWith('/dig/interview/') &&
    !pathname.endsWith('/select-mode') &&
    !pathname.endsWith('/select-interviewer') &&
    !pathname.endsWith('/history');

  const defaultRightAction = (
    <button
      onClick={() => router.push('/mypage/settings')}
      className="rounded-full p-2 hover:bg-white/50 transition-colors"
    >
      <Settings size={20} className="text-stone-700" />
    </button>
  );

  return (
    <>
      {!headerConfig.hideHeader && (
        <AppHeader
          title={headerConfig.title}
          showBackButton={headerConfig.showBackButton}
          onBack={headerConfig.onBack}
          rightAction={headerConfig.rightAction ?? defaultRightAction}
        />
      )}
      <main className={isInterviewChat ? '' : 'pb-20'}>
        {children}
      </main>
      {!isInterviewChat && <BottomNav />}
    </>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-main">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 spinner-warm"></div>
          <p className="text-stone-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PageHeaderProvider>
      <div className="min-h-screen bg-gradient-main">
        <MainContent>{children}</MainContent>
      </div>
    </PageHeaderProvider>
  );
}
