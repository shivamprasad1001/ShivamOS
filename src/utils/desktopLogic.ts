import {
  GRID_SIZE,
  MENU_BAR_HEIGHT,
  TASKBAR_HEIGHT,
  snapCoordinateToGrid,
  type ViewportSize,
  type WindowId,
} from './windowLogic';

export type DesktopIconId = Extract<
  WindowId,
  'about' | 'projects' | 'resume' | 'skills' | 'contact' | 'terminal' | 'games' | 'paint' | 'notes' | 'trash'
>;

export const LEFT_DESKTOP_ICON_IDS: DesktopIconId[] = [
  'about',
  'projects',
  'resume',
  'skills',
  'contact',
  'terminal',
];

export const RIGHT_DESKTOP_ICON_IDS: DesktopIconId[] = [
  'games',
  'paint',
  'notes',
  'trash',
];

export const ALL_DESKTOP_ICON_IDS: DesktopIconId[] = [
  ...LEFT_DESKTOP_ICON_IDS,
  ...RIGHT_DESKTOP_ICON_IDS,
];

export const ICON_WIDTH = 104;
export const ICON_HEIGHT = 88;
export const ICON_ROW_STEP = 96;
export const ICON_COL_STEP = 112;
export const ICON_PADDING = 8;
export const ICON_STORAGE_KEY = 'shivamos_icon_positions_v1';

export interface Point {
  x: number;
  y: number;
}

export interface MarqueeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CustomDesktopFolder {
  id: string;
  name: string;
  x: number;
  y: number;
}

export type IconPositionMap = Record<DesktopIconId, Point>;

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

/**
 * Clamp a desktop icon position strictly inside the usable desktop area
 * between the top menu bar and bottom taskbar.
 */
export function clampIconPosition(
  x: number,
  y: number,
  viewport: ViewportSize,
  iconWidth: number = ICON_WIDTH,
  iconHeight: number = ICON_HEIGHT
): Point {
  const minX = ICON_PADDING;
  const maxX = Math.max(minX, viewport.width - iconWidth - ICON_PADDING);
  const minY = MENU_BAR_HEIGHT + ICON_PADDING;
  const maxY = Math.max(minY, viewport.height - TASKBAR_HEIGHT - iconHeight - ICON_PADDING);

  return {
    x: Math.round(Math.min(Math.max(x, minX), maxX)),
    y: Math.round(Math.min(Math.max(y, minY), maxY)),
  };
}

/**
 * Snap a desktop icon's (x, y) position to an 8px grid while clamping inside the desktop area.
 */
export function snapIconPosition(
  x: number,
  y: number,
  viewport: ViewportSize,
  gridSize: number = GRID_SIZE,
  iconWidth: number = ICON_WIDTH,
  iconHeight: number = ICON_HEIGHT
): Point {
  const minX = ICON_PADDING;
  const maxX = Math.max(minX, viewport.width - iconWidth - ICON_PADDING);
  const minY = MENU_BAR_HEIGHT + ICON_PADDING;
  const maxY = Math.max(minY, viewport.height - TASKBAR_HEIGHT - iconHeight - ICON_PADDING);

  const clamped = clampIconPosition(x, y, viewport, iconWidth, iconHeight);
  let snappedX = snapCoordinateToGrid(clamped.x, gridSize);
  let snappedY = snapCoordinateToGrid(clamped.y, gridSize);

  if (snappedX < minX) snappedX = Math.ceil(minX / gridSize) * gridSize;
  if (snappedX > maxX) snappedX = Math.max(minX, Math.floor(maxX / gridSize) * gridSize);
  if (snappedY < minY) snappedY = Math.ceil(minY / gridSize) * gridSize;
  if (snappedY > maxY) snappedY = Math.max(minY, Math.floor(maxY / gridSize) * gridSize);

  return {
    x: snappedX === 0 ? 0 : snappedX,
    y: snappedY === 0 ? 0 : snappedY,
  };
}

/**
 * Compute default 8px-grid-aligned positions for desktop icons along left and right rails.
 */
export function computeDefaultIconPositions(viewport: ViewportSize): IconPositionMap {
  const topY = MENU_BAR_HEIGHT + 16; // 48px (divisible by 8)
  const usableHeight = Math.max(ICON_HEIGHT, viewport.height - TASKBAR_HEIGHT - topY - ICON_PADDING);
  const maxRows = Math.max(1, Math.floor((usableHeight + (ICON_ROW_STEP - ICON_HEIGHT)) / ICON_ROW_STEP));

  const positions = {} as IconPositionMap;

  LEFT_DESKTOP_ICON_IDS.forEach((id, index) => {
    const col = Math.floor(index / maxRows);
    const row = index % maxRows;
    const rawX = 16 + col * ICON_COL_STEP;
    const rawY = topY + row * ICON_ROW_STEP;
    positions[id] = snapIconPosition(rawX, rawY, viewport);
  });

  const rightBaseX = Math.max(16, Math.floor((viewport.width - ICON_WIDTH - 16) / GRID_SIZE) * GRID_SIZE);
  RIGHT_DESKTOP_ICON_IDS.forEach((id, index) => {
    const col = Math.floor(index / maxRows);
    const row = index % maxRows;
    const rawX = rightBaseX - col * ICON_COL_STEP;
    const rawY = topY + row * ICON_ROW_STEP;
    positions[id] = snapIconPosition(rawX, rawY, viewport);
  });

  return positions;
}

/**
 * Clamp all stored icon positions to a new viewport while preserving relative placement.
 */
export function clampIconPositionsToViewport(
  positions: IconPositionMap,
  viewport: ViewportSize
): IconPositionMap {
  const next = {} as IconPositionMap;
  for (const id of ALL_DESKTOP_ICON_IDS) {
    const pt = positions[id];
    next[id] = snapIconPosition(pt.x, pt.y, viewport);
  }
  return next;
}

/**
 * Generate a unique name for a newly created visual desktop folder ("New Folder", "New Folder (2)", ...).
 */
export function createNextFolderName(existingNames: string[]): string {
  const lower = new Set(existingNames.map((n) => n.trim().toLowerCase()));
  if (!lower.has('new folder')) return 'New Folder';
  let idx = 2;
  while (lower.has(`new folder (${idx})`)) {
    idx += 1;
  }
  return `New Folder (${idx})`;
}

/**
 * Sanitize an icon rename input (trim & clamp length; fall back if empty).
 */
export function sanitizeIconRename(raw: string, fallback: string): string {
  const trimmed = raw.trim().slice(0, 28);
  return trimmed.length > 0 ? trimmed : fallback;
}

/**
 * Find an unoccupied 8px-aligned spot on the desktop for a newly created folder.
 */
export function findFreeDesktopSpot(
  occupied: Point[],
  viewport: ViewportSize,
  preferredPoint?: Point
): Point {
  if (preferredPoint) {
    return snapIconPosition(preferredPoint.x, preferredPoint.y, viewport);
  }
  const rightBaseX = Math.max(16, Math.floor((viewport.width - ICON_WIDTH - 16) / GRID_SIZE) * GRID_SIZE);
  const topY = MENU_BAR_HEIGHT + 16;

  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 6; row++) {
      const candidate = snapIconPosition(
        rightBaseX - col * ICON_COL_STEP,
        topY + row * ICON_ROW_STEP,
        viewport
      );
      const overlaps = occupied.some(
        (pt) => Math.abs(pt.x - candidate.x) < ICON_WIDTH - 8 && Math.abs(pt.y - candidate.y) < ICON_HEIGHT - 8
      );
      if (!overlaps) return candidate;
    }
  }
  return snapIconPosition(rightBaseX - ICON_COL_STEP, topY, viewport);
}

/**
 * Normalize a rubber-band selection drag from any two corner points into a positive-size rect.
 */
export function normalizeMarqueeRect(start: Point, current: Point): MarqueeRect {
  const x = Math.min(start.x, current.x);
  const y = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  return { x, y, width, height };
}

/**
 * Axis-aligned bounding box intersection test.
 */
export function rectsIntersect(a: MarqueeRect, b: MarqueeRect): boolean {
  return (
    a.x <= b.x + b.width &&
    a.x + a.width >= b.x &&
    a.y <= b.y + b.height &&
    a.y + a.height >= b.y
  );
}

/**
 * Return all desktop icon IDs (and optional custom folder IDs) whose bounding boxes intersect the marquee.
 */
export function getIconsInMarquee(
  marquee: MarqueeRect,
  positions: IconPositionMap,
  iconWidth: number = ICON_WIDTH,
  iconHeight: number = ICON_HEIGHT
): DesktopIconId[] {
  const selected: DesktopIconId[] = [];
  for (const id of ALL_DESKTOP_ICON_IDS) {
    const pos = positions[id];
    if (!pos) continue;
    const iconRect: MarqueeRect = {
      x: pos.x,
      y: pos.y,
      width: iconWidth,
      height: iconHeight,
    };
    if (rectsIntersect(marquee, iconRect)) {
      selected.push(id);
    }
  }
  return selected;
}

function getDefaultStorage(): StorageLike | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Load persisted desktop icon positions from localStorage (wrapped in try/catch),
 * falling back cleanly to defaults for missing or malformed entries.
 */
export function loadIconPositions(
  viewport: ViewportSize,
  storage: StorageLike | null = getDefaultStorage()
): IconPositionMap {
  const defaults = computeDefaultIconPositions(viewport);
  if (!storage) return defaults;

  try {
    const raw = storage.getItem(ICON_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;

    const record = parsed as Record<string, unknown>;
    const merged = { ...defaults };

    for (const id of ALL_DESKTOP_ICON_IDS) {
      const candidate = record[id];
      if (
        candidate &&
        typeof candidate === 'object' &&
        typeof (candidate as Point).x === 'number' &&
        typeof (candidate as Point).y === 'number' &&
        Number.isFinite((candidate as Point).x) &&
        Number.isFinite((candidate as Point).y)
      ) {
        merged[id] = snapIconPosition(
          (candidate as Point).x,
          (candidate as Point).y,
          viewport
        );
      }
    }

    return merged;
  } catch {
    return defaults;
  }
}

/**
 * Save desktop icon positions to localStorage (wrapped in try/catch).
 */
export function saveIconPositions(
  positions: IconPositionMap,
  storage: StorageLike | null = getDefaultStorage()
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(ICON_STORAGE_KEY, JSON.stringify(positions));
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove persisted desktop icon positions from localStorage (wrapped in try/catch).
 */
export function clearSavedIconPositions(
  storage: StorageLike | null = getDefaultStorage()
): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(ICON_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
