export type MinesweeperDifficulty = 'beginner' | 'intermediate' | 'expert';

export interface MinesweeperPreset {
  label: string;
  rows: number;
  cols: number;
  mines: number;
}

export const MINESWEEPER_PRESETS: Record<MinesweeperDifficulty, MinesweeperPreset> = {
  beginner: { label: '8×8 (10)', rows: 8, cols: 8, mines: 10 },
  intermediate: { label: '10×10 (18)', rows: 10, cols: 10, mines: 18 },
  expert: { label: '12×12 (28)', rows: 12, cols: 12, mines: 28 },
};

export interface MineCell {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export interface MinesweeperBoard {
  rows: number;
  cols: number;
  mines: number;
  cells: MineCell[][];
  minesPlaced: boolean;
  status: 'ready' | 'playing' | 'won' | 'lost';
  explodedAt: { row: number; col: number } | null;
}

const NEIGHBOR_DELTAS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

export function createEmptyBoard(difficulty: MinesweeperDifficulty): MinesweeperBoard {
  const { rows, cols, mines } = MINESWEEPER_PRESETS[difficulty];
  const cells: MineCell[][] = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
  return {
    rows,
    cols,
    mines,
    cells,
    minesPlaced: false,
    status: 'ready',
    explodedAt: null,
  };
}

function cloneCells(cells: MineCell[][]): MineCell[][] {
  return cells.map((row) => row.map((cell) => ({ ...cell })));
}

/**
 * Places mines randomly while keeping the first clicked cell and its 8 neighbors safe.
 */
export function placeMinesSafely(
  board: MinesweeperBoard,
  safeRow: number,
  safeCol: number,
  rng: () => number = Math.random
): MinesweeperBoard {
  const cells = cloneCells(board.cells);
  const candidates: Array<{ r: number; c: number }> = [];

  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const isSafeZone = Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1;
      if (!isSafeZone) {
        candidates.push({ r, c });
      }
    }
  }

  // Fallback if board is very small: exclude only exact safe cell
  if (candidates.length < board.mines) {
    candidates.length = 0;
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        if (!(r === safeRow && c === safeCol)) {
          candidates.push({ r, c });
        }
      }
    }
  }

  // Fisher-Yates shuffle
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const mineCount = Math.min(board.mines, candidates.length);
  for (let i = 0; i < mineCount; i++) {
    const { r, c } = candidates[i];
    cells[r][c].isMine = true;
  }

  // Compute adjacent counts
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (cells[r][c].isMine) continue;
      let count = 0;
      for (const [dr, dc] of NEIGHBOR_DELTAS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < board.rows && nc >= 0 && nc < board.cols && cells[nr][nc].isMine) {
          count += 1;
        }
      }
      cells[r][c].adjacentMines = count;
    }
  }

  return {
    ...board,
    cells,
    minesPlaced: true,
    status: 'playing',
  };
}

export function countFlags(board: MinesweeperBoard): number {
  let total = 0;
  for (const row of board.cells) {
    for (const cell of row) {
      if (cell.isFlagged) total += 1;
    }
  }
  return total;
}

export function toggleFlag(board: MinesweeperBoard, row: number, col: number): MinesweeperBoard {
  if (board.status === 'won' || board.status === 'lost') return board;
  const target = board.cells[row]?.[col];
  if (!target || target.isRevealed) return board;

  const cells = cloneCells(board.cells);
  cells[row][col].isFlagged = !cells[row][col].isFlagged;
  return { ...board, cells };
}

export function revealCell(
  board: MinesweeperBoard,
  row: number,
  col: number,
  rng: () => number = Math.random
): MinesweeperBoard {
  if (board.status === 'won' || board.status === 'lost') return board;
  const initialTarget = board.cells[row]?.[col];
  if (!initialTarget || initialTarget.isRevealed || initialTarget.isFlagged) return board;

  const prepared = board.minesPlaced ? board : placeMinesSafely(board, row, col, rng);
  const cells = cloneCells(prepared.cells);
  const clicked = cells[row][col];

  if (clicked.isMine) {
    // Reveal all mines on defeat
    for (const r of cells) {
      for (const c of r) {
        if (c.isMine) c.isRevealed = true;
      }
    }
    return {
      ...prepared,
      cells,
      status: 'lost',
      explodedAt: { row, col },
    };
  }

  // BFS flood-fill for 0-adjacent cells
  const queue: Array<[number, number]> = [[row, col]];
  clicked.isRevealed = true;

  while (queue.length > 0) {
    const [cr, cc] = queue.shift()!;
    if (cells[cr][cc].adjacentMines !== 0) continue;

    for (const [dr, dc] of NEIGHBOR_DELTAS) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (nr < 0 || nr >= prepared.rows || nc < 0 || nc >= prepared.cols) continue;
      const neighbor = cells[nr][nc];
      if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
        neighbor.isRevealed = true;
        if (neighbor.adjacentMines === 0) {
          queue.push([nr, nc]);
        }
      }
    }
  }

  // Check victory: all non-mine cells revealed
  let remainingSafe = 0;
  for (const r of cells) {
    for (const c of r) {
      if (!c.isMine && !c.isRevealed) remainingSafe += 1;
    }
  }

  if (remainingSafe === 0) {
    for (const r of cells) {
      for (const c of r) {
        if (c.isMine) c.isFlagged = true;
      }
    }
    return { ...prepared, cells, status: 'won' };
  }

  return { ...prepared, cells, status: 'playing' };
}
