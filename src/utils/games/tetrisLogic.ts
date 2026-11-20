export const TETRIS_COLS = 10;
export const TETRIS_ROWS = 20;

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type TetrisStatus = 'title' | 'playing' | 'paused' | 'gameover';

export interface ActivePiece {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
}

export interface TetrisState {
  board: Array<Array<TetrominoType | null>>;
  active: ActivePiece;
  nextType: TetrominoType;
  bag: TetrominoType[];
  score: number;
  lines: number;
  level: number;
  status: TetrisStatus;
}

export interface TetrisCellView {
  type: TetrominoType | null;
  kind: 'empty' | 'locked' | 'active' | 'ghost';
}

export const TETROMINO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: '#2A9D8F', // OS Teal
  O: '#F4EFE0', // OS Cream
  T: '#33FF66', // CRT Phosphor Green
  S: '#6EDB88', // Bright Mint Green
  Z: '#E4572E', // OS Tomato Accent
  J: '#5C9EAD', // Retro Steel Cyan
  L: '#E9A84C', // Warm Amber
};

export const TETROMINO_SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const LINE_SCORE_TABLE = [0, 100, 300, 500, 800];

export function createEmptyTetrisBoard(): Array<Array<TetrominoType | null>> {
  return Array.from({ length: TETRIS_ROWS }, () =>
    Array.from({ length: TETRIS_COLS }, () => null)
  );
}

export function createShuffledBag(rng: () => number = Math.random): TetrominoType[] {
  const bag = [...TETROMINO_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = bag[i];
    bag[i] = bag[j];
    bag[j] = tmp;
  }
  return bag;
}

function drawFromBag(
  bag: TetrominoType[],
  rng: () => number
): { pieceType: TetrominoType; nextBag: TetrominoType[] } {
  const source = bag.length > 0 ? [...bag] : createShuffledBag(rng);
  const pieceType = source.shift()!;
  const nextBag = source.length > 0 ? source : createShuffledBag(rng);
  return { pieceType, nextBag };
}

export function spawnPiece(type: TetrominoType): ActivePiece {
  const shape = TETROMINO_SHAPES[type].map((row) => [...row]);
  const x = Math.floor((TETRIS_COLS - shape[0].length) / 2);
  const y = type === 'I' ? -1 : 0;
  return { type, shape, x, y };
}

export function rotateMatrixCW(matrix: number[][]): number[][] {
  const size = matrix.length;
  const out = Array.from({ length: size }, () => Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      out[c][size - 1 - r] = matrix[r][c];
    }
  }
  return out;
}

export function canPlacePiece(
  board: Array<Array<TetrominoType | null>>,
  piece: ActivePiece,
  dx = 0,
  dy = 0,
  shapeOverride?: number[][]
): boolean {
  const shape = shapeOverride ?? piece.shape;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = piece.x + c + dx;
      const ny = piece.y + r + dy;
      if (nx < 0 || nx >= TETRIS_COLS || ny >= TETRIS_ROWS) {
        return false;
      }
      if (ny >= 0 && board[ny][nx] !== null) {
        return false;
      }
    }
  }
  return true;
}

export function createInitialTetrisState(
  status: TetrisStatus = 'title',
  rng: () => number = Math.random
): TetrisState {
  const bag0 = createShuffledBag(rng);
  const first = drawFromBag(bag0, rng);
  const second = drawFromBag(first.nextBag, rng);
  return {
    board: createEmptyTetrisBoard(),
    active: spawnPiece(first.pieceType),
    nextType: second.pieceType,
    bag: second.nextBag,
    score: 0,
    lines: 0,
    level: 1,
    status,
  };
}

export function moveTetrisPiece(
  state: TetrisState,
  dx: number,
  dy: number,
  softDropBonus = false
): { state: TetrisState; moved: boolean } {
  if (state.status !== 'playing') return { state, moved: false };
  if (!canPlacePiece(state.board, state.active, dx, dy)) {
    return { state, moved: false };
  }
  return {
    moved: true,
    state: {
      ...state,
      active: {
        ...state.active,
        x: state.active.x + dx,
        y: state.active.y + dy,
      },
      score: softDropBonus && dy > 0 ? state.score + dy : state.score,
    },
  };
}

export function rotateTetrisPiece(state: TetrisState): { state: TetrisState; rotated: boolean } {
  if (state.status !== 'playing') return { state, rotated: false };
  if (state.active.type === 'O') return { state, rotated: false };

  const rotatedShape = rotateMatrixCW(state.active.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kickX of kicks) {
    if (canPlacePiece(state.board, state.active, kickX, 0, rotatedShape)) {
      return {
        rotated: true,
        state: {
          ...state,
          active: {
            ...state.active,
            x: state.active.x + kickX,
            shape: rotatedShape,
          },
        },
      };
    }
  }
  return { state, rotated: false };
}

export function computeGhostY(state: TetrisState): number {
  let dy = 0;
  while (canPlacePiece(state.board, state.active, 0, dy + 1)) {
    dy += 1;
  }
  return state.active.y + dy;
}

function lockAndAdvance(
  state: TetrisState,
  extraScore: number,
  rng: () => number
): { state: TetrisState; clearedLines: number; event: 'lock' | 'clear' | 'gameover' } {
  const nextBoard = state.board.map((row) => [...row]);
  const { shape, x, y, type } = state.active;

  let lockedAboveTop = false;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const by = y + r;
      const bx = x + c;
      if (by < 0) {
        lockedAboveTop = true;
      } else if (by < TETRIS_ROWS && bx >= 0 && bx < TETRIS_COLS) {
        nextBoard[by][bx] = type;
      }
    }
  }

  // Filter out full lines and prepend empty rows at top
  const remaining = nextBoard.filter((row) => row.some((cell) => cell === null));
  const clearedLines = TETRIS_ROWS - remaining.length;
  while (remaining.length < TETRIS_ROWS) {
    remaining.unshift(Array.from({ length: TETRIS_COLS }, () => null));
  }

  const totalLines = state.lines + clearedLines;
  const nextLevel = Math.floor(totalLines / 10) + 1;
  const linePoints = (LINE_SCORE_TABLE[clearedLines] ?? 800) * state.level;
  const nextScore = state.score + extraScore + linePoints;

  const nextActive = spawnPiece(state.nextType);
  const drawn = drawFromBag(state.bag, rng);
  const canSpawn = !lockedAboveTop && canPlacePiece(remaining, nextActive);

  if (!canSpawn) {
    return {
      clearedLines,
      event: 'gameover',
      state: {
        ...state,
        board: remaining,
        score: nextScore,
        lines: totalLines,
        level: nextLevel,
        status: 'gameover',
      },
    };
  }

  return {
    clearedLines,
    event: clearedLines > 0 ? 'clear' : 'lock',
    state: {
      ...state,
      board: remaining,
      active: nextActive,
      nextType: drawn.pieceType,
      bag: drawn.nextBag,
      score: nextScore,
      lines: totalLines,
      level: nextLevel,
    },
  };
}

export function tickTetris(
  state: TetrisState,
  rng: () => number = Math.random
): { state: TetrisState; clearedLines: number; event: 'fall' | 'lock' | 'clear' | 'gameover' } {
  if (state.status !== 'playing') {
    return { state, clearedLines: 0, event: 'fall' };
  }

  const moved = moveTetrisPiece(state, 0, 1, false);
  if (moved.moved) {
    return { state: moved.state, clearedLines: 0, event: 'fall' };
  }

  return lockAndAdvance(state, 0, rng);
}

export function hardDropTetris(
  state: TetrisState,
  rng: () => number = Math.random
): { state: TetrisState; droppedRows: number; clearedLines: number; event: 'lock' | 'clear' | 'gameover' } {
  if (state.status !== 'playing') {
    return { state, droppedRows: 0, clearedLines: 0, event: 'lock' };
  }

  const ghostY = computeGhostY(state);
  const droppedRows = Math.max(0, ghostY - state.active.y);
  const droppedState: TetrisState = {
    ...state,
    active: {
      ...state.active,
      y: ghostY,
    },
  };
  const locked = lockAndAdvance(droppedState, droppedRows * 2, rng);
  return {
    ...locked,
    droppedRows,
  };
}

export function getTetrisDropIntervalMs(level: number): number {
  return Math.max(110, 760 - (Math.max(1, level) - 1) * 65);
}

export function composeTetrisGrid(state: TetrisState): TetrisCellView[] {
  const cells: TetrisCellView[] = new Array(TETRIS_ROWS * TETRIS_COLS);

  for (let r = 0; r < TETRIS_ROWS; r++) {
    for (let c = 0; c < TETRIS_COLS; c++) {
      const lockedType = state.board[r][c];
      cells[r * TETRIS_COLS + c] = {
        type: lockedType,
        kind: lockedType ? 'locked' : 'empty',
      };
    }
  }

  if (state.status === 'playing' || state.status === 'paused') {
    const ghostY = computeGhostY(state);
    const { shape, x, y, type } = state.active;

    // Ghost landing preview first
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const gr = ghostY + r;
        const gc = x + c;
        if (gr >= 0 && gr < TETRIS_ROWS && gc >= 0 && gc < TETRIS_COLS) {
          const idx = gr * TETRIS_COLS + gc;
          if (cells[idx].kind === 'empty') {
            cells[idx] = { type, kind: 'ghost' };
          }
        }
      }
    }

    // Active falling tetromino overrides ghost
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const ar = y + r;
        const ac = x + c;
        if (ar >= 0 && ar < TETRIS_ROWS && ac >= 0 && ac < TETRIS_COLS) {
          cells[ar * TETRIS_COLS + ac] = { type, kind: 'active' };
        }
      }
    }
  }

  return cells;
}
