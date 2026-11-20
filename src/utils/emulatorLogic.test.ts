import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDeviceFormFactor,
  getEmulatorResolutionLabel,
  getVirtualKeyPayload,
  shouldUseEmulatorLayout,
  isGameWindow,
  getDPadDirectionFromCoords,
  getGameControllerConfig,
  GAME_CONTROLLER_CONFIGS,
} from './emulatorLogic';
import { detectIOSUserAgent, isStandaloneDisplayMode } from './pwaLogic';

test('getDeviceFormFactor classifies phone, tablet, and desktop widths accurately', () => {
  assert.equal(getDeviceFormFactor(390), 'phone');
  assert.equal(getDeviceFormFactor(639), 'phone');
  assert.equal(getDeviceFormFactor(640), 'tablet');
  assert.equal(getDeviceFormFactor(820), 'tablet');
  assert.equal(getDeviceFormFactor(1023), 'tablet');
  assert.equal(getDeviceFormFactor(1024), 'desktop');
  assert.equal(getDeviceFormFactor(1440), 'desktop');
});

test('shouldUseEmulatorLayout activates on mobile and tablet viewports and respects desktop override', () => {
  assert.equal(shouldUseEmulatorLayout({ width: 390, height: 844 }), true);
  assert.equal(shouldUseEmulatorLayout({ width: 820, height: 1180 }), true);
  assert.equal(shouldUseEmulatorLayout({ width: 1024, height: 768 }), false);
  assert.equal(shouldUseEmulatorLayout({ width: 1440, height: 900 }), false);
  assert.equal(shouldUseEmulatorLayout({ width: 1440, height: 900 }, true), true);
});

test('getEmulatorResolutionLabel returns classic VGA/SVGA labels per form factor', () => {
  assert.equal(getEmulatorResolutionLabel('phone'), 'VGA 640x480');
  assert.equal(getEmulatorResolutionLabel('tablet'), 'SVGA 800x600');
  assert.equal(getEmulatorResolutionLabel('desktop'), 'XGA 1024x768');
});

test('getVirtualKeyPayload maps emulator gamepad controls to standard KeyboardEvent keys', () => {
  assert.deepEqual(getVirtualKeyPayload('up'), {
    key: 'ArrowUp',
    code: 'ArrowUp',
    keyCode: 38,
  });
  assert.deepEqual(getVirtualKeyPayload('space'), {
    key: ' ',
    code: 'Space',
    keyCode: 32,
  });
  assert.deepEqual(getVirtualKeyPayload('escape'), {
    key: 'Escape',
    code: 'Escape',
    keyCode: 27,
  });
  assert.deepEqual(getVirtualKeyPayload('enter'), {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
  });
  assert.deepEqual(getVirtualKeyPayload('p'), {
    key: 'p',
    code: 'KeyP',
    keyCode: 80,
  });
  assert.deepEqual(getVirtualKeyPayload('x'), {
    key: 'x',
    code: 'KeyX',
    keyCode: 88,
  });
  assert.deepEqual(getVirtualKeyPayload('f'), {
    key: 'f',
    code: 'KeyF',
    keyCode: 70,
  });
  assert.deepEqual(getVirtualKeyPayload('r'), {
    key: 'r',
    code: 'KeyR',
    keyCode: 82,
  });
});

test('isGameWindow identifies retro portfolio games accurately', () => {
  assert.equal(isGameWindow('game-snake'), true);
  assert.equal(isGameWindow('game-tetris'), true);
  assert.equal(isGameWindow('game-pong'), true);
  assert.equal(isGameWindow('game-minesweeper'), true);
  assert.equal(isGameWindow('game-custom'), true);
  assert.equal(isGameWindow('terminal'), false);
  assert.equal(isGameWindow('about'), false);
  assert.equal(isGameWindow('projects'), false);
  assert.equal(isGameWindow(null), false);
  assert.equal(isGameWindow(undefined), false);
});

test('getDPadDirectionFromCoords maps continuous 2D touches and deadzones accurately', () => {
  const cx = 50;
  const cy = 50;

  // Center resting deadzone (< 12px)
  assert.equal(getDPadDirectionFromCoords(50, 50, cx, cy, 12), null);
  assert.equal(getDPadDirectionFromCoords(55, 52, cx, cy, 12), null);

  // Pure 4-way cardinals outside deadzone
  assert.equal(getDPadDirectionFromCoords(80, 50, cx, cy, 12), 'right');
  assert.equal(getDPadDirectionFromCoords(20, 50, cx, cy, 12), 'left');
  assert.equal(getDPadDirectionFromCoords(50, 20, cx, cy, 12), 'up');
  assert.equal(getDPadDirectionFromCoords(50, 80, cx, cy, 12), 'down');

  // Angled quadrants (smooth slide detection)
  assert.equal(getDPadDirectionFromCoords(75, 40, cx, cy, 12), 'right');
  assert.equal(getDPadDirectionFromCoords(60, 85, cx, cy, 12), 'down');
  assert.equal(getDPadDirectionFromCoords(25, 40, cx, cy, 12), 'left');
  assert.equal(getDPadDirectionFromCoords(45, 15, cx, cy, 12), 'up');
});

test('getGameControllerConfig returns custom tactile configs per active game', () => {
  const tetrisConfig = getGameControllerConfig('game-tetris');
  assert.equal(tetrisConfig.title, 'TETRIS 90s');
  assert.equal(tetrisConfig.btnA.label, 'A');
  assert.equal(tetrisConfig.btnA.sublabel, 'ROTATE');
  assert.equal(tetrisConfig.btnB.sublabel, 'DROP');

  const snakeConfig = getGameControllerConfig('game-snake');
  assert.equal(snakeConfig.title, 'RETRO SNAKE');
  assert.equal(snakeConfig.btnB.sublabel, 'PAUSE');

  const defaultConf = getGameControllerConfig('terminal');
  assert.equal(defaultConf.title, 'SHIVAM RETRO PAD');
});

test('PWA platform helpers detect iOS user agents and standalone mode reliably', () => {
  assert.equal(
    detectIOSUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
    ),
    true
  );
  assert.equal(
    detectIOSUserAgent('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'),
    true
  );
  assert.equal(
    detectIOSUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36'),
    false
  );
  assert.equal(isStandaloneDisplayMode(true, false), true);
  assert.equal(isStandaloneDisplayMode(false, true), true);
  assert.equal(isStandaloneDisplayMode(false, false), false);
});
