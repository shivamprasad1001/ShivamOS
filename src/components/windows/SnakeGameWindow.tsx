import React, { useCallback, useEffect, useRef, useState } from 'react';
import { selectFocusedWindowId, useWindowStore } from '../../store/windowStore';
import {
  createInitialSnakeState,
  queueSnakeDirection,
  SNAKE_COLS,
  SNAKE_ROWS,
  stepSnake,
  type Direction,
  type SnakeState,
} from '../../utils/games/snakeLogic';
import { playRetroSound } from '../../utils/sound';

type SnakeSpeed = 'slow' | 'normal' | 'turbo';

const SPEED_MS: Record<SnakeSpeed, number> = {
  slow: 155,
  normal: 112,
  turbo: 78,
};

const CELL_PX = 20;
const CANVAS_W = SNAKE_COLS * CELL_PX; // 400
const CANVAS_H = SNAKE_ROWS * CELL_PX; // 320
const HIGH_SCORE_KEY = 'shivamos_snake_best_v1';

interface Spark {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export function SnakeGameWindow() {
  const soundEnabled = useWindowStore((s) => s.soundEnabled);
  const isFocused = useWindowStore((s) => selectFocusedWindowId(s.windows) === 'game-snake');

  const [speed, setSpeed] = useState<SnakeSpeed>('normal');
  const [hud, setHud] = useState<{
    score: number;
    best: number;
    status: SnakeState['status'];
    length: number;
  }>(() => {
    let best = 0;
    try {
      best = parseInt(window.localStorage.getItem(HIGH_SCORE_KEY) || '0', 10) || 0;
    } catch {
      best = 0;
    }
    return { score: 0, best, status: 'title', length: 3 };
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<SnakeState>(createInitialSnakeState('title'));
  const speedRef = useRef<SnakeSpeed>(speed);
  const soundRef = useRef<boolean>(soundEnabled);
  const focusedRef = useRef<boolean>(isFocused);
  const bestRef = useRef<number>(hud.best);
  const flashRef = useRef<number>(0);

  // Zero-GC pooled particle ring buffer
  const sparksRef = useRef<Spark[]>(
    Array.from({ length: 32 }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      color: '#33FF66',
    }))
  );

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    focusedRef.current = isFocused;
  }, [isFocused]);

  const emitSparks = useCallback((cx: number, cy: number, color: string, count: number) => {
    const pool = sparksRef.current;
    let spawned = 0;
    for (let i = 0; i < pool.length && spawned < count; i++) {
      if (!pool[i].active) {
        const angle = (Math.PI * 2 * spawned) / count + Math.random() * 0.4;
        const mag = 45 + Math.random() * 85;
        pool[i].active = true;
        pool[i].x = cx;
        pool[i].y = cy;
        pool[i].vx = Math.cos(angle) * mag;
        pool[i].vy = Math.sin(angle) * mag;
        pool[i].life = 0.28 + Math.random() * 0.14;
        pool[i].color = color;
        spawned += 1;
      }
    }
  }, []);

  const syncHud = useCallback((state: SnakeState) => {
    if (state.score > bestRef.current) {
      bestRef.current = state.score;
      try {
        window.localStorage.setItem(HIGH_SCORE_KEY, String(state.score));
      } catch {
        // ignore storage restrictions
      }
    }
    setHud({
      score: state.score,
      best: bestRef.current,
      status: state.status,
      length: state.snake.length,
    });
  }, []);

  const startGame = useCallback(() => {
    const fresh = createInitialSnakeState('playing');
    gameRef.current = fresh;
    flashRef.current = 0;
    playRetroSound('open', soundRef.current);
    syncHud(fresh);
  }, [syncHud]);

  const togglePause = useCallback(() => {
    const cur = gameRef.current;
    if (cur.status === 'playing') {
      gameRef.current = { ...cur, status: 'paused' };
      playRetroSound('click', soundRef.current);
      syncHud(gameRef.current);
    } else if (cur.status === 'paused') {
      gameRef.current = { ...cur, status: 'playing' };
      playRetroSound('click', soundRef.current);
      syncHud(gameRef.current);
    }
  }, [syncHud]);

  const steer = useCallback((dir: Direction) => {
    const cur = gameRef.current;
    if (cur.status === 'title') {
      const fresh = queueSnakeDirection(createInitialSnakeState('playing'), dir);
      gameRef.current = fresh;
      syncHud(fresh);
      return;
    }
    if (cur.status !== 'playing') return;
    gameRef.current = queueSnakeDirection(cur, dir);
  }, [syncHud]);

  // Keyboard listener when Snake window is focused
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!focusedRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      const k = e.key;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') {
        e.preventDefault();
        steer('UP');
      } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
        e.preventDefault();
        steer('DOWN');
      } else if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
        e.preventDefault();
        steer('LEFT');
      } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
        e.preventDefault();
        steer('RIGHT');
      } else if (k === 'p' || k === 'P') {
        e.preventDefault();
        togglePause();
      } else if ((k === 'Enter' || k === ' ') && (gameRef.current.status === 'title' || gameRef.current.status === 'gameover')) {
        e.preventDefault();
        startGame();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [steer, togglePause, startGame]);

  // Dedicated 60fps Canvas2D render & fixed-step simulation loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let accumulator = 0;

    const renderFrame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const cur = gameRef.current;
      if (cur.status === 'playing') {
        accumulator += dt * 1000;
        const stepMs = SPEED_MS[speedRef.current];
        while (accumulator >= stepMs) {
          accumulator -= stepMs;
          const result = stepSnake(gameRef.current);
          gameRef.current = result.state;
          if (result.event === 'eat') {
            const h = result.state.snake[0];
            emitSparks(h.x * CELL_PX + 10, h.y * CELL_PX + 10, '#E4572E', 8);
            playRetroSound('score', soundRef.current);
            syncHud(result.state);
          } else if (result.event === 'bonus') {
            const h = result.state.snake[0];
            emitSparks(h.x * CELL_PX + 10, h.y * CELL_PX + 10, '#F4EFE0', 14);
            playRetroSound('win', soundRef.current);
            syncHud(result.state);
          } else if (result.event === 'crash') {
            const h = result.state.snake[0];
            emitSparks(h.x * CELL_PX + 10, h.y * CELL_PX + 10, '#E4572E', 18);
            flashRef.current = 0.14;
            playRetroSound('boom', soundRef.current);
            syncHud(result.state);
            break;
          }
        }
      } else {
        accumulator = 0;
      }

      if (flashRef.current > 0) {
        flashRef.current = Math.max(0, flashRef.current - dt);
      }

      // Update pooled sparks
      const pool = sparksRef.current;
      for (let i = 0; i < pool.length; i++) {
        const s = pool[i];
        if (!s.active) continue;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        if (s.life <= 0) s.active = false;
      }

      // Draw CRT arena
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        const st = gameRef.current;
        ctx.fillStyle = flashRef.current > 0 ? '#2b120d' : '#0B130B';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Subtle CRT pixel grid lines
        ctx.fillStyle = 'rgba(51, 255, 102, 0.06)';
        for (let x = 0; x <= CANVAS_W; x += CELL_PX) {
          ctx.fillRect(x, 0, 1, CANVAS_H);
        }
        for (let y = 0; y <= CANVAS_H; y += CELL_PX) {
          ctx.fillRect(0, y, CANVAS_W, 1);
        }

        // Regular food (tomato pixel block with highlight)
        const fx = st.food.x * CELL_PX;
        const fy = st.food.y * CELL_PX;
        ctx.fillStyle = '#E4572E';
        ctx.fillRect(fx + 3, fy + 3, CELL_PX - 6, CELL_PX - 6);
        ctx.fillStyle = '#F4EFE0';
        ctx.fillRect(fx + 5, fy + 5, 4, 4);

        // Bonus data packet (pulsing cream/teal block)
        if (st.bonus) {
          const bx = st.bonus.point.x * CELL_PX;
          const by = st.bonus.point.y * CELL_PX;
          const blink = Math.floor(now / 150) % 2 === 0;
          ctx.fillStyle = blink ? '#F4EFE0' : '#2A9D8F';
          ctx.fillRect(bx + 2, by + 2, CELL_PX - 4, CELL_PX - 4);
          ctx.fillStyle = '#1A1A1A';
          ctx.fillRect(bx + 7, by + 7, 6, 6);
        }

        // Snake segments
        for (let i = st.snake.length - 1; i >= 0; i--) {
          const seg = st.snake[i];
          const sx = seg.x * CELL_PX;
          const sy = seg.y * CELL_PX;
          ctx.fillStyle = i === 0 ? '#33FF66' : i % 2 === 0 ? '#26cc50' : '#1fa342';
          ctx.fillRect(sx + 1, sy + 1, CELL_PX - 2, CELL_PX - 2);
          if (i === 0) {
            ctx.fillStyle = '#0B130B';
            ctx.fillRect(sx + 5, sy + 5, 3, 3);
            ctx.fillRect(sx + 12, sy + 5, 3, 3);
          }
        }

        // Pooled sparks
        for (let i = 0; i < pool.length; i++) {
          const s = pool[i];
          if (!s.active) continue;
          ctx.fillStyle = s.color;
          ctx.fillRect(Math.round(s.x), Math.round(s.y), 4, 4);
        }
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(rafId);
  }, [emitSparks, syncHud]);

  return (
    <div className="p-3 sm:p-4 flex flex-col items-center gap-3 select-none">
      {/* Compact Retro HUD Strip */}
      <div className="w-full max-w-[404px] border-2 border-[#1A1A1A] bg-[#E8E0C8] px-3 py-2 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4 tabular-nums">
          <div>
            <span className="text-[10px] font-bold text-[#4A463B] block leading-none">SCORE</span>
            <span className="text-base font-bold text-[#1A1A1A]" style={{ fontFamily: 'var(--font-display)' }}>
              {hud.score}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#4A463B] block leading-none">BEST</span>
            <span className="text-base font-bold text-[#2A9D8F]" style={{ fontFamily: 'var(--font-display)' }}>
              {hud.best}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {hud.status === 'playing' || hud.status === 'paused' ? (
            <button
              type="button"
              onClick={togglePause}
              className="os-btn px-2.5 py-1 text-[11px] font-bold"
            >
              {hud.status === 'paused' ? 'Resume' : 'Pause'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={startGame}
            className="os-btn os-btn-primary px-2.5 py-1 text-[11px] font-bold"
          >
            {hud.status === 'title' ? 'Start' : 'Restart'}
          </button>
        </div>
      </div>

      {/* CRT Playfield */}
      <div className="relative w-full max-w-[404px] border-2 border-[#1A1A1A] bg-[#0B130B] shadow-[4px_4px_0_0_#1A1A1A]">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          data-testid="snake-canvas"
          className="block w-full h-auto pixel-crisp"
        />

        {/* Title / Pause / Game Over Modal Overlay */}
        {hud.status !== 'playing' && (
          <div className="absolute inset-0 bg-[#0B130B]/88 flex flex-col items-center justify-center p-5 text-center text-[#33FF66] gap-3">
            <h3
              className="text-xl m-0 text-[#33FF66]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {hud.status === 'title'
                ? 'SNAKE.EXE'
                : hud.status === 'paused'
                  ? 'PAUSED'
                  : 'GAME OVER'}
            </h3>

            {hud.status === 'gameover' && (
              <div className="text-xs text-[#F4EFE0] tabular-nums space-y-0.5">
                <div>
                  Final Score: <strong className="text-[#33FF66]">{hud.score}</strong> · Length:{' '}
                  <strong>{hud.length}</strong>
                </div>
                <div>High Score: {hud.best}</div>
              </div>
            )}

            {hud.status === 'title' && (
              <div className="flex items-center gap-1.5" role="group" aria-label="Snake speed">
                {(['slow', 'normal', 'turbo'] as SnakeSpeed[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSpeed(mode)}
                    aria-pressed={speed === mode}
                    className={`px-2.5 py-1 text-[11px] font-bold border-2 ${
                      speed === mode
                        ? 'bg-[#33FF66] text-[#0B130B] border-[#33FF66]'
                        : 'bg-[#0B130B] text-[#33FF66] border-[#33FF66]/60 hover:border-[#33FF66]'
                    }`}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              data-start="true"
              onClick={hud.status === 'paused' ? togglePause : startGame}
              className="border-2 border-[#33FF66] bg-[#33FF66] text-[#0B130B] hover:bg-[#F4EFE0] hover:border-[#F4EFE0] px-5 py-1.5 text-xs font-bold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {hud.status === 'paused'
                ? 'Resume [P]'
                : hud.status === 'gameover'
                  ? 'Play Again'
                  : 'Start Game'}
            </button>

            <div className="text-[11px] text-[#33FF66]/75">
              WASD / Arrow Keys Move · P Pause · Collect +30 Bonus Blocks
            </div>
          </div>
        )}
      </div>

      {/* Tactile On-Screen D-Pad (works on touchscreens & mouse clicks) */}
      <div className="w-full max-w-[404px] flex items-center justify-between gap-2 text-[11px] text-[#4A463B]">
        <span>Keys: Arrows / WASD · P Pause</span>
        <div className="flex items-center gap-1" role="group" aria-label="Snake directional controls">
          <button
            type="button"
            aria-label="Move Left"
            onClick={() => steer('LEFT')}
            className="os-btn w-8 h-7 font-bold text-xs flex items-center justify-center"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Move Up"
            onClick={() => steer('UP')}
            className="os-btn w-8 h-7 font-bold text-xs flex items-center justify-center"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Move Down"
            onClick={() => steer('DOWN')}
            className="os-btn w-8 h-7 font-bold text-xs flex items-center justify-center"
          >
            ↓
          </button>
          <button
            type="button"
            aria-label="Move Right"
            onClick={() => steer('RIGHT')}
            className="os-btn w-8 h-7 font-bold text-xs flex items-center justify-center"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
