'use client';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'emerald' | 'amber' | 'sky' | 'rose' | 'gray';
  className?: string;
}

export default function Badge({ children, color = 'emerald', className = '' }: BadgeProps) {
  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    sky: 'bg-sky-100 text-sky-700',
    rose: 'bg-rose-100 text-rose-700',
    gray: 'bg-stone-100 text-stone-700',
  };

  return (
    <span className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-medium ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  );
}
