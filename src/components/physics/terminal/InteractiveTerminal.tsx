import React, { useState, useRef, useEffect } from 'react';
import type { SandboxActions, TerminalOutputLine } from '../../../types/terminal';
import { executeCommand } from '../../../lib/terminal/commandExecutor';
import { getTokenSuggestions } from '../../../lib/terminal/ghostAutocomplete';
import { HighlightedCommand, HighlightedJson } from '../../../lib/terminal/syntaxHighlight';
import { TerminalPrompt } from './TerminalPrompt';

export const InteractiveTerminal: React.FC<{ sandbox: SandboxActions }> = ({ sandbox }) => {
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('~');
  const [runningProcess, setRunningProcess] = useState('fish — 80x24');
  
  const [history, setHistory] = useState<TerminalOutputLine[]>([
    { id: '1', type: 'text', content: 'fwmctl v0.2.1 UNIX IPC connected to /run/user/1000/fwm-wayland-0.sock' },
    { id: '2', type: 'text', content: 'Type "help", "ls", "fwmctl state", or "cd docs"' },
  ]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  const [tabCandidates, setTabCandidates] = useState<string[]>([]);
  const [tabPrefix, setTabPrefix] = useState<string>('');
  const [tabIdx, setTabIdx] = useState<number>(-1);
  const [isTabCycling, setIsTabCycling] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [history, tabCandidates, input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' && inputRef.current?.selectionStart === input.length) {
      const { ghostText, prefix, tokens } = getTokenSuggestions(input, cwd);
      if (ghostText) {
        e.preventDefault();
        setInput(prefix + (tokens[0] || ''));
        setIsTabCycling(false); setTabCandidates([]); setTabIdx(-1);
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      
      if (!isTabCycling || tabCandidates.length === 0) {
        const { tokens, prefix } = getTokenSuggestions(input, cwd);
        if (tokens.length > 0) {
          setTabCandidates(tokens);
          setTabPrefix(prefix);
          setTabIdx(0);
          setIsTabCycling(true);
          setInput(prefix + tokens[0]);
        }
      } else {
        const shift = e.shiftKey;
        const nextIdx = shift
          ? (tabIdx - 1 + tabCandidates.length) % tabCandidates.length
          : (tabIdx + 1) % tabCandidates.length;
        setTabIdx(nextIdx);
        setInput(tabPrefix + tabCandidates[nextIdx]);
      }
      return;
    }

    if (e.key !== 'Shift' && e.key !== 'Tab') {
      if (isTabCycling) {
        setIsTabCycling(false); setTabCandidates([]); setTabIdx(-1);
      }
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = historyIdx < cmdHistory.length - 1 ? historyIdx + 1 : historyIdx;
      setHistoryIdx(nextIdx);
      setInput(cmdHistory[cmdHistory.length - 1 - nextIdx] || '');
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(cmdHistory[cmdHistory.length - 1 - nextIdx] || '');
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInput('');
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;

      setCmdHistory((prev) => [...prev, trimmed]);
      setHistoryIdx(-1);
      setIsTabCycling(false); setTabCandidates([]); setTabIdx(-1);
      setRunningProcess(trimmed);

      const capturedCwd = cwd;
      const newLines = executeCommand(trimmed, cwd, setCwd, sandbox);

      setTimeout(() => setRunningProcess('fish — 80x24'), 600);

      if (newLines.length > 0 && newLines[0].content === '__CLEAR__') {
        setHistory([]);
      } else {
        setHistory((prev) => [
          ...prev,
          { id: Date.now().toString(), type: 'cmd', content: trimmed, cwd: capturedCwd },
          ...newLines,
        ]);
      }
      setInput('');
    }
  };

  return (
    <div 
      onClick={() => inputRef.current?.focus()} 
      // Removed pointer-events-auto so it inherits visibility states safely
      className="w-full h-[66vh] max-h-[520px] min-h-[380px] bg-[#090b10]/95 border border-amber-500/40 p-4 font-mono text-xs sm:text-sm flex flex-col justify-between shadow-2xl rounded-none select-text backdrop-blur-md cursor-text"
    >
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800/80 text-[10px] sm:text-xs text-slate-400 select-none shrink-0">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-red-500/80 rounded-full" />
          <span className="w-2.5 h-2.5 bg-amber-500/80 rounded-full" />
          <span className="w-2.5 h-2.5 bg-green-500/80 rounded-full" />
          <span className="ml-2 font-bold text-slate-300 truncate max-w-[200px]">{runningProcess}</span>
        </div>
        <span className="text-amber-400 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">IPC ACTIVE</span>
      </div>

      {/* Removed aggressive overscroll blocks so native scroll bubbling resumes when terminal hits bounds */}
      <div 
        ref={terminalContainerRef} 
        data-lenis-prevent 
        className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin flex flex-col justify-start"
      >
        {history.map((line) => (
          <div key={line.id} className="leading-relaxed">
            {line.type === 'cmd' ? (
              <div className="flex items-center space-x-2">
                <span className="text-[#9ece6a] font-bold">ilu@fwm-host</span>
                <span className="text-slate-500">:</span>
                <span className="text-[#7dcfff]">{line.cwd || '~'}$</span>
                <HighlightedCommand cmd={line.content} />
              </div>
            ) : line.type === 'json' ? (
              <HighlightedJson json={line.content} />
            ) : line.type === 'error' ? (
              <div className="text-[#f7768e] whitespace-pre-wrap">{line.content}</div>
            ) : line.type === 'success' ? (
              <div className="text-[#9ece6a] font-bold whitespace-pre-wrap">{line.content}</div>
            ) : (
              <div className="text-slate-300 whitespace-pre-wrap">{line.content}</div>
            )}
          </div>
        ))}

        <TerminalPrompt input={input} setInput={setInput} onKeyDown={handleKeyDown} inputRef={inputRef} cwd={cwd} hideGhost={isTabCycling} />

        {isTabCycling && tabCandidates.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1 pt-1.5 font-mono text-xs select-none border-t border-slate-800/40 my-1">
            {tabCandidates.map((cand, idx) => (
              <span
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setTabIdx(idx);
                  setInput(tabPrefix + cand);
                  inputRef.current?.focus();
                }}
                className={`cursor-pointer px-1.5 py-0.5 truncate ${idx === tabIdx ? 'bg-[#c0caf5] text-[#090b10] font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {cand}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};