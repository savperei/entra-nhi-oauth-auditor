import React from 'react';
import { Finding } from '../types';
import { RiskBadge } from './RiskBadge';

export interface EvidencePanelProps {
  findings?: Finding[];
  remediation?: string[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  findings = [],
  remediation = [],
}) => {
  if (!findings || findings.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center mx-auto text-[#22C55E] mb-3">
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-[#F1F5F9]">No Risk Findings Detected</h3>
        <p className="text-xs text-[#94A3B8] mt-1 max-w-md mx-auto">
          This identity passed all automated posture compliance rules with no excessive grants or hygiene alerts.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#334155]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#F1F5F9]">Risk Findings &amp; Evidence</h2>
            <p className="text-xs text-[#64748B]">
              Detected permission vulnerabilities and hygiene violations
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30">
          {findings.length} Flagged {findings.length === 1 ? 'Issue' : 'Issues'}
        </span>
      </div>

      <div className="space-y-4">
        {findings.map((finding, idx) => (
          <div
            key={finding.id || idx}
            className="bg-[#0F172A]/70 border border-[#334155] rounded-xl p-5 hover:border-[#475569] transition-all duration-150"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <RiskBadge level={finding.severity} />
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#1E293B] text-[#94A3B8] border border-[#334155]">
                  {finding.rule_id}
                </span>
                <h3 className="text-sm font-bold text-[#F1F5F9]">
                  {finding.title || finding.rule_name || 'Flagged Risk Item'}
                </h3>
              </div>

              {finding.detected_at && (
                <span className="text-xs text-[#64748B]">
                  Detected: {new Date(finding.detected_at).toLocaleDateString()}
                </span>
              )}
            </div>

            <p className="text-xs text-[#CBD5E1] mt-2 leading-relaxed">
              {finding.description || finding.evidence_text || 'No additional evidence recorded.'}
            </p>

            {finding.remediation && (
              <div className="mt-3 p-3 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-lg flex items-start gap-2 text-xs text-[#93C5FD]">
                <svg
                  className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div>
                  <span className="font-semibold text-white">Recommended Remediation: </span>
                  {finding.remediation}
                </div>
              </div>
            )}
          </div>
        ))}

        {remediation && remediation.length > 0 && (
          <div className="mt-4 p-4 bg-[#1E293B] border border-[#334155] rounded-xl">
            <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
              Action Plan Guidance
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-[#94A3B8]">
              {remediation.map((step, sIdx) => (
                <li key={sIdx}>{step}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvidencePanel;

