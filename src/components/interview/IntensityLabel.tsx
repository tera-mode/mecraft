'use client';

interface IntensityLabelProps {
  intensityLabel?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function IntensityLabel({
  intensityLabel,
  size = 'md',
}: IntensityLabelProps) {
  // 強弱がない場合は何も表示しない
  if (!intensityLabel) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={`${sizeClasses[size]} rounded-full bg-white/60 text-gray-700 font-medium`}
    >
      {intensityLabel}
    </span>
  );
}
