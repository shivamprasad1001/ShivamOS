import React, { useEffect, useRef, useState } from 'react';
import { SITE_META, SYSTEM_CHROME_COPY, WINDOW_MANAGER_COPY } from '../../data/content';
import { useWindowStore } from '../store/windowStore';
import type { ViewportSize } from '../utils/windowLogic';
import { CrtPixelIcon, OsLogoIcon, SpeakerPixelIcon } from './PixelIcons';
import { PWAInstallButton } from './PWAInstallButton';

type MenuKey = 'os' | 'file' | 'edit' | 'view' | 'special' | null;
const DESKTOP_MENU_ORDER: Exclude<MenuKey, null>[] = ['os', 'file', 'edit', 'view', 'special'];

interface MenuBarProps {
  viewport: ViewportSize;
  isMobile: boolean;
  onEnterEmulator?: () => void;
}

export function MenuBar({ viewport, isMobile, onEnterEmulator }: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [clockText, setClockText] = useState('');
  const navRef = useRef<HTMLElement>(null);
  const activeMenuRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Partial<Record<Exclude<MenuKey, null>, HTMLButtonElement | null>>>({});

  const crtEnabled = useWindowStore((s) => s.crtEnabled);
  const soundEnabled = useWindowStore((s) => s.soundEnabled);
  const wallpaper = useWindowStore((s) => s.wallpaper);
  const openWindow = useWindowStore((s) => s.openWindow);
  const closeFocusedWindow = useWindowStore((s) => s.closeFocusedWindow);
  const closeAllWindows = useWindowStore((s) => s.closeAllWindows);
  const toggleCrt = useWindowStore((s) => s.toggleCrt);
  const toggleSound = useWindowStore((s) => s.toggleSound);
  const setWallpaper = useWindowStore((s) => s.setWallpaper);
  const cascadeWindows = useWindowStore((s) => s.cascadeWindows);
  const tileWindows = useWindowStore((s) => s.tileWindows);
  const resetLayout = useWindowStore((s) => s.resetLayout);
  const lockSystem = useWindowStore((s) => s.lockSystem);
  const rebootSystem = useWindowStore((s) => s.rebootSystem);
  const shutDownSystem = useWindowStore((s) => s.shutDownSystem);
  const emptyTrash = useWindowStore((s) => s.emptyTrash);
  const triggerBsod = useWindowStore((s) => s.triggerBsod);
  const requestTerminalClear = useWindowStore((s) => s.requestTerminalClear);
  const openSwitcher = useWindowStore((s) => s.openSwitcher);
  const pushToast = useWindowStore((s) => s.pushToast);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockText(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: isMobile ? undefined : '2-digit',
          hour12: true,
        })
      );
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, [isMobile]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openMenu) {
        const keyToFocus = openMenu;
        setOpenMenu(null);
        triggerRefs.current[keyToFocus]?.focus();
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

  // Roving focus: when a menu opens, focus its first menuitem for keyboard accessibility
  useEffect(() => {
    if (!openMenu) return;
    const id = window.requestAnimationFrame(() => {
      const firstItem = activeMenuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
      firstItem?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [openMenu]);

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!openMenu) return;
    const container = activeMenuRef.current;
    if (!container) return;

    const items = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    if (items.length === 0) return;

    const currentIdx = items.indexOf(document.activeElement as HTMLButtonElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = items[(currentIdx + 1 + items.length) % items.length];
      next?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = items[(currentIdx - 1 + items.length) % items.length];
      prev?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (!isMobile && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      const idx = DESKTOP_MENU_ORDER.indexOf(openMenu);
      const step = e.key === 'ArrowRight' ? 1 : -1;
      const nextMenu = DESKTOP_MENU_ORDER[(idx + step + DESKTOP_MENU_ORDER.length) % DESKTOP_MENU_ORDER.length];
      setOpenMenu(nextMenu);
    }
  };

  const handleTriggerKeyDown = (key: Exclude<MenuKey, null>, e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpenMenu(key);
    } else if (!isMobile && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      const idx = DESKTOP_MENU_ORDER.indexOf(key);
      const step = e.key === 'ArrowRight' ? 1 : -1;
      const nextMenu = DESKTOP_MENU_ORDER[(idx + step + DESKTOP_MENU_ORDER.length) % DESKTOP_MENU_ORDER.length];
      triggerRefs.current[nextMenu]?.focus();
      if (openMenu) {
        setOpenMenu(nextMenu);
      }
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(SITE_META.email).catch(() => {});
    pushToast(SYSTEM_CHROME_COPY.toasts.copiedToClipboard);
    setOpenMenu(null);
  };

  const runAction = (fn: () => void) => {
    fn();
    setOpenMenu(null);
  };

  const menuButtonClass = (key: MenuKey) =>
    `h-full px-2.5 flex items-center text-xs font-semibold whitespace-nowrap shrink-0 border-r-0 ${
      openMenu === key
        ? 'bg-[#1A1A1A] text-[#F4EFE0]'
        : 'text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F4EFE0]'
    }`;

  return (
    <header
      ref={navRef}
      className="no-print fixed top-0 left-0 right-0 z-40 h-8 bg-[#F4EFE0] border-b-2 border-[#1A1A1A] flex items-center justify-between px-2 select-none"
    >
      {/* Left: OS Logo + File, Edit, View, Special menus */}
      <nav aria-label="Desktop menu bar" className="flex items-center h-full gap-0.5">
        <div className="relative h-full">
          <button
            ref={(el) => {
              triggerRefs.current.os = el;
            }}
            type="button"
            aria-label="ShivamOS Menu"
            aria-haspopup="menu"
            aria-expanded={openMenu === 'os'}
            onClick={() => setOpenMenu(openMenu === 'os' ? null : 'os')}
            onKeyDown={(e) => handleTriggerKeyDown('os', e)}
            className={`${menuButtonClass('os')} gap-1.5`}
          >
            <OsLogoIcon size={16} />
            <span
              className="text-xs tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {SITE_META.osName}
            </span>
          </button>
          {openMenu === 'os' && (
            <div
              ref={activeMenuRef}
              role="menu"
              onKeyDown={handleMenuKeyDown}
              className="absolute left-0 top-8 w-56 bg-[#F4EFE0] border-2 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] py-1 z-50"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => runAction(() => openWindow('about', viewport))}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
              >
                About {SITE_META.osName} ({SITE_META.osVersion})
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => runAction(() => openWindow('skills', viewport))}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
              >
                System Profiler (Skills)
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => runAction(() => openWindow('explorer', viewport))}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
              >
                {SYSTEM_CHROME_COPY.startMenu.explorerLabel}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => runAction(() => openWindow('settings', viewport))}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
              >
                {SYSTEM_CHROME_COPY.startMenu.settingsLabel}...
              </button>
              <div className="my-1 border-t-2 border-[#1A1A1A]" />
              <button
                type="button"
                role="menuitem"
                onClick={() => runAction(lockSystem)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
              >
                {SYSTEM_CHROME_COPY.startMenu.lockAction}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => runAction(rebootSystem)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
              >
                {SYSTEM_CHROME_COPY.startMenu.restartAction}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => runAction(shutDownSystem)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#E4572E] hover:text-[#F4EFE0] focus:bg-[#E4572E] focus:text-[#F4EFE0]"
              >
                {SYSTEM_CHROME_COPY.startMenu.shutDownAction}...
              </button>
            </div>
          )}
        </div>

        {!isMobile && (
          <>
            {/* File Menu */}
            <div className="relative h-full">
              <button
                ref={(el) => {
                  triggerRefs.current.file = el;
                }}
                type="button"
                aria-haspopup="menu"
                aria-expanded={openMenu === 'file'}
                onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
                onKeyDown={(e) => handleTriggerKeyDown('file', e)}
                className={menuButtonClass('file')}
              >
                File
              </button>
              {openMenu === 'file' && (
                <div
                  ref={activeMenuRef}
                  role="menu"
                  onKeyDown={handleMenuKeyDown}
                  className="absolute left-0 top-8 w-56 bg-[#F4EFE0] border-2 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] py-1 z-50"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(() => openWindow('about', viewport))}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    Open About Me
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(() => openWindow('explorer', viewport))}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    Open File Explorer
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(() => openWindow('projects', viewport))}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    Open Projects Folder
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(() => openWindow('resume', viewport))}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    Open Resume
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(() => openWindow('terminal', viewport))}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    Open terminal.exe
                  </button>
                  <div className="my-1 border-t-2 border-[#1A1A1A]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(() => openWindow('games', viewport))}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    Open Games Folder
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(() => openWindow('paint', viewport))}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    Open Paint.app
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(() => openWindow('notes', viewport))}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    Open Notes.txt
                  </button>
                  <div className="my-1 border-t-2 border-[#1A1A1A]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(closeFocusedWindow)}
                    className="w-full text-left px-3 py-1.5 text-xs flex justify-between hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    <span>Close Active Window</span>
                    <span className="opacity-70">{WINDOW_MANAGER_COPY.closeShortcutLabel}</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(closeAllWindows)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    Close All Windows
                  </button>
                </div>
              )}
            </div>

            {/* Edit Menu */}
            <div className="relative h-full">
              <button
                ref={(el) => {
                  triggerRefs.current.edit = el;
                }}
                type="button"
                aria-haspopup="menu"
                aria-expanded={openMenu === 'edit'}
                onClick={() => setOpenMenu(openMenu === 'edit' ? null : 'edit')}
                onKeyDown={(e) => handleTriggerKeyDown('edit', e)}
                className={menuButtonClass('edit')}
              >
                Edit
              </button>
              {openMenu === 'edit' && (
                <div
                  ref={activeMenuRef}
                  role="menu"
                  onKeyDown={handleMenuKeyDown}
                  className="absolute left-0 top-8 w-52 bg-[#F4EFE0] border-2 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] py-1 z-50"
                >
                  {SITE_META.email && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleCopyEmail}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                    >
                      Copy Email Address
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(requestTerminalClear)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    Clear Terminal Buffer
                  </button>
                  <div className="my-1 border-t-2 border-[#1A1A1A]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(() => resetLayout(viewport))}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    Reset Desktop Layout
                  </button>
                </div>
              )}
            </div>

            {/* View Menu */}
            <div className="relative h-full">
              <button
                ref={(el) => {
                  triggerRefs.current.view = el;
                }}
                type="button"
                aria-haspopup="menu"
                aria-expanded={openMenu === 'view'}
                onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')}
                onKeyDown={(e) => handleTriggerKeyDown('view', e)}
                className={menuButtonClass('view')}
              >
                View
              </button>
              {openMenu === 'view' && (
                <div
                  ref={activeMenuRef}
                  role="menu"
                  onKeyDown={handleMenuKeyDown}
                  className="absolute left-0 top-8 w-56 bg-[#F4EFE0] border-2 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] py-1 z-50"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(toggleCrt)}
                    className="w-full text-left px-3 py-1.5 text-xs flex justify-between hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    <span>CRT Scanlines</span>
                    <span>{crtEnabled ? '[ON]' : '[OFF]'}</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(toggleSound)}
                    className="w-full text-left px-3 py-1.5 text-xs flex justify-between hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    <span>UI Sound Effects</span>
                    <span>{soundEnabled ? '[ON]' : '[MUTED]'}</span>
                  </button>
                  <div className="my-1 border-t-2 border-[#1A1A1A]" />
                  <div className="px-3 py-1 text-[10px] font-bold text-[#4A463B]">
                    Wallpaper Pattern
                  </div>
                  {(['dither', 'dots', 'grid', 'diagonal'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      role="menuitem"
                      onClick={() => runAction(() => setWallpaper(mode))}
                      className="w-full text-left px-3 py-1 text-xs flex justify-between hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                    >
                      <span className="capitalize">{mode}</span>
                      <span>{wallpaper === mode ? '[*]' : ''}</span>
                    </button>
                  ))}
                  <div className="my-1 border-t-2 border-[#1A1A1A]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(() => openSwitcher(1))}
                    className="w-full text-left px-3 py-1.5 text-xs flex justify-between hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    <span>Switch Window...</span>
                    <span className="opacity-70">{WINDOW_MANAGER_COPY.switcherShortcutLabel}</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(() => cascadeWindows(viewport))}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    Cascade Open Windows
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(() => tileWindows(viewport))}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    Tile Open Windows
                  </button>
                  <div className="my-1 border-t-2 border-[#1A1A1A]" />
                  {onEnterEmulator && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => runAction(onEnterEmulator)}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                    >
                      Win Emulator Frame
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(() => openWindow('settings', viewport))}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    {SYSTEM_CHROME_COPY.contextMenu.openSettings}
                  </button>
                </div>
              )}
            </div>

            {/* Special Menu */}
            <div className="relative h-full">
              <button
                ref={(el) => {
                  triggerRefs.current.special = el;
                }}
                type="button"
                aria-haspopup="menu"
                aria-expanded={openMenu === 'special'}
                onClick={() => setOpenMenu(openMenu === 'special' ? null : 'special')}
                onKeyDown={(e) => handleTriggerKeyDown('special', e)}
                className={menuButtonClass('special')}
              >
                Special
              </button>
              {openMenu === 'special' && (
                <div
                  ref={activeMenuRef}
                  role="menu"
                  onKeyDown={handleMenuKeyDown}
                  className="absolute left-0 top-8 w-56 bg-[#F4EFE0] border-2 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] py-1 z-50"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(emptyTrash)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    Empty Trash
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(lockSystem)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    {SYSTEM_CHROME_COPY.startMenu.lockAction}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(rebootSystem)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    Reboot ShivamOS
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(shutDownSystem)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    {SYSTEM_CHROME_COPY.startMenu.shutDownAction}...
                  </button>
                  <div className="my-1 border-t-2 border-[#1A1A1A]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(triggerBsod)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#E4572E] hover:text-[#F4EFE0] focus:bg-[#E4572E] focus:text-[#F4EFE0]"
                  >
                    Trigger Blue Screen...
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      {/* Right: PWA Install, Sound mute toggle, CRT toggle, live clock (easter egg trigger) */}
      <div className="flex items-center h-full gap-1.5 shrink-0">
        <PWAInstallButton variant="compact" />

        <button
          type="button"
          onClick={toggleCrt}
          aria-pressed={crtEnabled}
          aria-label={crtEnabled ? 'Disable CRT scanlines' : 'Enable CRT scanlines'}
          title="Toggle CRT scanlines"
          className={`h-6 px-2 flex items-center gap-1 text-xs font-semibold border-2 border-[#1A1A1A] whitespace-nowrap shrink-0 ${
            crtEnabled ? 'bg-[#1A1A1A] text-[#33FF66]' : 'bg-[#E8E0C8] text-[#1A1A1A] hover:bg-[#D8CFB2]'
          }`}
        >
          <CrtPixelIcon enabled={crtEnabled} size={14} />
          <span className="hidden sm:inline">CRT</span>
        </button>

        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? 'Mute UI sound effects' : 'Unmute UI sound effects'}
          title={soundEnabled ? 'UI sounds on (click to mute)' : 'UI sounds muted (click to enable)'}
          className={`h-6 px-2 flex items-center gap-1 text-xs font-semibold border-2 border-[#1A1A1A] whitespace-nowrap shrink-0 ${
            soundEnabled ? 'bg-[#2A9D8F] text-[#F4EFE0]' : 'bg-[#E8E0C8] text-[#1A1A1A] hover:bg-[#D8CFB2]'
          }`}
        >
          <SpeakerPixelIcon enabled={soundEnabled} size={14} />
          <span className="hidden sm:inline">{soundEnabled ? 'SFX' : 'MUTE'}</span>
        </button>

        <button
          type="button"
          onClick={triggerBsod}
          aria-label={`System clock ${clockText || 'live'} — click for system diagnostic`}
          title="Click clock for a surprise"
          className="h-6 px-2 flex items-center text-xs font-semibold tabular-nums border-2 border-[#1A1A1A] bg-[#F4EFE0] hover:bg-[#1A1A1A] hover:text-[#F4EFE0] whitespace-nowrap shrink-0"
        >
          {clockText || '12:00 PM'}
        </button>
      </div>
    </header>
  );
}
