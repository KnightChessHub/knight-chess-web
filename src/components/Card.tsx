import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

export default function Card({ children, className = '', hover = false, onClick, style }: CardProps) {
  return (
    <div
      className={`glass-card rounded-xl transition-all duration-300 ${
        hover ? 'glass-hover cursor-pointer' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={{ padding: '1.75rem', ...style }}
    >
      {children}
    </div>
  );
}

