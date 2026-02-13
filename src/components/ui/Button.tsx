'use client';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const variantClasses = {
    primary: 'btn-gradient-primary text-white shadow-md',
    secondary: 'btn-gradient-secondary text-white shadow-md',
    ghost: 'border border-emerald-200 bg-white/80 text-stone-700 backdrop-blur-sm hover:bg-emerald-50 hover:border-emerald-300',
    danger: 'bg-red-500 text-white shadow-md hover:bg-red-600',
  };

  const radiusMap = {
    primary: 'rounded-xl',
    secondary: 'rounded-lg',
    ghost: 'rounded-lg',
    danger: 'rounded-lg',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`font-semibold transition-all btn-press disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${radiusMap[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
