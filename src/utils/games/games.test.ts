import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialSnakeState,
  queueSnakeDirection,
  stepSnake,
} from './snakeLogic';
import {
  countFlags,
  createEmptyBoard,
  revealCell,
  toggleFlag,
} from './minesweeperLogic';
import { createInitialPongState, stepPong } from './pongLogic';
import {
  applyBrush,
  createBlankPixelGrid,
  createDefaultPaintings,
  createNewPainting,
  floodFillGrid,
  interpolateLine,
} from './paintLogic';
import {
  composeTetrisGrid,
  createInitialTetrisState,
  hardDropTetris,
  moveTetrisPiece,
  rotateTetrisPiece,
  spawnPiece,
  TETRIS_COLS,
  TETRIS_ROWS,
  tickTetris,
} from './tetrisLogic';

test('snake prevents immediate 180-degree reversal and eats food cleanly', () => {
  const initial = createInitialSnakeState('playing', () => 0);
  // Trying to reverse LEFT while moving RIGHT must be ignored
  const reversed = queueSnakeDirection(initial, 'LEFT');
  assert.equal(reversed.directionQueue.length, 0);

  // Place food directly in front of head at (11, 8)
  const withFoodAhead = { ...initial, food: { x: 11, y: 8 } };
  const stepped = stepSnake(withFoodAhead, () => 0);
  assert.equal(stepped.event, 'eat');
  assert.equal(stepped.state.score, 10);
  assert.equal(stepped.state.snake.length, 4);
  assert.deepEqual(stepped.state.snake[0], { x: 11, y: 8 });
});

test('snake triggers gameover when colliding with wall', () => {
  const base = createInitialSnakeState('playing', () => 0);
  const atRightEdge = {
    ...base,
    snake: [
      { x: base.cols - 1, y: 8 },
      { x: base.cols - 2, y: 8 },
      { x: base.cols - 3, y: 8 },
    ],
    direction: 'RIGHT' as const,
  };
  const res = stepSnake(atRightEdge, () => 0);
  assert.equal(res.event, 'crash');
  assert.equal(res.state.status, 'gameover');
});

test('minesweeper guarantees safe first click and supports flagging', () => {
  const empty = createEmptyBoard('beginner');
  const afterFirst = revealCell(empty, 3, 3, () => 0.25);
  assert.equal(afterFirst.minesPlaced, true);
  assert.equal(afterFirst.status, 'playing');
  assert.equal(afterFirst.cells[3][3].isMine, false);
  assert.equal(afterFirst.cells[3][3].isRevealed, true);

  // Flag an unrevealed cell
  let unrevealed: [number, number] | null = null;
  for (let r = 0; r < afterFirst.rows && !unrevealed; r++) {
    for (let c = 0; c < afterFirst.cols && !unrevealed; c++) {
      if (!afterFirst.cells[r][c].isRevealed) unrevealed = [r, c];
    }
  }
  assert.ok(unrevealed);
  const flagged = toggleFlag(afterFirst, unrevealed[0], unrevealed[1]);
  assert.equal(countFlags(flagged), 1);
  // Revealing a flagged cell is a no-op
  const afterRevealFlagged = revealCell(flagged, unrevealed[0], unrevealed[1]);
  assert.equal(afterRevealFlagged.cells[unrevealed[0]][unrevealed[1]].isRevealed, false);
});

test('pong bounces off player paddle and increments rally, scores when ball exits right edge', () => {
  const start = createInitialPongState('medium', 'playing');
  const nearPlayer = {
    ...start,
    ballX: 25,
    ballY: start.playerY + 20,
    ballVx: -220,
    ballVy: 0,
  };
  const hit = stepPong(nearPlayer, 0.016, { up: false, down: false, targetY: null });
  assert.equal(hit.event, 'paddle');
  assert.ok(hit.state.ballVx > 0);
  assert.equal(hit.state.rally, 1);

  const pastRight = {
    ...start,
    ballX: start.width + 2,
    ballVx: 240,
  };
  const scored = stepPong(pastRight, 0.016, { up: false, down: false, targetY: null }, () => 0.5);
  assert.equal(scored.event, 'score_player');
  assert.equal(scored.state.playerScore, 1);
});

test('paint floodFillGrid fills contiguous region without leaking across borders', () => {
  const grid = createBlankPixelGrid(4, 4, '#F4EFE0');
  // Draw vertical wall at x = 2
  for (let y = 0; y < 4; y++) {
    grid[y * 4 + 2] = '#1A1A1A';
  }
  const filled = floodFillGrid(grid, 4, 4, 0, 0, '#E4572E');
  // Left side (x=0, x=1) should be tomato
  assert.equal(filled[0 * 4 + 0], '#E4572E');
  assert.equal(filled[3 * 4 + 1], '#E4572E');
  // Wall stays ink
  assert.equal(filled[1 * 4 + 2], '#1A1A1A');
  // Right side (x=3) stays cream
  assert.equal(filled[0 * 4 + 3], '#F4EFE0');
});

test('paint interpolateLine yields continuous points between endpoints', () => {
  const line = interpolateLine(0, 0, 3, 3);
  assert.equal(line.length, 4);
  assert.deepEqual(line[0], { x: 0, y: 0 });
  assert.deepEqual(line[3], { x: 3, y: 3 });

  const horiz = interpolateLine(2, 5, 5, 5);
  assert.equal(horiz.length, 4);
  assert.deepEqual(horiz.map((p) => p.x), [2, 3, 4, 5]);
});

test('paint applyBrush modifies grid respecting brush size and boundaries', () => {
  const grid = createBlankPixelGrid(10, 10, '#FFFFFF');
  const painted1 = applyBrush(grid, 10, 10, 5, 5, 1, '#1A1A1A');
  assert.equal(painted1[5 * 10 + 5], '#1A1A1A');
  assert.equal(painted1[5 * 10 + 4], '#FFFFFF');

  // 2x2 brush centered around (2, 2) covers rows 1-2, cols 1-2
  const painted2 = applyBrush(grid, 10, 10, 2, 2, 2, '#E4572E');
  assert.equal(painted2[1 * 10 + 1], '#E4572E');
  assert.equal(painted2[1 * 10 + 2], '#E4572E');
  assert.equal(painted2[2 * 10 + 1], '#E4572E');
  assert.equal(painted2[2 * 10 + 2], '#E4572E');
  assert.equal(painted2[3 * 10 + 3], '#FFFFFF');
});

test('paint creates multiple paintings with default starter templates', () => {
  const defaults = createDefaultPaintings();
  assert.ok(defaults.length >= 2);
  assert.equal(defaults[0].title, 'floppy_disk.bmp');

  const newP = createNewPainting('my_art.bmp', 24, 16);
  assert.equal(newP.title, 'my_art.bmp');
  assert.equal(newP.pixels.length, 24 * 16);
});

test('tetris moves, rotates with wall kick, and composes 200-cell CSS grid with ghost preview', () => {
  const base = createInitialTetrisState('playing', () => 0.1);
  const tState = { ...base, active: spawnPiece('T') };

  const movedLeft = moveTetrisPiece(tState, -1, 0);
  assert.equal(movedLeft.moved, true);
  assert.equal(movedLeft.state.active.x, tState.active.x - 1);

  const rotated = rotateTetrisPiece(movedLeft.state);
  assert.equal(rotated.rotated, true);

  // Wall kick near left wall using vertical I-piece
  const iAtLeft = {
    ...tState,
    active: {
      type: 'I' as const,
      shape: [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
      ],
      x: -1,
      y: 2,
    },
  };
  const kicked = rotateTetrisPiece(iAtLeft);
  assert.equal(kicked.rotated, true);
  assert.ok(kicked.state.active.x >= 0);

  const cells = composeTetrisGrid(tState);
  assert.equal(cells.length, TETRIS_COLS * TETRIS_ROWS);
  assert.equal(cells.filter((c) => c.kind === 'active').length, 4);
  assert.equal(cells.filter((c) => c.kind === 'ghost').length, 4);
});

test('tetris hard drop locks piece, clears completed bottom line, and awards score', () => {
  const base = createInitialTetrisState('playing', () => 0.2);
  // Fill bottom row except columns 4 & 5, then hard-drop an O-piece into that 2-col gap
  const board = base.board.map((row) => [...row]);
  for (let c = 0; c < TETRIS_COLS; c++) {
    if (c !== 4 && c !== 5) {
      board[TETRIS_ROWS - 1][c] = 'J';
    }
  }
  const ready = {
    ...base,
    board,
    active: {
      ...spawnPiece('O'),
      x: 4,
      y: 0,
    },
  };

  const dropped = hardDropTetris(ready, () => 0.2);
  assert.equal(dropped.event, 'clear');
  assert.equal(dropped.clearedLines, 1);
  assert.equal(dropped.state.lines, 1);
  // 18 rows * 2 hard-drop pts + 100 single-line clear = 136
  assert.equal(dropped.state.score, 136);
  // Only the top half of the O-piece remains in the bottom row after line clear
  assert.equal(dropped.state.board[TETRIS_ROWS - 1][4], 'O');
  assert.equal(dropped.state.board[TETRIS_ROWS - 1][5], 'O');
  assert.equal(dropped.state.board[TETRIS_ROWS - 1][0], null);
});

test('tetris triggers gameover when board stacks to top and next piece cannot spawn', () => {
  const base = createInitialTetrisState('playing', () => 0.3);
  const fullBoard = base.board.map((row, r) =>
    r >= 1 ? row.map(() => 'L' as const) : row.map(() => null)
  );
  // Leave one column empty on row 1 so it doesn't clear, blocking spawn area
  fullBoard[1][0] = null;
  const choked = {
    ...base,
    board: fullBoard,
    active: { ...spawnPiece('O'), x: 4, y: -1 },
  };
  const ticked = tickTetris(choked, () => 0.3);
  assert.equal(ticked.event, 'gameover');
  assert.equal(ticked.state.status, 'gameover');
});

