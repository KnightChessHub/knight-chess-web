import { Component, type ReactNode } from 'react';
import Card from './Card';
import Button from './Button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      errorInfo: errorInfo.componentStack || null
    });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary">
          <Card className="max-w-2xl w-full">
            <div className="text-center">
              <div className="w-20 h-20 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-danger" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Something went wrong</h1>
              <p className="text-text-secondary mb-6 text-lg">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-text-secondary hover:text-text-primary mb-2">
                    Technical Details
                  </summary>
                  <pre className="bg-bg-tertiary p-4 rounded-lg overflow-auto text-xs text-text-secondary max-h-60">
                    {this.state.errorInfo}
                  </pre>
                </details>
              )}
              
              <div className="flex space-x-3 justify-center">
                <Button onClick={this.handleReload} size="lg">
                  <RefreshCw className="w-5 h-5" />
                  Reload Page
                </Button>
                <Button variant="ghost" onClick={this.handleGoHome} size="lg">
                  <Home className="w-5 h-5" />
                  Go Home
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
