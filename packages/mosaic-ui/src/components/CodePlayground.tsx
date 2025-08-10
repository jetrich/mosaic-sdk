import React, { useState } from 'react';
import { CodeBlock } from './CodeBlock';
import './CodePlayground.css';

interface CodePlaygroundProps {
  initialCode: string;
  language?: string;
  filename?: string;
  className?: string;
  onCodeChange?: (code: string) => void;
  runnable?: boolean;
}

interface ConsoleOutput {
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: number;
}

export const CodePlayground: React.FC<CodePlaygroundProps> = ({
  initialCode,
  language = 'typescript',
  filename = 'example.ts',
  className = '',
  onCodeChange,
  runnable = true
}) => {
  const [code, setCode] = useState(initialCode);
  const [isEditing, setIsEditing] = useState(false);
  const [output, setOutput] = useState<ConsoleOutput[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleCodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = event.target.value;
    setCode(newCode);
    onCodeChange?.(newCode);
  };

  const handleRun = async () => {
    if (!runnable) return;

    setIsRunning(true);
    setOutput([]);

    try {
      // Simulate code execution with delayed output
      const lines = code.split('\n');
      const newOutput: ConsoleOutput[] = [];

      // Mock execution simulation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Parse and simulate console output
      lines.forEach((line, index) => {
        if (line.trim().startsWith('console.log')) {
          const match = line.match(/console\.log\(['"`](.*)['"`]\)/);
          if (match) {
            newOutput.push({
              type: 'log',
              message: match[1],
              timestamp: Date.now() + index * 100
            });
          }
        } else if (line.trim().startsWith('console.error')) {
          const match = line.match(/console\.error\(['"`](.*)['"`]\)/);
          if (match) {
            newOutput.push({
              type: 'error',
              message: match[1],
              timestamp: Date.now() + index * 100
            });
          }
        } else if (line.trim().startsWith('throw new Error')) {
          const match = line.match(/throw new Error\(['"`](.*)['"`]\)/);
          if (match) {
            newOutput.push({
              type: 'error',
              message: `Error: ${match[1]}`,
              timestamp: Date.now() + index * 100
            });
          }
        }
      });

      // Add success message if no errors
      if (!newOutput.some(out => out.type === 'error')) {
        newOutput.push({
          type: 'info',
          message: '✅ Code executed successfully',
          timestamp: Date.now() + lines.length * 100
        });
      }

      setOutput(newOutput);
    } catch (error) {
      setOutput([{
        type: 'error',
        message: `Runtime Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput([]);
    onCodeChange?.(initialCode);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`code-playground ${className}`}>
      <div className="code-playground-header">
        <div className="code-playground-tabs">
          <button 
            className={`code-playground-tab ${!isEditing ? 'active' : ''}`}
            onClick={() => setIsEditing(false)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            Preview
          </button>
          <button 
            className={`code-playground-tab ${isEditing ? 'active' : ''}`}
            onClick={() => setIsEditing(true)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"/>
            </svg>
            Edit
          </button>
        </div>
        
        <div className="code-playground-actions">
          <button 
            className="code-playground-reset"
            onClick={handleReset}
            title="Reset to original code"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.705 8.005a.75.75 0 01.834.656 5.5 5.5 0 109.592-2.97l-1.204-1.204a.25.25 0 00-.427.177V7.5a.75.75 0 01-.75.75H4.5a.25.25 0 00-.177.427l1.204 1.204a.25.25 0 00.427-.177V8.739a.75.75 0 01.75-.75h2.19a4 4 0 11-6.62 3.417.75.75 0 01-.656-.834z"/>
            </svg>
            Reset
          </button>
          
          {runnable && (
            <button 
              className="code-playground-run"
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="spinning">
                  <path d="M8 12a4 4 0 100-8 4 4 0 000 8zM8 0a8 8 0 100 16A8 8 0 008 0z" opacity="0.25"/>
                  <path d="M12 8a4 4 0 00-4-4V0a8 8 0 018 8h-4z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM6.5 5.5v5a.5.5 0 00.757.429l4-2.5a.5.5 0 000-.858l-4-2.5A.5.5 0 006.5 5.5z"/>
                </svg>
              )}
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
          )}
        </div>
      </div>

      <div className="code-playground-content">
        {isEditing ? (
          <div className="code-playground-editor">
            <div className="code-editor-header">
              <span className="code-editor-filename">{filename}</span>
            </div>
            <textarea
              className="code-editor-textarea"
              value={code}
              onChange={handleCodeChange}
              spellCheck={false}
              placeholder="Enter your code here..."
            />
          </div>
        ) : (
          <CodeBlock 
            code={code}
            language={language}
            filename={filename}
            showLineNumbers={true}
          />
        )}
      </div>

      {runnable && output.length > 0 && (
        <div className="code-playground-output">
          <div className="code-playground-output-header">
            <span className="code-playground-output-title">Console Output</span>
            <button 
              className="code-playground-clear"
              onClick={() => setOutput([])}
              title="Clear output"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.5 1a1 1 0 00-1 1v12a1 1 0 001 1h11a1 1 0 001-1V2a1 1 0 00-1-1h-11zM4 4h8v1H4V4zm0 3h8v1H4V7zm0 3h5v1H4v-1z"/>
              </svg>
              Clear
            </button>
          </div>
          <div className="code-playground-console">
            {output.map((entry, index) => (
              <div key={index} className={`console-entry console-${entry.type}`}>
                <span className="console-timestamp">
                  {formatTimestamp(entry.timestamp)}
                </span>
                <span className="console-message">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};