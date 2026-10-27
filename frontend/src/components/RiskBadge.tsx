import React from 'react';
import { RiskLevel } from '../types';

export interface RiskBadgeProps {
  level: RiskLevel | string;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '' }) => {
  const normalized = (level || 'None').toString().trim().toLowerCase();

  let colorClasses = 'bg-[#F1F5F9] text-[#64748B]'; // None / default
  let displayLabel = 'None';

  if (normalized === 'critical') {
    colorClasses = 'bg-[#FEE2E2] text-[#DC2626]';
    displayLabel = 'Critical';
  } else if (normalized === 'high') {
    colorClasses = 'bg-[#FEF3C7] text-[#D97706]';
    displayLabel = 'High';
  } else if (normalized === 'medium') {
    colorClasses = 'bg-[#FEF9C3] text-[#CA8A04]';
    displayLabel = 'Medium';
  } else if (normalized === 'low') {
    colorClasses = 'bg-[#DCFCE7] text-[#16A34A]';
    displayLabel = 'Low';
  } else {
    displayLabel = level ? level.toString() : 'None';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors duration-150 ${colorClasses} ${className}`}
    >
      {displayLabel}
    </span>
  );
};

export default RiskBadge;
