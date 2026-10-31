import React, { useMemo, useState } from 'react';
import { RiskBadge } from './RiskBadge';

export interface FindingItem {
  rule_id: string;
  rule_name: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  evidence_text: string;
  remediation: string;
}

export interface EvidencePanelProps {
  findings?: FindingItem[] | any[];
  remediation?: string[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ findings = [] }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

  const normalizedFindings = useMemo<FindingItem[]>(() => {
    return (findings || []).map((f: any) => {
      const rule_id = f.rule_id || '';
      const rule_name = f.rule_name || f.title || 'Risk Finding';
      const rawSev = (f.severity || 'Low').toString().trim();
      const severity = rawSev.charAt(0).toUpperCase() + rawSev.slice(1).toLowerCase();
      const evidence_text = f.evidence_text || f.description || '';
      const remediation = f.remediation || '';

      return {
        rule_id,
        rule_name,
        severity,
        evidence_text,
        remediation,
      };
    });
  }, [findings]);

  const counts = useMemo(() => {
    const res = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };
    normalizedFindings.forEach((f) => {
      const s = f.severity;
      if (s === 'Critical') res.Critical++;
      else if (s === 'High') res.High++;
      else if (s === 'Medium') res.Medium++;
      else if (s === 'Low') res.Low++;
    });
    return res;
  }, [normalizedFindings]);

  const severityWeight: Record<string, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  const filteredAndSortedFindings = useMemo(() => {
    let result = [...normalizedFindings];
    if (selectedSeverity) {
      result = result.filter((f) => f.severity === selectedSeverity);
    }
    result.sort((a, b) => {
      const weightA = severityWeight[a.severity] || 0;
      const weightB = severityWeight[b.severity] || 0;
      return weightB - weightA;
    });
    return result;
  }, [normalizedFindings, selectedSeverity]);

  const getBorderColor = (sev: string): string => {
    switch (sev) {
      case 'Critical':
        return '#C74444';
      case 'High':
        return '#D77928';
      case 'Medium':
        return '#C59A32';
      case 'Low':
        return '#39856A';
      default:
        return '#66736C';
    }
  };

  const handleChipClick = (sev: string) => {
    if (selectedSeverity === sev) {
      setSelectedSeverity(null);
    } else {
      setSelectedSeverity(sev);
    }
  };

  if (normalizedFindings.length === 0) {
    return (
      <div className="bg-[#F0FDF4] dark:bg-[#142A22] border border-[#A7C4B5]/50 dark:border-[#283C35] rounded-lg p-5 flex items-center gap-3 text-xs text-[#39856A] dark:text-[#2DD4BF] shadow-xs">
        <span className="w-5 h-5 rounded-full bg-[#39856A] text-white flex items-center justify-center font-bold text-xs shrink-0">
          ✓
        </span>
        <span className="font-medium">
          No risk findings detected. This identity has zero triggered security rules.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-[#66736C] dark:text-[#95A69E]">
          Filter by severity:
        </span>
        {(['Critical', 'High', 'Medium', 'Low'] as const).map((sev) => {
          const isSelected = selectedSeverity === sev;
          const count = counts[sev];
          const color = getBorderColor(sev);

          return (
            <button
              key={sev}
              type="button"
              onClick={() => handleChipClick(sev)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                isSelected
                  ? 'bg-[#147D68] text-white font-semibold shadow-2xs'
                  : 'bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] text-[#66736C] dark:text-[#95A69E] hover:text-[#202824] dark:hover:text-[#E8EBE9]'
              }`}
            >
              <span
                style={{ backgroundColor: color }}
                className="w-1.5 h-1.5 rounded-full shrink-0"
              />
              <span>{sev}:</span>
              <span className="font-mono font-semibold">{count}</span>
            </button>
          );
        })}

        {selectedSeverity && (
          <button
            onClick={() => setSelectedSeverity(null)}
            className="text-xs text-[#147D68] dark:text-[#2DD4BF] hover:underline ml-1 font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Finding Cards */}
      <div className="space-y-3">
        {filteredAndSortedFindings.map((finding, idx) => {
          const borderColor = getBorderColor(finding.severity);

          return (
            <div
              key={`${finding.rule_id}-${idx}`}
              style={{ borderLeftColor: borderColor }}
              className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] border-l-4 rounded-r-lg p-4 sm:p-5 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[#ECEBE4] dark:border-[#283C35] pb-2">
                <div className="flex items-center gap-2">
                  <RiskBadge level={finding.severity} />
                  <span className="font-semibold text-xs text-[#202824] dark:text-[#E8EBE9]">
                    {finding.rule_name}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#66736C] dark:text-[#A7C4B5] bg-[#ECEBE4] dark:bg-[#111B18] px-2 py-0.5 rounded border border-[#DCE2DB] dark:border-[#283C35]">
                  {finding.rule_id}
                </span>
              </div>

              {/* Evidence */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[#66736C] dark:text-[#95A69E]">
                  Evidence
                </span>
                <div className="p-2.5 rounded bg-[#172622] text-[#E8EBE9] border border-[#283C35] font-mono text-[11px] leading-relaxed break-words">
                  {finding.evidence_text || 'No explicit evidence details available.'}
                </div>
              </div>

              {/* Remediation */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[#66736C] dark:text-[#95A69E]">
                  Remediation
                </span>
                <div className="p-2.5 rounded bg-[#F0FDF4] dark:bg-[#142A22] border border-[#A7C4B5]/40 dark:border-[#283C35] text-[11px] text-[#147D68] dark:text-[#2DD4BF] leading-relaxed">
                  {finding.remediation || 'Review directory configuration and permissions.'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EvidencePanel;
