import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DESKTOP_ICON_LABELS,
  SITE_META,
  SYSTEM_CHROME_COPY,
} from '../../data/content';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { selectFocusedWindowId, useWindowStore, type OSWindowState } from '../store/windowStore';
import { ALL_DESKTOP_ICON_IDS, type DesktopIconId } from '../utils/desktopLogic';
import {
  dispatchVirtualKey,
  getDeviceFormFactor,
  getEmulatorResolutionLabel,
  isGameWindow,
  type VirtualControlKey,
} from '../utils/emulatorLogic';
import type { ViewportSize, WindowId } from '../utils/windowLogic';
import { renderDesktopIconGraphic } from './DesktopIconsLayer';
import {
  CrtPixelIcon,
  ExplorerPixelIcon,
  LockPixelIcon,
  OsLogoIcon,
  PowerPixelIcon,
  SettingsPixelIcon,
  SpeakerPixelIcon,
} from './PixelIcons';
import { PWAInstallButton } from './PWAInstallButton';
import { RetroGamePad } from './RetroGamePad';
import { renderWindowIcon } from './WindowSwitcher';

interface WinEmulatorShellProps {
  viewport: ViewportSize;
  isTrashEmpty: boolean;
  renderWindowBody: (id: WindowId) => React.ReactNode;
  forcedOnDesktop?: boolean;
  onExitEmulator?: () => void;
}

const START_MENU_APPS: Array<{ id: WindowId; label: string }> = [
  { id: 'explorer', label: SYSTEM_CHROME_COPY.startMenu.explorerLabel },
  { id: 'about', label: DESKTOP_ICON_LABELS.about },
  { id: 'projects', label: DESKTOP_ICON_LABELS.projects },
  { id: 'resume', label: DESKTOP_ICON_LABELS.resume },
  { id: 'skills', label: DESKTOP_ICON_LABELS.skills },
  { id: 'contact', label: DESKTOP_ICON_LABELS.contact },
  { id: 'terminal', label: DESKTOP_ICON_LABELS.terminal },
  { id: 'games', label: DESKTOP_ICON_LABELS.games },
  { id: 'paint', label: DESKTOP_ICON_LABELS.paint },
  { id: 'notes', label: DESKTOP_ICON_LABELS.notes },
  { id: 'settings', label: SYSTEM_CHROME_COPY.startMenu.settingsLabel },
  { id: 'trash', label: DESKTOP_ICON_LABELS.trash },
];

type EmulatorDesktopShortcut = {
  id: WindowId;
  label: string;
  renderIcon: (isTrashEmpty: boolean) => React.ReactNode;
};

const EMULATOR_DESKTOP_SHORTCUTS: EmulatorDesktopShortcut[] = [
  ...ALL_DESKTOP_ICON_IDS.map((id: DesktopIconId) => ({
    id: id as WindowId,
    label: DESKTOP_ICON_LABELS[id],
    renderIcon: (trashEmpty: boolean) => renderDesktopIconGraphic(id, trashEmpty, 32),
  })),
  {
    id: 'explorer',
    label: SYSTEM_CHROME_COPY.startMenu.explorerLabel,
    renderIcon: () => <ExplorerPixelIcon size={32} />,
  },
  {
    id: 'settings',
    label: SYSTEM_CHROME_COPY.startMenu.settingsLabel,
    renderIcon: () => <SettingsPixelIcon size={32} />,
  },
];

interface FloatingWinFrameProps {
  win: OSWindowState;
  isFocused: boolean;
  bounds: ViewportSize;
  darkBody: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  children: React.ReactNode;
}

function EmulatorFloatingWindow({
  win,
  isFocused,
  bounds,
  darkBody,
  onFocus,
  onClose,
  onMinimize,
  children,
}: FloatingWinFrameProps) {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
    x: Math.max(8, Math.min(win.x % 96, Math.max(8, bounds.width - 360))),
    y: Math.max(8, Math.min(win.y % 72, Math.max(8, bounds.height - 280))),
  }));
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );

  const clampedWidth = Math.min(Math.max(320, Math.round(bounds.width * 0.82)), bounds.width - 16);
  const clampedHeight = Math.min(
    Math.max(280, Math.round(bounds.height * 0.78)),
    bounds.height - 16
  );
  const safeX = Math.max(8, Math.min(pos.x, Math.max(8, bounds.width - clampedWidth - 8)));
  const safeY = Math.max(8, Math.min(pos.y, Math.max(8, bounds.height - clampedHeight - 8)));

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    onFocus();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: safeX,
      origY: safeY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const nextX = Math.max(
      8,
      Math.min(d.origX + (e.clientX - d.startX), Math.max(8, bounds.width - clampedWidth - 8))
    );
    const nextY = Math.max(
      8,
      Math.min(d.origY + (e.clientY - d.startY), Math.max(8, bounds.height - clampedHeight - 8))
    );
    setPos({ x: Math.round(nextX / 8) * 8, y: Math.round(nextY / 8) * 8 });
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <section
      aria-label={win.title}
      data-window-id={win.id}
      data-focused={isFocused ? 'true' : 'false'}
      onPointerDown={onFocus}
      style={{
        left: `${safeX}px`,
        top: `${safeY}px`,
        width: `${clampedWidth}px`,
        height: `${clampedHeight}px`,
        zIndex: win.zIndex,
      }}
      className={`absolute os-window ${
        win.isClosing ? 'animate-window-close' : 'animate-window-open'
      } flex flex-col overflow-hidden`}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        className={`h-8 shrink-0 flex items-center justify-between px-2 border-b-2 border-[#1A1A1A] touch-none select-none ${
          isFocused ? 'bg-[#F4EFE0]' : 'bg-[#E8E0C8]'
        }`}
      >
        <button
          type="button"
          aria-label={`Close ${win.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-5 h-5 border-2 border-[#1A1A1A] bg-[#F4EFE0] hover:bg-[#E4572E] hover:text-[#F4EFE0] flex items-center justify-center text-xs font-bold leading-none shrink-0"
        >
          ×
        </button>

        <div className="flex-1 mx-2 flex items-center gap-1.5 min-w-0">
          <div
            className={`flex-1 h-2.5 ${
              isFocused ? 'titlebar-stripes-active' : 'titlebar-stripes-inactive'
            }`}
            aria-hidden="true"
          />
          <h2
            className={`px-1.5 text-xs truncate ${
              isFocused ? 'text-[#1A1A1A]' : 'text-[#4A463B]'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {win.title}
          </h2>
          <div
            className={`flex-1 h-2.5 ${
              isFocused ? 'titlebar-stripes-active' : 'titlebar-stripes-inactive'
            }`}
            aria-hidden="true"
          />
        </div>

        <button
          type="button"
          aria-label={`Minimize ${win.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}
          className="w-5 h-5 border-2 border-[#1A1A1A] bg-[#F4EFE0] hover:bg-[#2A9D8F] hover:text-[#F4EFE0] flex items-center justify-center text-xs font-bold leading-none shrink-0"
        >
          _
        </button>
      </div>

      <div
        className={`flex-1 min-h-0 overflow-y-auto os-scroll ${
          darkBody ? 'bg-[#0B130B] text-[#33FF66]' : 'bg-[#F4EFE0] text-[#1A1A1A]'
        }`}
      >
        {children}
      </div>
    </section>
  );
}

export function WinEmulatorShell({
  viewport,
  isTrashEmpty,
  renderWindowBody,
  forcedOnDesktop = false,
  onExitEmulator,
}: WinEmulatorShellProps) {
  const formFactor = getDeviceFormFactor(viewport.width);
  const resLabel = getEmulatorResolutionLabel(formFactor);
  const isOnline = useOnlineStatus();

  const [showPad, setShowPad] = useState(false);
  const [windowedMode, setWindowedMode] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [clockText, setClockText] = useState('');
  const [screenBounds, setScreenBounds] = useState<ViewportSize>({ width: 640, height: 480 });

  const screenRef = useRef<HTMLDivElement>(null);
  const startMenuRef = useRef<HTMLDivElement>(null);

  const windows = useWindowStore((s) => s.windows);
  const recentWindowIds = useWindowStore((s) => s.recentWindowIds);
  const crtEnabled = useWindowStore((s) => s.crtEnabled);
  const soundEnabled = useWindowStore((s) => s.soundEnabled);
  const wallpaper = useWindowStore((s) => s.wallpaper);

  const openWindow = useWindowStore((s) => s.openWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const toggleTaskbarWindow = useWindowStore((s) => s.toggleTaskbarWindow);
  const toggleCrt = useWindowStore((s) => s.toggleCrt);
  const toggleSound = useWindowStore((s) => s.toggleSound);
  const lockSystem = useWindowStore((s) => s.lockSystem);
  const rebootSystem = useWindowStore((s) => s.rebootSystem);
  const shutDownSystem = useWindowStore((s) => s.shutDownSystem);
  const triggerBsod = useWindowStore((s) => s.triggerBsod);

  const focusedId = selectFocusedWindowId(windows);
  const openWindows = useMemo(
    () => Object.values(windows).filter((w) => w.isOpen && !w.isClosing),
    [windows]
  );
  const visibleWindows = useMemo(
    () => openWindows.filter((w) => !w.isMinimized).sort((a, b) => a.zIndex - b.zIndex),
    [openWindows]
  );
  const activeWindow =
    (focusedId && windows[focusedId]?.isOpen && !windows[focusedId].isMinimized
      ? windows[focusedId]
      : visibleWindows[visibleWindows.length - 1]) ?? null;

  const activeGameId = activeWindow && isGameWindow(activeWindow.id) ? activeWindow.id : null;

  // Auto-activate retro handheld D-pad whenever a game opens or is focused; auto-hide when closed or non-game is active
  useEffect(() => {
    if (activeGameId) {
      setShowPad(true);
    } else {
      setShowPad(false);
    }
  }, [activeGameId]);

  const canUseWindowedMode = formFactor !== 'phone';
  const useFloatingWindows = canUseWindowedMode && windowedMode;

  // Measure the emulated CRT viewport for tablet windowed bounds
  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const measure = () => {
      setScreenBounds({
        width: Math.max(320, Math.round(el.clientWidth)),
        height: Math.max(240, Math.round(el.clientHeight)),
      });
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [showPad, viewport.width, viewport.height]);

  // Live taskbar clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClockText(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Close Start menu on outside pointer click
  useEffect(() => {
    if (!startOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (startMenuRef.current && !startMenuRef.current.contains(target)) {
        const startBtn = document.querySelector('[data-testid="emu-start-button"]');
        if (!startBtn || !startBtn.contains(target)) {
          setStartOpen(false);
        }
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [startOpen]);

  const handleToggleDesktop = () => {
    setStartOpen(false);
    if (visibleWindows.length > 0) {
      visibleWindows.forEach((w) => minimizeWindow(w.id));
    } else if (openWindows.length > 0) {
      const target = openWindows[openWindows.length - 1];
      openWindow(target.id, viewport);
    }
  };

  const handleCycleWindows = () => {
    setStartOpen(false);
    if (openWindows.length === 0) {
      openWindow('about', viewport);
      return;
    }
    const sorted = [...openWindows].sort((a, b) => a.id.localeCompare(b.id));
    const currentIdx = activeWindow ? sorted.findIndex((w) => w.id === activeWindow.id) : -1;
    const next = sorted[(currentIdx + 1) % sorted.length];
    if (next) {
      openWindow(next.id, viewport);
    }
  };

  const emuCopy = SYSTEM_CHROME_COPY.emulator;

  return (
    <div
      data-testid="win-emulator-shell"
      data-form-factor={formFactor}
      className="h-[100dvh] w-full max-w-full bg-[#D8CFB2] flex flex-col overflow-hidden select-none"
    >
      {/* 1. Emulator Hardware Top Bezel */}
      <header className="no-print h-9 shrink-0 bg-[#1A1A1A] text-[#F4EFE0] border-b-2 border-[#1A1A1A] px-2 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            aria-hidden="true"
            title={isOnline ? 'Emulator power ON (Online)' : 'Emulator power ON (Offline cache)'}
            className={`w-2.5 h-2.5 border border-[#F4EFE0] shrink-0 ${
              isOnline ? 'bg-[#33FF66]' : 'bg-[#E4572E]'
            }`}
          />
          <OsLogoIcon size={15} className="shrink-0" />
          <span
            className="text-[11px] sm:text-xs font-bold tracking-tight truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {emuCopy.brandLabel}
          </span>
          <span
            data-testid="emu-res-badge"
            className="hidden sm:inline-block px-1.5 py-0.5 bg-[#0B130B] text-[#33FF66] border border-[#33FF66]/60 text-[10px] font-mono font-bold whitespace-nowrap"
          >
            {resLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <PWAInstallButton variant="compact" />

          {canUseWindowedMode && (
            <button
              type="button"
              data-testid="emu-layout-toggle"
              aria-pressed={windowedMode}
              onClick={() => setWindowedMode((prev) => !prev)}
              title={windowedMode ? 'Switch to Full-Screen Fit mode' : 'Switch to Floating Windows mode'}
              className={`h-6 px-1.5 border-2 border-[#F4EFE0] text-[10px] font-bold whitespace-nowrap ${
                windowedMode
                  ? 'bg-[#2A9D8F] text-[#F4EFE0]'
                  : 'bg-[#1A1A1A] text-[#F4EFE0] hover:bg-[#F4EFE0] hover:text-[#1A1A1A]'
              }`}
            >
              {windowedMode ? emuCopy.windowedLabel : emuCopy.fitLabel}
            </button>
          )}

          <button
            type="button"
            data-testid="emu-crt-toggle"
            aria-pressed={crtEnabled}
            aria-label={crtEnabled ? 'Disable CRT scanlines' : 'Enable CRT scanlines'}
            onClick={toggleCrt}
            className={`h-6 px-1.5 border-2 border-[#F4EFE0] flex items-center gap-1 text-[10px] font-bold ${
              crtEnabled
                ? 'bg-[#0B130B] text-[#33FF66]'
                : 'bg-[#F4EFE0] text-[#1A1A1A] hover:bg-[#E8E0C8]'
            }`}
          >
            <CrtPixelIcon enabled={crtEnabled} size={12} />
            <span className="hidden sm:inline">CRT</span>
          </button>

          <button
            type="button"
            data-testid="emu-sound-toggle"
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Mute UI sound effects' : 'Unmute UI sound effects'}
            onClick={toggleSound}
            className={`h-6 px-1.5 border-2 border-[#F4EFE0] flex items-center gap-1 text-[10px] font-bold ${
              soundEnabled
                ? 'bg-[#2A9D8F] text-[#F4EFE0]'
                : 'bg-[#F4EFE0] text-[#1A1A1A] hover:bg-[#E8E0C8]'
            }`}
          >
            <SpeakerPixelIcon enabled={soundEnabled} size={12} />
            <span className="hidden sm:inline">{soundEnabled ? 'SFX' : 'MUTE'}</span>
          </button>

          <button
            type="button"
            data-testid="emu-pad-toggle"
            aria-pressed={showPad}
            aria-label={showPad ? 'Hide virtual emulator controller' : 'Show virtual emulator controller'}
            onClick={() => setShowPad((prev) => !prev)}
            className={`h-6 px-2 border-2 border-[#F4EFE0] text-[10px] font-bold whitespace-nowrap ${
              showPad
                ? 'bg-[#E4572E] text-[#F4EFE0]'
                : 'bg-[#1A1A1A] text-[#F4EFE0] hover:bg-[#F4EFE0] hover:text-[#1A1A1A]'
            }`}
          >
            {activeGameId ? (showPad ? 'GAMEPAD: ON' : 'GAMEPAD') : emuCopy.padButton}
          </button>

          {forcedOnDesktop && onExitEmulator && (
            <button
              type="button"
              onClick={onExitEmulator}
              className="h-6 px-2 border-2 border-[#F4EFE0] bg-[#F4EFE0] text-[#1A1A1A] text-[10px] font-bold whitespace-nowrap"
            >
              {emuCopy.exitDesktopLabel}
            </button>
          )}
        </div>
      </header>

      {/* 2. Emulated Windows Monitor Frame */}
      <main
        aria-label="ShivamOS Windows Emulator Screen"
        className="flex-1 min-h-0 p-1.5 sm:p-2.5 flex flex-col overflow-hidden"
      >
        <div className="flex-1 min-h-0 border-2 border-[#1A1A1A] shadow-[3px_3px_0_0_#1A1A1A] flex flex-col overflow-hidden relative bg-[#E8E0C8]">
          {/* Emulated Screen Workspace (Wallpaper + Desktop Icons + Active Window) */}
          <div
            ref={screenRef}
            data-testid="emu-screen-workspace"
            className={`flex-1 min-h-0 relative overflow-hidden desktop-${wallpaper}`}
          >
            {/* Desktop Icons Grid (always present underneath windows like real Windows 95) */}
            <nav
              aria-label="Emulated desktop icons"
              className="h-full overflow-y-auto os-scroll p-2.5 sm:p-4"
            >
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 content-start">
                {EMULATOR_DESKTOP_SHORTCUTS.map((item) => {
                  const isRunning = windows[item.id]?.isOpen && !windows[item.id]?.isClosing;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-emu-icon={item.id}
                      onClick={() => {
                        setStartOpen(false);
                        openWindow(item.id, viewport);
                      }}
                      className={`flex flex-col items-center gap-1 p-2 border-2 text-center ${
                        isRunning
                          ? 'border-[#1A1A1A] bg-[#F4EFE0]/90 shadow-[2px_2px_0_0_#1A1A1A]'
                          : 'border-transparent bg-transparent hover:border-[#1A1A1A] hover:bg-[#F4EFE0]/70'
                      }`}
                    >
                      {item.renderIcon(isTrashEmpty)}
                      <span className="px-1 py-0.5 text-[10px] sm:text-[11px] font-bold leading-tight bg-[#F4EFE0]/90 border border-[#1A1A1A]/50 text-[#1A1A1A] truncate max-w-full">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Active Windows inside Emulated Monitor */}
            {useFloatingWindows
              ? visibleWindows.map((win) => (
                  <EmulatorFloatingWindow
                    key={win.id}
                    win={win}
                    isFocused={focusedId === win.id}
                    bounds={screenBounds}
                    darkBody={win.id === 'terminal'}
                    onFocus={() => focusWindow(win.id)}
                    onClose={() => closeWindow(win.id)}
                    onMinimize={() => minimizeWindow(win.id)}
                  >
                    {renderWindowBody(win.id)}
                  </EmulatorFloatingWindow>
                ))
              : activeWindow && (
                  <section
                    key={activeWindow.id}
                    aria-label={activeWindow.title}
                    data-window-id={activeWindow.id}
                    data-focused="true"
                    data-closing={activeWindow.isClosing ? 'true' : 'false'}
                    className={`absolute inset-1 sm:inset-2 z-20 os-window ${
                      activeWindow.isClosing ? 'animate-window-close' : 'animate-window-open'
                    } flex flex-col overflow-hidden`}
                  >
                    {/* Authentic Retro Title Bar */}
                    <div className="h-8 shrink-0 flex items-center justify-between px-2 border-b-2 border-[#1A1A1A] bg-[#F4EFE0] select-none">
                      <button
                        type="button"
                        aria-label={`Close ${activeWindow.title}`}
                        onClick={() => closeWindow(activeWindow.id)}
                        className="w-5 h-5 border-2 border-[#1A1A1A] bg-[#F4EFE0] hover:bg-[#E4572E] hover:text-[#F4EFE0] flex items-center justify-center text-xs font-bold leading-none shrink-0"
                      >
                        ×
                      </button>

                      <div className="flex-1 mx-2 flex items-center gap-1.5 min-w-0">
                        <div
                          className="hidden sm:block flex-1 h-2.5 titlebar-stripes-active"
                          aria-hidden="true"
                        />
                        <h2
                          className="px-1.5 text-xs truncate text-[#1A1A1A]"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {activeWindow.title}
                        </h2>
                        <div
                          className="hidden sm:block flex-1 h-2.5 titlebar-stripes-active"
                          aria-hidden="true"
                        />
                      </div>

                      <button
                        type="button"
                        aria-label={`Minimize ${activeWindow.title}`}
                        onClick={() => minimizeWindow(activeWindow.id)}
                        title="Minimize to Desktop"
                        className="w-5 h-5 border-2 border-[#1A1A1A] bg-[#F4EFE0] hover:bg-[#2A9D8F] hover:text-[#F4EFE0] flex items-center justify-center text-xs font-bold leading-none shrink-0"
                      >
                        _
                      </button>
                    </div>

                    {/* Scrollable Window Interior */}
                    <div
                      className={`flex-1 min-h-0 overflow-y-auto os-scroll ${
                        activeWindow.id === 'terminal'
                          ? 'bg-[#0B130B] text-[#33FF66]'
                          : 'bg-[#F4EFE0] text-[#1A1A1A]'
                      }`}
                    >
                      {renderWindowBody(activeWindow.id)}
                    </div>
                  </section>
                )}

            {/* Emulated Start Menu Overlay (anchored above Windows Taskbar) */}
            {startOpen && (
              <div
                ref={startMenuRef}
                role="menu"
                aria-label="Start Menu"
                data-testid="emu-start-menu"
                className="animate-window-open absolute bottom-1 left-1 z-40 w-[300px] max-w-[calc(100%-8px)] max-h-[calc(100%-8px)] bg-[#F4EFE0] border-2 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] flex flex-col overflow-hidden"
              >
                <div className="px-2.5 py-1.5 bg-[#1A1A1A] text-[#F4EFE0] border-b-2 border-[#1A1A1A] flex items-center justify-between gap-2 shrink-0">
                  <span
                    className="text-xs font-bold truncate"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {SYSTEM_CHROME_COPY.startMenu.bannerTitle}
                  </span>
                  <span className="text-[10px] text-[#E8E0C8] font-bold">
                    {SYSTEM_CHROME_COPY.startMenu.bannerUser}
                  </span>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[1.2fr_1fr] divide-x-2 divide-[#1A1A1A] overflow-hidden">
                  <div className="py-1 overflow-y-auto os-scroll">
                    <div className="px-2 pb-1 text-[10px] font-bold uppercase text-[#4A463B]">
                      {SYSTEM_CHROME_COPY.startMenu.appsHeading}
                    </div>
                    {START_MENU_APPS.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setStartOpen(false);
                          openWindow(app.id, viewport);
                        }}
                        className="w-full px-2 py-1.5 text-left text-[11px] font-semibold flex items-center gap-1.5 hover:bg-[#1A1A1A] hover:text-[#F4EFE0]"
                      >
                        <span className="shrink-0 bg-[#F4EFE0] border border-[#1A1A1A] p-0.5">
                          {renderWindowIcon(app.id, isTrashEmpty, 12)}
                        </span>
                        <span className="truncate">{app.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="py-1 bg-[#E8E0C8] flex flex-col justify-between overflow-y-auto os-scroll">
                    <div>
                      <div className="px-2 pb-1 text-[10px] font-bold uppercase text-[#4A463B]">
                        {SYSTEM_CHROME_COPY.startMenu.recentHeading}
                      </div>
                      {recentWindowIds.length === 0 ? (
                        <p className="px-2 py-1.5 text-[10px] text-[#4A463B] m-0">
                          {SYSTEM_CHROME_COPY.startMenu.recentEmpty}
                        </p>
                      ) : (
                        recentWindowIds.map((winId) => {
                          const win = windows[winId];
                          if (!win) return null;
                          return (
                            <button
                              key={`emu-recent-${winId}`}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setStartOpen(false);
                                openWindow(winId, viewport);
                              }}
                              className="w-full px-2 py-1.5 text-left text-[10px] font-semibold flex items-center gap-1.5 hover:bg-[#1A1A1A] hover:text-[#F4EFE0]"
                            >
                              <span className="shrink-0 bg-[#F4EFE0] border border-[#1A1A1A] p-0.5">
                                {renderWindowIcon(winId, isTrashEmpty, 11)}
                              </span>
                              <span className="truncate">{win.title.split('—')[0].trim()}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="px-2 pt-1.5 text-[10px] text-[#4A463B] border-t border-[#1A1A1A]/30">
                      {SITE_META.ownerName}
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-[#1A1A1A] bg-[#F4EFE0] p-1.5 flex items-center justify-between gap-1 shrink-0">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setStartOpen(false);
                      lockSystem();
                    }}
                    className="os-btn px-2 py-1 text-[10px] font-bold flex items-center gap-1"
                  >
                    <LockPixelIcon size={11} />
                    <span>{SYSTEM_CHROME_COPY.startMenu.lockAction}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setStartOpen(false);
                        rebootSystem();
                      }}
                      className="os-btn px-2 py-1 text-[10px] font-bold"
                    >
                      {SYSTEM_CHROME_COPY.startMenu.restartAction}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setStartOpen(false);
                        shutDownSystem();
                      }}
                      className="os-btn os-btn-primary px-2 py-1 text-[10px] font-bold flex items-center gap-1"
                    >
                      <PowerPixelIcon size={11} />
                      <span>{SYSTEM_CHROME_COPY.startMenu.shutDownAction}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Emulated Bottom Windows Taskbar */}
          <div
            data-testid="emu-taskbar"
            className="no-print h-9 shrink-0 bg-[#F4EFE0] border-t-2 border-[#1A1A1A] px-1.5 flex items-center justify-between gap-1.5 relative z-30"
          >
            <button
              type="button"
              data-testid="emu-start-button"
              aria-haspopup="menu"
              aria-expanded={startOpen}
              onClick={() => setStartOpen((prev) => !prev)}
              className={`h-7 px-2 flex items-center gap-1 border-2 border-[#1A1A1A] text-[11px] font-bold whitespace-nowrap shrink-0 ${
                startOpen
                  ? 'bg-[#1A1A1A] text-[#F4EFE0]'
                  : 'bg-[#E4572E] text-[#F4EFE0] shadow-[2px_2px_0_0_#1A1A1A]'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <OsLogoIcon size={12} />
              <span>{SYSTEM_CHROME_COPY.taskbar.startLabel}</span>
            </button>

            <nav
              aria-label="Open windows"
              className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto py-0.5"
            >
              {openWindows.length === 0 ? (
                <span className="text-[10px] font-semibold text-[#4A463B] px-1 truncate">
                  {SYSTEM_CHROME_COPY.taskbar.noOpenWindows}
                </span>
              ) : (
                openWindows.map((win) => {
                  const isFocused = activeWindow?.id === win.id && !win.isMinimized;
                  const shortTitle = win.title.split('—')[0].trim();
                  return (
                    <button
                      key={win.id}
                      type="button"
                      data-emu-task={win.id}
                      aria-pressed={isFocused}
                      onClick={() => {
                        setStartOpen(false);
                        toggleTaskbarWindow(win.id, viewport);
                      }}
                      className={`h-7 px-2 min-w-[78px] max-w-[132px] border-2 border-[#1A1A1A] flex items-center gap-1 text-[10px] font-bold shrink-0 text-left ${
                        isFocused
                          ? 'bg-[#1A1A1A] text-[#F4EFE0] shadow-[inset_0_-3px_0_0_#E4572E]'
                          : win.isMinimized
                            ? 'bg-[#D8CFB2] text-[#4A463B]'
                            : 'bg-[#E8E0C8] text-[#1A1A1A]'
                      }`}
                    >
                      <span className="shrink-0 bg-[#F4EFE0] border border-[#1A1A1A] p-0.5">
                        {renderWindowIcon(win.id, isTrashEmpty, 11)}
                      </span>
                      <span className="truncate flex-1">{shortTitle}</span>
                    </button>
                  );
                })
              )}
            </nav>

            <button
              type="button"
              onClick={triggerBsod}
              aria-label={`Emulator clock ${clockText || 'live'}`}
              className="h-7 px-1.5 border-2 border-[#1A1A1A] bg-[#E8E0C8] text-[10px] font-bold tabular-nums whitespace-nowrap shrink-0"
            >
              {clockText || '12:00 PM'}
            </button>
          </div>
        </div>
      </main>

      {/* 3. Authentic Retro Handheld Game Controller & System Hotkey Deck */}
      {showPad && (
        <RetroGamePad
          activeWindowId={activeWindow?.id ?? null}
          soundEnabled={soundEnabled}
          onFocusActiveWindow={() => {
            if (activeWindow) {
              focusWindow(activeWindow.id);
            }
          }}
          onAltTab={handleCycleWindows}
          onToggleDesktop={handleToggleDesktop}
          onOpenTerminal={() => {
            setStartOpen(false);
            openWindow('terminal', viewport);
          }}
          onOpenGames={() => {
            setStartOpen(false);
            openWindow('games', viewport);
          }}
        />
      )}
    </div>
  );
}
