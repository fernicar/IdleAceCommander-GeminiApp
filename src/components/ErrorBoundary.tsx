import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  // FIX: Initialize state as a class property to resolve typing issues with 'this.state'.
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 border-2 border-red-500 rounded-lg p-6">
            <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
            <h2 className="text-2xl font-bold mb-2 text-red-400">System Error</h2>
            <p className="text-gray-300 mb-4">
              A critical error occurred. The game needs to restart.
            </p>
            {this.state.error && (
              <pre className="bg-gray-900 p-3 rounded text-xs text-gray-400 mb-4 overflow-auto max-h-32">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="w-full bg-military-green hover:bg-green-600 text-white font-bold py-3 rounded transition-colors"
            >
              <i className="fas fa-sync mr-2"></i>
              RESTART GAME
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// FIX: Removed default export to use named export instead.
// export default ErrorBoundary;