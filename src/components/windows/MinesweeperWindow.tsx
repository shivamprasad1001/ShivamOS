import React, { useCallback, useEffect, useRef, useState } from 'react';
import { selectFocusedWindowId, useWindowStore } from '../../store/windowStore';
import {
  countFlags,
  createEmptyBoard,
  MINESWEEPER_PRESETS,
  revealCell,
  toggleFlag,
  type MinesweeperBoard,
  type MinesweeperDifficulty,
} from '../../utils/games/minesweeperLogic';
import { playRetroSound } from '../../utils/sound';
import { MineBombIcon, MineFlagIcon } from '../PixelIcons';

const NUMBER_COLORS: Record<number, string> = {
  1: '#0000AA',
  2: '#1C7C54',
  3: '#E4572E',
  4: '#4B2E83',
  5: '#8C2D19',
  6: '#2A9D8F',
  7: '#1A1A1A',
  8: '#4A463B',
};

const MINESWEEPER_BEST_KEY = 'shivamos_minesweeper_best_v1';

type MinesweeperBestTimes = Record<MinesweeperDifficulty, number | null>;

function readMinesweeperBest(): MinesweeperBestTimes {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(MINESWEEPER_BEST_KEY) : null;
    if (!raw) return { beginner: null, intermediate: null, expert: null };
    const parsed = JSON.parse(raw);
    return {
      beginner: typeof parsed?.beginner === 'number' ? parsed.beginner : null,
      intermediate: typeof parsed?.intermediate === 'number' ? parsed.intermediate : null,
      expert: typeof parsed?.expert === 'number' ? parsed.expert : null,
    };
  } catch {
    return { beginner: null, intermediate: null, expert: null };
  }
}

export function MinesweeperWindow() {
  const soundEnabled = useWindowStore((s) => s.soundEnabled);
  const isFocused = useWindowStore(
    (s) => selectFocusedWindowId(s.windows) === 'game-minesweeper'
  );

  const [difficulty, setDifficulty] = useState<MinesweeperDifficulty>('beginner');
  const [board, setBoard] = useState<MinesweeperBoard>(() => createEmptyBoard('beginner'));
  const [bestTimes, setBestTimes] = useState<MinesweeperBestTimes>(readMinesweeperBest);
  const [flagMode, setFlagMode] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [cursor, setCursor] = useState<{ r: number; c: number }>({ r: 0, c: 0 });

  const soundRef = useRef(soundEnabled);
  const focusedRef = useRef(isFocused);
  const cursorRef = useRef(cursor);
  const boardRef = useRef(board);
  const flagModeRef = useRef(flagMode);

  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    focusedRef.current = isFocused;
  }, [isFocused]);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    flagModeRef.current = flagMode;
  }, [flagMode]);

  useEffect(() => {
    if (board.status !== 'playing') return;
    const timer = window.setInterval(() => {
      setElapsedSec((prev) => Math.min(999, prev + 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [board.status]);

  const handleReset = useCallback(
    (nextDiff: MinesweeperDifficulty = difficulty) => {
      playRetroSound('click', soundRef.current);
      setDifficulty(nextDiff);
      setBoard(createEmptyBoard(nextDiff));
      setElapsedSec(0);
      setCursor({ r: 0, c: 0 });
    },
    [difficulty]
  );

  const handleCellAction = useCallback(
    (row: number, col: number, forceFlag = false) => {
      const currentBoard = boardRef.current;
      if (currentBoard.status === 'won' || currentBoard.status === 'lost') return;

      if (forceFlag || flagModeRef.current) {
        const next = toggleFlag(currentBoard, row, col);
        if (next !== currentBoard) {
          playRetroSound('click', soundRef.current);
          setBoard(next);
        }
        return;
      }

      const next = revealCell(currentBoard, row, col);
      if (next.status === 'lost') {
        playRetroSound('boom', soundRef.current);
      } else if (next.status === 'won') {
        playRetroSound('win', soundRef.current);
        setBestTimes((prev) => {
          const cur = prev[difficulty];
          const best = cur === null ? elapsedSec : Math.min(cur, elapsedSec);
          const updated = { ...prev, [difficulty]: best };
          try {
            window.localStorage.setItem(MINESWEEPER_BEST_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
      } else if (next !== currentBoard) {
        playRetroSound('hit', soundRef.current);
      }
      setBoard(next);
    },
    [difficulty, elapsedSec]
  );

  // Keyboard navigation & actions for gamepad D-pad and buttons
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!focusedRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      const { r, c } = cursorRef.current;
      const curBoard = boardRef.current;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setCursor({ r: Math.max(0, r - 1), c });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setCursor({ r: Math.min(curBoard.rows - 1, r + 1), c });
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setCursor({ r, c: Math.max(0, c - 1) });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setCursor({ r, c: Math.min(curBoard.cols - 1, c + 1) });
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCellAction(r, c, false);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleCellAction(r, c, true);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCellAction, handleReset]);

  const minesRemaining = board.mines - countFlags(board);
  const statusLabel =
    board.status === 'won'
      ? 'CLEARED!'
      : board.status === 'lost'
        ? 'DETONATED'
        : board.status === 'playing'
          ? 'ACTIVE'
          : 'READY';

  return (
    <div className="p-3 sm:p-4 flex flex-col items-center gap-3 select-none">
      {/* Difficulty Selector Strip */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1" role="group" aria-label="Minesweeper board size">
          {(Object.keys(MINESWEEPER_PRESETS) as MinesweeperDifficulty[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleReset(key)}
              aria-pressed={difficulty === key}
              className={`px-2 py-1 text-[11px] font-bold border-2 border-[#1A1A1A] ${
                difficulty === key
                  ? 'bg-[#1A1A1A] text-[#F4EFE0]'
                  : 'bg-[#F4EFE0] text-[#1A1A1A] hover:bg-[#E8E0C8]'
              }`}
            >
              {MINESWEEPER_PRESETS[key].label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setFlagMode((v) => !v)}
          aria-pressed={flagMode}
          className={`px-2.5 py-1 text-[11px] font-bold border-2 border-[#1A1A1A] flex items-center gap-1.5 ${
            flagMode
              ? 'bg-[#E4572E] text-[#F4EFE0]'
              : 'bg-[#E8E0C8] text-[#1A1A1A] hover:bg-[#D8CFB2]'
          }`}
        >
          <MineFlagIcon size={12} />
          <span>{flagMode ? 'Flag Mode: ON' : 'Flag Mode'}</span>
        </button>
      </div>

      {/* Classic Retro LED HUD Header */}
      <div className="w-full border-2 border-[#1A1A1A] bg-[#E8E0C8] px-3 py-2 flex items-center justify-between gap-2">
        <div
          aria-label={`Mines remaining ${minesRemaining}`}
          className="border-2 border-[#1A1A1A] bg-[#0B130B] text-[#33FF66] px-2 py-0.5 text-lg leading-none tabular-nums"
          style={{ fontFamily: 'var(--font-terminal)' }}
        >
          {String(Math.max(-99, minesRemaining)).padStart(3, '0')}
        </div>

        <button
          type="button"
          onClick={() => handleReset(difficulty)}
          className={`os-btn px-3 py-1 text-xs font-bold ${
            board.status === 'won'
              ? 'os-btn-teal'
              : board.status === 'lost'
                ? 'os-btn-primary'
                : ''
          }`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {statusLabel} · Reset
        </button>

        <div className="flex items-center gap-1.5">
          <div
            aria-label={`Elapsed time ${elapsedSec} seconds`}
            className="border-2 border-[#1A1A1A] bg-[#0B130B] text-[#33FF66] px-2 py-0.5 text-lg leading-none tabular-nums"
            style={{ fontFamily: 'var(--font-terminal)' }}
          >
            {String(elapsedSec).padStart(3, '0')}s
          </div>
          <div
            title="Best clear time stored in localStorage"
            className="hidden sm:block border-2 border-[#1A1A1A] bg-[#E8E0C8] px-1.5 py-0.5 text-[10px] font-bold text-[#2A9D8F] tabular-nums"
          >
            BEST: {bestTimes[difficulty] !== null ? `${bestTimes[difficulty]}s` : '--'}
          </div>
        </div>
      </div>

      {/* Board Grid */}
      <div className="w-full overflow-x-auto flex justify-center">
        <div
          role="grid"
          aria-label="Minesweeper grid"
          className="inline-grid border-2 border-[#1A1A1A] bg-[#1A1A1A] gap-[2px] p-[2px]"
          style={{
            gridTemplateColumns: `repeat(${board.cols}, minmax(26px, 32px))`,
          }}
        >
          {board.cells.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const isExploded =
                board.explodedAt?.row === rIdx && board.explodedAt?.col === cIdx;
              const cellLabel = cell.isRevealed
                ? cell.isMine
                  ? `Mine at row ${rIdx + 1} column ${cIdx + 1}`
                  : `${cell.adjacentMines || 'Empty'} at row ${rIdx + 1} column ${cIdx + 1}`
                : cell.isFlagged
                  ? `Flagged cell row ${rIdx + 1} column ${cIdx + 1}`
                  : `Hidden cell row ${rIdx + 1} column ${cIdx + 1}`;

              const isCursor = cursor.r === rIdx && cursor.c === cIdx;

              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  type="button"
                  aria-label={cellLabel}
                  onClick={() => {
                    setCursor({ r: rIdx, c: cIdx });
                    handleCellAction(rIdx, cIdx, false);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCursor({ r: rIdx, c: cIdx });
                    handleCellAction(rIdx, cIdx, true);
                  }}
                  className={`relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-bold leading-none p-0 ${
                    isCursor ? 'outline outline-2 outline-offset-[-2px] outline-[#E4572E] z-10' : ''
                  } ${
                    cell.isRevealed
                      ? isExploded
                        ? 'bg-[#E4572E] text-[#F4EFE0]'
                        : 'bg-[#E8E0C8] text-[#1A1A1A]'
                      : 'bg-[#F4EFE0] hover:bg-[#D8CFB2] shadow-[inset_-2px_-2px_0_0_#D8CFB2,inset_2px_2px_0_0_#ffffff]'
                  }`}
                >
                  {cell.isRevealed ? (
                    cell.isMine ? (
                      <MineBombIcon size={14} />
                    ) : cell.adjacentMines > 0 ? (
                      <span style={{ color: NUMBER_COLORS[cell.adjacentMines] }}>
                        {cell.adjacentMines}
                      </span>
                    ) : null
                  ) : cell.isFlagged ? (
                    <MineFlagIcon size={14} />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Status Footer */}
      <div className="w-full text-[11px] text-[#4A463B] flex flex-wrap items-center justify-between gap-2">
        <span>First click is always safe. Right-click or use Flag Mode to mark mines.</span>
        {board.status === 'won' && (
          <span className="font-bold text-[#2A9D8F]">
            All {board.mines} mines neutralized in {elapsedSec}s!
          </span>
        )}
      </div>
    </div>
  );
}
