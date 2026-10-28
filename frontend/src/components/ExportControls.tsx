import React, { useState } from 'react';
import { apiClient } from '../services/api';

export const ExportControls: React.FC = () => {
  const [downloading, setDownloading] = useState<'json' | 'html' | null>(null);

  const handleDownload = async (format: 'json' | 'html') => {
    try {
      setDownloading(format);
      const response = await apiClient.get(`/reports/${format}`, {
        responseType: 'blob',
      });

      // Extract filename from Content-Disposition header if available
      const disposition = response.headers['content-disposition'];
      let filename = `audit_report.${format}`;
      if (disposition && disposition.includes('filename=')) {
        const matches = disposition.match(/filename="?([^"]+)"?/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Create browser blob download link
      const blob = new Blob([response.data], {
        type: format === 'json' ? 'application/json' : 'text/html',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to download ${format} report:`, err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Export JSON Button */}
      <button
        onClick={() => handleDownload('json')}
        disabled={downloading !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-[#F1F5F9] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
        title="Download audit report as JSON file"
      >
        {downloading === 'json' ? (
          <svg className="w-3.5 h-3.5 animate-spin text-[#3B82F6]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 text-[#3B82F6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        )}
        <span>Export JSON</span>
      </button>

      {/* Export HTML Button */}
      <button
        onClick={() => handleDownload('html')}
        disabled={downloading !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-[#F1F5F9] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
        title="Download audit report as standalone HTML file"
      >
        {downloading === 'html' ? (
          <svg className="w-3.5 h-3.5 animate-spin text-[#22C55E]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 text-[#22C55E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <circle cx="12" cy="14" r="3" />
          </svg>
        )}
        <span>Export HTML</span>
      </button>
    </div>
  );
};

export default ExportControls;

