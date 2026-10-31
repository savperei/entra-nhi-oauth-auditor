import React, { useState } from 'react';
import { apiClient } from '../services/api';
import { useAudit } from '../hooks/useAudit';

type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ExportControlsProps {
  disabled?: boolean;
  className?: string;
}

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
            className="w-3.5 h-3.5 animate-spin text-[#147D68] shrink-0"
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
          <span className="whitespace-nowrap">Downloading...</span>
        </>
      );
    }

    if (status === 'success') {
      return (
        <>
          <span className="text-[#39856A] font-bold">✓</span>
          <span className="text-[#39856A] whitespace-nowrap font-medium">Downloaded</span>
        </>
      );
    }

    if (status === 'error') {
      return (
        <>
          <span className="text-[#C74444] font-bold">⚠</span>
          <span className="text-[#C74444] whitespace-nowrap font-medium">Failed</span>
        </>
      );
    }

    // Default 'idle' state
    return (
      <>
        <svg
          className="w-3.5 h-3.5 text-[#66736C] dark:text-[#95A69E] shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span className="whitespace-nowrap font-medium">
          {format === 'html' ? 'Download HTML' : 'Download JSON'}
        </span>
      </>
    );
  };

  const getButtonClasses = (status: ExportStatus) => {
    if (isDisabled) {
      return 'bg-transparent border-[#DCE2DB] dark:border-[#283C35] text-[#97A8A0] dark:text-[#6E827A] opacity-50 cursor-not-allowed';
    }
    if (status === 'success') {
      return 'bg-[#F0FDF4] dark:bg-[#142A22] border-[#A7C4B5] text-[#39856A] dark:text-[#2DD4BF] cursor-default';
    }
    if (status === 'error') {
      return 'bg-[#FDF2F2] dark:bg-[#202F2A] border-[#C74444]/40 text-[#C74444] hover:bg-[#FDF2F2]';
    }
    if (status === 'loading') {
      return 'bg-[#FFFFFF] dark:bg-[#182622] border-[#DCE2DB] dark:border-[#283C35] text-[#202824] dark:text-[#E8EBE9] cursor-wait opacity-80';
    }
    return 'bg-[#FFFFFF] dark:bg-[#182622] hover:bg-[#ECEBE4] dark:hover:bg-[#202F2A] border-[#DCE2DB] dark:border-[#283C35] text-[#202824] dark:text-[#E8EBE9] active:scale-95 cursor-pointer';
  };

  const tooltipText = isDisabled ? 'Run an audit first to enable exports' : undefined;

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${className}`}>
      {/* Button group */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* [Download HTML] Button */}
        <span title={tooltipText} className={`w-full sm:w-auto ${isDisabled ? 'cursor-not-allowed' : ''}`}>
          <button
            onClick={() => handleDownload('html')}
            disabled={isDisabled || htmlStatus === 'loading'}
            title={tooltipText || 'Download HTML executive report'}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs border shadow-2xs transition-colors focus:outline-none focus:ring-1 focus:ring-[#147D68] ${getButtonClasses(
              htmlStatus
            )}`}
          >
            {getButtonContent(htmlStatus, 'html')}
          </button>
        </span>

        {/* [Download JSON] Button */}
        <span title={tooltipText} className={`w-full sm:w-auto ${isDisabled ? 'cursor-not-allowed' : ''}`}>
          <button
            onClick={() => handleDownload('json')}
            disabled={isDisabled || jsonStatus === 'loading'}
            title={tooltipText || 'Download raw JSON findings export'}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs border shadow-2xs transition-colors focus:outline-none focus:ring-1 focus:ring-[#147D68] ${getButtonClasses(
              jsonStatus
            )}`}
          >
            {getButtonContent(jsonStatus, 'json')}
          </button>
        </span>
      </div>
    </div>
  );
};

export default ExportControls;
