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
        <div className="flex flex-col items-center justify-center min-h-screen px-5 text-center">
          <h1 className="text-5xl font-bold text-text mb-4">Oops!</h1>
          <p className="text-xl text-text-secondary mb-2">Something went wrong.</p>
          <p className="text-sm text-text-muted mb-8 max-w-md">{this.state.error?.message}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
            className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-all duration-200 active:scale-[0.97]"
          >
            Back to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
