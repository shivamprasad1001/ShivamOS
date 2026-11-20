import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  dispatchVirtualKey,
  getDPadDirectionFromCoords,
  type DPadDirection,
  type VirtualControlKey,
} from '../utils/emulatorLogic';
import { playRetroSound } from '../utils/sound';

interface RetroGamePadProps {
  activeWindowId: string | null;
  soundEnabled: boolean;
  onFocusActiveWindow: () => void;
  onAltTab?: () => void;
  onToggleDesktop?: () => void;
  onOpenTerminal?: () => void;
  onOpenGames?: () => void;
}

const DAS_DELAY_MS = 180;
const DAS_REPEAT_MS = 55;

export function RetroGamePad({
  soundEnabled,
  onFocusActiveWindow,
  onAltTab,
  onToggleDesktop,
  onOpenTerminal,
  onOpenGames,
}: RetroGamePadProps) {
  const [padMode, setPadMode] = useState<'gamepad' | 'sysdeck'>('gamepad');
  const [activeDirection, setActiveDirection] = useState<DPadDirection>(null);

  const dpadRef = useRef<HTMLDivElement>(null);
  const pointerTrackingRef = useRef<boolean>(false);
  const currentDirRef = useRef<DPadDirection>(null);

  // DAS Auto-Repeat timers
  const dasDelayTimeoutRef = useRef<number | null>(null);
  const dasIntervalRef = useRef<number | null>(null);
  const activeRepeatKeyRef = useRef<VirtualControlKey | null>(null);

  // Haptic feedback helper
  const triggerHaptic = useCallback((ms = 12) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {
      // Haptics not supported or blocked
    }
  }, []);

  // Stop any active DAS auto-repeat
  const stopAutoRepeat = useCallback(() => {
    if (dasDelayTimeoutRef.current !== null) {
      window.clearTimeout(dasDelayTimeoutRef.current);
      dasDelayTimeoutRef.current = null;
    }
    if (dasIntervalRef.current !== null) {
      window.clearInterval(dasIntervalRef.current);
      dasIntervalRef.current = null;
    }
    if (activeRepeatKeyRef.current) {
      dispatchVirtualKey(activeRepeatKeyRef.current, 'keyup');
      activeRepeatKeyRef.current = null;
    }
  }, []);

  // Start DAS auto-repeat for a pressed key
  const startAutoRepeat = useCallback(
    (key: VirtualControlKey) => {
      stopAutoRepeat();
      activeRepeatKeyRef.current = key;
      dispatchVirtualKey(key, 'keydown');

      dasDelayTimeoutRef.current = window.setTimeout(() => {
        dasIntervalRef.current = window.setInterval(() => {
          if (activeRepeatKeyRef.current === key) {
            dispatchVirtualKey(key, 'keydown');
          }
        }, DAS_REPEAT_MS);
      }, DAS_DELAY_MS);
    },
    [stopAutoRepeat]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      stopAutoRepeat();
    };
  }, [stopAutoRepeat]);

  // Handle D-Pad direction change with continuous slide support
  const setDirection = useCallback(
    (newDir: DPadDirection) => {
      if (currentDirRef.current === newDir) return;

      // Release previous direction
      if (currentDirRef.current) {
        stopAutoRepeat();
      }

      currentDirRef.current = newDir;
      setActiveDirection(newDir);

      if (newDir) {
        triggerHaptic(12);
        playRetroSound('click', soundEnabled);
        startAutoRepeat(newDir);
      }
    },
    [soundEnabled, startAutoRepeat, stopAutoRepeat, triggerHaptic]
  );

  // Continuous pointer tracking over the cross D-pad
  const handleDPadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    onFocusActiveWindow();
    pointerTrackingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dir = getDPadDirectionFromCoords(e.clientX, e.clientY, cx, cy, 14);
    setDirection(dir);
  };

  const handleDPadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerTrackingRef.current) return;
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dir = getDPadDirectionFromCoords(e.clientX, e.clientY, cx, cy, 14);
    setDirection(dir);
  };

  const handleDPadPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerTrackingRef.current) return;
    pointerTrackingRef.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    setDirection(null);
  };

  // System hotkey handlers for sysdeck mode
  const handleSysKeyDown = (key: VirtualControlKey) => (e: React.PointerEvent) => {
    e.preventDefault();
    onFocusActiveWindow();
    triggerHaptic(14);
    playRetroSound('hit', soundEnabled);
    startAutoRepeat(key);
  };

  const handleSysKeyUp = () => (e: React.PointerEvent) => {
    e.preventDefault();
    stopAutoRepeat();
  };

  return (
    <section
      aria-label="Retro Handheld Game Navigation Controller"
      data-testid="retro-gamepad-deck"
      className="no-print shrink-0 bg-[#D8CFB2] border-t-2 border-[#1A1A1A] px-2.5 pt-1.5 pb-2 select-none touch-none"
    >
      <div className="max-w-md mx-auto flex flex-col gap-1.5">
        {/* Hardware Header Strip with Brand, LED and Mode Switch */}
        <div className="flex items-center justify-between text-[10px] font-bold tracking-wider px-1">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-none bg-[#E4572E] border border-[#1A1A1A] animate-pulse"
              aria-hidden="true"
              title="Power LED"
            />
            <span className="text-[#1A1A1A]" style={{ fontFamily: 'var(--font-display)' }}>
              SHIVAM RETRO PAD
            </span>
            <span className="px-1 py-0.2 bg-[#0B130B] text-[#33FF66] border border-[#1A1A1A] text-[9px] font-mono">
              D-PAD NAV
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="pad-mode-switch"
              onClick={() => setPadMode((prev) => (prev === 'gamepad' ? 'sysdeck' : 'gamepad'))}
              className="h-5 px-1.5 bg-[#F4EFE0] hover:bg-[#1A1A1A] hover:text-[#F4EFE0] border border-[#1A1A1A] text-[9px] font-bold uppercase transition-colors"
            >
              {padMode === 'gamepad' ? 'SYS DECK' : 'D-PAD'}
            </button>
          </div>
        </div>

        {padMode === 'gamepad' ? (
          /* Pure Navigation Deck: Ergonomic Molded Cross D-Pad */
          <div className="flex items-center justify-between sm:justify-center gap-4 py-0.5">
            {/* Left: Decorative Retro Bezel Grooves */}
            <div
              className="hidden xs:flex flex-col gap-1 opacity-60 w-16 items-center"
              aria-hidden="true"
            >
              <div className="w-10 h-1 bg-[#1A1A1A]" />
              <div className="w-10 h-1 bg-[#1A1A1A]" />
              <div className="w-10 h-1 bg-[#1A1A1A]" />
              <span className="text-[8px] font-mono font-bold text-[#4A463B] mt-0.5">4-WAY</span>
            </div>

            {/* Center: Tactile Molded Cross D-Pad with continuous thumb tracking */}
            <div className="relative w-[116px] h-[116px] shrink-0 flex items-center justify-center mx-auto">
              <div
                ref={dpadRef}
                data-testid="molded-dpad"
                aria-label="Cross D-Pad Navigation"
                onPointerDown={handleDPadPointerDown}
                onPointerMove={handleDPadPointerMove}
                onPointerUp={handleDPadPointerUp}
                onPointerCancel={handleDPadPointerUp}
                className="relative w-[112px] h-[112px] bg-[#C4B99A] border-2 border-[#1A1A1A] shadow-[3px_3px_0_0_#1A1A1A] flex items-center justify-center touch-none cursor-pointer"
              >
                {/* Horizontal Bar */}
                <div className="absolute top-[36px] left-[4px] right-[4px] h-[36px] bg-[#2B2822] border-y-2 border-[#1A1A1A]" />
                {/* Vertical Bar */}
                <div className="absolute left-[36px] top-[4px] bottom-[4px] w-[36px] bg-[#2B2822] border-x-2 border-[#1A1A1A]" />

                {/* D-Pad Up Arm */}
                <div
                  data-dir="up"
                  className={`absolute top-[4px] left-[36px] w-[36px] h-[32px] flex items-center justify-center font-bold text-xs ${
                    activeDirection === 'up'
                      ? 'bg-[#E4572E] text-[#F4EFE0]'
                      : 'bg-[#2B2822] text-[#E8E0C8]'
                  }`}
                >
                  ▲
                </div>

                {/* D-Pad Left Arm */}
                <div
                  data-dir="left"
                  className={`absolute top-[36px] left-[4px] w-[32px] h-[36px] flex items-center justify-center font-bold text-xs ${
                    activeDirection === 'left'
                      ? 'bg-[#E4572E] text-[#F4EFE0]'
                      : 'bg-[#2B2822] text-[#E8E0C8]'
                  }`}
                >
                  ◀
                </div>

                {/* Center Pivot Thumb Rest */}
                <div className="absolute top-[36px] left-[36px] w-[36px] h-[36px] bg-[#1A1A1A] flex items-center justify-center z-10">
                  <div className="w-3.5 h-3.5 rounded-full border border-[#4A463B] bg-[#2B2822]" />
                </div>

                {/* D-Pad Right Arm */}
                <div
                  data-dir="right"
                  className={`absolute top-[36px] right-[4px] w-[32px] h-[36px] flex items-center justify-center font-bold text-xs ${
                    activeDirection === 'right'
                      ? 'bg-[#E4572E] text-[#F4EFE0]'
                      : 'bg-[#2B2822] text-[#E8E0C8]'
                  }`}
                >
                  ▶
                </div>

                {/* D-Pad Down Arm */}
                <div
                  data-dir="down"
                  className={`absolute bottom-[4px] left-[36px] w-[36px] h-[32px] flex items-center justify-center font-bold text-xs ${
                    activeDirection === 'down'
                      ? 'bg-[#E4572E] text-[#F4EFE0]'
                      : 'bg-[#2B2822] text-[#E8E0C8]'
                  }`}
                >
                  ▼
                </div>
              </div>
            </div>

            {/* Right: Retro Speaker Slats & Audio Branding */}
            <div
              className="hidden xs:flex flex-col gap-1 opacity-60 w-16 items-center"
              aria-hidden="true"
            >
              <div className="flex gap-1 py-0.5">
                <span className="w-1 h-3 bg-[#1A1A1A] transform -skew-x-12" />
                <span className="w-1 h-3 bg-[#1A1A1A] transform -skew-x-12" />
                <span className="w-1 h-3 bg-[#1A1A1A] transform -skew-x-12" />
              </div>
              <span className="text-[8px] font-mono font-bold text-[#4A463B] mt-0.5">STEREO</span>
            </div>
          </div>
        ) : (
          /* System Deck Mode: Quick Windows hotkeys (Desk, Alt+Tab, Term, Games, Space, Enter, Esc) */
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 py-1">
            {onToggleDesktop && (
              <button
                type="button"
                onClick={onToggleDesktop}
                className="os-btn py-2 text-[10px] font-bold"
              >
                DESK
              </button>
            )}
            {onAltTab && (
              <button
                type="button"
                onClick={onAltTab}
                className="os-btn py-2 text-[10px] font-bold"
              >
                ALT+TAB
              </button>
            )}
            {onOpenTerminal && (
              <button
                type="button"
                onClick={onOpenTerminal}
                className="os-btn py-2 text-[10px] font-bold bg-[#0B130B] text-[#33FF66]"
              >
                TERM
              </button>
            )}
            {onOpenGames && (
              <button
                type="button"
                onClick={onOpenGames}
                className="os-btn py-2 text-[10px] font-bold"
              >
                GAMES
              </button>
            )}
            <button
              type="button"
              onPointerDown={handleSysKeyDown('space')}
              onPointerUp={handleSysKeyUp()}
              onPointerCancel={handleSysKeyUp()}
              className="os-btn py-2 text-[10px] font-bold bg-[#E4572E] text-[#F4EFE0]"
            >
              SPACE
            </button>
            <button
              type="button"
              onPointerDown={handleSysKeyDown('enter')}
              onPointerUp={handleSysKeyUp()}
              onPointerCancel={handleSysKeyUp()}
              className="os-btn py-2 text-[10px] font-bold bg-[#2A9D8F] text-[#F4EFE0]"
            >
              ENTER
            </button>
            <button
              type="button"
              onPointerDown={handleSysKeyDown('escape')}
              onPointerUp={handleSysKeyUp()}
              onPointerCancel={handleSysKeyUp()}
              className="os-btn py-2 text-[10px] font-bold"
            >
              ESC
            </button>
          </div>
        )}

        {/* Tactile Control Guide Footer Bar */}
        <div className="border border-[#1A1A1A]/40 bg-[#C4B99A]/50 px-2 py-0.5 flex items-center justify-between text-[8px] font-mono font-bold text-[#4A463B]">
          <span>▲ / ▼ / ◄ / ► NAVIGATION (TOUCH &amp; SLIDE)</span>
          <span className="hidden xs:inline">CONTINUOUS DAS</span>
        </div>
      </div>
    </section>
  );
}
