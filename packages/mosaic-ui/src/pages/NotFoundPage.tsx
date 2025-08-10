import React from 'react';
import { Navigation, TerminalWindow, TerminalContent } from '../components';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

const navItems = [
  { label: 'Documentation', href: '/docs' },
  { label: 'Components', href: '/components' },
  { label: 'Examples', href: '/examples' },
  { label: 'GitHub', href: 'https://github.com/mosaic' }
];

const notFoundCommands = [
  {
    command: 'mosaic navigate /unknown-page',
    output: '❌ Error 404: Route not found'
  },
  {
    command: 'ls -la /routes',
    output: 'total 4\ndrwxr-xr-x  2 mosaic mosaic 4096 Jan 23 12:00 .\ndrwxr-xr-x  3 mosaic mosaic 4096 Jan 23 12:00 ..\n-rw-r--r--  1 mosaic mosaic    0 Jan 23 12:00 home\n-rw-r--r--  1 mosaic mosaic    0 Jan 23 12:00 docs\n-rw-r--r--  1 mosaic mosaic    0 Jan 23 12:00 dashboard\n-rw-r--r--  1 mosaic mosaic    0 Jan 23 12:00 login'
  },
  {
    command: 'mosaic suggest --similar',
    output: 'Did you mean?\n  /docs       - Documentation\n  /dashboard  - Control Panel\n  /login      - Authentication'
  }
];

export const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page">
      <Navigation 
        items={navItems}
        version="v0.1.0"
        onCommandPalette={() => console.log('Command palette opened')}
      />

      <div className="not-found-container">
        <div className="not-found-content">
          <div className="not-found-header">
            <h1 className="not-found-title">
              <span className="error-code">404</span>
              <span className="not-found-prompt">$ </span>
              Page Not Found
            </h1>
            <p className="not-found-subtitle">
              The page you're looking for doesn't exist in our system.
            </p>
          </div>

          <div className="not-found-terminal">
            <TerminalWindow title="Navigation Error">
              <TerminalContent commands={notFoundCommands} animated={true} />
            </TerminalWindow>
          </div>

          <div className="not-found-actions">
            <Link to="/" className="btn btn-primary">
              <span className="not-found-prompt">$ </span>
              cd ~/home
            </Link>
            <Link to="/docs" className="btn btn-secondary">
              View Documentation
            </Link>
            <button 
              className="btn btn-secondary"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>

          <div className="not-found-suggestions">
            <h3 className="suggestions-title">Popular destinations:</h3>
            <div className="suggestions-grid">
              <Link to="/" className="suggestion-card">
                <div className="suggestion-icon">🏠</div>
                <h4>Home</h4>
                <p>Main landing page</p>
              </Link>
              <Link to="/docs" className="suggestion-card">
                <div className="suggestion-icon">📚</div>
                <h4>Documentation</h4>
                <p>Guides and API reference</p>
              </Link>
              <Link to="/dashboard" className="suggestion-card">
                <div className="suggestion-icon">📊</div>
                <h4>Dashboard</h4>
                <p>Monitor your agents</p>
              </Link>
              <Link to="/login" className="suggestion-card">
                <div className="suggestion-icon">🔐</div>
                <h4>Login</h4>
                <p>Access your account</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};