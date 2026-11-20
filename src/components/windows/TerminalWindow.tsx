import React, { useEffect, useRef, useState } from 'react';
import { useWindowStore } from '../../store/windowStore';
import {
  autocompleteTerminalInput,
  executeTerminalCommand,
  navigateHistory,
  type TerminalEntry,
} from '../../utils/terminalLogic';
import type { ViewportSize } from '../../utils/windowLogic';

interface TerminalWindowProps {
  viewport: ViewportSize;
}

const INITIAL_ENTRIES: TerminalEntry[] = [
  { id: 'init-1', kind: 'accent', text: 'ShivamOS Command Shell v7.96 [tty01]' },
  {
    id: 'init-2',
    kind: 'output',
    text: 'Type "help", "whoami", "ls projects", "ls games", "open snake", or "open resume".',
  },
];

const QUICK_COMMANDS = ['help', 'ls projects', 'ls games', 'open snake', 'open resume'];

export function TerminalWindow({ viewport }: TerminalWindowProps) {
  const openWindow = useWindowStore((s) => s.openWindow);
  const setWallpaper = useWindowStore((s) => s.setWallpaper);
  const triggerBsod = useWindowStore((s) => s.triggerBsod);
  const clearSignal = useWindowStore((s) => s.terminalClearSignal);

  const [entries, setEntries] = useState<TerminalEntry[]>(INITIAL_ENTRIES);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clearSignal > 0) {
      setEntries([{ id: `clr-${clearSignal}`, kind: 'accent', text: 'Terminal buffer cleared.' }]);
    }
  }, [clearSignal]);

  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [entries]);

  const runCommand = (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    const promptLine: TerminalEntry = {
      id: `in-${Date.now()}-${Math.random()}`,
      kind: 'input',
      text: `shivam@os:~$ ${trimmed}`,
    };

    const result = executeTerminalCommand(trimmed);

    if (trimmed) {
      setHistory((prev) => [...prev, trimmed]);
    }
    setHistoryIndex(-1);
    setInput('');

    if (result.clear) {
      setEntries([]);
      return;
    }

    const outLines: TerminalEntry[] = result.lines.map((line, i) => ({
      id: `out-${Date.now()}-${i}-${Math.random()}`,
      kind: line.kind,
      text: line.text,
    }));

    setEntries((prev) => [...prev, promptLine, ...outLines]);

    if (result.openWindow) {
      openWindow(result.openWindow, viewport);
    }
    if (result.setWallpaper) {
      setWallpaper(result.setWallpaper);
    }
    if (result.triggerBsod) {
      window.setTimeout(() => triggerBsod(), 250);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runCommand(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = navigateHistory(history, historyIndex, 'up');
      setHistoryIndex(next.nextIndex);
      setInput(next.value);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = navigateHistory(history, historyIndex, 'down');
      setHistoryIndex(next.nextIndex);
      setInput(next.value);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setInput((prev) => autocompleteTerminalInput(prev));
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="min-h-full bg-[#0B130B] text-[#33FF66] p-4 flex flex-col justify-between gap-3"
      style={{ fontFamily: 'var(--font-terminal)' }}
    >
      {/* Output log */}
      <div className="space-y-1 text-lg sm:text-xl leading-snug break-words" aria-live="polite">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={
              entry.kind === 'error'
                ? 'text-[#E4572E]'
                : entry.kind === 'accent'
                  ? 'text-[#F4EFE0]'
                  : entry.kind === 'input'
                    ? 'text-[#33FF66] font-bold pt-1'
                    : 'text-[#33FF66]/90 whitespace-pre-wrap'
            }
          >
            {entry.text}
          </div>
        ))}

        {/* Active Prompt Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
          <label htmlFor="terminal-cmd-input" className="text-[#33FF66] shrink-0 select-none">
            shivam@os:~$
          </label>
          <input
            ref={inputRef}
            id="terminal-cmd-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="type help..."
            className="flex-1 min-w-0 bg-transparent border-0 text-[#33FF66] placeholder:text-[#33FF66]/40 focus:outline-none text-lg sm:text-xl p-0"
            style={{ fontFamily: 'var(--font-terminal)' }}
          />
          <button
            type="submit"
            className="border border-[#33FF66] px-2 py-0.5 text-sm text-[#33FF66] hover:bg-[#33FF66] hover:text-[#0B130B] shrink-0"
          >
            RUN
          </button>
        </form>
        <div ref={endRef} />
      </div>

      {/* Quick clickable command bar for touch / quick inspection */}
      <div className="border-t border-[#33FF66]/35 pt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-sm text-[#33FF66]/70 mr-1">QUICK:</span>
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              runCommand(cmd);
            }}
            className="border border-[#33FF66]/60 px-2 py-0.5 text-sm leading-none text-[#33FF66] hover:bg-[#33FF66] hover:text-[#0B130B]"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
