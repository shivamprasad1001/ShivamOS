import React, { useCallback, useEffect, useRef, useState } from 'react';
import { selectFocusedWindowId, useWindowStore } from '../../store/windowStore';
import {
  createInitialPongState,
  PONG_HEIGHT,
  PONG_WIDTH,
  stepPong,
  type PongDifficulty,
  type PongState,
} from '../../utils/games/pongLogic';
import { playRetroSound } from '../../utils/sound';

interface Spark {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const PONG_BEST_KEY = 'shivamos_pong_best_v1';

function readPongBestRally(): number {
  try {
    return parseInt(window.localStorage.getItem(PONG_BEST_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function PongGameWindow() {
  const soundEnabled = useWindowStore((s) => s.soundEnabled);
  const isFocused = useWindowStore((s) => selectFocusedWindowId(s.windows) === 'game-pong');

  const [difficulty, setDifficulty] = useState<PongDifficulty>('medium');
  const [bestRally, setBestRally] = useState<number>(readPongBestRally);
  const bestRallyRef = useRef<number>(bestRally);
  const [hud, setHud] = useState({
    playerScore: 0,
    cpuScore: 0,
    rally: 0,
    maxRally: 0,
    status: 'title' as PongState['status'],
    winner: null as PongState['winner'],
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PongState>(createInitialPongState('medium', 'title'));
  const keysRef = useRef<{ up: boolean; down: boolean }>({ up: false, down: false });
  const pointerTargetYRef = useRef<number | null>(null);
  const soundRef = useRef<boolean>(soundEnabled);
  const focusedRef = useRef<boolean>(isFocused);
  const sparksRef = useRef<Spark[]>(
    Array.from({ length: 28 }, () => ({
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
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    focusedRef.current = isFocused;
  }, [isFocused]);

  const emitSparks = useCallback((x: number, y: number, color: string, count: number) => {
    const pool = sparksRef.current;
    let n = 0;
    for (let i = 0; i < pool.length && n < count; i++) {
      if (!pool[i].active) {
        const a = Math.random() * Math.PI * 2;
        const v = 50 + Math.random() * 120;
        pool[i].active = true;
        pool[i].x = x;
        pool[i].y = y;
        pool[i].vx = Math.cos(a) * v;
        pool[i].vy = Math.sin(a) * v;
        pool[i].life = 0.22 + Math.random() * 0.14;
        pool[i].color = color;
        n += 1;
      }
    }
  }, []);

  const syncHud = useCallback((st: PongState) => {
    if (st.maxRally > bestRallyRef.current) {
      bestRallyRef.current = st.maxRally;
      setBestRally(st.maxRally);
      try {
        window.localStorage.setItem(PONG_BEST_KEY, String(st.maxRally));
      } catch {
        // ignore
      }
    }
    setHud({
      playerScore: st.playerScore,
      cpuScore: st.cpuScore,
      rally: st.rally,
      maxRally: st.maxRally,
      status: st.status,
      winner: st.winner,
    });
  }, []);

  const startMatch = useCallback(
    (diff: PongDifficulty = difficulty) => {
      const fresh = createInitialPongState(diff, 'playing');
      stateRef.current = fresh;
      pointerTargetYRef.current = null;
      keysRef.current = { up: false, down: false };
      playRetroSound('open', soundRef.current);
      syncHud(fresh);
    },
    [difficulty, syncHud]
  );

  const togglePause = useCallback(() => {
    const cur = stateRef.current;
    if (cur.status === 'playing') {
      stateRef.current = { ...cur, status: 'paused' };
      syncHud(stateRef.current);
    } else if (cur.status === 'paused') {
      stateRef.current = { ...cur, status: 'playing' };
      syncHud(stateRef.current);
    }
  }, [syncHud]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!focusedRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        pointerTargetYRef.current = null;
        keysRef.current.up = true;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        pointerTargetYRef.current = null;
        keysRef.current.down = true;
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
      } else if ((e.key === 'Enter' || e.key === ' ') && (stateRef.current.status === 'title' || stateRef.current.status === 'gameover')) {
        e.preventDefault();
        startMatch();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = false;
    };

    const onBlur = () => {
      keysRef.current = { up: false, down: false };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [startMatch, togglePause]);

  // 60fps Canvas2D Pong loop decoupled from React renders
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const cur = stateRef.current;
      if (cur.status === 'playing') {
        const out = stepPong(cur, dt, {
          up: keysRef.current.up,
          down: keysRef.current.down,
          targetY: pointerTargetYRef.current,
        });
        stateRef.current = out.state;

        if (out.event === 'wall') {
          playRetroSound('click', soundRef.current);
        } else if (out.event === 'paddle' && out.impactPoint) {
          emitSparks(out.impactPoint.x, out.impactPoint.y, '#33FF66', 7);
          playRetroSound('hit', soundRef.current);
          syncHud(out.state);
        } else if (out.event === 'score_player' && out.impactPoint) {
          emitSparks(out.impactPoint.x, out.impactPoint.y, '#33FF66', 14);
          playRetroSound(out.state.status === 'gameover' ? 'win' : 'score', soundRef.current);
          syncHud(out.state);
        } else if (out.event === 'score_cpu' && out.impactPoint) {
          emitSparks(out.impactPoint.x, out.impactPoint.y, '#E4572E', 14);
          playRetroSound(out.state.status === 'gameover' ? 'boom' : 'close', soundRef.current);
          syncHud(out.state);
        }
      }

      const pool = sparksRef.current;
      for (let i = 0; i < pool.length; i++) {
        const s = pool[i];
        if (!s.active) continue;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        if (s.life <= 0) s.active = false;
      }

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        const st = stateRef.current;
        ctx.fillStyle = '#0B130B';
        ctx.fillRect(0, 0, PONG_WIDTH, PONG_HEIGHT);

        // Center dashed net
        ctx.fillStyle = 'rgba(51, 255, 102, 0.35)';
        for (let y = 6; y < PONG_HEIGHT; y += 18) {
          ctx.fillRect(PONG_WIDTH / 2 - 1, y, 2, 10);
        }

        // Player paddle (left, green) & CPU paddle (right, teal)
        ctx.fillStyle = '#33FF66';
        ctx.fillRect(16, Math.round(st.playerY), st.paddleW, st.paddleH);

        ctx.fillStyle = '#2A9D8F';
        ctx.fillRect(PONG_WIDTH - 16 - st.paddleW, Math.round(st.cpuY), st.paddleW, st.paddleH);

        // Ball turns tomato on fast rallies (>= 5)
        ctx.fillStyle = st.rally >= 5 ? '#E4572E' : '#F4EFE0';
        ctx.fillRect(Math.round(st.ballX), Math.round(st.ballY), st.ballSize, st.ballSize);

        for (let i = 0; i < pool.length; i++) {
          const s = pool[i];
          if (!s.active) continue;
          ctx.fillStyle = s.color;
          ctx.fillRect(Math.round(s.x), Math.round(s.y), 3, 3);
        }
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafId);
  }, [emitSparks, syncHud]);

  const handleCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleY = PONG_HEIGHT / rect.height;
    pointerTargetYRef.current = (e.clientY - rect.top) * scaleY;
  };

  return (
    <div className="p-3 sm:p-4 flex flex-col items-center gap-3 select-none">
      {/* Scoreboard Strip */}
      <div className="w-full max-w-[444px] border-2 border-[#1A1A1A] bg-[#E8E0C8] px-3 py-2 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4 tabular-nums">
          <div>
            <span className="text-[10px] font-bold text-[#4A463B] block leading-none">YOU</span>
            <span className="text-base font-bold text-[#1A1A1A]" style={{ fontFamily: 'var(--font-display)' }}>
              {hud.playerScore}
            </span>
          </div>
          <span className="font-bold text-[#4A463B]">vs</span>
          <div>
            <span className="text-[10px] font-bold text-[#4A463B] block leading-none">CPU</span>
            <span className="text-base font-bold text-[#2A9D8F]" style={{ fontFamily: 'var(--font-display)' }}>
              {hud.cpuScore}
            </span>
          </div>
          <div className="border-l-2 border-[#1A1A1A] pl-3">
            <span className="text-[10px] font-bold text-[#4A463B] block leading-none">RALLY</span>
            <span className="text-sm font-bold text-[#E4572E]">{hud.rally}</span>
          </div>
          <div className="border-l-2 border-[#1A1A1A] pl-3 hidden xs:block">
            <span className="text-[10px] font-bold text-[#4A463B] block leading-none">BEST</span>
            <span className="text-sm font-bold text-[#2A9D8F]">{bestRally}</span>
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
            onClick={() => startMatch(difficulty)}
            className="os-btn os-btn-primary px-2.5 py-1 text-[11px] font-bold"
          >
            {hud.status === 'title' ? 'Start' : 'Restart'}
          </button>
        </div>
      </div>

      {/* Pong Court */}
      <div className="relative w-full max-w-[444px] border-2 border-[#1A1A1A] bg-[#0B130B] shadow-[4px_4px_0_0_#1A1A1A]">
        <canvas
          ref={canvasRef}
          width={PONG_WIDTH}
          height={PONG_HEIGHT}
          data-testid="pong-canvas"
          onPointerMove={(e) => {
            if (stateRef.current.status === 'playing') {
              handleCanvasPointer(e);
            }
          }}
          onPointerDown={handleCanvasPointer}
          className="block w-full h-auto pixel-crisp touch-none"
        />

        {hud.status !== 'playing' && (
          <div className="absolute inset-0 bg-[#0B130B]/88 flex flex-col items-center justify-center p-5 text-center text-[#33FF66] gap-3">
            <h3
              className="text-xl m-0 text-[#33FF66]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {hud.status === 'title'
                ? 'PONG.EXE'
                : hud.status === 'paused'
                  ? 'PAUSED'
                  : hud.winner === 'player'
                    ? 'YOU WIN!'
                    : 'CPU WINS'}
            </h3>

            {hud.status === 'gameover' && (
              <div className="text-xs text-[#F4EFE0] tabular-nums">
                Final: {hud.playerScore} – {hud.cpuScore} · Best Rally: {hud.maxRally}
              </div>
            )}

            {hud.status === 'title' && (
              <div className="flex items-center gap-1.5" role="group" aria-label="CPU difficulty">
                {(['easy', 'medium', 'hard'] as PongDifficulty[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDifficulty(mode)}
                    aria-pressed={difficulty === mode}
                    className={`px-2.5 py-1 text-[11px] font-bold border-2 ${
                      difficulty === mode
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
              onClick={hud.status === 'paused' ? togglePause : () => startMatch(difficulty)}
              className="border-2 border-[#33FF66] bg-[#33FF66] text-[#0B130B] hover:bg-[#F4EFE0] hover:border-[#F4EFE0] px-5 py-1.5 text-xs font-bold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {hud.status === 'paused'
                ? 'Resume [P]'
                : hud.status === 'gameover'
                  ? 'Play Again'
                  : 'Start Match'}
            </button>

            <div className="text-[11px] text-[#33FF66]/75">
              First to 5 · W/S, Arrows, or Move Mouse Over Court
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
