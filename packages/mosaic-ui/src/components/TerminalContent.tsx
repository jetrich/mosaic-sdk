import React, { useEffect, useState } from 'react';
import './TerminalContent.css';

interface Command {
  prompt?: string;
  command: string;
  output?: string;
}

interface TerminalContentProps {
  commands?: Command[];
  animated?: boolean;
  prompt?: string;
}

export const TerminalContent: React.FC<TerminalContentProps> = ({
  commands = [],
  animated = true,
  prompt = '$ '
}) => {
  const [displayedCommands, setDisplayedCommands] = useState<Command[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typingIndex, setTypingIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!animated) {
      setDisplayedCommands(commands);
      return;
    }

    if (currentIndex < commands.length) {
      const currentCommand = commands[currentIndex];
      setIsTyping(true);
      
      // Type out the command
      const typeInterval = setInterval(() => {
        if (typingIndex < currentCommand.command.length) {
          setTypingIndex(prev => prev + 1);
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
          
          // Show output after a delay
          setTimeout(() => {
            setDisplayedCommands(prev => [...prev, currentCommand]);
            setCurrentIndex(prev => prev + 1);
            setTypingIndex(0);
          }, 500);
        }
      }, 50);

      return () => clearInterval(typeInterval);
    }
  }, [commands, currentIndex, typingIndex, animated]);

  const currentTypingCommand = commands[currentIndex];
  const typedPortion = currentTypingCommand?.command.slice(0, typingIndex) || '';

  return (
    <div className="terminal-content">
      {displayedCommands.map((cmd, index) => (
        <div key={index} className="terminal-line-group">
          <div className="terminal-line">
            <span className="terminal-prompt">{cmd.prompt || prompt}</span>
            <span className="terminal-command">{cmd.command}</span>
          </div>
          {cmd.output && (
            <div className="terminal-output">{cmd.output}</div>
          )}
        </div>
      ))}
      
      {isTyping && currentTypingCommand && (
        <div className="terminal-line">
          <span className="terminal-prompt">{currentTypingCommand.prompt || prompt}</span>
          <span className="terminal-command">
            {typedPortion}
            <span className="terminal-cursor"></span>
          </span>
        </div>
      )}
      
      {!isTyping && currentIndex >= commands.length && (
        <div className="terminal-line">
          <span className="terminal-prompt">{prompt}</span>
          <span className="terminal-cursor"></span>
        </div>
      )}
    </div>
  );
};