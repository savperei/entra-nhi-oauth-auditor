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
        return 'text-[#C74444] dark:text-[#E05A5A]';
      case 'high':
        return 'text-[#D77928] dark:text-[#E58B3C]';
      case 'medium':
        return 'text-[#C59A32] dark:text-[#DDB045]';
      case 'low':
        return 'text-[#39856A] dark:text-[#4AA484]';
      case 'blue':
      case 'teal':
        return 'text-[#147D68] dark:text-[#2DD4BF]';
      default:
        return 'text-[#202824] dark:text-[#E8EBE9]';
    }
  };

  return (
    <div
      className={`bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-3.5 sm:p-4 transition-colors flex flex-col justify-between shadow-xs ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-medium text-[#66736C] dark:text-[#95A69E]">
            {label}
          </span>
          {tooltip && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="w-4 h-4 rounded-full border border-[#DCE2DB] dark:border-[#3D524A] text-[#66736C] dark:text-[#95A69E] hover:text-[#202824] dark:hover:text-[#E8EBE9] text-[10px] flex items-center justify-center font-mono leading-none focus:outline-none"
                aria-label="Info"
              >
                i
              </button>
              {showTooltip && (
                <div className="absolute right-0 top-5 z-30 w-56 p-2.5 rounded shadow-lg bg-[#172622] text-[#F5F4EF] dark:bg-[#0D1614] border border-[#283C35] text-[11px] leading-relaxed font-normal">
                  {tooltip}
                </div>
              )}
            </div>
          )}
        </div>
        <div className={`text-2xl sm:text-3xl font-bold mt-1.5 tracking-tight font-mono ${getAccentClass(accent)}`}>
          {value}
        </div>
      </div>
      {sublabel && (
        <div className="text-[11px] text-[#66736C] dark:text-[#95A69E] mt-2.5 font-normal leading-relaxed">
          {sublabel}
        </div>
      )}
    </div>
  );
};

export default ScoreCard;
