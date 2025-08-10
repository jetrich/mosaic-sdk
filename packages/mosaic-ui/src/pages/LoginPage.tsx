import React, { useState } from 'react';
import { TerminalWindow, TerminalContent } from '../components';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [, setShowGitHub] = useState(false);

  const loginCommands = [
    {
      command: 'mosaic auth login',
      output: 'Authenticating with MosAIc...'
    },
    {
      command: 'npm login --registry https://registry.mosaic.dev',
      output: 'Username: _\nPassword: ********\nEmail: dev@mosaic.dev\n\n✓ Logged in as developer'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo Section */}
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-prompt">$ </span>
            <span className="logo-text">mosaic</span>
            <span className="logo-cursor">_</span>
          </div>
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Sign in to your MosAIc account</p>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="developer@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" className="checkbox-input" />
              <span>Remember me</span>
            </label>
            <a href="/forgot-password" className="form-link">Forgot password?</a>
          </div>

          <button 
            type="submit" 
            className={`btn btn-primary btn-full ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider">
          <span>or</span>
        </div>

        {/* OAuth Options */}
        <div className="oauth-buttons">
          <button 
            className="oauth-button"
            onClick={() => setShowGitHub(true)}
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            Continue with GitHub
          </button>

          <button className="oauth-button">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Terminal Alternative */}
        <div className="terminal-section">
          <p className="terminal-title">Prefer the command line?</p>
          <TerminalWindow title="CLI Authentication">
            <TerminalContent commands={loginCommands} animated={true} />
          </TerminalWindow>
        </div>

        {/* Sign Up Link */}
        <p className="login-footer">
          Don't have an account? 
          <a href="/signup" className="login-link"> Create one</a>
        </p>
      </div>

      {/* Background Effect */}
      <div className="login-background">
        <div className="grid-pattern"></div>
      </div>
    </div>
  );
};