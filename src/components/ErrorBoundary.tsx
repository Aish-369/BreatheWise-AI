import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected rendering issue occurred.',
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[BreatheWise UI ErrorBoundary]', error.message, info.componentStack);
  }

  private handleReload = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F7F1] text-[#252D28] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E2E7E1] rounded-2xl p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F6DFDC] text-[#B33A2E] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-[#252D28]">
                  Workspace Interrupted
                </h1>
                <p className="text-xs text-[#89918A]">
                  Your local SQLite household data remains safely stored.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#252D28] bg-[#F7F7F1] border border-[#E2E7E1] rounded-xl p-3">
              {this.state.errorMessage}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore Workspace</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-xs font-medium border border-[#E2E7E1] bg-white text-[#252D28] rounded-lg hover:bg-[#F7F7F1] cursor-pointer"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
