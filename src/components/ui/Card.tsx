import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  gradient 
}) => {
  const baseClasses = 'bg-white rounded-xl shadow-lg transition-all duration-300';
  const hoverClasses = hover ? 'hover:shadow-2xl hover:-translate-y-1 cursor-pointer' : '';
  const gradientClasses = gradient ? `bg-gradient-to-br ${gradient}` : '';

  return (
    <div className={`${baseClasses} ${hoverClasses} ${gradientClasses} ${className}`}>
      {children}
    </div>
  );
};