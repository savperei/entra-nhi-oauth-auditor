import React, { useState, useEffect } from 'react';
import { RiskBadge } from './RiskBadge';
import { RiskLevel } from '../types';

export interface RiskSummaryCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  none: number;
}

export interface RiskBreakdownChartProps {
  summary?: RiskSummaryCounts | null;
  total: number;
  className?: string;
}

interface RiskRowData {
  level: RiskLevel;
  count: number;
  color: string;
}

export const RiskBreakdownChart: React.FC<RiskBreakdownChartProps> = ({
  summary,
  total,
  className = '',
}) => {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const isEmpty = !summary || total === 0;

  if (isEmpty) {
    return (
      <div className={`py-6 text-center text-xs text-[#71717A] dark:text-[#94A3B8] ${className}`}>
        Run an audit to view the risk breakdown.
      </div>
    );
  }

  const rows: RiskRowData[] = [
    {
      level: 'Critical',
      count: summary.critical || 0,
      color: '#DC2626',
    },
    {
      level: 'High',
      count: summary.high || 0,
      color: '#D97706',
    },
    {
      level: 'Medium',
      count: summary.medium || 0,
      color: '#CA8A04',
    },
    {
      level: 'Low',
      count: summary.low || 0,
      color: '#16A34A',
    },
    {
      level: 'None',
      count: summary.none || 0,
      color: '#71717A',
    },
  ];

  return (
    <div className={`space-y-2.5 ${className}`}>
      {rows.map((row) => {
        const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;

        return (
          <div
            key={row.level}
            className="flex items-center gap-2 sm:gap-3 text-xs"
          >
            {/* Badge */}
            <div className="w-20 shrink-0">
              <RiskBadge level={row.level} />
            </div>

            {/* Bar track */}
            <div className="flex-1 h-2 bg-[#F4F4F5] dark:bg-[#0F172A] rounded-full overflow-hidden relative min-w-[50px] border border-[#E4E4E7] dark:border-[#334155]">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  backgroundColor: row.color,
                  width: isMounted ? `${pct}%` : '0%',
                  minWidth: isMounted && row.count > 0 ? '3px' : '0px',
                }}
              />
            </div>

            {/* Count */}
            <div
              className={`w-6 text-right font-mono text-xs shrink-0 ${
                row.count > 0
                  ? 'font-bold text-[#18181B] dark:text-[#F1F5F9]'
                  : 'text-[#A1A1AA] dark:text-[#71717A]'
              }`}
            >
              {row.count}
            </div>

            {/* Percentage */}
            <div className="w-10 text-right font-mono text-[11px] text-[#71717A] dark:text-[#94A3B8] shrink-0">
              {pct}%
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RiskBreakdownChart;
