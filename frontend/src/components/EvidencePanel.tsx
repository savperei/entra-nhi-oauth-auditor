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

  // Normalize incoming findings
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

  // Counts per severity
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

  // Severity weights for sorting desc
  const severityWeight: Record<string, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  // Filtered & sorted findings
  const displayedFindings = useMemo(() => {
    const list = selectedSeverity
      ? normalizedFindings.filter((f) => f.severity.toLowerCase() === selectedSeverity.toLowerCase())
      : normalizedFindings;

    return [...list].sort((a, b) => {
      const wA = severityWeight[a.severity] || 0;
      const wB = severityWeight[b.severity] || 0;
      return wB - wA;
    });
  }, [normalizedFindings, selectedSeverity]);

  // Border color helper:
  // Critical #DC2626 | High #D97706 | Medium #CA8A04 | Low #16A34A
  const getBorderColorStyle = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '#DC2626';
      case 'high':
        return '#D97706';
      case 'medium':
        return '#CA8A04';
      case 'low':
        return '#16A34A';
      default:
        return '#94A3B8';
    }
  };

  // EMPTY STATE: when no findings overall
  if (normalizedFindings.length === 0) {
    return (
      <div className="bg-[#F0FDF4] border border-green-200 rounded-xl p-6 flex items-center gap-4 text-[#166534] shadow-sm">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-[#16A34A]">
          <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-green-900">
            No risk findings detected. This identity looks clean.
          </h4>
          <p className="text-xs text-green-700 mt-0.5">
            All automated permissions, credentials, and tenant scope audits completed with zero flagged issues.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* SUMMARY ROW (above cards): Count chips + click to filter */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        {selectedSeverity && (
          <button
            type="button"
            onClick={() => setSelectedSeverity(null)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
          >
            Clear Filter (Show All {normalizedFindings.length})
          </button>
        )}

        {/* Critical Chip */}
        <button
          type="button"
          onClick={() =>
            setSelectedSeverity((prev) => (prev === 'Critical' ? null : 'Critical'))
          }
          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
            selectedSeverity === 'Critical'
              ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-sm ring-2 ring-[#DC2626]/20'
              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
          }`}
        >
          <span>Critical:</span>
          <span className="font-bold">{counts.Critical}</span>
        </button>

        {/* High Chip */}
        <button
          type="button"
          onClick={() =>
            setSelectedSeverity((prev) => (prev === 'High' ? null : 'High'))
          }
          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
            selectedSeverity === 'High'
              ? 'bg-[#D97706] text-white border-[#D97706] shadow-sm ring-2 ring-[#D97706]/20'
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <span>High:</span>
          <span className="font-bold">{counts.High}</span>
        </button>

        {/* Medium Chip */}
        <button
          type="button"
          onClick={() =>
            setSelectedSeverity((prev) => (prev === 'Medium' ? null : 'Medium'))
          }
          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
            selectedSeverity === 'Medium'
              ? 'bg-[#CA8A04] text-white border-[#CA8A04] shadow-sm ring-2 ring-[#CA8A04]/20'
              : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
          }`}
        >
          <span>Medium:</span>
          <span className="font-bold">{counts.Medium}</span>
        </button>

        {/* Low Chip */}
        <button
          type="button"
          onClick={() => setSelectedSeverity((prev) => (prev === 'Low' ? null : 'Low'))}
          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
            selectedSeverity === 'Low'
              ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-sm ring-2 ring-[#16A34A]/20'
              : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
          }`}
        >
          <span>Low:</span>
          <span className="font-bold">{counts.Low}</span>
        </button>
      </div>

      {/* FILTER ZERO RESULTS STATE */}
      {displayedFindings.length === 0 && selectedSeverity && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          <p className="text-sm">
            No <span className="font-semibold text-slate-800">{selectedSeverity}</span> risk
            findings detected.
          </p>
          <button
            type="button"
            onClick={() => setSelectedSeverity(null)}
            className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
          >
            Show all findings
          </button>
        </div>
      )}

      {/* FINDING CARDS (one per finding, sorted severity desc) */}
      <div className="space-y-4">
        {displayedFindings.map((finding, idx) => {
          const borderColor = getBorderColorStyle(finding.severity);

          return (
            <div
              key={`${finding.rule_id}-${idx}`}
              style={{ borderLeftColor: borderColor, borderLeftWidth: '3px' }}
              className="bg-white border border-slate-200 border-l-[3px] rounded-xl p-5 shadow-sm space-y-3.5 hover:shadow-md transition-shadow"
            >
              {/* TOP ROW: RiskBadge + rule_name (bold) + rule_id (muted monospace, right-aligned) */}
              <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <RiskBadge level={finding.severity} />
                  <span className="font-bold text-slate-900 text-sm truncate">
                    {finding.rule_name}
                  </span>
                </div>
                <span className="font-mono text-xs text-slate-400 shrink-0">
                  {finding.rule_id}
                </span>
              </div>

              {/* MIDDLE: "Evidence" label (tiny caps, muted) + evidence_text in dark code-style box */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Evidence
                </span>
                <div className="bg-[#1E293B] text-[#E2E8F0] font-mono text-xs p-3.5 rounded-lg whitespace-pre-wrap break-words leading-relaxed border border-slate-800 shadow-inner">
                  {finding.evidence_text || 'No evidence details recorded.'}
                </div>
              </div>

              {/* BOTTOM: "Remediation" label (tiny caps, muted) + remediation text in green-tinted box */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Remediation
                </span>
                <div className="bg-[#F0FDF4] text-[#166534] text-xs font-medium p-3.5 rounded-lg border border-green-200 leading-relaxed">
                  {finding.remediation || 'No remediation action recommended.'}
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
