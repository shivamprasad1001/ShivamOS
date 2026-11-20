import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_DESKTOP_ICON_IDS,
  ICON_HEIGHT,
  ICON_STORAGE_KEY,
  ICON_WIDTH,
  clearSavedIconPositions,
  computeDefaultIconPositions,
  createNextFolderName,
  findFreeDesktopSpot,
  getIconsInMarquee,
  loadIconPositions,
  normalizeMarqueeRect,
  rectsIntersect,
  sanitizeIconRename,
  saveIconPositions,
  snapIconPosition,
  type StorageLike,
} from './desktopLogic';
import { GRID_SIZE, MENU_BAR_HEIGHT, TASKBAR_HEIGHT } from './windowLogic';

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

test('computeDefaultIconPositions places every desktop icon on 8px grid above taskbar', () => {
  const viewport = { width: 1440, height: 900 };
  const positions = computeDefaultIconPositions(viewport);

  for (const id of ALL_DESKTOP_ICON_IDS) {
    const pos = positions[id];
    assert.ok(pos, `Expected default position for ${id}`);
    assert.equal(pos.x % GRID_SIZE, 0);
    assert.equal(pos.y % GRID_SIZE, 0);
    assert.ok(pos.x >= 8);
    assert.ok(pos.y >= MENU_BAR_HEIGHT + 8);
    assert.ok(pos.x + ICON_WIDTH <= viewport.width - 8);
    assert.ok(pos.y + ICON_HEIGHT <= viewport.height - TASKBAR_HEIGHT - 8);
  }
});

test('snapIconPosition snaps dragged icon coordinates to 8px grid and clamps above taskbar', () => {
  const viewport = { width: 1440, height: 900 };
  const mid = snapIconPosition(203, 149, viewport);
  assert.deepEqual(mid, { x: 200, y: 152 });

  const topLeft = snapIconPosition(-40, 0, viewport);
  assert.deepEqual(topLeft, { x: 8, y: MENU_BAR_HEIGHT + 8 });

  const bottomRight = snapIconPosition(2000, 1500, viewport);
  assert.equal(bottomRight.x % GRID_SIZE, 0);
  assert.equal(bottomRight.y % GRID_SIZE, 0);
  assert.ok(bottomRight.x + ICON_WIDTH <= viewport.width - 8);
  assert.ok(bottomRight.y + ICON_HEIGHT <= viewport.height - TASKBAR_HEIGHT - 8);
});

test('normalizeMarqueeRect handles all four drag directions', () => {
  assert.deepEqual(normalizeMarqueeRect({ x: 10, y: 20 }, { x: 110, y: 120 }), {
    x: 10,
    y: 20,
    width: 100,
    height: 100,
  });
  assert.deepEqual(normalizeMarqueeRect({ x: 110, y: 120 }, { x: 10, y: 20 }), {
    x: 10,
    y: 20,
    width: 100,
    height: 100,
  });
  assert.deepEqual(normalizeMarqueeRect({ x: 110, y: 20 }, { x: 10, y: 120 }), {
    x: 10,
    y: 20,
    width: 100,
    height: 100,
  });
});

test('rectsIntersect and getIconsInMarquee select only intersecting icons', () => {
  assert.equal(
    rectsIntersect({ x: 0, y: 0, width: 50, height: 50 }, { x: 40, y: 40, width: 50, height: 50 }),
    true
  );
  assert.equal(
    rectsIntersect({ x: 0, y: 0, width: 50, height: 50 }, { x: 60, y: 0, width: 50, height: 50 }),
    false
  );

  const viewport = { width: 1440, height: 900 };
  const positions = computeDefaultIconPositions(viewport);

  const marquee = normalizeMarqueeRect({ x: 8, y: 40 }, { x: 120, y: 200 });
  const selected = getIconsInMarquee(marquee, positions);
  assert.deepEqual(selected, ['about', 'projects']);

  const emptyMarquee = normalizeMarqueeRect({ x: 500, y: 300 }, { x: 700, y: 450 });
  assert.deepEqual(getIconsInMarquee(emptyMarquee, positions), []);
});

test('createNextFolderName, sanitizeIconRename, and findFreeDesktopSpot behave cleanly', () => {
  assert.equal(createNextFolderName([]), 'New Folder');
  assert.equal(createNextFolderName(['New Folder']), 'New Folder (2)');
  assert.equal(createNextFolderName(['new folder', 'New Folder (2)']), 'New Folder (3)');

  assert.equal(sanitizeIconRename('   My Work  ', 'Projects'), 'My Work');
  assert.equal(sanitizeIconRename('   ', 'Projects'), 'Projects');

  const viewport = { width: 1440, height: 900 };
  const defaults = computeDefaultIconPositions(viewport);
  const spot = findFreeDesktopSpot(Object.values(defaults), viewport);
  assert.equal(spot.x % GRID_SIZE, 0);
  assert.equal(spot.y % GRID_SIZE, 0);
  assert.ok(spot.y + ICON_HEIGHT <= viewport.height - TASKBAR_HEIGHT - 8);
});

test('loadIconPositions and saveIconPositions persist safely and survive storage errors', () => {
  const viewport = { width: 1440, height: 900 };
  const storage = createMemoryStorage();
  const defaults = computeDefaultIconPositions(viewport);
  const moved = { ...defaults, about: { x: 320, y: 240 } };

  assert.equal(saveIconPositions(moved, storage), true);
  const loaded = loadIconPositions(viewport, storage);
  assert.deepEqual(loaded.about, { x: 320, y: 240 });

  storage.setItem(ICON_STORAGE_KEY, '{not-valid-json');
  const recovered = loadIconPositions(viewport, storage);
  assert.deepEqual(recovered, defaults);

  const brokenStorage: StorageLike = {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
    removeItem: () => {
      throw new Error('SecurityError');
    },
  };

  assert.equal(saveIconPositions(moved, brokenStorage), false);
  assert.equal(clearSavedIconPositions(brokenStorage), false);
  assert.deepEqual(loadIconPositions(viewport, brokenStorage), defaults);
});
