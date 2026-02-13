'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Pickaxe, User, Hammer, Users } from 'lucide-react';

const tabs = [
  { href: '/dig', label: 'ほる', icon: Pickaxe, color: 'var(--tab-dig)' },
  { href: '/mypage', label: 'じぶん', icon: User, color: 'var(--tab-mypage)' },
  { href: '/craft', label: 'つくる', icon: Hammer, color: 'var(--tab-craft)' },
  { href: '/everyone', label: 'みんな', icon: Users, color: 'var(--tab-everyone)' },
];

export default function BottomNav() {
  const pathname = usePathname();

  // インタビュー中は非表示
  if (pathname.includes('/interview/') && pathname.includes('/dig/interview/')) {
    const segments = pathname.split('/');
    // /dig/interview/[mode] のチャット画面では非表示
    if (segments.length >= 4 && segments[2] === 'interview') {
      const subPath = segments[3];
      if (subPath !== 'select-mode' && subPath !== 'select-interviewer' && subPath !== 'history') {
        return null;
      }
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-header border-t border-white/20 pb-safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 h-20">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 px-3 py-1 transition-all"
            >
              <Icon
                size={24}
                style={isActive ? { color: tab.color } : undefined}
                className={isActive ? '' : 'text-stone-400'}
              />
              <span
                className={`text-[10px] font-medium ${isActive ? '' : 'text-stone-400'}`}
                style={isActive ? { color: tab.color } : undefined}
              >
                {isActive ? '' : ''}{tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
