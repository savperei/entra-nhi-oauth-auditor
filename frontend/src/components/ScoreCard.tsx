import React from 'react';

export interface ScoreCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  accent?: 'critical' | 'high' | 'medium' | 'low' | 'blue' | string;
  className?: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  label,
  value,
  sublabel,
  accent,
  className = '',
}) => {
  const getAccentClass = (acc?: string) => {
    switch (acc?.toLowerCase()) {
      case 'critical':
        return 'text-[#EF4444]';
      case 'high':
        return 'text-[#F59E0B]';
      case 'medium':
        return 'text-[#EAB308]';
      case 'low':
        return 'text-[#22C55E]';
      case 'blue':
        return 'text-[#3B82F6]';
      default:
        return 'text-[#F1F5F9]';
    }
  };

  return (
    <div
      className={`bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow-sm transition-all duration-200 hover:border-[#475569] flex flex-col justify-between ${className}`}
    >
      <div>
        <span className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">
          {label}
        </span>
        <div className={`text-3xl font-extrabold mt-2 tracking-tight ${getAccentClass(accent)}`}>
          {value}
        </div>
      </div>
      {sublabel && (
        <div className="text-xs text-[#64748B] mt-2 font-medium">
          {sublabel}
        </div>
      )}
    </div>
  );
};

export default ScoreCard;

