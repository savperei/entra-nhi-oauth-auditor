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
      <div className={`py-6 text-center text-xs text-[#66736C] dark:text-[#95A69E] ${className}`}>
        Run an audit to view the risk breakdown.
      </div>
    );
  }

  const rows: RiskRowData[] = [
    {
      level: 'Critical',
      count: summary.critical || 0,
      color: '#C74444',
    },
    {
      level: 'High',
      count: summary.high || 0,
      color: '#D77928',
    },
    {
      level: 'Medium',
      count: summary.medium || 0,
      color: '#C59A32',
    },
    {
      level: 'Low',
      count: summary.low || 0,
      color: '#39856A',
    },
    {
      level: 'None',
      count: summary.none || 0,
      color: '#66736C',
    },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
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
            <div className="flex-1 h-2.5 bg-[#ECEBE4] dark:bg-[#111B18] rounded-full overflow-hidden relative min-w-[50px] border border-[#DCE2DB] dark:border-[#283C35]">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  backgroundColor: row.color,
                  width: isMounted ? `${pct}%` : '0%',
                  minWidth: isMounted && row.count > 0 ? '4px' : '0px',
                }}
              />
            </div>

            {/* Count */}
            <div
              className={`w-6 text-right font-mono text-xs shrink-0 ${
                row.count > 0
                  ? 'font-bold text-[#202824] dark:text-[#E8EBE9]'
                  : 'text-[#97A8A0] dark:text-[#6E827A]'
              }`}
            >
              {row.count}
            </div>

            {/* Percentage */}
            <div className="w-12 text-right font-mono text-[11px] text-[#66736C] dark:text-[#95A69E] shrink-0">
              {pct}%
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RiskBreakdownChart;
