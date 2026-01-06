
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { storageService } from '../services/storageService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chronos Error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log error for debugging (could send to external service)
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    };
    console.error('Error Log:', errorLog);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleExportData = () => {
    try {
      storageService.downloadBackup();
    } catch (e) {
      console.error('Failed to export data:', e);
    }
  };

  handleClearAndReload = () => {
    if (window.confirm('This will clear all cached data and reload. Your saved data will remain. Continue?')) {
      // Clear only session storage and caches, keep localStorage
      sessionStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-8">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-black tracking-tight">Something went wrong</h1>
              <p className="text-gray-400 text-sm mt-2 font-medium">
                Chronos encountered an unexpected error. Your data is safe.
              </p>
            </div>

            {/* Error details (collapsed) */}
            <details className="text-left bg-gray-50 rounded-xl p-4 text-xs">
              <summary className="cursor-pointer font-bold text-gray-500 uppercase tracking-widest text-[10px]">
                Technical Details
              </summary>
              <pre className="mt-4 overflow-auto text-red-600 bg-red-50 p-3 rounded-lg max-h-32">
                {this.state.error?.message || 'Unknown error'}
              </pre>
            </details>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full bg-black text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
              >
                Reload Application
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={this.handleExportData}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors"
                >
                  Export Data Backup
                </button>
                <button
                  onClick={this.handleClearAndReload}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
                >
                  Clear Cache
                </button>
              </div>
            </div>

            {/* Footer */}
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
              Chronos v3.4.1 — Error Recovery Mode
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
