import React, { useState } from 'react';

export interface ScoreCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  accent?: 'critical' | 'high' | 'medium' | 'low' | 'blue' | 'teal' | string;
  tooltip?: string;
  className?: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  label,
  value,
  sublabel,
  accent,
  tooltip,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getAccentClass = (acc?: string) => {
    switch (acc?.toLowerCase()) {
      case 'critical':
        return 'text-[#DC2626]';
      case 'high':
        return 'text-[#D97706]';
      case 'medium':
        return 'text-[#CA8A04]';
      case 'low':
        return 'text-[#16A34A]';
      case 'blue':
      case 'teal':
        return 'text-[#0F766E] dark:text-[#2DD4BF]';
      default:
        return 'text-[#18181B] dark:text-[#F1F5F9]';
    }
  };

  return (
    <div
      className={`bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-3.5 sm:p-4 transition-colors flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-medium text-[#71717A] dark:text-[#94A3B8]">
            {label}
          </span>
          {tooltip && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="w-4 h-4 rounded-full border border-[#D4D4D8] dark:border-[#475569] text-[#71717A] dark:text-[#94A3B8] hover:text-[#18181B] dark:hover:text-[#F1F5F9] text-[10px] flex items-center justify-center font-mono leading-none focus:outline-none"
                aria-label="Info"
              >
                i
              </button>
              {showTooltip && (
                <div className="absolute right-0 top-5 z-30 w-52 p-2 rounded shadow bg-[#18181B] text-[#F4F4F5] dark:bg-[#0F172A] dark:border dark:border-[#334155] text-[11px] leading-tight font-normal">
                  {tooltip}
                </div>
              )}
            </div>
          )}
        </div>
        <div className={`text-2xl sm:text-3xl font-bold mt-1 tracking-tight font-mono ${getAccentClass(accent)}`}>
          {value}
        </div>
      </div>
      {sublabel && (
        <div className="text-[11px] text-[#71717A] dark:text-[#94A3B8] mt-2 font-normal leading-tight">
          {sublabel}
        </div>
      )}
    </div>
  );
};

export default ScoreCard;
