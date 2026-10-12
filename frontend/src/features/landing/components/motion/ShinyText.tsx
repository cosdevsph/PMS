import React from 'react';

export interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  children?: React.ReactNode;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 4,
  className = '',
  children,
}) => {
  const content = children || text;

  return (
    <span
      className={`inline-block relative overflow-hidden bg-clip-text text-transparent ${
        disabled ? '' : 'animate-text-shine'
      } ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(120deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 1) 40%, rgba(92, 219, 149, 0.95) 50%, rgba(255, 255, 255, 1) 60%, rgba(255, 255, 255, 0.7) 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        animationDuration: `${speed}s`,
      }}
    >
      {content}
    </span>
  );
};

export default ShinyText;
