'use client';

interface IntensityStarsProps {
  intensity: number; // 1-5
  size?: 'sm' | 'md' | 'lg';
}

export default function IntensityStars({
  intensity,
  size = 'md',
}: IntensityStarsProps) {
  const maxStars = 5;
  const filledStars = Math.min(Math.max(Math.round(intensity), 0), maxStars);
  const emptyStars = maxStars - filledStars;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <span className={`${sizeClasses[size]} tracking-tight`} aria-label={`強度: ${filledStars}/5`}>
      <span className="text-yellow-500">{'★'.repeat(filledStars)}</span>
      <span className="text-stone-300">{'☆'.repeat(emptyStars)}</span>
    </span>
  );
}
