export type WallpaperMode = 'dither' | 'dots' | 'grid' | 'diagonal';

export type EdgeSnapZone = 'left' | 'right';

export type WindowId =
  | 'about'
  | 'projects'
  | 'resume'
  | 'skills'
  | 'contact'
  | 'terminal'
  | 'trash'
  | 'games'
  | 'game-snake'
  | 'game-minesweeper'
  | 'game-pong'
  | 'game-tetris'
  | 'paint'
  | 'notes'
  | 'project-orchestratorflow'
  | 'project-gwen'
  | 'project-minigpt'
  | 'project-textile-defect'
  | 'project-yolov8'
  | 'explorer'
  | 'settings';

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export const MENU_BAR_HEIGHT = 32;
export const TASKBAR_HEIGHT = 40;
export const WINDOW_PADDING = 8;
export const GRID_SIZE = 8;
export const CASCADE_OFFSET = 24;
export const EDGE_SNAP_THRESHOLD = 20;

/**
 * Snap a single pixel coordinate to the nearest grid increment (default 8px).
 */
export function snapCoordinateToGrid(value: number, gridSize: number = GRID_SIZE): number {
  const snapped = Math.round(value / gridSize) * gridSize;
  return snapped === 0 ? 0 : snapped;
}

/**
 * Clamp a window position so the title bar remains reachable inside the desktop
 * area between the top menu bar and bottom taskbar.
 */
export function clampWindowPosition(
  x: number,
  y: number,
  width: number,
  viewport: ViewportSize
): { x: number; y: number } {
  const minVisibleX = Math.min(120, width);
  const minX = -(width - minVisibleX);
  const maxX = Math.max(WINDOW_PADDING, viewport.width - minVisibleX);
  const minY = MENU_BAR_HEIGHT;
  const maxY = Math.max(MENU_BAR_HEIGHT, viewport.height - TASKBAR_HEIGHT - 40);

  return {
    x: Math.round(Math.min(Math.max(x, minX), maxX)),
    y: Math.round(Math.min(Math.max(y, minY), maxY)),
  };
}

/**
 * Snap a window's (x, y) coordinates to the nearest grid line while keeping
 * the title bar strictly within the reachable viewport bounds above the taskbar.
 */
export function snapWindowPositionToGrid(
  x: number,
  y: number,
  width: number,
  viewport: ViewportSize,
  gridSize: number = GRID_SIZE
): { x: number; y: number } {
  const minVisibleX = Math.min(120, width);
  const minX = -(width - minVisibleX);
  const maxX = Math.max(WINDOW_PADDING, viewport.width - minVisibleX);
  const minY = MENU_BAR_HEIGHT;
  const maxY = Math.max(MENU_BAR_HEIGHT, viewport.height - TASKBAR_HEIGHT - 40);

  const clamped = clampWindowPosition(x, y, width, viewport);
  let snappedX = snapCoordinateToGrid(clamped.x, gridSize);
  let snappedY = snapCoordinateToGrid(clamped.y, gridSize);

  if (snappedX < minX) snappedX = Math.ceil(minX / gridSize) * gridSize;
  if (snappedX > maxX) snappedX = Math.floor(maxX / gridSize) * gridSize;
  if (snappedY < minY) snappedY = Math.ceil(minY / gridSize) * gridSize;
  if (snappedY > maxY) snappedY = Math.floor(maxY / gridSize) * gridSize;

  return {
    x: snappedX === 0 ? 0 : snappedX,
    y: snappedY === 0 ? 0 : snappedY,
  };
}

/**
 * Clamp a window's resized dimensions to its min constraints and desktop bounds above taskbar.
 */
export function clampWindowSize(
  x: number,
  y: number,
  width: number,
  height: number,
  minWidth: number,
  minHeight: number,
  viewport: ViewportSize
): { width: number; height: number } {
  const maxWidth = Math.max(minWidth, viewport.width - Math.max(0, x) - WINDOW_PADDING);
  const maxHeight = Math.max(
    minHeight,
    viewport.height - TASKBAR_HEIGHT - Math.max(MENU_BAR_HEIGHT, y) - WINDOW_PADDING
  );

  return {
    width: Math.round(Math.min(Math.max(width, minWidth), maxWidth)),
    height: Math.round(Math.min(Math.max(height, minHeight), maxHeight)),
  };
}

/**
 * Snap a window's resized dimensions to the nearest 8px grid multiple while
 * respecting both min constraints and desktop bounds above taskbar.
 */
export function snapWindowSizeToGrid(
  x: number,
  y: number,
  width: number,
  height: number,
  minWidth: number,
  minHeight: number,
  viewport: ViewportSize,
  gridSize: number = GRID_SIZE
): { width: number; height: number } {
  const maxWidth = Math.max(minWidth, viewport.width - Math.max(0, x) - WINDOW_PADDING);
  const maxHeight = Math.max(
    minHeight,
    viewport.height - TASKBAR_HEIGHT - Math.max(MENU_BAR_HEIGHT, y) - WINDOW_PADDING
  );

  const clamped = clampWindowSize(x, y, width, height, minWidth, minHeight, viewport);
  let snappedW = snapCoordinateToGrid(clamped.width, gridSize);
  let snappedH = snapCoordinateToGrid(clamped.height, gridSize);

  const minGridW = Math.ceil(minWidth / gridSize) * gridSize;
  const maxGridW = Math.floor(maxWidth / gridSize) * gridSize;
  const minGridH = Math.ceil(minHeight / gridSize) * gridSize;
  const maxGridH = Math.floor(maxHeight / gridSize) * gridSize;

  if (snappedW < minGridW) snappedW = minGridW;
  if (maxGridW >= minGridW && snappedW > maxGridW) snappedW = maxGridW;
  if (snappedH < minGridH) snappedH = minGridH;
  if (maxGridH >= minGridH && snappedH > maxGridH) snappedH = maxGridH;

  return {
    width: snappedW,
    height: snappedH,
  };
}

/**
 * Clamp a window rectangle completely inside the visible desktop area above the taskbar on an 8px grid.
 */
export function clampWindowRectToViewport(
  x: number,
  y: number,
  width: number,
  height: number,
  minWidth: number,
  minHeight: number,
  viewport: ViewportSize,
  gridSize: number = GRID_SIZE
): { x: number; y: number; width: number; height: number } {
  const availW = Math.max(minWidth, viewport.width - WINDOW_PADDING * 2);
  const availH = Math.max(
    minHeight,
    viewport.height - MENU_BAR_HEIGHT - TASKBAR_HEIGHT - WINDOW_PADDING * 2
  );

  const targetW = Math.min(Math.max(width, minWidth), availW);
  const targetH = Math.min(Math.max(height, minHeight), availH);

  const snappedW = Math.max(
    Math.ceil(minWidth / gridSize) * gridSize,
    Math.min(
      snapCoordinateToGrid(targetW, gridSize),
      Math.floor(availW / gridSize) * gridSize || Math.ceil(minWidth / gridSize) * gridSize
    )
  );
  const snappedH = Math.max(
    Math.ceil(minHeight / gridSize) * gridSize,
    Math.min(
      snapCoordinateToGrid(targetH, gridSize),
      Math.floor(availH / gridSize) * gridSize || Math.ceil(minHeight / gridSize) * gridSize
    )
  );

  const minX = WINDOW_PADDING;
  const maxX = Math.max(minX, viewport.width - snappedW - WINDOW_PADDING);
  const minY = MENU_BAR_HEIGHT + WINDOW_PADDING;
  const maxY = Math.max(minY, viewport.height - TASKBAR_HEIGHT - snappedH - WINDOW_PADDING);

  let nextX = snapCoordinateToGrid(Math.min(Math.max(x, minX), maxX), gridSize);
  let nextY = snapCoordinateToGrid(Math.min(Math.max(y, minY), maxY), gridSize);

  if (nextX < minX) nextX = Math.ceil(minX / gridSize) * gridSize;
  if (nextX > maxX) nextX = Math.max(minX, Math.floor(maxX / gridSize) * gridSize);
  if (nextY < minY) nextY = Math.ceil(minY / gridSize) * gridSize;
  if (nextY > maxY) nextY = Math.max(minY, Math.floor(maxY / gridSize) * gridSize);

  return {
    x: nextX === 0 ? 0 : nextX,
    y: nextY === 0 ? 0 : nextY,
    width: snappedW,
    height: snappedH,
  };
}

/**
 * Compute cascaded window coordinates with 24px offset aligned to an 8px grid.
 */
export function computeCascadePositions(
  ids: WindowId[],
  viewport: ViewportSize
): Record<WindowId, { x: number; y: number }> {
  const startX = viewport.width >= 1024 ? 144 : 24;
  const startY = MENU_BAR_HEIGHT + 24;
  const result = {} as Record<WindowId, { x: number; y: number }>;

  ids.forEach((id, index) => {
    const slot = index % 8;
    const rawX = startX + slot * CASCADE_OFFSET;
    const rawY = startY + slot * CASCADE_OFFSET;
    const maxX = Math.max(startX, Math.floor((viewport.width - 360) / GRID_SIZE) * GRID_SIZE);
    const maxY = Math.max(
      startY,
      Math.floor((viewport.height - TASKBAR_HEIGHT - 260) / GRID_SIZE) * GRID_SIZE
    );
    result[id] = {
      x: Math.min(rawX, maxX),
      y: Math.min(rawY, maxY),
    };
  });

  return result;
}

/**
 * Compute the next cascaded position for a newly opened window (24px offset per step),
 * wrapping cleanly when running out of room and clamping strictly inside the desktop area.
 */
export function computeNextCascadePosition(
  cascadeIndex: number,
  width: number,
  height: number,
  minWidth: number,
  minHeight: number,
  viewport: ViewportSize
): { x: number; y: number; width: number; height: number } {
  const startX = viewport.width >= 1024 ? 144 : 24;
  const startY = MENU_BAR_HEIGHT + 24;

  const usableW = Math.max(0, viewport.width - width - WINDOW_PADDING - startX);
  const usableH = Math.max(0, viewport.height - TASKBAR_HEIGHT - height - WINDOW_PADDING - startY);
  const maxStepsX = Math.max(1, Math.floor(usableW / CASCADE_OFFSET) + 1);
  const maxStepsY = Math.max(1, Math.floor(usableH / CASCADE_OFFSET) + 1);
  const cycleLength = Math.max(1, Math.min(8, maxStepsX, maxStepsY));

  const slot = ((cascadeIndex % cycleLength) + cycleLength) % cycleLength;
  const rawX = startX + slot * CASCADE_OFFSET;
  const rawY = startY + slot * CASCADE_OFFSET;

  return clampWindowRectToViewport(rawX, rawY, width, height, minWidth, minHeight, viewport);
}

/**
 * Detect whether a dragged pointer is within the left or right edge snap zone.
 */
export function detectEdgeSnapZone(
  pointerX: number,
  pointerY: number,
  viewport: ViewportSize,
  threshold: number = EDGE_SNAP_THRESHOLD
): EdgeSnapZone | null {
  if (viewport.width < 768) return null;
  if (pointerY < MENU_BAR_HEIGHT || pointerY > viewport.height - TASKBAR_HEIGHT) return null;
  if (pointerX <= threshold) return 'left';
  if (pointerX >= viewport.width - threshold) return 'right';
  return null;
}

/**
 * Compute the half-screen rectangle for a left or right edge snap above the taskbar,
 * aligned to the 8px grid.
 */
export function computeEdgeSnapRect(
  zone: EdgeSnapZone,
  viewport: ViewportSize,
  gridSize: number = GRID_SIZE
): { x: number; y: number; width: number; height: number } {
  const top = MENU_BAR_HEIGHT;
  const availH = Math.max(240, viewport.height - top - TASKBAR_HEIGHT);
  const snappedH = Math.floor(availH / gridSize) * gridSize;
  const halfW = Math.floor(viewport.width / 2 / gridSize) * gridSize;

  if (zone === 'left') {
    return {
      x: 0,
      y: top,
      width: halfW,
      height: snappedH,
    };
  }

  return {
    x: halfW,
    y: top,
    width: viewport.width - halfW,
    height: snappedH,
  };
}

/**
 * Order open (non-closing) windows for the Alt+Tab window switcher,
 * most recently focused first.
 */
export function getSwitcherWindowOrder<
  T extends { id: WindowId; isOpen: boolean; isClosing?: boolean; isMinimized: boolean; zIndex: number },
>(windows: Record<WindowId, T>): T[] {
  return (Object.values(windows) as T[])
    .filter((w) => w.isOpen && !w.isClosing)
    .sort((a, b) => b.zIndex - a.zIndex);
}

/**
 * Advance or reverse the active index in the Alt+Tab window switcher with wraparound.
 */
export function cycleSwitcherIndex(currentIndex: number, count: number, direction: 1 | -1 = 1): number {
  if (count <= 0) return -1;
  return (currentIndex + direction + count) % count;
}

export const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
] as const;

/**
 * Pure state machine step for Konami code detection.
 * Returns the updated key buffer and whether the full sequence just matched.
 */
export function advanceKonamiBuffer(
  buffer: string[],
  rawKey: string
): { nextBuffer: string[]; matched: boolean } {
  const normalized = rawKey.length === 1 ? rawKey.toLowerCase() : rawKey;
  const nextBuffer = [...buffer, normalized].slice(-KONAMI_SEQUENCE.length);
  const matched =
    nextBuffer.length === KONAMI_SEQUENCE.length &&
    KONAMI_SEQUENCE.every((expected, idx) => nextBuffer[idx] === expected);
  return {
    nextBuffer: matched ? [] : nextBuffer,
    matched,
  };
}
