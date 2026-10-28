import React, { Component, ErrorInfo, ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level ErrorBoundary class component to catch runtime rendering errors
 * in any child component tree.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught rendering error:', error, errorInfo);
  }

  handleRefresh = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F172A] text-[#F1F5F9] flex items-center justify-center p-6">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center mx-auto mb-4 text-[#EF4444]">
              <svg
                className="w-8 h-8"
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

            <h2 className="text-xl font-bold text-[#F1F5F9]">
              Something went wrong. Please refresh.
            </h2>

            {this.state.error?.message && (
              <p className="text-xs font-mono text-[#94A3B8] bg-[#0F172A] p-2.5 rounded-lg border border-[#334155] mt-3 break-all text-left">
                {this.state.error.message}
              </p>
            )}

            <div className="mt-6">
              <button
                onClick={this.handleRefresh}
                className="px-5 py-2.5 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors active:scale-95"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

