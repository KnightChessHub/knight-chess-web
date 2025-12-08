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
      className={`glass-card rounded-lg transition-all duration-200 p-6 ${
        hover ? 'glass-hover cursor-pointer' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={{ padding: '1.5rem' }}
    >
      {children}
    </div>
  );
}

