import { X } from 'lucide-react';
import React from 'react';

export type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'gray';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLSpanElement>) => void;
  onRemove?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = false,
  className = '',
  onClick,
  onRemove,
}) => {
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-secondary-100 text-secondary-800',
    accent: 'bg-accent-100 text-accent-800',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-warning-50 text-warning-700',
    error: 'bg-error-50 text-error-700',
    gray: 'bg-gray-100 text-gray-800',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const roundedClass = rounded ? 'rounded-full' : 'rounded';

  return (
    <span
      className={`inline-flex items-center font-medium ${roundedClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={!onRemove ? onClick : undefined}
      style={{ cursor: onClick && !onRemove ? 'pointer' : 'default' }}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label="Remove item"
          className="ml-1.5 flex-shrink-0 rounded-full text-inherit opacity-70 hover:opacity-100 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation(); // Prevent any parent onClick from firing
            onRemove(e);
          }}
        > <X size={size === 'sm' ? 12 : 14} /></button>
      )}
    </span>
  );
};