import React, { useRef } from 'react';
import { type OSWindowState, useWindowStore } from '../store/windowStore';
import {
  detectEdgeSnapZone,
  snapWindowPositionToGrid,
  snapWindowSizeToGrid,
  type EdgeSnapZone,
  type ViewportSize,
} from '../utils/windowLogic';

interface DesktopWindowProps {
  win: OSWindowState;
  isFocused: boolean;
  isMobile: boolean;
  viewport: ViewportSize;
  darkBody?: boolean;
  children: React.ReactNode;
}

export function DesktopWindow({
  win,
  isFocused,
  isMobile,
  viewport,
  darkBody = false,
  children,
}: DesktopWindowProps) {
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const toggleMaximizeWindow = useWindowStore((s) => s.toggleMaximizeWindow);
  const moveWindow = useWindowStore((s) => s.moveWindow);
  const resizeWindow = useWindowStore((s) => s.resizeWindow);
  const setSnapPreviewZone = useWindowStore((s) => s.setSnapPreviewZone);
  const snapWindowToEdge = useWindowStore((s) => s.snapWindowToEdge);
  const unsnapWindow = useWindowStore((s) => s.unsnapWindow);

  const dragOriginRef = useRef<{
    pointerX: number;
    pointerY: number;
    winX: number;
    winY: number;
    width: number;
    hasMoved: boolean;
    wasSnappedOrMaximized: boolean;
    activeSnapZone: EdgeSnapZone | null;
  } | null>(null);

  const resizeOriginRef = useRef<{
    pointerX: number;
    pointerY: number;
    width: number;
    height: number;
    hasResized: boolean;
  } | null>(null);

  if (!win.isOpen || (!isMobile && win.isMinimized)) {
    return null;
  }

  const handleTitlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMobile || win.isClosing) return;
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    focusWindow(win.id);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOriginRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      winX: win.x,
      winY: win.y,
      width: win.width,
      hasMoved: false,
      wasSnappedOrMaximized: Boolean(win.isMaximized || win.snapZone),
      activeSnapZone: null,
    };
  };

  const handleTitlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const origin = dragOriginRef.current;
    if (!origin || isMobile) return;
    const dx = e.clientX - origin.pointerX;
    const dy = e.clientY - origin.pointerY;
    if (!origin.hasMoved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;

    if (!origin.hasMoved && origin.wasSnappedOrMaximized) {
      // Restore floating dimensions anchored proportionally under the cursor
      const restoredW = win.restoreRect ? win.restoreRect.width : win.width;
      const ratio = origin.width > 0 ? (origin.pointerX - origin.winX) / origin.width : 0.5;
      const anchoredX = Math.round(e.clientX - restoredW * Math.min(Math.max(ratio, 0.15), 0.85));
      const anchoredY = Math.round(e.clientY - 16);
      unsnapWindow(win.id, anchoredX, anchoredY, viewport);
      origin.winX = anchoredX;
      origin.winY = anchoredY;
      origin.width = restoredW;
      origin.pointerX = e.clientX;
      origin.pointerY = e.clientY;
      origin.wasSnappedOrMaximized = false;
      origin.hasMoved = true;
      return;
    }

    origin.hasMoved = true;
    const nextX = origin.winX + (e.clientX - origin.pointerX);
    const nextY = origin.winY + (e.clientY - origin.pointerY);
    moveWindow(win.id, nextX, nextY, viewport);

    const edgeZone = detectEdgeSnapZone(e.clientX, e.clientY, viewport);
    origin.activeSnapZone = edgeZone;
    setSnapPreviewZone(edgeZone);
  };

  const finishTitleDrag = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const origin = dragOriginRef.current;
    if (!origin) return;
    dragOriginRef.current = null;
    setSnapPreviewZone(null);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (!origin.hasMoved || isMobile) return;

    if (!cancelled && origin.activeSnapZone) {
      snapWindowToEdge(win.id, origin.activeSnapZone, viewport);
      return;
    }

    const dx = e.clientX - origin.pointerX;
    const dy = e.clientY - origin.pointerY;
    const snapped = snapWindowPositionToGrid(
      origin.winX + dx,
      origin.winY + dy,
      origin.width,
      viewport
    );
    moveWindow(win.id, snapped.x, snapped.y, viewport);
  };

  const handleResizePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isMobile || win.isClosing) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    focusWindow(win.id);
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeOriginRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      width: win.width,
      height: win.height,
      hasResized: false,
    };
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const origin = resizeOriginRef.current;
    if (!origin || isMobile) return;
    const dx = e.clientX - origin.pointerX;
    const dy = e.clientY - origin.pointerY;
    if (dx === 0 && dy === 0 && !origin.hasResized) return;
    origin.hasResized = true;
    resizeWindow(win.id, origin.width + dx, origin.height + dy, viewport);
  };

  const finishResize = (e: React.PointerEvent<HTMLButtonElement>) => {
    const origin = resizeOriginRef.current;
    if (!origin) return;
    resizeOriginRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (origin.hasResized && !isMobile) {
      const dx = e.clientX - origin.pointerX;
      const dy = e.clientY - origin.pointerY;
      const snapped = snapWindowSizeToGrid(
        win.x,
        win.y,
        origin.width + dx,
        origin.height + dy,
        win.minWidth,
        win.minHeight,
        viewport
      );
      resizeWindow(win.id, snapped.width, snapped.height, viewport);
    }
  };

  const desktopStyle: React.CSSProperties = isMobile
    ? {}
    : {
        position: 'absolute',
        left: `${win.x}px`,
        top: `${win.y}px`,
        width: `${win.width}px`,
        height: `${win.height}px`,
        zIndex: win.zIndex,
      };

  const isSnappedOrMaximized = Boolean(win.isMaximized || win.snapZone);

  return (
    <section
      aria-label={win.title}
      data-window-id={win.id}
      data-focused={isFocused ? 'true' : 'false'}
      data-closing={win.isClosing ? 'true' : 'false'}
      data-snap-zone={win.snapZone ?? 'none'}
      onPointerDown={() => {
        if (!isMobile && !win.isClosing) focusWindow(win.id);
      }}
      style={desktopStyle}
      className={`pointer-events-auto os-window ${
        win.isClosing ? 'animate-window-close' : 'animate-window-open'
      } flex flex-col overflow-hidden ${isMobile ? 'w-full relative mb-4 scroll-mt-10' : ''}`}
    >
      {/* Title Bar */}
      <div
        onPointerDown={handleTitlePointerDown}
        onPointerMove={handleTitlePointerMove}
        onPointerUp={(e) => finishTitleDrag(e, false)}
        onPointerCancel={(e) => finishTitleDrag(e, true)}
        onDoubleClick={() => {
          if (!isMobile && !win.isClosing) toggleMaximizeWindow(win.id, viewport);
        }}
        className={`h-8 shrink-0 flex items-center justify-between px-2 border-b-2 border-[#1A1A1A] select-none ${
          isFocused ? 'bg-[#F4EFE0]' : 'bg-[#E8E0C8]'
        } ${!isMobile ? 'touch-none' : ''}`}
      >
        {/* Left: Close box */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            aria-label={`Close ${win.title}`}
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(win.id);
            }}
            className="w-5 h-5 border-2 border-[#1A1A1A] bg-[#F4EFE0] hover:bg-[#E4572E] hover:text-[#F4EFE0] flex items-center justify-center text-xs font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Center: Classic pinstripes + pixel title */}
        <div className="flex-1 mx-2 flex items-center gap-2 min-w-0">
          <div
            className={`hidden sm:block flex-1 h-3 ${
              isFocused ? 'titlebar-stripes-active' : 'titlebar-stripes-inactive'
            }`}
            aria-hidden="true"
          />
          <h2
            className={`px-2 text-xs sm:text-[13px] truncate ${
              isFocused ? 'text-[#1A1A1A]' : 'text-[#4A463B]'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {win.title}
          </h2>
          <div
            className={`hidden sm:block flex-1 h-3 ${
              isFocused ? 'titlebar-stripes-active' : 'titlebar-stripes-inactive'
            }`}
            aria-hidden="true"
          />
        </div>

        {/* Right: Minimize + Zoom/Restore boxes */}
        <div className="flex items-center gap-1 shrink-0">
          {!isMobile && (
            <>
              <button
                type="button"
                aria-label={`Minimize ${win.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  minimizeWindow(win.id);
                }}
                className="w-5 h-5 border-2 border-[#1A1A1A] bg-[#F4EFE0] hover:bg-[#2A9D8F] hover:text-[#F4EFE0] flex items-center justify-center text-xs font-bold leading-none"
              >
                _
              </button>
              <button
                type="button"
                aria-label={isSnappedOrMaximized ? `Restore ${win.title}` : `Zoom ${win.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMaximizeWindow(win.id, viewport);
                }}
                className="w-5 h-5 border-2 border-[#1A1A1A] bg-[#F4EFE0] hover:bg-[#2A9D8F] hover:text-[#F4EFE0] flex items-center justify-center text-[10px] font-bold leading-none"
              >
                {isSnappedOrMaximized ? '❐' : '□'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Scrollable Window Body */}
      <div
        className={`flex-1 min-h-0 overflow-y-auto os-scroll ${
          darkBody ? 'bg-[#0B130B] text-[#33FF66]' : 'bg-[#F4EFE0] text-[#1A1A1A]'
        }`}
      >
        {children}
      </div>

      {/* Resizable Bottom-Right Corner (Desktop only) */}
      {!isMobile && (
        <button
          type="button"
          aria-label={`Resize ${win.title}`}
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={finishResize}
          onPointerCancel={finishResize}
          className={`absolute bottom-0 right-0 w-4 h-4 border-t-2 border-l-2 border-[#1A1A1A] touch-none flex items-end justify-end p-0.5 ${
            darkBody ? 'bg-[#0B130B]' : 'bg-[#E8E0C8] hover:bg-[#D8CFB2]'
          }`}
          style={{ cursor: 'nwse-resize' }}
          title="Drag to resize (snaps to 8px grid)"
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            shapeRendering="crispEdges"
            aria-hidden="true"
          >
            <rect x="6" y="0" width="2" height="2" fill={darkBody ? '#33FF66' : '#1A1A1A'} />
            <rect x="3" y="3" width="2" height="2" fill={darkBody ? '#33FF66' : '#1A1A1A'} />
            <rect x="6" y="3" width="2" height="2" fill={darkBody ? '#33FF66' : '#1A1A1A'} />
            <rect x="0" y="6" width="2" height="2" fill={darkBody ? '#33FF66' : '#1A1A1A'} />
            <rect x="3" y="6" width="2" height="2" fill={darkBody ? '#33FF66' : '#1A1A1A'} />
            <rect x="6" y="6" width="2" height="2" fill={darkBody ? '#33FF66' : '#1A1A1A'} />
          </svg>
        </button>
      )}
    </section>
  );
}
