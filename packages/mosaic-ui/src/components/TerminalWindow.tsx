import React from 'react';
import './TerminalWindow.css';

interface TerminalWindowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const TerminalWindow: React.FC<TerminalWindowProps> = ({ 
  title = 'mosaic@terminal', 
  children,
  className = ''
}) => {
  return (
    <div className={`terminal-window ${className}`}>
      <div className="terminal-header">
        <div className="terminal-controls">
          <button className="terminal-control terminal-close" aria-label="Close">
            <span className="terminal-control-icon"></span>
          </button>
          <button className="terminal-control terminal-minimize" aria-label="Minimize">
            <span className="terminal-control-icon"></span>
          </button>
          <button className="terminal-control terminal-maximize" aria-label="Maximize">
            <span className="terminal-control-icon"></span>
          </button>
        </div>
        <div className="terminal-title">{title}</div>
        <div className="terminal-spacer"></div>
      </div>
      <div className="terminal-body">
        {children}
      </div>
    </div>
  );
};