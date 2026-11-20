import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CASCADE_OFFSET,
  GRID_SIZE,
  KONAMI_SEQUENCE,
  MENU_BAR_HEIGHT,
  TASKBAR_HEIGHT,
  advanceKonamiBuffer,
  clampWindowPosition,
  clampWindowRectToViewport,
  clampWindowSize,
  computeCascadePositions,
  computeEdgeSnapRect,
  computeNextCascadePosition,
  cycleSwitcherIndex,
  detectEdgeSnapZone,
  getSwitcherWindowOrder,
  snapCoordinateToGrid,
  snapWindowPositionToGrid,
  snapWindowSizeToGrid,
  type WindowId,
} from './windowLogic';

test('snapCoordinateToGrid rounds coordinates to nearest 8px multiple', () => {
  assert.equal(snapCoordinateToGrid(0), 0);
  assert.equal(snapCoordinateToGrid(3), 0);
  assert.equal(snapCoordinateToGrid(4), 8);
  assert.equal(snapCoordinateToGrid(155), 152);
  assert.equal(snapCoordinateToGrid(157), 160);
  assert.equal(snapCoordinateToGrid(-3), 0);
  assert.equal(snapCoordinateToGrid(-5), -8);
});

test('snapWindowPositionToGrid aligns released coordinates to 8px grid within viewport bounds', () => {
  const viewport = { width: 1440, height: 900 };
  const mid = snapWindowPositionToGrid(203, 109, 500, viewport);
  assert.deepEqual(mid, { x: 200, y: 112 });
  assert.equal(mid.x % GRID_SIZE, 0);
  assert.equal(mid.y % GRID_SIZE, 0);

  const top = snapWindowPositionToGrid(155, 10, 500, viewport);
  assert.deepEqual(top, { x: 152, y: MENU_BAR_HEIGHT });

  const bottom = snapWindowPositionToGrid(155, 1100, 500, viewport);
  assert.equal(bottom.y % GRID_SIZE, 0);
  assert.ok(bottom.y <= viewport.height - TASKBAR_HEIGHT - 40);
});

test('snapWindowSizeToGrid snaps dimensions to 8px grid respecting min and viewport max', () => {
  const viewport = { width: 1440, height: 900 };
  const mid = snapWindowSizeToGrid(100, 100, 503, 413, 360, 280, viewport);
  assert.deepEqual(mid, { width: 504, height: 416 });
  assert.equal(mid.width % GRID_SIZE, 0);
  assert.equal(mid.height % GRID_SIZE, 0);

  // Below min constraints clamps up to nearest 8px multiple >= min
  const small = snapWindowSizeToGrid(100, 100, 200, 150, 362, 281, viewport);
  assert.equal(small.width % GRID_SIZE, 0);
  assert.equal(small.height % GRID_SIZE, 0);
  assert.ok(small.width >= 362);
  assert.ok(small.height >= 281);

  // Beyond viewport bounds floors to 8px multiple within max above taskbar
  const huge = snapWindowSizeToGrid(100, 100, 2000, 2000, 360, 280, viewport);
  assert.equal(huge.width % GRID_SIZE, 0);
  assert.equal(huge.height % GRID_SIZE, 0);
  assert.ok(100 + huge.width <= viewport.width - 8);
  assert.ok(100 + huge.height <= viewport.height - TASKBAR_HEIGHT - 8);
});

test('clampWindowPosition prevents dragging above menu bar or under taskbar', () => {
  const viewport = { width: 1440, height: 900 };
  const topClamped = clampWindowPosition(200, -40, 500, viewport);
  assert.equal(topClamped.y, MENU_BAR_HEIGHT);
  assert.equal(topClamped.x, 200);

  const leftClamped = clampWindowPosition(-900, 100, 500, viewport);
  assert.equal(leftClamped.x, -380);

  const rightClamped = clampWindowPosition(1800, 100, 500, viewport);
  assert.equal(rightClamped.x, 1320);

  const bottomClamped = clampWindowPosition(100, 1200, 500, viewport);
  assert.equal(bottomClamped.y, viewport.height - TASKBAR_HEIGHT - 40);
});

test('clampWindowSize enforces min dimensions and viewport max bounds above taskbar', () => {
  const viewport = { width: 1200, height: 800 };
  const tooSmall = clampWindowSize(100, 100, 120, 90, 320, 240, viewport);
  assert.deepEqual(tooSmall, { width: 320, height: 240 });

  const tooLarge = clampWindowSize(100, 100, 1800, 1200, 320, 240, viewport);
  assert.deepEqual(tooLarge, { width: 1092, height: 652 });
});

test('clampWindowRectToViewport keeps full window inside desktop above taskbar on 8px grid', () => {
  const viewport = { width: 1024, height: 768 };
  const clamped = clampWindowRectToViewport(900, 650, 600, 500, 360, 300, viewport);
  assert.equal(clamped.x % GRID_SIZE, 0);
  assert.equal(clamped.y % GRID_SIZE, 0);
  assert.equal(clamped.width % GRID_SIZE, 0);
  assert.equal(clamped.height % GRID_SIZE, 0);
  assert.ok(clamped.x >= 8);
  assert.ok(clamped.y >= MENU_BAR_HEIGHT + 8);
  assert.ok(clamped.x + clamped.width <= viewport.width - 8);
  assert.ok(clamped.y + clamped.height <= viewport.height - TASKBAR_HEIGHT - 8);
});

test('computeCascadePositions staggers windows by 24px on an 8px grid', () => {
  const positions = computeCascadePositions(['about', 'projects', 'terminal'], {
    width: 1440,
    height: 900,
  });
  assert.equal(positions.about.x % 8, 0);
  assert.equal(positions.about.y % 8, 0);
  assert.equal(positions.projects.x - positions.about.x, CASCADE_OFFSET);
  assert.equal(positions.terminal.y - positions.projects.y, CASCADE_OFFSET);
});

test('computeNextCascadePosition offsets each new window by 24px and clamps inside desktop', () => {
  const viewport = { width: 1440, height: 900 };
  const first = computeNextCascadePosition(0, 560, 440, 360, 300, viewport);
  const second = computeNextCascadePosition(1, 560, 440, 360, 300, viewport);
  const third = computeNextCascadePosition(2, 560, 440, 360, 300, viewport);

  assert.equal(second.x - first.x, 24);
  assert.equal(second.y - first.y, 24);
  assert.equal(third.x - second.x, 24);
  assert.equal(third.y - second.y, 24);

  // Tight viewport wraps & stays fully inside viewport above taskbar
  const smallViewport = { width: 800, height: 600 };
  const tight = computeNextCascadePosition(5, 600, 500, 360, 300, smallViewport);
  assert.ok(tight.x >= 8);
  assert.ok(tight.y >= MENU_BAR_HEIGHT + 8);
  assert.ok(tight.x + tight.width <= smallViewport.width - 8);
  assert.ok(tight.y + tight.height <= smallViewport.height - TASKBAR_HEIGHT - 8);
});

test('detectEdgeSnapZone detects left and right screen edges between menu bar and taskbar', () => {
  const viewport = { width: 1440, height: 900 };
  assert.equal(detectEdgeSnapZone(10, 200, viewport), 'left');
  assert.equal(detectEdgeSnapZone(1430, 200, viewport), 'right');
  assert.equal(detectEdgeSnapZone(720, 200, viewport), null);
  assert.equal(detectEdgeSnapZone(5, 10, viewport), null); // above menu bar
  assert.equal(detectEdgeSnapZone(5, 890, viewport), null); // inside taskbar
  assert.equal(detectEdgeSnapZone(5, 200, { width: 640, height: 800 }), null); // mobile
});

test('computeEdgeSnapRect returns left and right half-screen rectangles above taskbar on 8px grid', () => {
  const viewport = { width: 1440, height: 900 };
  const left = computeEdgeSnapRect('left', viewport);
  const right = computeEdgeSnapRect('right', viewport);

  assert.deepEqual(left, { x: 0, y: MENU_BAR_HEIGHT, width: 720, height: 824 });
  assert.deepEqual(right, { x: 720, y: MENU_BAR_HEIGHT, width: 720, height: 824 });
  assert.equal(left.x + left.width, right.x);
  assert.equal(right.x + right.width, viewport.width);
  assert.ok(left.y + left.height <= viewport.height - TASKBAR_HEIGHT);
});

test('getSwitcherWindowOrder and cycleSwitcherIndex sort by zIndex and wrap cleanly', () => {
  const mockWindows = {
    about: { id: 'about' as WindowId, isOpen: true, isClosing: false, isMinimized: false, zIndex: 12 },
    projects: { id: 'projects' as WindowId, isOpen: true, isClosing: false, isMinimized: true, zIndex: 15 },
    terminal: { id: 'terminal' as WindowId, isOpen: true, isClosing: true, isMinimized: false, zIndex: 20 },
    resume: { id: 'resume' as WindowId, isOpen: false, isClosing: false, isMinimized: false, zIndex: 30 },
  } as unknown as Record<
    WindowId,
    { id: WindowId; isOpen: boolean; isClosing: boolean; isMinimized: boolean; zIndex: number }
  >;

  const ordered = getSwitcherWindowOrder(mockWindows);
  assert.deepEqual(
    ordered.map((w) => w.id),
    ['projects', 'about']
  );

  assert.equal(cycleSwitcherIndex(0, 3, 1), 1);
  assert.equal(cycleSwitcherIndex(2, 3, 1), 0);
  assert.equal(cycleSwitcherIndex(0, 3, -1), 2);
  assert.equal(cycleSwitcherIndex(0, 0, 1), -1);
});

test('advanceKonamiBuffer triggers only after exact full sequence', () => {
  let buffer: string[] = [];
  for (let i = 0; i < KONAMI_SEQUENCE.length - 1; i++) {
    const res = advanceKonamiBuffer(buffer, KONAMI_SEQUENCE[i]);
    assert.equal(res.matched, false);
    buffer = res.nextBuffer;
  }

  const finalRes = advanceKonamiBuffer(buffer, 'A');
  assert.equal(finalRes.matched, true);
  assert.deepEqual(finalRes.nextBuffer, []);
});
