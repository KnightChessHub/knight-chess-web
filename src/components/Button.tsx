import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-primary hover:bg-primary-dark text-white font-medium focus:ring-primary transition-all duration-200',
    secondary:
      'bg-secondary hover:bg-secondary-dark text-white font-medium focus:ring-secondary transition-all duration-200',
    danger: 'bg-danger hover:bg-red-600 text-white font-medium focus:ring-danger transition-all duration-200',
    ghost: 'bg-transparent hover:bg-bg-hover text-text-primary border border-border hover:border-primary transition-all duration-200',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5 min-h-[2rem]',
    md: 'px-4 py-2.5 text-base gap-2 min-h-[2.5rem]',
    lg: 'px-6 py-3 text-lg gap-2.5 min-h-[3rem]',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" style={{ marginRight: '0.5rem' }} />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}

