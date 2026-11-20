import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  DESKTOP_ICON_LABELS,
  PROJECTS,
  SYSTEM_CHROME_COPY,
  WINDOW_MANAGER_COPY,
} from '../data/content';
import { BlueScreen } from './components/BlueScreen';
import { BootScreen } from './components/BootScreen';
import {
  DesktopIconsLayer,
  type IconContextTarget,
} from './components/DesktopIconsLayer';
import { DesktopWindow } from './components/DesktopWindow';
import { LockScreen } from './components/LockScreen';
import { MenuBar } from './components/MenuBar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PowerOffScreen } from './components/PowerOffScreen';
import { Taskbar } from './components/Taskbar';
import { RetroGamePad } from './components/RetroGamePad';
import { ToastContainer } from './components/ToastContainer';
import { WindowSwitcher } from './components/WindowSwitcher';
import { WinEmulatorShell } from './components/WinEmulatorShell';
import { AboutWindow } from './components/windows/AboutWindow';
import { selectFocusedWindowId, useWindowStore } from './store/windowStore';
import {
  ICON_HEIGHT,
  ICON_WIDTH,
  getIconsInMarquee,
  normalizeMarqueeRect,
  type DesktopIconId,
  type MarqueeRect,
  type Point,
} from './utils/desktopLogic';
import { isGameWindow, shouldUseEmulatorLayout } from './utils/emulatorLogic';
import {
  TASKBAR_HEIGHT,
  advanceKonamiBuffer,
  computeEdgeSnapRect,
  type ViewportSize,
  type WindowId,
} from './utils/windowLogic';

// Lazy-load non-primary and heavy windows so the initial bundle stays under 500 kB
const ProjectsFolderWindow = lazy(() =>
  import('./components/windows/ProjectsFolderWindow').then((m) => ({
    default: m.ProjectsFolderWindow,
  }))
);
const ProjectDetailWindow = lazy(() =>
  import('./components/windows/ProjectDetailWindow').then((m) => ({
    default: m.ProjectDetailWindow,
  }))
);
const ResumeWindow = lazy(() =>
  import('./components/windows/ResumeWindow').then((m) => ({ default: m.ResumeWindow }))
);
const SkillsWindow = lazy(() =>
  import('./components/windows/SkillsWindow').then((m) => ({ default: m.SkillsWindow }))
);
const ContactWindow = lazy(() =>
  import('./components/windows/ContactWindow').then((m) => ({ default: m.ContactWindow }))
);
const TerminalWindow = lazy(() =>
  import('./components/windows/TerminalWindow').then((m) => ({ default: m.TerminalWindow }))
);
const TrashWindow = lazy(() =>
  import('./components/windows/TrashWindow').then((m) => ({ default: m.TrashWindow }))
);
const GamesFolderWindow = lazy(() =>
  import('./components/windows/GamesFolderWindow').then((m) => ({
    default: m.GamesFolderWindow,
  }))
);
const SnakeGameWindow = lazy(() =>
  import('./components/windows/SnakeGameWindow').then((m) => ({ default: m.SnakeGameWindow }))
);
const TetrisWindow = lazy(() =>
  import('./components/windows/TetrisWindow').then((m) => ({ default: m.TetrisWindow }))
);
const MinesweeperWindow = lazy(() =>
  import('./components/windows/MinesweeperWindow').then((m) => ({
    default: m.MinesweeperWindow,
  }))
);
const PongGameWindow = lazy(() =>
  import('./components/windows/PongGameWindow').then((m) => ({ default: m.PongGameWindow }))
);
const PaintWindow = lazy(() =>
  import('./components/windows/PaintWindow').then((m) => ({ default: m.PaintWindow }))
);
const NotesWindow = lazy(() =>
  import('./components/windows/NotesWindow').then((m) => ({ default: m.NotesWindow }))
);
const FileExplorerWindow = lazy(() =>
  import('./components/windows/FileExplorerWindow').then((m) => ({
    default: m.FileExplorerWindow,
  }))
);
const SettingsWindow = lazy(() =>
  import('./components/windows/SettingsWindow').then((m) => ({ default: m.SettingsWindow }))
);
const PropertiesDialog = lazy(() =>
  import('./components/PropertiesDialog').then((m) => ({ default: m.PropertiesDialog }))
);

type ContextMenuState =
  | { kind: 'desktop'; x: number; y: number; clickPoint: Point }
  | { kind: 'desktop-icon'; iconId: DesktopIconId; x: number; y: number }
  | { kind: 'custom-folder'; folderId: string; x: number; y: number };

function readViewport(): ViewportSize {
  if (typeof window === 'undefined') return { width: 1440, height: 900 };
  return { width: window.innerWidth, height: window.innerHeight };
}

function WindowLoadingFallback({ dark }: { dark?: boolean }) {
  return (
    <div
      className={`p-4 text-xs font-bold ${
        dark ? 'bg-[#0B130B] text-[#33FF66]' : 'bg-[#F4EFE0] text-[#1A1A1A]'
      }`}
    >
      {WINDOW_MANAGER_COPY.loadingWindow}
    </div>
  );
}

export default function App() {
  const [viewport, setViewport] = useState<ViewportSize>(readViewport);
  const [forceEmulator, setForceEmulator] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('emulator') === '1';
  });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);

  const konamiBufferRef = useRef<string[]>([]);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const marqueeOriginRef = useRef<{
    start: Point;
    additive: boolean;
    baseSelection: DesktopIconId[];
    active: boolean;
  } | null>(null);

  const powerState = useWindowStore((s) => s.powerState);
  const crtEnabled = useWindowStore((s) => s.crtEnabled);
  const wallpaper = useWindowStore((s) => s.wallpaper);
  const reduceMotion = useWindowStore((s) => s.reduceMotion);
  const bsodActive = useWindowStore((s) => s.bsodActive);
  const windows = useWindowStore((s) => s.windows);
  const trashItems = useWindowStore((s) => s.trashItems);
  const iconPositions = useWindowStore((s) => s.iconPositions);
  const customFolders = useWindowStore((s) => s.customFolders);
  const selectedIconIds = useWindowStore((s) => s.selectedIconIds);
  const snapPreviewZone = useWindowStore((s) => s.snapPreviewZone);
  const switcherOpen = useWindowStore((s) => s.switcherOpen);
  const propertiesTarget = useWindowStore((s) => s.propertiesTarget);

  const finishBoot = useWindowStore((s) => s.finishBoot);
  const unlockDesktop = useWindowStore((s) => s.unlockDesktop);
  const powerOnSystem = useWindowStore((s) => s.powerOnSystem);
  const openWindow = useWindowStore((s) => s.openWindow);
  const closeFocusedWindow = useWindowStore((s) => s.closeFocusedWindow);
  const selectIcons = useWindowStore((s) => s.selectIcons);
  const cycleWallpaper = useWindowStore((s) => s.cycleWallpaper);
  const createDesktopFolder = useWindowStore((s) => s.createDesktopFolder);
  const deleteCustomFolder = useWindowStore((s) => s.deleteCustomFolder);
  const startRenaming = useWindowStore((s) => s.startRenaming);
  const refreshDesktop = useWindowStore((s) => s.refreshDesktop);
  const openProperties = useWindowStore((s) => s.openProperties);
  const pushToast = useWindowStore((s) => s.pushToast);
  const cascadeWindows = useWindowStore((s) => s.cascadeWindows);
  const tileWindows = useWindowStore((s) => s.tileWindows);
  const resetLayout = useWindowStore((s) => s.resetLayout);
  const triggerBsod = useWindowStore((s) => s.triggerBsod);
  const dismissBsod = useWindowStore((s) => s.dismissBsod);
  const fitWindowsToViewport = useWindowStore((s) => s.fitWindowsToViewport);
  const fitIconsToViewport = useWindowStore((s) => s.fitIconsToViewport);
  const openSwitcher = useWindowStore((s) => s.openSwitcher);
  const stepSwitcher = useWindowStore((s) => s.stepSwitcher);
  const commitSwitcher = useWindowStore((s) => s.commitSwitcher);
  const cancelSwitcher = useWindowStore((s) => s.cancelSwitcher);
  const soundEnabled = useWindowStore((s) => s.soundEnabled);
  const focusWindow = useWindowStore((s) => s.focusWindow);

  const isEmulatorMode = shouldUseEmulatorLayout(viewport, forceEmulator);
  const isMobile = isEmulatorMode;
  const focusedId = selectFocusedWindowId(windows);
  const isTrashEmpty = trashItems.length === 0;

  const activeDesktopGameId =
    !isEmulatorMode &&
    focusedId &&
    isGameWindow(focusedId) &&
    windows[focusedId]?.isOpen &&
    !windows[focusedId]?.isMinimized
      ? focusedId
      : null;

  const [desktopPadDismissed, setDesktopPadDismissed] = useState(false);

  // Auto-activate desktop D-pad when any game opens or gains focus; reset dismissal on new game
  useEffect(() => {
    if (activeDesktopGameId) {
      setDesktopPadDismissed(false);
    }
  }, [activeDesktopGameId]);

  // Support ?autostart=1 to jump straight to desktop (for rapid automated verification)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      unlockDesktop();
    }
  }, [unlockDesktop]);

  // Sync reduce-motion setting onto <html> for CSS animation overrides
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = reduceMotion ? 'true' : 'false';
  }, [reduceMotion]);

  // Track viewport size and keep windows & icons clamped inside visible bounds
  useEffect(() => {
    const onResize = () => {
      const next = readViewport();
      setViewport(next);
      fitWindowsToViewport(next);
      fitIconsToViewport(next);
    };
    const initial = readViewport();
    fitWindowsToViewport(initial);
    fitIconsToViewport(initial);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [fitWindowsToViewport, fitIconsToViewport]);

  // Focus first item when desktop or icon context menu opens for roving arrow-key navigation
  useEffect(() => {
    if (!contextMenu) return;
    const id = window.requestAnimationFrame(() => {
      const first = contextMenuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
      first?.focus();
    });
    const onMouseDown = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, [contextMenu]);

  // Global keyboard shortcuts while desktop is active
  useEffect(() => {
    if (powerState !== 'desktop') return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (bsodActive || propertiesTarget) return;

      // Alt+Tab (or Alt+` host-OS-safe alias) opens/cycles the Window Switcher on desktop
      if (!isMobile && e.altKey && (e.key === 'Tab' || e.key === '`')) {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu(null);
        openSwitcher(e.shiftKey ? -1 : 1);
        return;
      }

      // Keyboard navigation while Window Switcher is open
      if (switcherOpen) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
          e.preventDefault();
          stepSwitcher(1);
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
          e.preventDefault();
          stepSwitcher(-1);
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          commitSwitcher();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelSwitcher();
          return;
        }
        return;
      }

      // Ctrl+W closes the currently focused window
      if (e.ctrlKey && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        e.stopPropagation();
        closeFocusedWindow();
        return;
      }

      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if (e.key === 'Escape') {
        if (contextMenu) {
          setContextMenu(null);
          return;
        }
        if (!isTyping) {
          closeFocusedWindow();
        }
        return;
      }

      // Pressing Enter when multiple desktop icons are selected opens them
      if (
        !isMobile &&
        !isTyping &&
        e.key === 'Enter' &&
        selectedIconIds.length > 0 &&
        (target === document.body || target?.tagName === 'MAIN')
      ) {
        e.preventDefault();
        selectedIconIds.forEach((id) => openWindow(id, viewport));
        return;
      }

      if (!isTyping) {
        const res = advanceKonamiBuffer(konamiBufferRef.current, e.key);
        konamiBufferRef.current = res.nextBuffer;
        if (res.matched) {
          triggerBsod();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' && switcherOpen) {
        commitSwitcher();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [
    powerState,
    bsodActive,
    propertiesTarget,
    isMobile,
    switcherOpen,
    contextMenu,
    selectedIconIds,
    viewport,
    openSwitcher,
    stepSwitcher,
    commitSwitcher,
    cancelSwitcher,
    closeFocusedWindow,
    openWindow,
    triggerBsod,
  ]);

  const renderWindowBody = (id: WindowId) => {
    if (id === 'about') return <AboutWindow viewport={viewport} />;

    let lazyNode: React.ReactNode = null;
    if (id === 'projects') lazyNode = <ProjectsFolderWindow viewport={viewport} />;
    else if (id === 'resume') lazyNode = <ResumeWindow />;
    else if (id === 'skills') lazyNode = <SkillsWindow />;
    else if (id === 'contact') lazyNode = <ContactWindow />;
    else if (id === 'terminal') lazyNode = <TerminalWindow viewport={viewport} />;
    else if (id === 'trash') lazyNode = <TrashWindow />;
    else if (id === 'games') lazyNode = <GamesFolderWindow viewport={viewport} />;
    else if (id === 'game-snake') lazyNode = <SnakeGameWindow />;
    else if (id === 'game-tetris') lazyNode = <TetrisWindow />;
    else if (id === 'game-minesweeper') lazyNode = <MinesweeperWindow />;
    else if (id === 'game-pong') lazyNode = <PongGameWindow />;
    else if (id === 'paint') lazyNode = <PaintWindow />;
    else if (id === 'notes') lazyNode = <NotesWindow />;
    else if (id === 'explorer') lazyNode = <FileExplorerWindow viewport={viewport} />;
    else if (id === 'settings') lazyNode = <SettingsWindow />;
    else {
      const project = PROJECTS.find((p) => p.id === id);
      if (project) {
        lazyNode = <ProjectDetailWindow project={project} />;
      }
    }

    if (!lazyNode) return null;
    return (
      <Suspense fallback={<WindowLoadingFallback dark={id === 'terminal'} />}>
        {lazyNode}
      </Suspense>
    );
  };

  if (powerState === 'booting') {
    return <BootScreen onComplete={finishBoot} />;
  }

  if (powerState === 'locked') {
    return <LockScreen onUnlock={unlockDesktop} />;
  }

  if (powerState === 'shutting-down' || powerState === 'off') {
    return <PowerOffScreen phase={powerState} onPowerOn={powerOnSystem} />;
  }

  const handleDesktopPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.button !== 0) return;
    setContextMenu(null);

    const additive = e.shiftKey;
    if (!additive) {
      selectIcons([], []);
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    marqueeOriginRef.current = {
      start: { x: e.clientX, y: e.clientY },
      additive,
      baseSelection: additive ? [...selectedIconIds] : [],
      active: false,
    };
  };

  const handleDesktopPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const origin = marqueeOriginRef.current;
    if (!origin) return;

    const dx = e.clientX - origin.start.x;
    const dy = e.clientY - origin.start.y;
    if (!origin.active && Math.hypot(dx, dy) < 4) return;

    origin.active = true;
    const rect = normalizeMarqueeRect(origin.start, { x: e.clientX, y: e.clientY });
    setMarqueeRect(rect);

    const hits = getIconsInMarquee(rect, iconPositions);
    const folderHits = customFolders
      .filter(
        (folder) =>
          folder.x < rect.x + rect.width &&
          folder.x + ICON_WIDTH > rect.x &&
          folder.y < rect.y + rect.height &&
          folder.y + ICON_HEIGHT > rect.y
      )
      .map((f) => f.id);

    if (origin.additive) {
      const merged = Array.from(new Set([...origin.baseSelection, ...hits]));
      selectIcons(merged, folderHits);
    } else {
      selectIcons(hits, folderHits);
    }
  };

  const finishDesktopMarquee = (e: React.PointerEvent<HTMLElement>) => {
    if (!marqueeOriginRef.current) return;
    marqueeOriginRef.current = null;
    setMarqueeRect(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const clampContextCoords = (clientX: number, clientY: number, menuW: number, menuH: number) => ({
    x: Math.min(clientX, Math.max(8, viewport.width - menuW - 8)),
    y: Math.min(clientY, Math.max(40, viewport.height - TASKBAR_HEIGHT - menuH - 8)),
  });

  const handleDesktopContextMenu = (e: React.MouseEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    const pos = clampContextCoords(e.clientX, e.clientY, 216, 288);
    setContextMenu({
      kind: 'desktop',
      x: pos.x,
      y: pos.y,
      clickPoint: { x: e.clientX, y: e.clientY },
    });
  };

  const handleIconContextMenu = (target: IconContextTarget, clientX: number, clientY: number) => {
    const pos = clampContextCoords(clientX, clientY, 192, 160);
    if (target.kind === 'desktop-icon') {
      setContextMenu({ kind: 'desktop-icon', iconId: target.iconId, x: pos.x, y: pos.y });
    } else {
      setContextMenu({ kind: 'custom-folder', folderId: target.folderId, x: pos.x, y: pos.y });
    }
  };

  const handleContextMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const container = contextMenuRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    if (items.length === 0) return;
    const idx = items.indexOf(document.activeElement as HTMLButtonElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(idx + 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setContextMenu(null);
    }
  };

  const runContextAction = (fn: () => void) => {
    fn();
    setContextMenu(null);
  };

  const snapPreviewRect =
    !isMobile && snapPreviewZone ? computeEdgeSnapRect(snapPreviewZone, viewport) : null;

  const ctxCopy = SYSTEM_CHROME_COPY.contextMenu;

  return (
    <div
      data-wallpaper={wallpaper}
      className={`desktop-${wallpaper} relative min-h-screen w-full overflow-x-hidden`}
    >
      {!isEmulatorMode && (
        <MenuBar
          viewport={viewport}
          isMobile={false}
          onEnterEmulator={() => setForceEmulator(true)}
        />
      )}

      {/* Desktop Mode (>= 1024px): Freeform draggable icons, rubber-band select, windows & taskbar */}
      {!isEmulatorMode ? (
        <main
          aria-label="ShivamOS Desktop"
          onPointerDown={handleDesktopPointerDown}
          onPointerMove={handleDesktopPointerMove}
          onPointerUp={finishDesktopMarquee}
          onPointerCancel={finishDesktopMarquee}
          onContextMenu={handleDesktopContextMenu}
          className="relative w-full h-screen pt-8 pb-10 overflow-hidden select-none"
        >
          {/* Draggable 8px-grid Desktop Icons & Custom Folders */}
          <DesktopIconsLayer
            viewport={viewport}
            isTrashEmpty={isTrashEmpty}
            onDismissContextMenu={() => setContextMenu(null)}
            onIconContextMenu={handleIconContextMenu}
          />

          {/* Rubber-Band Selection Marquee */}
          {marqueeRect && (
            <div
              aria-hidden="true"
              data-testid="desktop-marquee"
              style={{
                left: `${marqueeRect.x}px`,
                top: `${marqueeRect.y}px`,
                width: `${marqueeRect.width}px`,
                height: `${marqueeRect.height}px`,
              }}
              className="pointer-events-none fixed z-20 border-2 border-dashed border-[#1A1A1A] bg-[#2A9D8F]/20"
            />
          )}

          {/* Draggable / Resizable Windows (isolated stacking context so high z-index never escapes above OS chrome) */}
          <div className="pointer-events-none fixed inset-0 z-20 isolate">
            {Object.values(windows).map((win) => (
              <DesktopWindow
                key={win.id}
                win={win}
                isFocused={focusedId === win.id}
                isMobile={false}
                viewport={viewport}
                darkBody={win.id === 'terminal'}
              >
                {renderWindowBody(win.id)}
              </DesktopWindow>
            ))}
          </div>

          {/* Edge-Snap Half-Screen Ghost Preview */}
          {snapPreviewRect && snapPreviewZone && (
            <div
              aria-hidden="true"
              data-testid="edge-snap-preview"
              data-snap-zone={snapPreviewZone}
              style={{
                left: `${snapPreviewRect.x}px`,
                top: `${snapPreviewRect.y}px`,
                width: `${snapPreviewRect.width}px`,
                height: `${snapPreviewRect.height}px`,
              }}
              className="pointer-events-none fixed z-[45] border-2 border-dashed border-[#E4572E] bg-[#2A9D8F]/15 flex items-center justify-center"
            >
              <span
                className="px-3 py-1 bg-[#F4EFE0] border-2 border-[#1A1A1A] shadow-[2px_2px_0_0_#1A1A1A] text-xs font-bold text-[#1A1A1A]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {snapPreviewZone === 'left'
                  ? WINDOW_MANAGER_COPY.snapLeftLabel
                  : WINDOW_MANAGER_COPY.snapRightLabel}
              </span>
            </div>
          )}

          {/* Desktop & Icon Right-Click Context Menus */}
          {contextMenu && (
            <div
              ref={contextMenuRef}
              role="menu"
              data-testid="context-menu"
              data-context-kind={contextMenu.kind}
              aria-label={
                contextMenu.kind === 'desktop' ? 'Desktop context menu' : 'Icon context menu'
              }
              onKeyDown={handleContextMenuKeyDown}
              style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
              className="fixed z-50 w-52 bg-[#F4EFE0] border-2 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] py-1 text-xs"
            >
              {contextMenu.kind === 'desktop' ? (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    data-ctx-action="refresh"
                    onClick={() => runContextAction(() => refreshDesktop(viewport))}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    {ctxCopy.refresh}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    data-ctx-action="wallpaper"
                    onClick={() => runContextAction(cycleWallpaper)}
                    className="w-full text-left px-3 py-1.5 flex justify-between hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    <span>{ctxCopy.changeWallpaper}</span>
                    <span className="opacity-75 capitalize">[{wallpaper}]</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    data-ctx-action="new-folder"
                    onClick={() =>
                      runContextAction(() => createDesktopFolder(viewport, contextMenu.clickPoint))
                    }
                    className="w-full text-left px-3 py-1.5 hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    {ctxCopy.newFolder}
                  </button>
                  <div className="my-1 border-t-2 border-[#1A1A1A]" />
                  <button
                    type="button"
                    role="menuitem"
                    data-ctx-action="explorer"
                    onClick={() => runContextAction(() => openWindow('explorer', viewport))}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    {ctxCopy.openExplorer}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    data-ctx-action="settings"
                    onClick={() => runContextAction(() => openWindow('settings', viewport))}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    {ctxCopy.openSettings}
                  </button>
                  <div className="my-1 border-t-2 border-[#1A1A1A]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runContextAction(() => cascadeWindows(viewport))}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    {ctxCopy.cascadeWindows}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runContextAction(() => tileWindows(viewport))}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    {ctxCopy.tileWindows}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runContextAction(() => resetLayout(viewport))}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#E4572E] hover:text-[#F4EFE0] focus:bg-[#E4572E] focus:text-[#F4EFE0]"
                  >
                    {ctxCopy.resetLayout}
                  </button>
                </>
              ) : contextMenu.kind === 'desktop-icon' ? (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    data-ctx-action="open"
                    onClick={() =>
                      runContextAction(() => openWindow(contextMenu.iconId, viewport))
                    }
                    className="w-full text-left px-3 py-1.5 font-bold hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    {ctxCopy.open}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    data-ctx-action="rename"
                    onClick={() => runContextAction(() => startRenaming(contextMenu.iconId))}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    {ctxCopy.rename}
                  </button>
                  <div className="my-1 border-t-2 border-[#1A1A1A]" />
                  <button
                    type="button"
                    role="menuitem"
                    data-ctx-action="properties"
                    onClick={() =>
                      runContextAction(() =>
                        openProperties({ kind: 'desktop-icon', iconId: contextMenu.iconId })
                      )
                    }
                    className="w-full text-left px-3 py-1.5 hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    {ctxCopy.properties}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    data-ctx-action="open"
                    onClick={() =>
                      runContextAction(() =>
                        pushToast(SYSTEM_CHROME_COPY.toasts.customFolderEmpty)
                      )
                    }
                    className="w-full text-left px-3 py-1.5 font-bold hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    {ctxCopy.open}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    data-ctx-action="rename"
                    onClick={() => runContextAction(() => startRenaming(contextMenu.folderId))}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    {ctxCopy.rename}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    data-ctx-action="properties"
                    onClick={() =>
                      runContextAction(() =>
                        openProperties({ kind: 'custom-folder', folderId: contextMenu.folderId })
                      )
                    }
                    className="w-full text-left px-3 py-1.5 hover:bg-[#1A1A1A] hover:text-[#F4EFE0] focus:bg-[#1A1A1A] focus:text-[#F4EFE0]"
                  >
                    {ctxCopy.properties}
                  </button>
                  <div className="my-1 border-t-2 border-[#1A1A1A]" />
                  <button
                    type="button"
                    role="menuitem"
                    data-ctx-action="delete-folder"
                    onClick={() =>
                      runContextAction(() => deleteCustomFolder(contextMenu.folderId))
                    }
                    className="w-full text-left px-3 py-1.5 hover:bg-[#E4572E] hover:text-[#F4EFE0] focus:bg-[#E4572E] focus:text-[#F4EFE0]"
                  >
                    {ctxCopy.deleteFolder}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Bottom Desktop Taskbar + Start Menu + System Tray */}
          <Taskbar viewport={viewport} />
        </main>
      ) : (
        /* Mobile & Tablet Mode (< 1024px): Classic Windows Emulator Shell with CRT bezel, Taskbar, Start Menu & Virtual Pad */
        <WinEmulatorShell
          viewport={viewport}
          isTrashEmpty={isTrashEmpty}
          renderWindowBody={renderWindowBody}
          forcedOnDesktop={forceEmulator && viewport.width >= 1024}
          onExitEmulator={() => setForceEmulator(false)}
        />
      )}

      {/* Auto-Active Floating Retro Game D-Pad on Desktop Mode when any game window is active */}
      {!isEmulatorMode && activeDesktopGameId && !desktopPadDismissed && (
        <aside
          aria-label="Retro Game D-Pad Controller"
          data-testid="desktop-gamepad-dock"
          className="no-print fixed bottom-12 right-4 z-40 bg-[#D8CFB2] border-2 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] animate-window-open flex flex-col overflow-hidden max-w-[280px]"
        >
          {/* Mini retro header bar */}
          <div className="h-6 bg-[#1A1A1A] text-[#F4EFE0] px-2 flex items-center justify-between gap-2 border-b-2 border-[#1A1A1A] select-none">
            <span
              className="text-[10px] font-bold tracking-wider"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              RETRO D-PAD
            </span>
            <button
              type="button"
              aria-label="Close D-Pad"
              onClick={() => setDesktopPadDismissed(true)}
              className="w-4 h-4 bg-[#F4EFE0] text-[#1A1A1A] hover:bg-[#E4572E] hover:text-[#F4EFE0] flex items-center justify-center text-xs font-bold leading-none border border-[#1A1A1A]"
            >
              ×
            </button>
          </div>
          <RetroGamePad
            activeWindowId={activeDesktopGameId}
            soundEnabled={soundEnabled}
            onFocusActiveWindow={() => focusWindow(activeDesktopGameId)}
          />
        </aside>
      )}

      {/* Alt+Tab Window Switcher */}
      {!isEmulatorMode && <WindowSwitcher />}

      {/* Properties Dialog (lazy-loaded) */}
      {propertiesTarget && (
        <Suspense fallback={null}>
          <PropertiesDialog />
        </Suspense>
      )}

      {/* Bottom-Right Stepped System Toasts */}
      <ToastContainer isMobile={isEmulatorMode} />

      {/* Offline Connectivity Indicator (PWA) */}
      <OfflineIndicator />

      {/* Optional CRT Scanlines Overlay */}
      {crtEnabled && (
        <div
          aria-hidden="true"
          data-testid="crt-overlay"
          className="crt-scanlines fixed inset-0 z-[90]"
        />
      )}

      {/* Hidden Blue Screen Easter Egg */}
      {bsodActive && <BlueScreen onDismiss={dismissBsod} />}
    </div>
  );
}
