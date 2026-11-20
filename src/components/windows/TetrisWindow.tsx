import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { selectFocusedWindowId, useWindowStore } from '../../store/windowStore';
import {
  composeTetrisGrid,
  createInitialTetrisState,
  getTetrisDropIntervalMs,
  hardDropTetris,
  moveTetrisPiece,
  rotateTetrisPiece,
  TETRIS_COLS,
  TETRIS_ROWS,
  TETROMINO_COLORS,
  TETROMINO_SHAPES,
  tickTetris,
  type TetrisState,
} from '../../utils/games/tetrisLogic';
import { playRetroSound } from '../../utils/sound';

const TETRIS_BEST_KEY = 'shivamos_tetris_best_v1';
const TETRIS_SAVE_KEY = 'shivamos_tetris_saved_game_v1';

function readBestScore(): number {
  try {
    return parseInt(window.localStorage.getItem(TETRIS_BEST_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

function readSavedTetrisGame(): TetrisState | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(TETRIS_SAVE_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.score === 'number' && (parsed.status === 'playing' || parsed.status === 'paused')) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function TetrisWindow() {
  const soundEnabled = useWindowStore((s) => s.soundEnabled);
  const isFocused = useWindowStore((s) => selectFocusedWindowId(s.windows) === 'game-tetris');

  const [game, setGame] = useState<TetrisState>(() => createInitialTetrisState('title'));
  const [bestScore, setBestScore] = useState<number>(readBestScore);
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() => Boolean(readSavedTetrisGame()));
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [clearFlash, setClearFlash] = useState(false);

  const soundRef = useRef(soundEnabled);
  const focusedRef = useRef(isFocused);
  const bestRef = useRef(bestScore);

  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    focusedRef.current = isFocused;
  }, [isFocused]);

  const updateBestIfNeeded = useCallback((score: number) => {
    if (score > bestRef.current) {
      bestRef.current = score;
      setBestScore(score);
      try {
        window.localStorage.setItem(TETRIS_BEST_KEY, String(score));
      } catch {
        // ignore storage restrictions
      }
    }
  }, []);

  const triggerClearFlash = useCallback(() => {
    setClearFlash(true);
    window.setTimeout(() => setClearFlash(false), 140);
  }, []);

  const handleStart = useCallback(() => {
    playRetroSound('open', soundRef.current);
    setGame(createInitialTetrisState('playing'));
  }, []);

  const handleTogglePause = useCallback(() => {
    setGame((prev) => {
      if (prev.status === 'playing') {
        playRetroSound('click', soundRef.current);
        const nextState: TetrisState = { ...prev, status: 'paused' };
        try {
          window.localStorage.setItem(TETRIS_SAVE_KEY, JSON.stringify(nextState));
          setHasSavedGame(true);
        } catch {
          // ignore
        }
        return nextState;
      }
      if (prev.status === 'paused') {
        playRetroSound('click', soundRef.current);
        return { ...prev, status: 'playing' };
      }
      return prev;
    });
  }, []);

  const handleSaveGame = useCallback(() => {
    if (game.status !== 'playing' && game.status !== 'paused') return;
    try {
      window.localStorage.setItem(TETRIS_SAVE_KEY, JSON.stringify(game));
      setHasSavedGame(true);
      setSaveNotice('Saved ✓');
      playRetroSound('click', soundRef.current);
      window.setTimeout(() => setSaveNotice(null), 1400);
    } catch {
      // ignore
    }
  }, [game]);

  const handleResumeSavedGame = useCallback(() => {
    const saved = readSavedTetrisGame();
    if (saved) {
      playRetroSound('open', soundRef.current);
      setGame({ ...saved, status: 'playing' });
    }
  }, []);

  const handleMove = useCallback(
    (dx: number, dy: number, softDrop = false) => {
      setGame((prev) => {
        if (prev.status !== 'playing') return prev;
        const res = moveTetrisPiece(prev, dx, dy, softDrop);
        if (res.moved) {
          if (dx !== 0) playRetroSound('click', soundRef.current);
          updateBestIfNeeded(res.state.score);
        }
        return res.state;
      });
    },
    [updateBestIfNeeded]
  );

  const handleRotate = useCallback(() => {
    setGame((prev) => {
      if (prev.status !== 'playing') return prev;
      const res = rotateTetrisPiece(prev);
      if (res.rotated) {
        playRetroSound('hit', soundRef.current);
      }
      return res.state;
    });
  }, []);

  const handleHardDrop = useCallback(() => {
    setGame((prev) => {
      if (prev.status !== 'playing') return prev;
      const res = hardDropTetris(prev);
      updateBestIfNeeded(res.state.score);
      if (res.event === 'gameover') {
        playRetroSound('boom', soundRef.current);
      } else if (res.event === 'clear') {
        playRetroSound(res.clearedLines >= 4 ? 'win' : 'score', soundRef.current);
        triggerClearFlash();
      } else {
        playRetroSound('hit', soundRef.current);
      }
      return res.state;
    });
  }, [triggerClearFlash, updateBestIfNeeded]);

  // Gravity drop timer scaled by current level
  useEffect(() => {
    if (game.status !== 'playing') return;
    const intervalMs = getTetrisDropIntervalMs(game.level);
    const id = window.setInterval(() => {
      setGame((prev) => {
        if (prev.status !== 'playing') return prev;
        const res = tickTetris(prev);
        updateBestIfNeeded(res.state.score);
        if (res.event === 'gameover') {
          playRetroSound('boom', soundRef.current);
        } else if (res.event === 'clear') {
          playRetroSound(res.clearedLines >= 4 ? 'win' : 'score', soundRef.current);
          triggerClearFlash();
        } else if (res.event === 'lock') {
          playRetroSound('click', soundRef.current);
        }
        return res.state;
      });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [game.status, game.level, triggerClearFlash, updateBestIfNeeded]);

  // Window-scoped keyboard controls when TetrisWindow is focused
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!focusedRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      const key = e.key;
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        e.preventDefault();
        handleMove(-1, 0);
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        e.preventDefault();
        handleMove(1, 0);
      } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        e.preventDefault();
        handleMove(0, 1, true);
      } else if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === 'x' || key === 'X') {
        e.preventDefault();
        handleRotate();
      } else if (key === ' ') {
        e.preventDefault();
        if (game.status === 'title' || game.status === 'gameover') {
          handleStart();
        } else if (game.status === 'playing') {
          handleHardDrop();
        }
      } else if (key === 'p' || key === 'P') {
        e.preventDefault();
        handleTogglePause();
      } else if (key === 'Enter' && (game.status === 'title' || game.status === 'gameover')) {
        e.preventDefault();
        handleStart();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game.status, handleHardDrop, handleMove, handleRotate, handleStart, handleTogglePause]);

  const cells = useMemo(() => composeTetrisGrid(game), [game]);

  const nextPreviewGrid = useMemo(() => {
    const shape = TETROMINO_SHAPES[game.nextType];
    const grid = Array.from({ length: 16 }, () => false);
    const offsetR = Math.floor((4 - shape.length) / 2);
    const offsetC = Math.floor((4 - shape[0].length) / 2);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          grid[(offsetR + r) * 4 + (offsetC + c)] = true;
        }
      }
    }
    return grid;
  }, [game.nextType]);

  return (
    <div
      className="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 select-none"
      style={{ '--tetris-cell-size': 'clamp(12px, 2.8vh, 20px)' } as React.CSSProperties}
    >
      <div className="flex flex-row items-start justify-center gap-2 sm:gap-4">
        {/* Retro CSS Grid 10x20 Game Well */}
        <div className="relative border-2 border-[#1A1A1A] bg-[#0B130B] p-1 shadow-[3px_3px_0_0_#1A1A1A] shrink-0">
          <div
            role="grid"
            aria-label="Tetris game board"
            data-testid="tetris-grid"
            className="grid gap-[1px] bg-[#142614]"
            style={{
              gridTemplateColumns: `repeat(${TETRIS_COLS}, var(--tetris-cell-size))`,
              gridTemplateRows: `repeat(${TETRIS_ROWS}, var(--tetris-cell-size))`,
            }}
          >
            {cells.map((cell, idx) => {
              const color = cell.type ? TETROMINO_COLORS[cell.type] : undefined;
              const isSolid = cell.kind === 'locked' || cell.kind === 'active';
              const isGhost = cell.kind === 'ghost';

              return (
                <div
                  key={idx}
                  data-cell-kind={cell.kind}
                  data-piece={cell.type ?? ''}
                  className="w-[var(--tetris-cell-size)] h-[var(--tetris-cell-size)] box-border"
                  style={
                    isSolid
                      ? {
                          backgroundColor: clearFlash && cell.kind === 'locked' ? '#F4EFE0' : color,
                          boxShadow:
                            'inset 2px 2px 0 0 rgba(255,255,255,0.45), inset -2px -2px 0 0 rgba(0,0,0,0.45)',
                        }
                      : isGhost
                        ? {
                            backgroundColor: '#0B130B',
                            border: `1px dashed ${color}`,
                          }
                        : {
                            backgroundColor: '#0B130B',
                          }
                  }
                />
              );
            })}
          </div>

          {/* Title / Pause / Game Over Overlay */}
          {game.status !== 'playing' && (
            <div className="absolute inset-0 bg-[#0B130B]/90 flex flex-col items-center justify-center p-4 text-center text-[#33FF66] gap-3">
              <h3
                className="text-lg m-0 text-[#33FF66]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {game.status === 'title'
                  ? 'TETRIS.EXE'
                  : game.status === 'paused'
                    ? 'PAUSED'
                    : 'GAME OVER'}
              </h3>

              {game.status === 'gameover' && (
                <div className="text-xs text-[#F4EFE0] tabular-nums space-y-0.5">
                  <div>
                    Score: <strong className="text-[#33FF66]">{game.score}</strong>
                  </div>
                  <div>
                    Lines: <strong>{game.lines}</strong> · Lvl <strong>{game.level}</strong>
                  </div>
                </div>
              )}

              <button
                type="button"
                data-start="true"
                onClick={game.status === 'paused' ? handleTogglePause : handleStart}
                className="border-2 border-[#33FF66] bg-[#33FF66] text-[#0B130B] hover:bg-[#F4EFE0] hover:border-[#F4EFE0] px-4 py-1.5 text-xs font-bold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {game.status === 'paused'
                  ? 'Resume [P]'
                  : game.status === 'gameover'
                    ? 'Play Again'
                    : 'Start Game'}
              </button>

              {hasSavedGame && game.status !== 'paused' && (
                <button
                  type="button"
                  onClick={handleResumeSavedGame}
                  className="border-2 border-[#2A9D8F] bg-[#2A9D8F] text-[#F4EFE0] hover:bg-[#F4EFE0] hover:text-[#1A1A1A] px-3 py-1 text-xs font-bold"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Resume Saved Game
                </button>
              )}

              <div className="text-[11px] text-[#33FF66]/80 leading-snug">
                Arrows / WASD Move &amp; Rotate
                <br />
                Space Hard Drop · P Pause
              </div>
            </div>
          )}
        </div>

        {/* Side Telemetry & Controls Column */}
        <div className="w-[124px] sm:w-[168px] flex flex-col gap-1.5 sm:gap-2.5 text-xs shrink-0">
          {/* Next Piece CSS Grid Preview */}
          <div className="border-2 border-[#1A1A1A] bg-[#E8E0C8] p-1.5 sm:p-2.5 flex flex-col items-center gap-1 sm:gap-2">
            <span
              className="text-[9px] sm:text-[10px] font-bold tracking-wider text-[#1A1A1A]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              NEXT PIECE
            </span>
            <div
              aria-label={`Next piece ${game.nextType}`}
              className="grid gap-[1px] bg-[#142614] border-2 border-[#1A1A1A] p-0.5 sm:p-1"
              style={{
                gridTemplateColumns: 'repeat(4, 12px)',
                gridTemplateRows: 'repeat(4, 12px)',
              }}
            >
              {nextPreviewGrid.map((filled, idx) => (
                <div
                  key={idx}
                  className="w-3 h-3"
                  style={
                    filled
                      ? {
                          backgroundColor: TETROMINO_COLORS[game.nextType],
                          boxShadow:
                            'inset 1px 1px 0 0 rgba(255,255,255,0.45), inset -1px -1px 0 0 rgba(0,0,0,0.45)',
                        }
                      : { backgroundColor: '#0B130B' }
                  }
                />
              ))}
            </div>
          </div>

          {/* Score / Best / Lines / Level Readouts */}
          <div className="border-2 border-[#1A1A1A] bg-[#E8E0C8] p-1.5 sm:p-2.5 grid grid-cols-1 gap-1 sm:gap-2 tabular-nums text-[10px] sm:text-xs">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/30 pb-0.5">
              <span className="font-bold text-[#4A463B]">SCORE</span>
              <span
                data-testid="tetris-score"
                className="text-xs sm:text-sm font-bold text-[#1A1A1A]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {game.score}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/30 pb-0.5">
              <span className="font-bold text-[#4A463B]">BEST</span>
              <span
                className="text-xs sm:text-sm font-bold text-[#2A9D8F]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {bestScore}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/30 pb-0.5">
              <span className="font-bold text-[#4A463B]">LINES</span>
              <span data-testid="tetris-lines" className="font-bold text-[#1A1A1A]">
                {game.lines}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#4A463B]">LEVEL</span>
              <span data-testid="tetris-level" className="font-bold text-[#E4572E]">
                {game.level}
              </span>
            </div>
          </div>

          {/* Primary Actions with localStorage Save & Resume */}
          <div className="grid grid-cols-2 gap-1">
            {game.status === 'playing' || game.status === 'paused' ? (
              <>
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="os-btn py-1 text-[10px] font-bold"
                >
                  {game.status === 'paused' ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveGame}
                  className="os-btn os-btn-teal py-1 text-[10px] font-bold"
                >
                  {saveNotice || 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleStart}
                  className="os-btn os-btn-primary py-1 text-[10px] font-bold col-span-2"
                >
                  New Game
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStart}
                  className={`os-btn os-btn-teal py-1 text-[10px] font-bold ${
                    hasSavedGame ? 'col-span-1' : 'col-span-2'
                  }`}
                >
                  {game.status === 'gameover' ? 'Play' : 'Start'}
                </button>
                {hasSavedGame && (
                  <button
                    type="button"
                    onClick={handleResumeSavedGame}
                    className="os-btn py-1 text-[10px] font-bold bg-[#2A9D8F] text-[#F4EFE0]"
                  >
                    Saved
                  </button>
                )}
              </>
            )}
          </div>

          {/* Tactile On-Screen Controls */}
          <div
            className="flex border-2 border-[#1A1A1A] bg-[#F4EFE0] p-1.5 sm:p-2 flex-col gap-1 sm:gap-1.5"
            role="group"
            aria-label="Tetris directional controls"
          >
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                aria-label="Move piece left"
                onClick={() => handleMove(-1, 0)}
                className="os-btn h-7 font-bold text-xs flex items-center justify-center"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Rotate piece"
                onClick={handleRotate}
                className="os-btn h-7 font-bold text-xs flex items-center justify-center"
              >
                ↻
              </button>
              <button
                type="button"
                aria-label="Move piece right"
                onClick={() => handleMove(1, 0)}
                className="os-btn h-7 font-bold text-xs flex items-center justify-center"
              >
                →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                aria-label="Soft drop piece"
                onClick={() => handleMove(0, 1, true)}
                className="os-btn h-7 font-bold text-[11px]"
              >
                ↓ Soft
              </button>
              <button
                type="button"
                aria-label="Hard drop piece"
                onClick={handleHardDrop}
                className="os-btn os-btn-primary h-7 font-bold text-[11px]"
              >
                Drop
              </button>
            </div>
          </div>

          <div className="text-[10px] leading-snug text-[#4A463B]">
            Keys: ←/→ Move · ↑/W Rotate · ↓ Soft · Space Drop · P Pause
          </div>
        </div>
      </div>
    </div>
  );
}
