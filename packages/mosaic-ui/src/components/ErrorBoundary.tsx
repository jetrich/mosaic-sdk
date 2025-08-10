import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { TerminalWindow, TerminalContent } from './index';
import './ErrorBoundary.css';

export function ErrorBoundary() {
  const error = useRouteError();
  
  let errorMessage = 'An unexpected error occurred';
  let errorDetails = 'Something went wrong while loading this page.';
  let statusCode = '500';
  
  if (isRouteErrorResponse(error)) {
    statusCode = error.status.toString();
    errorMessage = error.statusText || `HTTP ${error.status}`;
    errorDetails = error.data?.message || 'The page encountered an error.';
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack || 'No additional details available.';
  }
  
  const terminalCommands = [
    {
      command: 'mosaic status',
      output: `❌ Error ${statusCode}: ${errorMessage}`
    },
    {
      command: 'mosaic debug --verbose',
      output: errorDetails.substring(0, 200) + (errorDetails.length > 200 ? '...' : '')
    },
    {
      command: 'mosaic restart',
      output: 'Restarting application...\n✓ Ready for new requests'
    }
  ];

  return (
    <div className="error-boundary">
      <div className="error-container">
        <div className="error-header">
          <h1 className="error-title">
            <span className="error-prompt">$ </span>
            System Error
          </h1>
          <p className="error-subtitle">
            The application encountered an unexpected error
          </p>
        </div>

        <div className="error-terminal">
          <TerminalWindow title="Error Diagnostics">
            <TerminalContent commands={terminalCommands} animated={false} />
          </TerminalWindow>
        </div>

        <div className="error-actions">
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/'}
          >
            <span className="error-prompt">$ </span>
            Return Home
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>

        <div className="error-details">
          <details className="error-collapsible">
            <summary>Technical Details</summary>
            <div className="error-stack">
              <pre>{JSON.stringify({ 
                error: errorMessage, 
                details: errorDetails,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent 
              }, null, 2)}</pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}