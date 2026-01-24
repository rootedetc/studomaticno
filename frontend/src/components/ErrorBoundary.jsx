import { Component } from 'react';
import Icon from './Icon';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="warning" className="w-8 h-8 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Greška
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error?.message || 'Something went wrong'}
            </p>
            <button
              onClick={this.handleReload}
              className="btn-primary"
            >
              Ponovno učitaj
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
