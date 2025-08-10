import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import './Navigation.css';

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

interface NavigationProps {
  items?: NavItem[];
  logo?: string;
  version?: string;
  showCommandPalette?: boolean;
  onCommandPalette?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  items = [],
  logo = 'mosaic',
  version = 'v0.1.0',
  showCommandPalette = true,
  onCommandPalette
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const location = useLocation();

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      onCommandPalette?.();
    }
  };

  return (
    <nav className="navigation" onKeyDown={handleKeyPress}>
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/" className="nav-logo">
            <span className="nav-logo-prompt">$ </span>
            <span className="nav-logo-text">{logo}</span>
            <span className={`nav-logo-cursor ${showCursor ? 'visible' : ''}`}>_</span>
          </Link>
          {version && (
            <span className="nav-version">
              <span className="nav-version-badge">{version}</span>
            </span>
          )}
        </div>

        <div className={`nav-center ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {items.map((item, index) => {
            const isActive = location.pathname === item.href || 
                           (item.href === '/docs' && location.pathname.startsWith('/docs')) ||
                           item.active;
            
            // Handle external links
            if (item.href.startsWith('http')) {
              return (
                <a
                  key={index}
                  href={item.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                </a>
              );
            }
            
            return (
              <Link
                key={index}
                to={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="nav-right">
          <ThemeToggle />
          
          {showCommandPalette && (
            <button 
              className="nav-command-palette"
              onClick={onCommandPalette}
              aria-label="Open command palette"
            >
              <span className="nav-command-icon">⌘</span>
              <span className="nav-command-text">K</span>
            </button>
          )}
          
          <Link 
            to="/login"
            className="nav-login"
            aria-label="Login with npm"
          >
            <span className="nav-login-prompt">$ </span>
            <span className="nav-login-text">npm login</span>
          </Link>

          <button
            className="nav-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="nav-mobile-toggle-line"></span>
            <span className="nav-mobile-toggle-line"></span>
            <span className="nav-mobile-toggle-line"></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="nav-mobile-menu">
          {items.map((item, index) => {
            const isActive = location.pathname === item.href || 
                           (item.href === '/docs' && location.pathname.startsWith('/docs')) ||
                           item.active;
            
            // Handle external links
            if (item.href.startsWith('http')) {
              return (
                <a
                  key={index}
                  href={item.href}
                  className={`nav-mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                </a>
              );
            }
            
            return (
              <Link
                key={index}
                to={item.href}
                className={`nav-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="nav-mobile-actions">
            {showCommandPalette && (
              <button 
                className="nav-command-palette mobile"
                onClick={() => {
                  onCommandPalette?.();
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="nav-command-icon">⌘</span>
                <span className="nav-command-text">K</span>
                <span className="nav-command-label">Command Palette</span>
              </button>
            )}
            <Link to="/login" className="nav-login mobile">
              <span className="nav-login-prompt">$ </span>
              <span className="nav-login-text">npm login</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};