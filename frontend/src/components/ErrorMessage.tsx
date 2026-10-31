import React from 'react';

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`bg-[#FDF2F2] dark:bg-[#202F2A] border border-[#C74444]/40 rounded-lg p-4 shadow-2xs text-[#C74444] dark:text-[#E05A5A] ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Error Alert Icon */}
        <div className="shrink-0 text-[#C74444] mt-0.5">
          <svg
            className="w-4 h-4"
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
          <h3 className="text-xs font-bold text-[#C74444] dark:text-[#E05A5A]">
            Application Notice
          </h3>
          <p className="text-xs text-[#202824] dark:text-[#E8EBE9] mt-0.5 leading-relaxed">
            {message}
          </p>

          {onRetry && (
            <div className="mt-2.5">
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C74444] hover:bg-[#A83232] text-white text-xs font-semibold rounded shadow-2xs transition-colors active:scale-95"
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
