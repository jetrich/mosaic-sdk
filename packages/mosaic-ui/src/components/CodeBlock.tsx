import React, { useState } from 'react';
import './CodeBlock.css';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
  filename?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'typescript',
  showLineNumbers = true,
  className = '',
  filename
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const lines = code.split('\n');
  const lineNumberWidth = lines.length.toString().length;

  return (
    <div className={`code-block ${className}`}>
      {(filename || language) && (
        <div className="code-block-header">
          {filename && <span className="code-block-filename">{filename}</span>}
          {!filename && <span className="code-block-language">{language}</span>}
          <button 
            className="code-block-copy"
            onClick={handleCopy}
            aria-label={copied ? 'Copied!' : 'Copy code'}
          >
            {copied ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.626 3.533a.249.249 0 00-.126.217v9.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25v-9.5a.249.249 0 00-.126-.217.75.75 0 01.752-1.298c.541.313.874.89.874 1.515v9.5A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25v-9.5c0-.625.333-1.202.874-1.515a.75.75 0 01.752 1.298zM5.75 1A1.75 1.75 0 004 2.75v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5A1.75 1.75 0 0010.25 1h-4.5zm1.75 1.5h1.5v1.5h1.5v1.5H9v1.5H7.5V5.5H6V4h1.5V2.5z"/>
              </svg>
            )}
            <span className="code-block-copy-text">
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>
        </div>
      )}
      <div className="code-block-content">
        {showLineNumbers && (
          <div className="code-block-line-numbers" aria-hidden="true">
            {lines.map((_, index) => (
              <div key={index} className="code-block-line-number">
                {(index + 1).toString().padStart(lineNumberWidth, ' ')}
              </div>
            ))}
          </div>
        )}
        <pre className="code-block-pre">
          <code className={`language-${language}`}>
            {lines.map((line, index) => (
              <div key={index} className="code-block-line">
                <span dangerouslySetInnerHTML={{ 
                  __html: highlightSyntax(line, language) 
                }} />
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};

// Basic syntax highlighting function
function highlightSyntax(code: string, language: string): string {
  // This is a simplified syntax highlighter
  // In production, you'd use Prism.js or similar
  
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  let highlighted = escapeHtml(code);

  if (language === 'typescript' || language === 'javascript') {
    // Keywords
    const keywords = /\b(const|let|var|function|class|if|else|for|while|return|import|export|from|interface|type|extends|implements|new|this|super|async|await|try|catch|throw|finally|typeof|instanceof|in|of|break|continue|switch|case|default|do)\b/g;
    highlighted = highlighted.replace(keywords, '<span class="syntax-keyword">$1</span>');
    
    // Strings
    highlighted = highlighted.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, '<span class="syntax-string">$&</span>');
    
    // Comments
    highlighted = highlighted.replace(/(\/\/.*$)|(\/\*[\s\S]*?\*\/)/gm, '<span class="syntax-comment">$&</span>');
    
    // Functions
    highlighted = highlighted.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, '<span class="syntax-function">$1</span>');
    
    // Numbers
    highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="syntax-number">$1</span>');
  }

  return highlighted;
}