import React from 'react';

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Reusable ErrorMessage component in a red-tinted box (#FEF2F2 bg, #DC2626 border),
 * displaying an error icon, error message, and optional Retry action.
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`bg-[#FEF2F2] border border-[#DC2626] rounded-xl p-5 shadow-sm text-[#991B1B] ${className}`}
    >
      <div className="flex items-start gap-3.5">
        {/* Error Alert Icon */}
        <div className="shrink-0 text-[#DC2626] mt-0.5">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Message and optional Retry action */}
        <div className="flex-1">
          <h3 className="text-sm font-bold text-[#DC2626]">
            Application Notice
          </h3>
          <p className="text-xs text-[#991B1B] mt-1 leading-relaxed">
            {message}
          </p>

          {onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors duration-150 active:scale-95"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>Retry</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;

