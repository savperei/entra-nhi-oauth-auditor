import React from 'react';
import { RiskLevel } from '../types';

export interface RiskBadgeProps {
  level: RiskLevel | string;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '' }) => {
  const normalized = (level || 'None').toString().trim().toLowerCase();

  let dotColor = 'bg-[#66736C]';
  let textColor = 'text-[#66736C]';
  let displayLabel = 'None';

  if (normalized === 'critical') {
    dotColor = 'bg-[#C74444]';
    textColor = 'text-[#C74444] dark:text-[#E05A5A]';
    displayLabel = 'Critical';
  } else if (normalized === 'high') {
    dotColor = 'bg-[#D77928]';
    textColor = 'text-[#D77928] dark:text-[#E58B3C]';
    displayLabel = 'High';
  } else if (normalized === 'medium') {
    dotColor = 'bg-[#C59A32]';
    textColor = 'text-[#C59A32] dark:text-[#DDB045]';
    displayLabel = 'Medium';
  } else if (normalized === 'low') {
    dotColor = 'bg-[#39856A]';
    textColor = 'text-[#39856A] dark:text-[#4AA484]';
    displayLabel = 'Low';
  } else {
    displayLabel = level ? level.toString() : 'None';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${textColor} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} aria-hidden="true" />
      {displayLabel}
    </span>
  );
};

export default RiskBadge;
