import React from 'react';
import { highlightInputText } from '../../../lib/terminal/syntaxHighlight';
import { getTokenSuggestions } from '../../../lib/terminal/ghostAutocomplete';

interface TerminalPromptProps {
  input: string;
  setInput: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  cwd: string;
  hideGhost?: boolean;
}

export const TerminalPrompt: React.FC<TerminalPromptProps> = ({
  input, setInput, onKeyDown, inputRef, cwd, hideGhost,
}) => {
  const { ghostText } = getTokenSuggestions(input, cwd);
  const ghost = hideGhost ? '' : ghostText;

  return (
    <div className="flex items-center space-x-2 relative font-mono text-xs sm:text-sm py-0.5 mt-1">
      <span className="text-[#9ece6a] font-bold shrink-0">ilu@fwm-host</span>
      <span className="text-slate-500 shrink-0">:</span>
      <span className="text-[#7dcfff] shrink-0">{cwd}$</span>

      <div className="relative flex-1 flex items-center overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0 pointer-events-none whitespace-pre flex items-center font-mono text-xs sm:text-sm">
          {highlightInputText(input)}
          {ghost && <span className="text-slate-600 opacity-60">{ghost}</span>}
        </div>

        {/* Foreground Layer */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full bg-transparent text-transparent caret-amber-400 outline-none font-mono text-xs sm:text-sm z-10"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
        />
      </div>
    </div>
  );
};