'use client';

import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

interface MenuCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  bgGradient: string;
  buttonGradient: string;
  href: string;
  disabled?: boolean;
  disabledMessage?: string;
}

export default function MenuCard({
  title,
  description,
  icon: Icon,
  iconColor,
  bgGradient,
  buttonGradient,
  href,
  disabled = false,
  disabledMessage,
}: MenuCardProps) {
  const router = useRouter();

  return (
    <div className={`glass-card rounded-2xl p-4 ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${bgGradient}`}>
          <Icon size={24} className={iconColor} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        {!disabled && (
          <button
            onClick={() => router.push(href)}
            className={`flex-shrink-0 rounded-xl bg-gradient-to-r ${buttonGradient} px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg`}
          >
            はじめる
          </button>
        )}
      </div>
      {disabled && disabledMessage && (
        <p className="mt-3 text-center text-xs text-gray-500">{disabledMessage}</p>
      )}
    </div>
  );
}
