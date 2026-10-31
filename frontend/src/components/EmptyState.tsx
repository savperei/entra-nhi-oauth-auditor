import React from 'react';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface EmptyStateProps {
  icon?: React.ReactNode | string;
  title: string;
  message: string;
  action?: EmptyStateAction;
  className?: string;
}

/**
 * Reusable Empty State component with a centered card layout,
 * shield icon, bold title, muted message, and optional CTA button.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
  className = '',
}) => {
  const renderIcon = () => {
    if (!icon) {
      return (
        <svg
          className="w-8 h-8 text-[#147D68] dark:text-[#2DD4BF]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    }

    if (typeof icon === 'string') {
      return <span className="text-3xl select-none leading-none">{icon}</span>;
    }

    return <div className="w-8 h-8 flex items-center justify-center text-[#147D68]">{icon}</div>;
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-xl p-8 max-w-md w-full text-center shadow-xs">
        {/* Icon Container */}
        <div className="w-14 h-14 rounded-xl bg-[#ECEBE4] dark:bg-[#111B18] border border-[#DCE2DB] dark:border-[#283C35] flex items-center justify-center mx-auto mb-4 text-[#147D68]">
          {renderIcon()}
        </div>

        {/* Bold Title */}
        <h2 className="text-base font-bold text-[#202824] dark:text-[#E8EBE9] tracking-tight">{title}</h2>

        {/* Muted Message */}
        <p className="text-xs text-[#66736C] dark:text-[#95A69E] mt-2 leading-relaxed">{message}</p>

        {/* Optional Action CTA Button */}
        {action && (
          <div className="mt-5">
            <button
              onClick={action.onClick}
              disabled={action.disabled || action.loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-semibold bg-[#147D68] hover:bg-[#0E6150] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-2xs transition-colors active:scale-95"
            >
              {action.loading && (
                <svg
                  className="w-3.5 h-3.5 animate-spin text-white"
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
              )}
              <span>{action.label}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
