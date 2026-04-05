import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Oops — Something went wrong</h2>
            <p className="text-gray-700 mb-4">An unexpected error happened while rendering this section. We've logged the details for debugging.</p>
            <details className="text-left text-xs text-gray-500 whitespace-pre-wrap rounded-lg bg-gray-100 p-3">
              {String(this.state.error && this.state.error.toString())}
              {this.state.info && this.state.info.componentStack}
            </details>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}

export default ErrorBoundary;
