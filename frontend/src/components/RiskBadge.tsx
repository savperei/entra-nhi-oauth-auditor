import React from 'react';
import { RiskLevel } from '../types';

export interface RiskBadgeProps {
  level: RiskLevel | string;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '' }) => {
  const normalized = (level || 'None').toString().trim().toLowerCase();

  let dotColor = 'bg-[#71717A]';
  let textColor = 'text-[#71717A]';
  let displayLabel = 'None';

  if (normalized === 'critical') {
    dotColor = 'bg-[#DC2626]';
    textColor = 'text-[#DC2626]';
    displayLabel = 'Critical';
  } else if (normalized === 'high') {
    dotColor = 'bg-[#D97706]';
    textColor = 'text-[#D97706]';
    displayLabel = 'High';
  } else if (normalized === 'medium') {
    dotColor = 'bg-[#CA8A04]';
    textColor = 'text-[#CA8A04]';
    displayLabel = 'Medium';
  } else if (normalized === 'low') {
    dotColor = 'bg-[#16A34A]';
    textColor = 'text-[#16A34A]';
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
