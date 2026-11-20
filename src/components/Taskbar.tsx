import React, { useEffect, useRef, useState } from 'react';
import {
  DESKTOP_ICON_LABELS,
  SITE_META,
  SYSTEM_CHROME_COPY,
} from '../../data/content';
import { selectFocusedWindowId, useWindowStore } from '../store/windowStore';
import type { ViewportSize, WindowId } from '../utils/windowLogic';
import {
  BatteryPixelIcon,
  CrtPixelIcon,
  LockPixelIcon,
  OsLogoIcon,
  PowerPixelIcon,
  SpeakerPixelIcon,
  WifiPixelIcon,
} from './PixelIcons';
import { renderWindowIcon } from './WindowSwitcher';

interface TaskbarProps {
  viewport: ViewportSize;
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

export function Taskbar({ viewport }: TaskbarProps) {
  const [startOpen, setStartOpen] = useState(false);
  const [clockText, setClockText] = useState('');
  const [dateTitle, setDateTitle] = useState('');

  const barRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const startMenuRef = useRef<HTMLDivElement>(null);

  const windows = useWindowStore((s) => s.windows);
  const trashItems = useWindowStore((s) => s.trashItems);
  const recentWindowIds = useWindowStore((s) => s.recentWindowIds);
  const crtEnabled = useWindowStore((s) => s.crtEnabled);
  const soundEnabled = useWindowStore((s) => s.soundEnabled);

  const openWindow = useWindowStore((s) => s.openWindow);
  const toggleTaskbarWindow = useWindowStore((s) => s.toggleTaskbarWindow);
  const toggleCrt = useWindowStore((s) => s.toggleCrt);
  const toggleSound = useWindowStore((s) => s.toggleSound);
  const lockSystem = useWindowStore((s) => s.lockSystem);
  const rebootSystem = useWindowStore((s) => s.rebootSystem);
  const shutDownSystem = useWindowStore((s) => s.shutDownSystem);

  const focusedId = selectFocusedWindowId(windows);
  const isTrashEmpty = trashItems.length === 0;

  const openWindows = Object.values(windows).filter((w) => w.isOpen && !w.isClosing);

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
      setDateTitle(
        now.toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!startOpen) return;

    const frame = window.requestAnimationFrame(() => {
      const firstItem = startMenuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
      firstItem?.focus();
    });

    const onMouseDown = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setStartOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setStartOpen(false);
        startButtonRef.current?.focus();
      }
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [startOpen]);

  const handleStartMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const menu = startMenuRef.current;
    if (!menu) return;
    const items = Array.from(menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    if (items.length === 0) return;

    const currentIdx = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(currentIdx + 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(currentIdx - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  const launchFromStart = (id: WindowId) => {
    setStartOpen(false);
    openWindow(id, viewport);
  };

  const runPowerAction = (fn: () => void) => {
    setStartOpen(false);
    fn();
  };

  return (
    <div
      ref={barRef}
      data-testid="desktop-taskbar"
      className="no-print fixed bottom-0 left-0 right-0 z-40 h-10 bg-[#F4EFE0] border-t-2 border-[#1A1A1A] px-2 flex items-center justify-between gap-2 select-none"
    >
      {/* Left: Start / Launcher Button + Start Menu */}
      <div className="relative shrink-0">
        <button
          ref={startButtonRef}
          type="button"
          data-testid="start-button"
          aria-haspopup="menu"
          aria-expanded={startOpen}
          onClick={() => setStartOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              setStartOpen(true);
            }
          }}
          className={`h-7 px-2.5 flex items-center gap-1.5 border-2 border-[#1A1A1A] text-xs font-bold whitespace-nowrap ${
            startOpen
              ? 'bg-[#1A1A1A] text-[#F4EFE0] translate-x-[1px] translate-y-[1px]'
              : 'bg-[#E4572E] text-[#F4EFE0] shadow-[2px_2px_0_0_#1A1A1A] hover:bg-[#1A1A1A]'
          }`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <OsLogoIcon size={14} />
          <span>{SYSTEM_CHROME_COPY.taskbar.startLabel}</span>
        </button>

        {startOpen && (
          <div
            ref={startMenuRef}
            role="menu"
            aria-label="Start Menu"
            data-testid="start-menu"
            onKeyDown={handleStartMenuKeyDown}
            className="animate-window-open absolute bottom-9 left-0 w-[340px] max-w-[calc(100vw-16px)] bg-[#F4EFE0] border-2 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] z-50 flex flex-col"
          >
            {/* Start Menu Header */}
            <div className="px-3 py-2 bg-[#1A1A1A] text-[#F4EFE0] border-b-2 border-[#1A1A1A] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <OsLogoIcon size={16} />
                <span
                  className="text-xs tracking-wide truncate"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {SYSTEM_CHROME_COPY.startMenu.bannerTitle}
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#E8E0C8] whitespace-nowrap">
                {SYSTEM_CHROME_COPY.startMenu.bannerUser}
              </span>
            </div>

            {/* Two-column body: Applications + Recent Items */}
            <div className="grid grid-cols-[1.15fr_1fr] divide-x-2 divide-[#1A1A1A] max-h-[420px]">
              {/* Left: Applications */}
              <div className="py-1.5 overflow-y-auto">
                <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#4A463B]">
                  {SYSTEM_CHROME_COPY.startMenu.appsHeading}
                </div>
                {START_MENU_APPS.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    role="menuitem"
                    data-start-app={app.id}
                    onClick={() => launchFromStart(app.id)}
                    className="w-full px-2.5 py-1.5 text-left text-xs font-semibold flex items-center gap-2 hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    <span className="shrink-0 bg-[#F4EFE0] border border-[#1A1A1A] p-0.5">
                      {renderWindowIcon(app.id, isTrashEmpty, 14)}
                    </span>
                    <span className="truncate">{app.label}</span>
                  </button>
                ))}
              </div>

              {/* Right: Recent Items */}
              <div className="py-1.5 bg-[#E8E0C8] flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#4A463B]">
                    {SYSTEM_CHROME_COPY.startMenu.recentHeading}
                  </div>
                  {recentWindowIds.length === 0 ? (
                    <p className="px-2.5 py-2 text-[11px] text-[#4A463B] m-0">
                      {SYSTEM_CHROME_COPY.startMenu.recentEmpty}
                    </p>
                  ) : (
                    recentWindowIds.map((winId) => {
                      const win = windows[winId];
                      if (!win) return null;
                      return (
                        <button
                          key={`recent-${winId}`}
                          type="button"
                          role="menuitem"
                          data-start-recent={winId}
                          onClick={() => launchFromStart(winId)}
                          className="w-full px-2.5 py-1.5 text-left text-[11px] font-semibold flex items-center gap-2 hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                        >
                          <span className="shrink-0 bg-[#F4EFE0] border border-[#1A1A1A] p-0.5">
                            {renderWindowIcon(winId, isTrashEmpty, 12)}
                          </span>
                          <span className="truncate">{win.title.split('—')[0].trim()}</span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="px-2.5 pt-2 mt-2 border-t border-[#1A1A1A]/30 text-[10px] text-[#4A463B]">
                  {SITE_META.ownerName}
                </div>
              </div>
            </div>

            {/* Footer: Lock, Restart, Shut Down */}
            <div className="border-t-2 border-[#1A1A1A] bg-[#F4EFE0] p-1.5 flex items-center justify-between gap-1.5">
              <button
                type="button"
                role="menuitem"
                data-testid="start-lock-btn"
                onClick={() => runPowerAction(lockSystem)}
                className="os-btn px-2 py-1 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap"
              >
                <LockPixelIcon size={12} />
                <span>{SYSTEM_CHROME_COPY.startMenu.lockAction}</span>
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  role="menuitem"
                  data-testid="start-restart-btn"
                  onClick={() => runPowerAction(rebootSystem)}
                  className="os-btn px-2 py-1 text-[11px] font-bold whitespace-nowrap"
                >
                  {SYSTEM_CHROME_COPY.startMenu.restartAction}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  data-testid="start-shutdown-btn"
                  onClick={() => runPowerAction(shutDownSystem)}
                  className="os-btn os-btn-primary px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap"
                >
                  <PowerPixelIcon size={12} />
                  <span>{SYSTEM_CHROME_COPY.startMenu.shutDownAction}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-6 w-[2px] bg-[#1A1A1A] shrink-0" aria-hidden="true" />

      {/* Center: Open Windows List */}
      <nav
        aria-label="Open windows"
        className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto py-0.5"
      >
        {openWindows.length === 0 ? (
          <span className="text-[11px] font-semibold text-[#4A463B] px-1 whitespace-nowrap">
            {SYSTEM_CHROME_COPY.taskbar.noOpenWindows}
          </span>
        ) : (
          openWindows.map((win) => {
            const isFocused = focusedId === win.id && !win.isMinimized;
            const shortTitle = win.title.split('—')[0].trim();
            return (
              <button
                key={win.id}
                type="button"
                data-taskbar-window={win.id}
                data-focused={isFocused ? 'true' : 'false'}
                data-minimized={win.isMinimized ? 'true' : 'false'}
                aria-pressed={isFocused}
                title={
                  win.isMinimized
                    ? `Restore ${win.title}`
                    : isFocused
                      ? `Minimize ${win.title}`
                      : `Focus ${win.title}`
                }
                onClick={() => toggleTaskbarWindow(win.id, viewport)}
                className={`h-7 px-2 min-w-[96px] max-w-[180px] border-2 border-[#1A1A1A] flex items-center gap-1.5 text-xs font-bold shrink-0 text-left ${
                  isFocused
                    ? 'bg-[#1A1A1A] text-[#F4EFE0] shadow-[inset_0_-3px_0_0_#E4572E]'
                    : win.isMinimized
                      ? 'bg-[#D8CFB2] text-[#4A463B] hover:bg-[#E8E0C8] hover:text-[#1A1A1A]'
                      : 'bg-[#E8E0C8] text-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] hover:bg-[#F4EFE0]'
                }`}
              >
                <span className="shrink-0 bg-[#F4EFE0] border border-[#1A1A1A] p-0.5">
                  {renderWindowIcon(win.id, isTrashEmpty, 12)}
                </span>
                <span className="truncate flex-1 text-[11px]">{shortTitle}</span>
                {win.isMinimized && (
                  <span className="text-[9px] font-bold px-1 border border-[#1A1A1A] bg-[#F4EFE0] text-[#1A1A1A] shrink-0">
                    MIN
                  </span>
                )}
              </button>
            );
          })
        )}
      </nav>

      {/* Right: System Tray (decorative Wi-Fi & Battery, CRT toggle, Mute toggle, Clock) */}
      <div
        aria-label="System tray"
        data-testid="system-tray"
        className="shrink-0 flex items-center gap-1.5 pl-2 border-l-2 border-[#1A1A1A]"
      >
        {/* Decorative pixel-art status indicators (explicitly non-telemetry) */}
        <div
          className="h-7 px-1.5 border-2 border-[#1A1A1A] bg-[#E8E0C8] flex items-center gap-1.5"
          title={`${SYSTEM_CHROME_COPY.taskbar.wifiDecorativeLabel} · ${SYSTEM_CHROME_COPY.taskbar.batteryDecorativeLabel}`}
          data-decorative="true"
        >
          <span
            role="img"
            aria-label={SYSTEM_CHROME_COPY.taskbar.wifiDecorativeLabel}
            title={SYSTEM_CHROME_COPY.taskbar.wifiDecorativeLabel}
            className="flex items-center"
          >
            <WifiPixelIcon size={14} />
          </span>
          <span
            role="img"
            aria-label={SYSTEM_CHROME_COPY.taskbar.batteryDecorativeLabel}
            title={SYSTEM_CHROME_COPY.taskbar.batteryDecorativeLabel}
            className="flex items-center"
          >
            <BatteryPixelIcon size={14} />
          </span>
        </div>

        <button
          type="button"
          data-testid="tray-crt-toggle"
          onClick={toggleCrt}
          aria-pressed={crtEnabled}
          aria-label={crtEnabled ? 'Disable CRT scanlines' : 'Enable CRT scanlines'}
          title={crtEnabled ? 'CRT scanlines: ON' : 'CRT scanlines: OFF'}
          className={`h-7 px-2 flex items-center gap-1 text-[11px] font-bold border-2 border-[#1A1A1A] whitespace-nowrap ${
            crtEnabled
              ? 'bg-[#1A1A1A] text-[#33FF66]'
              : 'bg-[#E8E0C8] text-[#1A1A1A] hover:bg-[#D8CFB2]'
          }`}
        >
          <CrtPixelIcon enabled={crtEnabled} size={13} />
          <span>CRT</span>
        </button>

        <button
          type="button"
          data-testid="tray-sound-toggle"
          onClick={toggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? 'Mute UI sound effects' : 'Enable UI sound effects'}
          title={soundEnabled ? 'Sound effects: ON' : 'Sound effects: MUTED'}
          className={`h-7 px-2 flex items-center gap-1 text-[11px] font-bold border-2 border-[#1A1A1A] whitespace-nowrap ${
            soundEnabled
              ? 'bg-[#2A9D8F] text-[#F4EFE0]'
              : 'bg-[#E8E0C8] text-[#1A1A1A] hover:bg-[#D8CFB2]'
          }`}
        >
          <SpeakerPixelIcon enabled={soundEnabled} size={13} />
          <span>{soundEnabled ? 'SFX' : 'MUTE'}</span>
        </button>

        <button
          type="button"
          data-testid="tray-clock"
          onClick={() => openWindow('settings', viewport)}
          title={`${dateTitle || 'System clock'} — Click to open Settings`}
          aria-label={`System tray clock ${clockText || 'live'} — open Settings`}
          className="h-7 px-2 border-2 border-[#1A1A1A] bg-[#F4EFE0] hover:bg-[#1A1A1A] hover:text-[#F4EFE0] text-[11px] font-bold tabular-nums whitespace-nowrap"
        >
          {clockText || '12:00 PM'}
        </button>
      </div>
    </div>
  );
}
