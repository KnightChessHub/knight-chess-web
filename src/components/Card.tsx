import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      className={`bg-bg-card border border-border rounded-lg transition-all duration-200 ${
        hover ? 'hover:bg-bg-hover hover:border-border-light cursor-pointer' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={{ padding: '1.5rem' }}
    >
      {children}
    </div>
  );
}

