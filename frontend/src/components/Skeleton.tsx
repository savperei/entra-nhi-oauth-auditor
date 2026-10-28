import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: string | boolean;
  lines?: number;
  className?: string;
}

/**
 * Reusable Skeleton loader with an animated gradient shimmer sliding left to right.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  rounded = 'md',
  lines = 1,
  className = '',
}) => {
  const getRoundedClass = (r: string | boolean) => {
    if (r === true || r === 'md') return 'rounded-md';
    if (r === false || r === 'none') return 'rounded-none';
    if (r === 'full') return 'rounded-full';
    if (r === 'lg') return 'rounded-lg';
    if (r === 'xl') return 'rounded-xl';
    if (r === '2xl') return 'rounded-2xl';
    return typeof r === 'string' ? r : 'rounded-md';
  };

  const style: React.CSSProperties = {
    background: 'linear-gradient(90deg, #1E293B 25%, #334155 50%, #1E293B 75%)',
    backgroundSize: '200% 100%',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (lines > 1) {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className={`animate-pulse animate-shimmer ${getRoundedClass(rounded)}`}
            style={{
              ...style,
              width: idx === lines - 1 && !width ? '75%' : style.width,
              height: style.height || '1rem',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`animate-pulse animate-shimmer ${getRoundedClass(rounded)} ${className}`}
      style={{
        ...style,
        height: style.height || '1rem',
        width: style.width || '100%',
      }}
    />
  );
};

export default Skeleton;

