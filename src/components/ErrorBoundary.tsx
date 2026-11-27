import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col flex-1 items-center justify-center min-h-[60vh] px-5 text-center">
          <h1 className="text-2xl font-semibold text-text mb-2">Something went wrong</h1>
          <p className="text-sm text-text-secondary mb-1">This page hit an unexpected error. Other tools still work.</p>
          <p className="font-mono text-xs text-text-muted mb-6 max-w-md break-words">{this.state.error?.message}</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
            className="h-9 px-4 bg-primary text-on-primary rounded-md text-sm font-medium hover:bg-primary-hover transition-colors focus-ring"
          >
            Back to all tools
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
