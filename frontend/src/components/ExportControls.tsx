import React, { useState } from 'react';
import { apiClient } from '../services/api';
import { useAudit } from '../hooks/useAudit';

type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ExportControlsProps {
  disabled?: boolean;
  className?: string;
}

/**
 * Generates today's date in YYYY-MM-DD format.
 */
const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ExportControls: React.FC<ExportControlsProps> = ({
  disabled: propDisabled,
  className = '',
}) => {
  const { result } = useAudit();
  const [htmlStatus, setHtmlStatus] = useState<ExportStatus>('idle');
  const [jsonStatus, setJsonStatus] = useState<ExportStatus>('idle');

  // Determine if export should be disabled (either via prop or if no audit data exists)
  const isNoAudit =
    !result ||
    (result as any).status === 'no_audit_run' ||
    (result as any).total_identities === 0;

  const isDisabled = propDisabled !== undefined ? propDisabled : isNoAudit;

  const handleDownload = async (format: 'html' | 'json') => {
    if (isDisabled) return;

    const setStatus = format === 'html' ? setHtmlStatus : setJsonStatus;
    setStatus('loading');

    try {
      const response = await apiClient.get(`/reports/${format}`, {
        responseType: 'blob',
      });

      const mimeType = format === 'html' ? 'text/html' : 'application/json';
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `nhi-audit-${getTodayDateString()}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    } catch (err) {
      console.error(`Failed to export ${format} report:`, err);
      setStatus('error');
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  const getButtonContent = (
    status: ExportStatus,
    format: 'html' | 'json'
  ) => {
    if (status === 'loading') {
      return (
        <>
          <svg
            className={`w-3.5 h-3.5 animate-spin ${
              format === 'html' ? 'text-[#22C55E]' : 'text-[#3B82F6]'
            }`}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span>Downloading...</span>
        </>
      );
    }

    if (status === 'success') {
      return (
        <>
          <svg
            className="w-3.5 h-3.5 text-[#22C55E]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-[#22C55E]">Downloaded!</span>
        </>
      );
    }

    if (status === 'error') {
      return (
        <>
          <svg
            className="w-3.5 h-3.5 text-[#EF4444]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span className="text-[#EF4444]">Failed</span>
        </>
      );
    }

    // Default 'idle' state
    if (format === 'html') {
      return (
        <>
          <svg
            className="w-3.5 h-3.5 text-[#22C55E]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <circle cx="12" cy="14" r="3" />
          </svg>
          <span>Download HTML</span>
        </>
      );
    }

    return (
      <>
        <svg
          className="w-3.5 h-3.5 text-[#3B82F6]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span>Download JSON</span>
      </>
    );
  };

  const getButtonClasses = (status: ExportStatus) => {
    if (isDisabled) {
      return 'bg-[#1E293B]/40 border-[#334155]/60 text-[#64748B] opacity-50 cursor-not-allowed';
    }
    if (status === 'success') {
      return 'bg-[#1E293B] border-[#22C55E]/60 text-[#22C55E] cursor-default';
    }
    if (status === 'error') {
      return 'bg-[#1E293B] border-[#EF4444]/60 text-[#EF4444] hover:bg-[#334155]';
    }
    if (status === 'loading') {
      return 'bg-[#1E293B] border-[#334155] text-[#F1F5F9] cursor-wait opacity-80';
    }
    return 'bg-[#1E293B] hover:bg-[#334155] border-[#334155] text-[#F1F5F9] active:scale-95 cursor-pointer';
  };

  const tooltipText = isDisabled ? 'Run an audit first' : undefined;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* "Export:" Label */}
      <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider select-none">
        Export:
      </span>

      {/* [Download HTML] Button */}
      <span title={tooltipText} className={isDisabled ? 'cursor-not-allowed' : undefined}>
        <button
          onClick={() => handleDownload('html')}
          disabled={isDisabled || htmlStatus === 'loading'}
          title={tooltipText || 'Download HTML report'}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm transition-all duration-150 ${getButtonClasses(
            htmlStatus
          )}`}
        >
          {getButtonContent(htmlStatus, 'html')}
        </button>
      </span>

      {/* [Download JSON] Button */}
      <span title={tooltipText} className={isDisabled ? 'cursor-not-allowed' : undefined}>
        <button
          onClick={() => handleDownload('json')}
          disabled={isDisabled || jsonStatus === 'loading'}
          title={tooltipText || 'Download JSON report'}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm transition-all duration-150 ${getButtonClasses(
            jsonStatus
          )}`}
        >
          {getButtonContent(jsonStatus, 'json')}
        </button>
      </span>
    </div>
  );
};

export default ExportControls;
