export const PAINT_COLS = 28;
export const PAINT_ROWS = 18;

export const PAINT_PALETTE = [
  { name: 'Ink', hex: '#1A1A1A' },
  { name: 'Tomato', hex: '#E4572E' },
  { name: 'Amber', hex: '#F4A261' },
  { name: 'Gold', hex: '#E9C46A' },
  { name: 'Teal', hex: '#2A9D8F' },
  { name: 'Deep Cyan', hex: '#264653' },
  { name: 'Terminal Green', hex: '#33FF66' },
  { name: 'Forest', hex: '#1C7C54' },
  { name: 'BSOD Blue', hex: '#0000AA' },
  { name: 'Sky Blue', hex: '#4EA8DE' },
  { name: 'Purple', hex: '#7B2CBF' },
  { name: 'Magenta', hex: '#D81159' },
  { name: 'Dither Gray', hex: '#D8CFB2' },
  { name: 'Paper Tan', hex: '#E8E0C8' },
  { name: 'Cream', hex: '#F4EFE0' },
  { name: 'Pure White', hex: '#FFFFFF' },
] as const;

export const PAINT_BG_HEX = '#F4EFE0';

export interface SavedPainting {
  id: string;
  title: string;
  cols: number;
  rows: number;
  pixels: string[];
  createdAt: number;
  updatedAt: number;
}

export const PAINTINGS_STORAGE_KEY = 'shivamos_paintings_v2';
export const ACTIVE_PAINTING_STORAGE_KEY = 'shivamos_active_painting_id_v2';

export function createBlankPixelGrid(
  cols: number = PAINT_COLS,
  rows: number = PAINT_ROWS,
  fill: string = PAINT_BG_HEX
): string[] {
  return Array.from({ length: cols * rows }, () => fill);
}

/**
 * Creates default sample paintings for a new user session.
 */
export function createDefaultPaintings(): SavedPainting[] {
  const now = Date.now();
  const painting1Pixels = createBlankPixelGrid(PAINT_COLS, PAINT_ROWS);

  // Draw a cute retro floppy disk icon in the default painting
  const cx = Math.floor(PAINT_COLS / 2);
  const cy = Math.floor(PAINT_ROWS / 2);
  for (let r = cy - 4; r <= cy + 4; r++) {
    for (let c = cx - 5; c <= cx + 5; c++) {
      if (r >= 0 && r < PAINT_ROWS && c >= 0 && c < PAINT_COLS) {
        painting1Pixels[r * PAINT_COLS + c] = '#0000AA';
      }
    }
  }
  // Metal slider
  for (let r = cy - 4; r <= cy - 1; r++) {
    for (let c = cx - 3; c <= cx + 3; c++) {
      painting1Pixels[r * PAINT_COLS + c] = '#D8CFB2';
    }
  }
  // White label
  for (let r = cy + 1; r <= cy + 3; r++) {
    for (let c = cx - 3; c <= cx + 3; c++) {
      painting1Pixels[r * PAINT_COLS + c] = '#FFFFFF';
    }
  }

  const p1: SavedPainting = {
    id: 'paint-1',
    title: 'floppy_disk.bmp',
    cols: PAINT_COLS,
    rows: PAINT_ROWS,
    pixels: painting1Pixels,
    createdAt: now - 3600000,
    updatedAt: now - 3600000,
  };

  const p2: SavedPainting = {
    id: 'paint-2',
    title: 'untitled_canvas.bmp',
    cols: PAINT_COLS,
    rows: PAINT_ROWS,
    pixels: createBlankPixelGrid(PAINT_COLS, PAINT_ROWS),
    createdAt: now,
    updatedAt: now,
  };

  return [p1, p2];
}

/**
 * Loads paintings safely from localStorage with robust error handling.
 */
export function loadSavedPaintings(): { paintings: SavedPainting[]; activeId: string } {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(PAINTINGS_STORAGE_KEY) : null;
    let list: SavedPainting[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed.filter(
          (p) =>
            p &&
            typeof p.id === 'string' &&
            typeof p.title === 'string' &&
            Array.isArray(p.pixels) &&
            typeof p.cols === 'number' &&
            typeof p.rows === 'number'
        );
      }
    }
    if (list.length === 0) {
      list = createDefaultPaintings();
    }

    const savedActive = typeof window !== 'undefined' ? window.localStorage.getItem(ACTIVE_PAINTING_STORAGE_KEY) : null;
    const activeId = list.some((p) => p.id === savedActive) ? savedActive! : list[0].id;

    return { paintings: list, activeId };
  } catch {
    const defaults = createDefaultPaintings();
    return { paintings: defaults, activeId: defaults[0].id };
  }
}

/**
 * Persists paintings safely into localStorage.
 */
export function savePaintingsToStorage(paintings: SavedPainting[], activeId: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PAINTINGS_STORAGE_KEY, JSON.stringify(paintings));
    window.localStorage.setItem(ACTIVE_PAINTING_STORAGE_KEY, activeId);
  } catch {
    // Ignore storage quota or security restrictions
  }
}

/**
 * Generates a new blank painting entry.
 */
export function createNewPainting(
  title?: string,
  cols: number = PAINT_COLS,
  rows: number = PAINT_ROWS
): SavedPainting {
  const now = Date.now();
  return {
    id: `paint-${now}-${Math.random().toString(36).slice(2, 6)}`,
    title: title || `painting_${new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(':', '-')}.bmp`,
    cols,
    rows,
    pixels: createBlankPixelGrid(cols, rows),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Pure 4-way BFS flood fill for the retro Pixel Paint bucket tool.
 */
export function floodFillGrid(
  grid: string[],
  cols: number,
  rows: number,
  startX: number,
  startY: number,
  replacementHex: string
): string[] {
  if (startX < 0 || startX >= cols || startY < 0 || startY >= rows) {
    return grid;
  }
  const startIdx = startY * cols + startX;
  const targetHex = grid[startIdx];
  if (targetHex === replacementHex) {
    return grid;
  }

  const next = [...grid];
  const queue: Array<[number, number]> = [[startX, startY]];
  next[startIdx] = replacementHex;

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const neighbors: Array<[number, number]> = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      const idx = ny * cols + nx;
      if (next[idx] === targetHex) {
        next[idx] = replacementHex;
        queue.push([nx, ny]);
      }
    }
  }

  return next;
}

/**
 * Bresenham's line algorithm: yields all coordinate pairs between two points
 * to ensure continuous, gap-free drawing on fast mouse movement and mobile touch sweeps.
 */
export function interpolateLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let curX = x0;
  let curY = y0;

  while (true) {
    points.push({ x: curX, y: curY });
    if (curX === x1 && curY === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      curX += sx;
    }
    if (e2 < dx) {
      err += dx;
      curY += sy;
    }
  }

  return points;
}

/**
 * Applies brush at (cx, cy) with variable thickness (1px, 2px, 3px).
 */
export function applyBrush(
  grid: string[],
  cols: number,
  rows: number,
  cx: number,
  cy: number,
  brushSize: number,
  colorHex: string
): string[] {
  let modified = false;
  const next = [...grid];

  const half = Math.floor(brushSize / 2);
  const startX = cx - half;
  const startY = cy - half;
  const endX = startX + brushSize;
  const endY = startY + brushSize;

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        const idx = y * cols + x;
        if (next[idx] !== colorHex) {
          next[idx] = colorHex;
          modified = true;
        }
      }
    }
  }

  return modified ? next : grid;
}
