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

  // Trigger CSS transition animation on mount (600ms ease-out)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const isEmpty = !summary || total === 0;

  if (isEmpty) {
    return (
      <div
        className={`bg-[#1E293B] border border-[#334155] rounded-xl p-6 shadow-sm ${className}`}
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[#F1F5F9]">
            Risk Distribution
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">0 identities audited</p>
        </div>
        <div className="py-10 text-center text-sm text-[#64748B]">
          Run an audit to see risk distribution.
        </div>
      </div>
    );
  }

  const rows: RiskRowData[] = [
    {
      level: 'Critical',
      count: summary.critical || 0,
      color: '#EF4444',
    },
    {
      level: 'High',
      count: summary.high || 0,
      color: '#F59E0B',
    },
    {
      level: 'Medium',
      count: summary.medium || 0,
      color: '#EAB308',
    },
    {
      level: 'Low',
      count: summary.low || 0,
      color: '#22C55E',
    },
    {
      level: 'None',
      count: summary.none || 0,
      color: '#64748B',
    },
  ];

  return (
    <div
      className={`bg-[#1E293B] border border-[#334155] rounded-xl p-6 shadow-sm ${className}`}
    >
      {/* Header & Subtitle */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
        <div>
          <h2 className="text-base font-semibold text-[#F1F5F9]">
            Risk Distribution
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            {total} {total === 1 ? 'identity' : 'identities'} audited
          </p>
        </div>
      </div>

      {/* 5 Rows */}
      <div className="space-y-4">
        {rows.map((row) => {
          const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;

          return (
            <div
              key={row.level}
              className="flex items-center gap-3 sm:gap-4 text-xs"
            >
              {/* [RiskBadge] */}
              <div className="w-24 shrink-0">
                <RiskBadge level={row.level} />
              </div>

              {/* [Bar track] light grey bg (#334155), full width */}
              <div className="flex-1 h-3 bg-[#334155] rounded-full overflow-hidden relative">
                {/* [Bar fill] coloured by level, width 0 -> final over 600ms ease-out */}
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: row.color,
                    width: isMounted ? `${pct}%` : '0%',
                    minWidth: isMounted ? '4px' : '0px',
                    transition: 'width 600ms ease-out, min-width 600ms ease-out',
                  }}
                />
              </div>

              {/* [N] Count: right-aligned, bold if > 0 */}
              <div
                className={`w-12 text-right font-mono text-sm ${
                  row.count > 0 ? 'font-bold text-[#F1F5F9]' : 'text-[#64748B]'
                }`}
              >
                {row.count}
              </div>

              {/* [%] Percentage: muted, e.g. "42%" */}
              <div className="w-12 text-right font-mono text-xs text-[#64748B]">
                {pct}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiskBreakdownChart;

