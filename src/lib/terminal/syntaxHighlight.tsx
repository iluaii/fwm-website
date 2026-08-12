import React from 'react';

export const highlightInputText = (text: string) => {
  if (!text) return null;
  const parts = text.split(' ');

  return (
    <span>
      {parts.map((part, i) => {
        let color = 'text-[#c0caf5]';

        if (i === 0) {
          if (['fwmctl', 'cat', 'ls', 'clear', 'help', 'whoami', 'uname'].includes(part.toLowerCase())) {
            color = 'text-[#7aa2f7] font-bold';
          }
        } else if (i === 1) {
          if (['state', 'windows', 'set', 'spawn', 'kill', 'calm', 'dispatch'].includes(part.toLowerCase())) {
            color = 'text-[#bb9af7]';
          } else if (part.endsWith('.md') || part.includes('config') || part.includes('txt')) {
            color = 'text-[#e0af68]';
          }
        } else if (i === 2) {
          if (['gravity', 'mass', 'bsp', 'mode', 'physics.gravity', 'physics.mass'].includes(part.toLowerCase())) {
            color = 'text-[#e0af68]';
          }
        } else if (i >= 3) {
          if (!isNaN(Number(part))) color = 'text-[#ff9e64]';
          else color = 'text-[#9ece6a]';
        }

        return (
          <span key={i} className={color}>
            {part}{i < parts.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </span>
  );
};

export const HighlightedCommand: React.FC<{ cmd: string }> = ({ cmd }) => (
  <span>{highlightInputText(cmd)}</span>
);

export const HighlightedJson: React.FC<{ json: string }> = ({ json }) => {
  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    const formatted = JSON.stringify(parsed, null, 2);
    const tokens = formatted.split('\n');

    return (
      <pre className="font-mono text-xs sm:text-sm leading-relaxed select-text my-1">
        {tokens.map((line, idx) => {
          const lineHighlighted = line.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match) => {
              let cls = 'text-[#ff9e64]';
              if (/^"/.test(match)) {
                if (/:$/.test(match)) cls = 'text-[#7aa2f7] font-semibold';
                else cls = 'text-[#9ece6a]';
              } else if (/true|false/.test(match)) cls = 'text-[#bb9af7]';
              else if (/null/.test(match)) cls = 'text-[#f7768e]';
              return `<span class="${cls}">${match}</span>`;
            }
          );
          return <div key={idx} dangerouslySetInnerHTML={{ __html: lineHighlighted }} />;
        })}
      </pre>
    );
  } catch {
    return <span className="text-[#c0caf5]">{json}</span>;
  }
};