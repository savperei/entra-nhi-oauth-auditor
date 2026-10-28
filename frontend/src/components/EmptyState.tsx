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
 * large icon (48px), bold title, muted message, and optional CTA button.
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
      // Default shield icon (48px)
      return (
        <svg
          className="w-12 h-12 text-[#3B82F6]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    }

    if (typeof icon === 'string') {
      // Emoji or string character
      return <span className="text-4xl select-none leading-none">{icon}</span>;
    }

    // ReactNode / SVG element
    return <div className="w-12 h-12 flex items-center justify-center">{icon}</div>;
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
        {/* Large Icon Container (48px) */}
        <div className="w-16 h-16 rounded-2xl bg-[#0F172A] border border-[#334155] flex items-center justify-center mx-auto mb-4 text-[#3B82F6] shadow-inner">
          {renderIcon()}
        </div>

        {/* Bold Title */}
        <h2 className="text-lg font-bold text-[#F1F5F9] tracking-tight">{title}</h2>

        {/* Muted Message */}
        <p className="text-sm text-[#64748B] mt-2 leading-relaxed">{message}</p>

        {/* Optional Action CTA Button */}
        {action && (
          <div className="mt-6">
            <button
              onClick={action.onClick}
              disabled={action.disabled || action.loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm transition-all duration-150 active:scale-95"
            >
              {action.loading && (
                <svg
                  className="w-4 h-4 animate-spin text-white"
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

