import type { ViewportSize } from './windowLogic';

export type DeviceFormFactor = 'phone' | 'tablet' | 'desktop';

export type VirtualControlKey =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'space'
  | 'enter'
  | 'escape'
  | 'p'
  | 'x'
  | 'f'
  | 'r';

export interface VirtualKeyPayload {
  key: string;
  code: string;
  keyCode: number;
}

export const PHONE_MAX_WIDTH = 640;
export const TABLET_MAX_WIDTH = 1024;

export function getDeviceFormFactor(width: number): DeviceFormFactor {
  if (width < PHONE_MAX_WIDTH) return 'phone';
  if (width < TABLET_MAX_WIDTH) return 'tablet';
  return 'desktop';
}

export function shouldUseEmulatorLayout(
  viewport: ViewportSize,
  forceEmulator = false
): boolean {
  if (forceEmulator) return true;
  return viewport.width < TABLET_MAX_WIDTH;
}

export function getEmulatorResolutionLabel(formFactor: DeviceFormFactor): string {
  if (formFactor === 'phone') return 'VGA 640x480';
  if (formFactor === 'tablet') return 'SVGA 800x600';
  return 'XGA 1024x768';
}

const VIRTUAL_KEY_MAP: Record<VirtualControlKey, VirtualKeyPayload> = {
  up: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
  down: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
  left: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
  right: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  space: { key: ' ', code: 'Space', keyCode: 32 },
  enter: { key: 'Enter', code: 'Enter', keyCode: 13 },
  escape: { key: 'Escape', code: 'Escape', keyCode: 27 },
  p: { key: 'p', code: 'KeyP', keyCode: 80 },
  x: { key: 'x', code: 'KeyX', keyCode: 88 },
  f: { key: 'f', code: 'KeyF', keyCode: 70 },
  r: { key: 'r', code: 'KeyR', keyCode: 82 },
};

export function getVirtualKeyPayload(control: VirtualControlKey): VirtualKeyPayload {
  return VIRTUAL_KEY_MAP[control];
}

export function dispatchVirtualKey(
  control: VirtualControlKey,
  eventType: 'keydown' | 'keyup'
): void {
  if (typeof window === 'undefined') return;
  const payload = getVirtualKeyPayload(control);
  const event = new KeyboardEvent(eventType, {
    key: payload.key,
    code: payload.code,
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(event);
}

export const GAME_WINDOW_IDS = [
  'game-snake',
  'game-tetris',
  'game-pong',
  'game-minesweeper',
] as const;

export type GameWindowId = (typeof GAME_WINDOW_IDS)[number];

export function isGameWindow(id: string | null | undefined): id is GameWindowId {
  if (!id) return false;
  return (
    id === 'game-snake' ||
    id === 'game-tetris' ||
    id === 'game-pong' ||
    id === 'game-minesweeper' ||
    id.startsWith('game-')
  );
}

export type DPadDirection = 'up' | 'down' | 'left' | 'right' | null;

/**
 * Maps continuous 2D touch coordinates relative to D-Pad center into a 4-way direction
 * with a deadzone to prevent accidental triggers when resting on the center pivot.
 */
export function getDPadDirectionFromCoords(
  touchX: number,
  touchY: number,
  centerX: number,
  centerY: number,
  deadzone = 12
): DPadDirection {
  const dx = touchX - centerX;
  const dy = touchY - centerY;
  const dist = Math.hypot(dx, dy);
  if (dist < deadzone) return null;

  const angle = Math.atan2(dy, dx);
  // Quadrants centered on cardinals:
  // Right: [-PI/4, PI/4]
  // Down: (PI/4, 3PI/4)
  // Up: (-3PI/4, -PI/4)
  // Left: > 3PI/4 or < -3PI/4
  if (angle >= -Math.PI / 4 && angle <= Math.PI / 4) {
    return 'right';
  } else if (angle > Math.PI / 4 && angle < (3 * Math.PI) / 4) {
    return 'down';
  } else if (angle < -Math.PI / 4 && angle > (-3 * Math.PI) / 4) {
    return 'up';
  } else {
    return 'left';
  }
}

export interface GameButtonConfig {
  label: string;
  sublabel: string;
  key: VirtualControlKey;
  color?: string;
}

export interface GameControllerConfig {
  title: string;
  badge: string;
  btnA: GameButtonConfig;
  btnB: GameButtonConfig;
  selectBtn: { label: string; key: VirtualControlKey };
  startBtn: { label: string; key: VirtualControlKey };
  dpadHint: string;
}

export const GAME_CONTROLLER_CONFIGS: Record<GameWindowId, GameControllerConfig> = {
  'game-tetris': {
    title: 'TETRIS 90s',
    badge: '10x20 MATRIX',
    btnA: { label: 'A', sublabel: 'ROTATE', key: 'up', color: '#E4572E' },
    btnB: { label: 'B', sublabel: 'DROP', key: 'space', color: '#2A9D8F' },
    selectBtn: { label: 'PAUSE', key: 'p' },
    startBtn: { label: 'START', key: 'enter' },
    dpadHint: '◄ ► GLIDE · ▼ SOFT DROP',
  },
  'game-snake': {
    title: 'RETRO SNAKE',
    badge: 'NOKIA 3310',
    btnA: { label: 'A', sublabel: 'START', key: 'enter', color: '#2A9D8F' },
    btnB: { label: 'B', sublabel: 'PAUSE', key: 'p', color: '#E4572E' },
    selectBtn: { label: 'PAUSE', key: 'p' },
    startBtn: { label: 'START', key: 'enter' },
    dpadHint: '▲ ▼ ◄ ► STEER',
  },
  'game-pong': {
    title: 'ARCADE PONG',
    badge: '1972 CRT',
    btnA: { label: 'A', sublabel: 'SERVE', key: 'space', color: '#E4572E' },
    btnB: { label: 'B', sublabel: 'PAUSE', key: 'p', color: '#2A9D8F' },
    selectBtn: { label: 'PAUSE', key: 'p' },
    startBtn: { label: 'START', key: 'enter' },
    dpadHint: '▲ ▼ PADDLE MOVE',
  },
  'game-minesweeper': {
    title: 'MINESWEEPER',
    badge: 'WIN 95 BOMBS',
    btnA: { label: 'A', sublabel: 'DIG', key: 'enter', color: '#2A9D8F' },
    btnB: { label: 'B', sublabel: 'FLAG', key: 'f', color: '#E4572E' },
    selectBtn: { label: 'FLAG', key: 'f' },
    startBtn: { label: 'RESET', key: 'r' },
    dpadHint: '▲ ▼ ◄ ► MOVE CURSOR',
  },
};

export const DEFAULT_CONTROLLER_CONFIG: GameControllerConfig = {
  title: 'SHIVAM RETRO PAD',
  badge: '8-BIT SYSTEM',
  btnA: { label: 'A', sublabel: 'ENTER', key: 'enter', color: '#2A9D8F' },
  btnB: { label: 'B', sublabel: 'SPACE', key: 'space', color: '#E4572E' },
  selectBtn: { label: 'ESC', key: 'escape' },
  startBtn: { label: 'START', key: 'enter' },
  dpadHint: '▲ ▼ ◄ ► NAVIGATE',
};

export function getGameControllerConfig(id: string | null | undefined): GameControllerConfig {
  if (id && isGameWindow(id)) {
    return GAME_CONTROLLER_CONFIGS[id] || DEFAULT_CONTROLLER_CONFIG;
  }
  return DEFAULT_CONTROLLER_CONFIG;
}
