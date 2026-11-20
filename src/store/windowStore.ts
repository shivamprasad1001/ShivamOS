import { create } from 'zustand';
import {
  ABOUT_CONTENT,
  DESKTOP_ICON_LABELS,
  PROJECTS,
  SYSTEM_CHROME_COPY,
  TRASH_FILES,
  type TrashFile,
} from '../../data/content';
import {
  clampIconPosition,
  clampIconPositionsToViewport,
  clearSavedIconPositions,
  computeDefaultIconPositions,
  createNextFolderName,
  findFreeDesktopSpot,
  loadIconPositions,
  sanitizeIconRename,
  saveIconPositions,
  snapIconPosition,
  type CustomDesktopFolder,
  type DesktopIconId,
  type IconPositionMap,
  type Point,
} from '../utils/desktopLogic';
import {
  DEFAULT_SYSTEM_SETTINGS,
  TOAST_DURATION_MS,
  TOAST_EXIT_MS,
  loadSystemSettings,
  pushRecentWindow,
  saveSystemSettings,
  type PowerState,
  type PropertiesTarget,
  type SystemSettings,
} from '../utils/systemLogic';
import {
  MENU_BAR_HEIGHT,
  TASKBAR_HEIGHT,
  clampWindowPosition,
  clampWindowRectToViewport,
  clampWindowSize,
  computeCascadePositions,
  computeEdgeSnapRect,
  computeNextCascadePosition,
  cycleSwitcherIndex,
  getSwitcherWindowOrder,
  type EdgeSnapZone,
  type ViewportSize,
  type WallpaperMode,
  type WindowId,
} from '../utils/windowLogic';
import { playRetroSound } from '../utils/sound';

export const CLOSE_ANIMATION_MS = 120;

export interface OSWindowState {
  id: WindowId;
  title: string;
  isOpen: boolean;
  isClosing: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  snapZone: EdgeSnapZone | null;
  hasOpenedBefore: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  zIndex: number;
  /** Saved geometry before maximizing or edge snapping */
  restoreRect?: { x: number; y: number; width: number; height: number };
}

export interface SentMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  sentAt: string;
}

export interface ToastNotification {
  id: string;
  message: string;
  isLeaving: boolean;
}

const WALLPAPER_ORDER: WallpaperMode[] = ['dither', 'dots', 'grid', 'diagonal'];
const closeTimers = new Map<WindowId, number>();
const toastTimers = new Map<string, number>();
let shutdownTimer: number | null = null;
let toastSeq = 0;

function cancelCloseTimer(id: WindowId): void {
  const existing = closeTimers.get(id);
  if (existing !== undefined) {
    window.clearTimeout(existing);
    closeTimers.delete(id);
  }
}

function cancelAllCloseTimers(): void {
  closeTimers.forEach((timerId) => window.clearTimeout(timerId));
  closeTimers.clear();
}

function cancelShutdownTimer(): void {
  if (shutdownTimer !== null) {
    window.clearTimeout(shutdownTimer);
    shutdownTimer = null;
  }
}

function getInitialViewport(): ViewportSize {
  if (typeof window === 'undefined') return { width: 1440, height: 900 };
  return { width: window.innerWidth, height: window.innerHeight };
}

function persistCurrentSettings(state: SystemSettings): void {
  saveSystemSettings({
    wallpaper: state.wallpaper,
    soundEnabled: state.soundEnabled,
    crtEnabled: state.crtEnabled,
    reduceMotion: state.reduceMotion,
  });
}

interface WindowStore {
  powerState: PowerState;
  crtEnabled: boolean;
  soundEnabled: boolean;
  wallpaper: WallpaperMode;
  reduceMotion: boolean;
  bsodActive: boolean;
  selectedIconIds: DesktopIconId[];
  selectedFolderIds: string[];
  iconPositions: IconPositionMap;
  customIconLabels: Partial<Record<DesktopIconId, string>>;
  customFolders: CustomDesktopFolder[];
  renamingId: string | null;
  refreshTick: number;
  topZ: number;
  cascadeCounter: number;
  snapPreviewZone: EdgeSnapZone | null;
  switcherOpen: boolean;
  switcherIndex: number;
  recentWindowIds: WindowId[];
  propertiesTarget: PropertiesTarget | null;
  toasts: ToastNotification[];
  windows: Record<WindowId, OSWindowState>;
  trashItems: TrashFile[];
  sentMessages: SentMessage[];
  terminalClearSignal: number;

  finishBoot: () => void;
  unlockDesktop: () => void;
  lockSystem: () => void;
  rebootSystem: () => void;
  shutDownSystem: () => void;
  powerOnSystem: () => void;

  toggleCrt: () => void;
  toggleSound: () => void;
  toggleReduceMotion: () => void;
  setWallpaper: (mode: WallpaperMode, silentToast?: boolean) => void;
  cycleWallpaper: () => void;
  resetSettings: () => void;
  triggerBsod: () => void;
  dismissBsod: (openResumeAfter?: boolean) => void;

  selectIcon: (id: DesktopIconId | null) => void;
  selectIcons: (ids: DesktopIconId[], folderIds?: string[]) => void;
  toggleSelectIcon: (id: DesktopIconId) => void;
  selectFolder: (id: string | null) => void;
  moveDesktopIcons: (
    updates: Partial<IconPositionMap>,
    viewport: ViewportSize,
    snapAndPersist?: boolean
  ) => void;
  fitIconsToViewport: (viewport: ViewportSize) => void;
  createDesktopFolder: (viewport: ViewportSize, preferredPoint?: Point) => void;
  moveCustomFolder: (id: string, x: number, y: number, viewport: ViewportSize, snap?: boolean) => void;
  deleteCustomFolder: (id: string) => void;
  startRenaming: (id: string) => void;
  commitRename: (id: string, nextName: string) => void;
  cancelRenaming: () => void;
  refreshDesktop: (viewport: ViewportSize) => void;

  openProperties: (target: PropertiesTarget) => void;
  closeProperties: () => void;
  pushToast: (message: string) => void;
  dismissToast: (id: string) => void;

  openWindow: (id: WindowId, viewport?: ViewportSize) => void;
  closeWindow: (id: WindowId) => void;
  finalizeCloseWindow: (id: WindowId) => void;
  closeFocusedWindow: () => void;
  closeAllWindows: () => void;
  minimizeWindow: (id: WindowId) => void;
  toggleTaskbarWindow: (id: WindowId, viewport: ViewportSize) => void;
  toggleMaximizeWindow: (id: WindowId, viewport: ViewportSize) => void;
  focusWindow: (id: WindowId) => void;
  moveWindow: (id: WindowId, x: number, y: number, viewport: ViewportSize) => void;
  resizeWindow: (id: WindowId, width: number, height: number, viewport: ViewportSize) => void;
  setSnapPreviewZone: (zone: EdgeSnapZone | null) => void;
  snapWindowToEdge: (id: WindowId, zone: EdgeSnapZone, viewport: ViewportSize) => void;
  unsnapWindow: (id: WindowId, nextX: number, nextY: number, viewport: ViewportSize) => void;
  cascadeWindows: (viewport: ViewportSize) => void;
  tileWindows: (viewport: ViewportSize) => void;
  resetLayout: (viewport: ViewportSize) => void;
  fitWindowsToViewport: (viewport: ViewportSize) => void;

  openSwitcher: (direction?: 1 | -1) => void;
  stepSwitcher: (direction?: 1 | -1) => void;
  selectSwitcherIndex: (index: number) => void;
  commitSwitcher: () => void;
  cancelSwitcher: () => void;

  emptyTrash: () => void;
  restoreTrash: () => void;
  addSentMessage: (msg: Omit<SentMessage, 'id' | 'sentAt'>) => void;
  requestTerminalClear: () => void;
}

function projectTitleById(id: (typeof PROJECTS)[number]['id']): string {
  return PROJECTS.find((p) => p.id === id)?.windowTitle ?? id;
}

function createInitialWindows(): Record<WindowId, OSWindowState> {
  return {
    about: {
      id: 'about',
      title: ABOUT_CONTENT.windowTitle,
      isOpen: true,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: true,
      x: 136,
      y: 56,
      width: 576,
      height: 624,
      minWidth: 360,
      minHeight: 360,
      zIndex: 12,
    },
    projects: {
      id: 'projects',
      title: 'Projects — Folder',
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 200,
      y: 72,
      width: 632,
      height: 496,
      minWidth: 384,
      minHeight: 304,
      zIndex: 10,
    },
    resume: {
      id: 'resume',
      title: 'Resume — SHIVAM_PRASAD_CV_2026.TXT',
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 248,
      y: 64,
      width: 640,
      height: 584,
      minWidth: 380,
      minHeight: 320,
      zIndex: 10,
    },
    skills: {
      id: 'skills',
      title: 'Skills — System Profiler',
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 280,
      y: 96,
      width: 608,
      height: 512,
      minWidth: 360,
      minHeight: 300,
      zIndex: 10,
    },
    contact: {
      id: 'contact',
      title: 'Contact — Mail Composer',
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 312,
      y: 96,
      width: 544,
      height: 544,
      minWidth: 360,
      minHeight: 360,
      zIndex: 10,
    },
    terminal: {
      id: 'terminal',
      title: 'terminal.exe',
      isOpen: true,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: true,
      x: 736,
      y: 208,
      width: 552,
      height: 416,
      minWidth: 360,
      minHeight: 264,
      zIndex: 11,
    },
    trash: {
      id: 'trash',
      title: 'Trash — Discarded Artifacts',
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 344,
      y: 136,
      width: 528,
      height: 400,
      minWidth: 340,
      minHeight: 264,
      zIndex: 10,
    },
    games: {
      id: 'games',
      title: 'Games — Arcade Folder',
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 224,
      y: 80,
      width: 584,
      height: 480,
      minWidth: 360,
      minHeight: 320,
      zIndex: 10,
    },
    'game-snake': {
      id: 'game-snake',
      title: 'snake.exe — CRT Snake',
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 208,
      y: 64,
      width: 488,
      height: 528,
      minWidth: 400,
      minHeight: 460,
      zIndex: 10,
    },
    'game-minesweeper': {
      id: 'game-minesweeper',
      title: 'minesweeper.exe — Mine Field',
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 720,
      y: 64,
      width: 464,
      height: 544,
      minWidth: 368,
      minHeight: 440,
      zIndex: 10,
    },
    'game-pong': {
      id: 'game-pong',
      title: 'pong.exe — Neural CPU Pong',
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 424,
      y: 128,
      width: 512,
      height: 432,
      minWidth: 420,
      minHeight: 400,
      zIndex: 10,
    },
    'game-tetris': {
      id: 'game-tetris',
      title: 'tetris.exe — Block Stacker',
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 368,
      y: 56,
      width: 472,
      height: 552,
      minWidth: 424,
      minHeight: 512,
      zIndex: 10,
    },
    paint: {
      id: 'paint',
      title: 'Paint.app — Pixel Sketchpad',
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 240,
      y: 80,
      width: 616,
      height: 544,
      minWidth: 440,
      minHeight: 420,
      zIndex: 10,
    },
    notes: {
      id: 'notes',
      title: 'Notes.txt — Sticky Notepad',
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 296,
      y: 112,
      width: 520,
      height: 448,
      minWidth: 360,
      minHeight: 320,
      zIndex: 10,
    },
    'project-orchestratorflow': {
      id: 'project-orchestratorflow',
      title: projectTitleById('project-orchestratorflow'),
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 240,
      y: 72,
      width: 640,
      height: 472,
      minWidth: 380,
      minHeight: 340,
      zIndex: 10,
    },
    'project-gwen': {
      id: 'project-gwen',
      title: projectTitleById('project-gwen'),
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 272,
      y: 96,
      width: 640,
      height: 472,
      minWidth: 380,
      minHeight: 340,
      zIndex: 10,
    },
    'project-minigpt': {
      id: 'project-minigpt',
      title: projectTitleById('project-minigpt'),
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 304,
      y: 120,
      width: 632,
      height: 448,
      minWidth: 380,
      minHeight: 340,
      zIndex: 10,
    },
    'project-textile-defect': {
      id: 'project-textile-defect',
      title: projectTitleById('project-textile-defect'),
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 328,
      y: 136,
      width: 632,
      height: 448,
      minWidth: 380,
      minHeight: 340,
      zIndex: 10,
    },
    'project-yolov8': {
      id: 'project-yolov8',
      title: projectTitleById('project-yolov8'),
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 352,
      y: 152,
      width: 632,
      height: 456,
      minWidth: 380,
      minHeight: 340,
      zIndex: 10,
    },
    explorer: {
      id: 'explorer',
      title: SYSTEM_CHROME_COPY.explorer.windowTitle,
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 200,
      y: 72,
      width: 656,
      height: 448,
      minWidth: 440,
      minHeight: 320,
      zIndex: 10,
    },
    settings: {
      id: 'settings',
      title: SYSTEM_CHROME_COPY.settings.windowTitle,
      isOpen: false,
      isClosing: false,
      isMinimized: false,
      isMaximized: false,
      snapZone: null,
      hasOpenedBefore: false,
      x: 248,
      y: 96,
      width: 528,
      height: 488,
      minWidth: 384,
      minHeight: 360,
      zIndex: 10,
    },
  };
}

function getFocusedWindowId(windows: Record<WindowId, OSWindowState>): WindowId | null {
  let highest: OSWindowState | null = null;
  for (const win of Object.values(windows)) {
    if (win.isOpen && !win.isClosing && !win.isMinimized) {
      if (!highest || win.zIndex > highest.zIndex) {
        highest = win;
      }
    }
  }
  return highest ? highest.id : null;
}

function finalizeWindowRectOnClose(win: OSWindowState): OSWindowState {
  const restored = win.restoreRect;
  return {
    ...win,
    ...(restored
      ? { x: restored.x, y: restored.y, width: restored.width, height: restored.height }
      : {}),
    isOpen: false,
    isClosing: false,
    isMinimized: false,
    isMaximized: false,
    snapZone: null,
    restoreRect: undefined,
  };
}

const initialSettings = loadSystemSettings();

export const useWindowStore = create<WindowStore>((set, get) => ({
  powerState: 'booting',
  crtEnabled: initialSettings.crtEnabled,
  soundEnabled: initialSettings.soundEnabled,
  wallpaper: initialSettings.wallpaper,
  reduceMotion: initialSettings.reduceMotion,
  bsodActive: false,
  selectedIconIds: [],
  selectedFolderIds: [],
  iconPositions: loadIconPositions(getInitialViewport()),
  customIconLabels: {},
  customFolders: [],
  renamingId: null,
  refreshTick: 0,
  topZ: 15,
  cascadeCounter: 0,
  snapPreviewZone: null,
  switcherOpen: false,
  switcherIndex: 0,
  recentWindowIds: ['about', 'terminal'],
  propertiesTarget: null,
  toasts: [],
  windows: createInitialWindows(),
  trashItems: [...TRASH_FILES],
  sentMessages: [],
  terminalClearSignal: 0,

  finishBoot: () => {
    cancelShutdownTimer();
    set({ powerState: 'locked' });
  },

  unlockDesktop: () => {
    cancelShutdownTimer();
    playRetroSound('open', get().soundEnabled);
    set({ powerState: 'desktop' });
  },

  lockSystem: () => {
    playRetroSound('click', get().soundEnabled);
    set({ powerState: 'locked', switcherOpen: false, propertiesTarget: null });
  },

  rebootSystem: () => {
    cancelAllCloseTimers();
    cancelShutdownTimer();
    playRetroSound('beep', get().soundEnabled);
    set({
      powerState: 'booting',
      bsodActive: false,
      switcherOpen: false,
      snapPreviewZone: null,
      propertiesTarget: null,
    });
  },

  shutDownSystem: () => {
    cancelAllCloseTimers();
    cancelShutdownTimer();
    const state = get();
    playRetroSound('close', state.soundEnabled);

    if (state.reduceMotion) {
      set({
        powerState: 'off',
        bsodActive: false,
        switcherOpen: false,
        snapPreviewZone: null,
        propertiesTarget: null,
      });
      return;
    }

    set({
      powerState: 'shutting-down',
      bsodActive: false,
      switcherOpen: false,
      snapPreviewZone: null,
      propertiesTarget: null,
    });

    shutdownTimer = window.setTimeout(() => {
      shutdownTimer = null;
      set({ powerState: 'off' });
    }, 650);
  },

  powerOnSystem: () => {
    cancelShutdownTimer();
    playRetroSound('beep', get().soundEnabled);
    set({ powerState: 'booting', bsodActive: false });
  },

  toggleCrt: () => {
    const state = get();
    const nextCrt = !state.crtEnabled;
    playRetroSound('click', state.soundEnabled);
    persistCurrentSettings({
      wallpaper: state.wallpaper,
      soundEnabled: state.soundEnabled,
      crtEnabled: nextCrt,
      reduceMotion: state.reduceMotion,
    });
    set({ crtEnabled: nextCrt });
  },

  toggleSound: () => {
    const state = get();
    const nextSound = !state.soundEnabled;
    persistCurrentSettings({
      wallpaper: state.wallpaper,
      soundEnabled: nextSound,
      crtEnabled: state.crtEnabled,
      reduceMotion: state.reduceMotion,
    });
    set({ soundEnabled: nextSound });
    if (nextSound) {
      playRetroSound('beep', true);
    }
  },

  toggleReduceMotion: () => {
    const state = get();
    const nextReduce = !state.reduceMotion;
    playRetroSound('click', state.soundEnabled);
    persistCurrentSettings({
      wallpaper: state.wallpaper,
      soundEnabled: state.soundEnabled,
      crtEnabled: state.crtEnabled,
      reduceMotion: nextReduce,
    });
    set({ reduceMotion: nextReduce });
  },

  setWallpaper: (mode, silentToast = false) => {
    const state = get();
    playRetroSound('click', state.soundEnabled);
    persistCurrentSettings({
      wallpaper: mode,
      soundEnabled: state.soundEnabled,
      crtEnabled: state.crtEnabled,
      reduceMotion: state.reduceMotion,
    });
    set({ wallpaper: mode });
    if (!silentToast) {
      get().pushToast(
        `${SYSTEM_CHROME_COPY.toasts.wallpaperChangedPrefix} ${mode.charAt(0).toUpperCase()}${mode.slice(1)}`
      );
    }
  },

  cycleWallpaper: () => {
    const current = get().wallpaper;
    const idx = WALLPAPER_ORDER.indexOf(current);
    const next = WALLPAPER_ORDER[(idx + 1) % WALLPAPER_ORDER.length];
    get().setWallpaper(next, false);
  },

  resetSettings: () => {
    playRetroSound('click', get().soundEnabled);
    persistCurrentSettings(DEFAULT_SYSTEM_SETTINGS);
    set({
      wallpaper: DEFAULT_SYSTEM_SETTINGS.wallpaper,
      soundEnabled: DEFAULT_SYSTEM_SETTINGS.soundEnabled,
      crtEnabled: DEFAULT_SYSTEM_SETTINGS.crtEnabled,
      reduceMotion: DEFAULT_SYSTEM_SETTINGS.reduceMotion,
    });
    get().pushToast(SYSTEM_CHROME_COPY.toasts.settingsSaved);
  },

  triggerBsod: () => {
    playRetroSound('bsod', get().soundEnabled);
    set({ bsodActive: true, switcherOpen: false });
  },

  dismissBsod: (openResumeAfter = false) => {
    playRetroSound('click', get().soundEnabled);
    set({ bsodActive: false });
    if (openResumeAfter) {
      get().openWindow('resume', getInitialViewport());
    }
  },

  selectIcon: (id) => set({ selectedIconIds: id ? [id] : [], selectedFolderIds: [] }),

  selectIcons: (ids, folderIds = []) =>
    set({ selectedIconIds: ids, selectedFolderIds: folderIds }),

  toggleSelectIcon: (id) =>
    set((state) => {
      const exists = state.selectedIconIds.includes(id);
      return {
        selectedIconIds: exists
          ? state.selectedIconIds.filter((item) => item !== id)
          : [...state.selectedIconIds, id],
      };
    }),

  selectFolder: (id) => set({ selectedIconIds: [], selectedFolderIds: id ? [id] : [] }),

  moveDesktopIcons: (updates, viewport, snapAndPersist = false) => {
    const state = get();
    const nextPositions: IconPositionMap = { ...state.iconPositions };

    (Object.keys(updates) as DesktopIconId[]).forEach((id) => {
      const pt = updates[id];
      if (!pt) return;
      nextPositions[id] = snapAndPersist
        ? snapIconPosition(pt.x, pt.y, viewport)
        : clampIconPosition(pt.x, pt.y, viewport);
    });

    if (snapAndPersist) {
      saveIconPositions(nextPositions);
    }

    set({ iconPositions: nextPositions });
  },

  fitIconsToViewport: (viewport) => {
    if (viewport.width < 768) return;
    const state = get();
    const clamped = clampIconPositionsToViewport(state.iconPositions, viewport);
    const clampedFolders = state.customFolders.map((folder) => {
      const snapped = snapIconPosition(folder.x, folder.y, viewport);
      return { ...folder, x: snapped.x, y: snapped.y };
    });
    set({ iconPositions: clamped, customFolders: clampedFolders });
  },

  createDesktopFolder: (viewport, preferredPoint) => {
    const state = get();
    const existingNames = state.customFolders.map((f) => f.name);
    const name = createNextFolderName(existingNames);
    const occupied: Point[] = [
      ...Object.values(state.iconPositions),
      ...state.customFolders.map((f) => ({ x: f.x, y: f.y })),
    ];
    const spot = findFreeDesktopSpot(occupied, viewport, preferredPoint);
    const id = `folder-${Date.now()}-${state.customFolders.length + 1}`;
    playRetroSound('open', state.soundEnabled);
    set({
      customFolders: [...state.customFolders, { id, name, x: spot.x, y: spot.y }],
      selectedIconIds: [],
      selectedFolderIds: [id],
    });
    get().pushToast(`${SYSTEM_CHROME_COPY.toasts.folderCreatedPrefix} "${name}"`);
  },

  moveCustomFolder: (id, x, y, viewport, snap = false) => {
    const state = get();
    const pos = snap ? snapIconPosition(x, y, viewport) : clampIconPosition(x, y, viewport);
    set({
      customFolders: state.customFolders.map((f) =>
        f.id === id ? { ...f, x: pos.x, y: pos.y } : f
      ),
    });
  },

  deleteCustomFolder: (id) => {
    const state = get();
    const target = state.customFolders.find((f) => f.id === id);
    if (!target) return;
    playRetroSound('close', state.soundEnabled);
    set({
      customFolders: state.customFolders.filter((f) => f.id !== id),
      selectedFolderIds: state.selectedFolderIds.filter((fid) => fid !== id),
      renamingId: state.renamingId === id ? null : state.renamingId,
    });
    get().pushToast(`${SYSTEM_CHROME_COPY.toasts.folderDeletedPrefix} "${target.name}"`);
  },

  startRenaming: (id) => set({ renamingId: id }),

  commitRename: (id, nextName) => {
    const state = get();
    const folder = state.customFolders.find((f) => f.id === id);
    if (folder) {
      const cleaned = sanitizeIconRename(nextName, folder.name);
      set({
        renamingId: null,
        customFolders: state.customFolders.map((f) =>
          f.id === id ? { ...f, name: cleaned } : f
        ),
      });
      if (cleaned !== folder.name) {
        get().pushToast(`${SYSTEM_CHROME_COPY.toasts.iconRenamedPrefix} "${cleaned}"`);
      }
      return;
    }

    if (id in DESKTOP_ICON_LABELS) {
      const iconId = id as DesktopIconId;
      const fallback = state.customIconLabels[iconId] ?? DESKTOP_ICON_LABELS[iconId];
      const cleaned = sanitizeIconRename(nextName, fallback);
      set({
        renamingId: null,
        customIconLabels: {
          ...state.customIconLabels,
          [iconId]: cleaned,
        },
      });
      if (cleaned !== fallback) {
        get().pushToast(`${SYSTEM_CHROME_COPY.toasts.iconRenamedPrefix} "${cleaned}"`);
      }
      return;
    }

    set({ renamingId: null });
  },

  cancelRenaming: () => set({ renamingId: null }),

  refreshDesktop: (viewport) => {
    const state = get();
    playRetroSound('click', state.soundEnabled);
    const snapped = clampIconPositionsToViewport(state.iconPositions, viewport);
    const snappedFolders = state.customFolders.map((folder) => {
      const pt = snapIconPosition(folder.x, folder.y, viewport);
      return { ...folder, x: pt.x, y: pt.y };
    });
    set({
      iconPositions: snapped,
      customFolders: snappedFolders,
      refreshTick: state.refreshTick + 1,
    });
    get().pushToast(SYSTEM_CHROME_COPY.toasts.desktopRefreshed);
  },

  openProperties: (target) => {
    playRetroSound('click', get().soundEnabled);
    set({ propertiesTarget: target });
  },

  closeProperties: () => set({ propertiesTarget: null }),

  pushToast: (message) => {
    toastSeq += 1;
    const id = `toast-${toastSeq}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-3), { id, message, isLeaving: false }],
    }));

    const timer = window.setTimeout(() => {
      toastTimers.delete(id);
      get().dismissToast(id);
    }, TOAST_DURATION_MS);
    toastTimers.set(id, timer);
  },

  dismissToast: (id) => {
    const existing = toastTimers.get(id);
    if (existing !== undefined) {
      window.clearTimeout(existing);
      toastTimers.delete(id);
    }

    const state = get();
    const target = state.toasts.find((t) => t.id === id);
    if (!target) return;

    if (state.reduceMotion) {
      set({ toasts: state.toasts.filter((t) => t.id !== id) });
      return;
    }

    if (!target.isLeaving) {
      set({
        toasts: state.toasts.map((t) => (t.id === id ? { ...t, isLeaving: true } : t)),
      });
      window.setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, TOAST_EXIT_MS);
    }
  },

  openWindow: (id, viewport) => {
    cancelCloseTimer(id);
    const state = get();
    const target = state.windows[id];
    const effectiveViewport = viewport ?? getInitialViewport();
    const nextZ = state.topZ + 1;
    const wasAlreadyOpen = target.isOpen && !target.isClosing && !target.isMinimized;

    let nextX = target.x;
    let nextY = target.y;
    let nextW = target.width;
    let nextH = target.height;
    let nextCascadeCounter = state.cascadeCounter;

    if (effectiveViewport.width >= 768 && !target.isMaximized && !target.snapZone) {
      if (!target.hasOpenedBefore) {
        const cascaded = computeNextCascadePosition(
          state.cascadeCounter,
          target.width,
          target.height,
          target.minWidth,
          target.minHeight,
          effectiveViewport
        );
        nextX = cascaded.x;
        nextY = cascaded.y;
        nextW = cascaded.width;
        nextH = cascaded.height;
        nextCascadeCounter = state.cascadeCounter + 1;
      } else {
        const clamped = clampWindowRectToViewport(
          nextX,
          nextY,
          nextW,
          nextH,
          target.minWidth,
          target.minHeight,
          effectiveViewport
        );
        nextX = clamped.x;
        nextY = clamped.y;
        nextW = clamped.width;
        nextH = clamped.height;
      }
    }

    playRetroSound(wasAlreadyOpen ? 'click' : 'open', state.soundEnabled);

    set({
      topZ: nextZ,
      cascadeCounter: nextCascadeCounter,
      switcherOpen: false,
      recentWindowIds: pushRecentWindow(state.recentWindowIds, id, 5),
      windows: {
        ...state.windows,
        [id]: {
          ...target,
          isOpen: true,
          isClosing: false,
          isMinimized: false,
          hasOpenedBefore: true,
          x: nextX,
          y: nextY,
          width: nextW,
          height: nextH,
          zIndex: nextZ,
        },
      },
    });
  },

  closeWindow: (id) => {
    const state = get();
    const target = state.windows[id];
    if (!target.isOpen || target.isClosing) return;

    playRetroSound('close', state.soundEnabled);
    cancelCloseTimer(id);

    if (target.isMinimized || state.reduceMotion) {
      set({
        windows: {
          ...state.windows,
          [id]: finalizeWindowRectOnClose(target),
        },
      });
      return;
    }

    set({
      windows: {
        ...state.windows,
        [id]: {
          ...target,
          isClosing: true,
        },
      },
    });

    const timerId = window.setTimeout(() => {
      closeTimers.delete(id);
      get().finalizeCloseWindow(id);
    }, CLOSE_ANIMATION_MS);
    closeTimers.set(id, timerId);
  },

  finalizeCloseWindow: (id) => {
    const state = get();
    const target = state.windows[id];
    if (!target.isClosing) return;

    set({
      windows: {
        ...state.windows,
        [id]: finalizeWindowRectOnClose(target),
      },
    });
  },

  closeFocusedWindow: () => {
    const state = get();
    const focusedId = getFocusedWindowId(state.windows);
    if (focusedId) {
      state.closeWindow(focusedId);
    }
  },

  closeAllWindows: () => {
    const state = get();
    const openIds = (Object.values(state.windows) as OSWindowState[])
      .filter((w) => w.isOpen && !w.isClosing)
      .map((w) => w.id);
    if (openIds.length === 0) return;

    playRetroSound('close', state.soundEnabled);

    if (state.reduceMotion) {
      cancelAllCloseTimers();
      const updated = { ...state.windows };
      openIds.forEach((id) => {
        updated[id] = finalizeWindowRectOnClose(updated[id]);
      });
      set({ windows: updated, switcherOpen: false });
      return;
    }

    const updated = { ...state.windows };
    openIds.forEach((id) => {
      cancelCloseTimer(id);
      if (updated[id].isMinimized) {
        updated[id] = finalizeWindowRectOnClose(updated[id]);
      } else {
        updated[id] = { ...updated[id], isClosing: true };
        const timerId = window.setTimeout(() => {
          closeTimers.delete(id);
          get().finalizeCloseWindow(id);
        }, CLOSE_ANIMATION_MS);
        closeTimers.set(id, timerId);
      }
    });
    set({ windows: updated, switcherOpen: false });
  },

  minimizeWindow: (id) => {
    const state = get();
    playRetroSound('click', state.soundEnabled);
    set({
      windows: {
        ...state.windows,
        [id]: {
          ...state.windows[id],
          isMinimized: true,
        },
      },
    });
  },

  toggleTaskbarWindow: (id, viewport) => {
    const state = get();
    const win = state.windows[id];
    if (!win.isOpen || win.isClosing) return;
    const focused = getFocusedWindowId(state.windows);
    if (win.isMinimized) {
      state.openWindow(id, viewport);
    } else if (focused === id) {
      state.minimizeWindow(id);
    } else {
      playRetroSound('click', state.soundEnabled);
      state.focusWindow(id);
    }
  },

  toggleMaximizeWindow: (id, viewport) => {
    const state = get();
    const win = state.windows[id];
    const nextZ = state.topZ + 1;
    playRetroSound('click', state.soundEnabled);

    if ((win.isMaximized || win.snapZone) && win.restoreRect) {
      const clamped = clampWindowRectToViewport(
        win.restoreRect.x,
        win.restoreRect.y,
        win.restoreRect.width,
        win.restoreRect.height,
        win.minWidth,
        win.minHeight,
        viewport
      );
      set({
        topZ: nextZ,
        windows: {
          ...state.windows,
          [id]: {
            ...win,
            ...clamped,
            isMaximized: false,
            snapZone: null,
            restoreRect: undefined,
            zIndex: nextZ,
          },
        },
      });
      return;
    }

    set({
      topZ: nextZ,
      windows: {
        ...state.windows,
        [id]: {
          ...win,
          isMaximized: true,
          snapZone: null,
          restoreRect: win.restoreRect ?? {
            x: win.x,
            y: win.y,
            width: win.width,
            height: win.height,
          },
          x: 16,
          y: MENU_BAR_HEIGHT + 8,
          width: Math.max(win.minWidth, viewport.width - 32),
          height: Math.max(win.minHeight, viewport.height - MENU_BAR_HEIGHT - TASKBAR_HEIGHT - 16),
          zIndex: nextZ,
        },
      },
    });
  },

  focusWindow: (id) => {
    const state = get();
    const win = state.windows[id];
    if (!win.isOpen || win.isClosing) return;
    if (win.zIndex === state.topZ && !win.isMinimized) return;
    const nextZ = state.topZ + 1;
    set({
      topZ: nextZ,
      windows: {
        ...state.windows,
        [id]: {
          ...win,
          isMinimized: false,
          zIndex: nextZ,
        },
      },
    });
  },

  moveWindow: (id, x, y, viewport) => {
    const state = get();
    const win = state.windows[id];
    const clamped = clampWindowPosition(x, y, win.width, viewport);
    set({
      windows: {
        ...state.windows,
        [id]: {
          ...win,
          x: clamped.x,
          y: clamped.y,
          hasOpenedBefore: true,
          isMaximized: false,
          snapZone: null,
        },
      },
    });
  },

  resizeWindow: (id, width, height, viewport) => {
    const state = get();
    const win = state.windows[id];
    const clamped = clampWindowSize(
      win.x,
      win.y,
      width,
      height,
      win.minWidth,
      win.minHeight,
      viewport
    );
    set({
      windows: {
        ...state.windows,
        [id]: {
          ...win,
          width: clamped.width,
          height: clamped.height,
          hasOpenedBefore: true,
          isMaximized: false,
          snapZone: null,
          restoreRect: undefined,
        },
      },
    });
  },

  setSnapPreviewZone: (zone) => {
    if (get().snapPreviewZone === zone) return;
    set({ snapPreviewZone: zone });
  },

  snapWindowToEdge: (id, zone, viewport) => {
    const state = get();
    const win = state.windows[id];
    const rect = computeEdgeSnapRect(zone, viewport);
    const nextZ = state.topZ + 1;
    playRetroSound('click', state.soundEnabled);

    set({
      topZ: nextZ,
      snapPreviewZone: null,
      windows: {
        ...state.windows,
        [id]: {
          ...win,
          restoreRect: win.restoreRect ?? {
            x: win.x,
            y: win.y,
            width: win.width,
            height: win.height,
          },
          x: rect.x,
          y: rect.y,
          width: Math.max(win.minWidth, rect.width),
          height: Math.max(win.minHeight, rect.height),
          isMaximized: false,
          snapZone: zone,
          hasOpenedBefore: true,
          zIndex: nextZ,
        },
      },
    });
  },

  unsnapWindow: (id, nextX, nextY, viewport) => {
    const state = get();
    const win = state.windows[id];
    const restoredW = win.restoreRect ? win.restoreRect.width : win.width;
    const restoredH = win.restoreRect ? win.restoreRect.height : win.height;
    const clampedPos = clampWindowPosition(nextX, nextY, restoredW, viewport);

    set({
      windows: {
        ...state.windows,
        [id]: {
          ...win,
          x: clampedPos.x,
          y: clampedPos.y,
          width: restoredW,
          height: restoredH,
          isMaximized: false,
          snapZone: null,
          restoreRect: undefined,
          hasOpenedBefore: true,
        },
      },
    });
  },

  cascadeWindows: (viewport) => {
    const state = get();
    const openIds = (Object.values(state.windows) as OSWindowState[])
      .filter((w) => w.isOpen && !w.isClosing && !w.isMinimized)
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((w) => w.id);
    if (openIds.length === 0) return;

    const coords = computeCascadePositions(openIds, viewport);
    const updated = { ...state.windows };
    let z = state.topZ;
    openIds.forEach((id) => {
      z += 1;
      const win = updated[id];
      const baseW = win.restoreRect ? win.restoreRect.width : win.width;
      const baseH = win.restoreRect ? win.restoreRect.height : win.height;
      const clamped = clampWindowRectToViewport(
        coords[id].x,
        coords[id].y,
        baseW,
        baseH,
        win.minWidth,
        win.minHeight,
        viewport
      );
      updated[id] = {
        ...win,
        ...clamped,
        isMaximized: false,
        snapZone: null,
        restoreRect: undefined,
        zIndex: z,
      };
    });
    playRetroSound('click', state.soundEnabled);
    set({ windows: updated, topZ: z });
  },

  tileWindows: (viewport) => {
    const state = get();
    const openWins = (Object.values(state.windows) as OSWindowState[])
      .filter((w) => w.isOpen && !w.isClosing && !w.isMinimized)
      .sort((a, b) => a.zIndex - b.zIndex);
    if (openWins.length === 0) return;

    const leftOffset = 136;
    const availW = Math.max(400, viewport.width - leftOffset - 16);
    const availH = Math.max(300, viewport.height - MENU_BAR_HEIGHT - TASKBAR_HEIGHT - 24);
    const cols = openWins.length === 1 ? 1 : 2;
    const rows = Math.ceil(openWins.length / cols);
    const cellW = Math.floor((availW - (cols - 1) * 16) / cols);
    const cellH = Math.floor((availH - (rows - 1) * 16) / rows);

    const updated = { ...state.windows };
    openWins.forEach((w, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      updated[w.id] = {
        ...w,
        isMaximized: false,
        snapZone: null,
        restoreRect: undefined,
        x: leftOffset + col * (cellW + 16),
        y: MENU_BAR_HEIGHT + 16 + row * (cellH + 16),
        width: Math.max(w.minWidth, cellW),
        height: Math.max(w.minHeight, cellH),
      };
    });
    playRetroSound('click', state.soundEnabled);
    set({ windows: updated });
  },

  resetLayout: (viewport) => {
    cancelAllCloseTimers();
    clearSavedIconPositions();
    const fresh = createInitialWindows();
    (['about', 'terminal'] as WindowId[]).forEach((id) => {
      const win = fresh[id];
      if (viewport.width < 1340 && id === 'terminal') {
        win.x = Math.max(144, viewport.width - win.width - 24);
        win.y = Math.max(MENU_BAR_HEIGHT + 80, viewport.height - TASKBAR_HEIGHT - win.height - 24);
      }
      const clamped = clampWindowRectToViewport(
        win.x,
        win.y,
        win.width,
        win.height,
        win.minWidth,
        win.minHeight,
        viewport
      );
      fresh[id] = { ...win, ...clamped };
    });
    playRetroSound('open', get().soundEnabled);
    set({
      windows: fresh,
      topZ: 15,
      cascadeCounter: 0,
      selectedIconIds: [],
      selectedFolderIds: [],
      customIconLabels: {},
      customFolders: [],
      renamingId: null,
      iconPositions: computeDefaultIconPositions(viewport),
      snapPreviewZone: null,
      switcherOpen: false,
    });
  },

  fitWindowsToViewport: (viewport) => {
    if (viewport.width < 768) return;
    const state = get();
    const updated = { ...state.windows };
    let changed = false;

    (Object.keys(updated) as WindowId[]).forEach((id) => {
      const win = updated[id];
      if (!win.isOpen || win.isClosing || win.isMinimized) return;

      if (win.snapZone) {
        const rect = computeEdgeSnapRect(win.snapZone, viewport);
        if (
          rect.x !== win.x ||
          rect.y !== win.y ||
          rect.width !== win.width ||
          rect.height !== win.height
        ) {
          changed = true;
          updated[id] = {
            ...win,
            x: rect.x,
            y: rect.y,
            width: Math.max(win.minWidth, rect.width),
            height: Math.max(win.minHeight, rect.height),
          };
        }
        return;
      }

      const clamped = clampWindowRectToViewport(
        win.x,
        win.y,
        win.width,
        win.height,
        win.minWidth,
        win.minHeight,
        viewport
      );

      if (
        clamped.x !== win.x ||
        clamped.y !== win.y ||
        clamped.width !== win.width ||
        clamped.height !== win.height
      ) {
        changed = true;
        updated[id] = {
          ...win,
          x: clamped.x,
          y: clamped.y,
          width: clamped.width,
          height: clamped.height,
        };
      }
    });

    if (changed) {
      set({ windows: updated });
    }
  },

  openSwitcher: (direction = 1) => {
    const state = get();
    const order = getSwitcherWindowOrder(state.windows);
    if (order.length === 0) return;

    playRetroSound('click', state.soundEnabled);
    if (!state.switcherOpen) {
      const initialIdx = order.length > 1 ? (direction === 1 ? 1 : order.length - 1) : 0;
      set({ switcherOpen: true, switcherIndex: initialIdx });
      return;
    }

    set({
      switcherIndex: cycleSwitcherIndex(state.switcherIndex, order.length, direction),
    });
  },

  stepSwitcher: (direction = 1) => {
    const state = get();
    if (!state.switcherOpen) return;
    const order = getSwitcherWindowOrder(state.windows);
    if (order.length === 0) {
      set({ switcherOpen: false, switcherIndex: 0 });
      return;
    }
    playRetroSound('click', state.soundEnabled);
    set({
      switcherIndex: cycleSwitcherIndex(state.switcherIndex, order.length, direction),
    });
  },

  selectSwitcherIndex: (index) => {
    const state = get();
    const order = getSwitcherWindowOrder(state.windows);
    if (index < 0 || index >= order.length) return;
    set({ switcherIndex: index });
  },

  commitSwitcher: () => {
    const state = get();
    if (!state.switcherOpen) return;
    const order = getSwitcherWindowOrder(state.windows);
    const chosen = order[state.switcherIndex] ?? order[0];
    set({ switcherOpen: false, switcherIndex: 0 });
    if (chosen) {
      playRetroSound('open', state.soundEnabled);
      get().focusWindow(chosen.id);
    }
  },

  cancelSwitcher: () => {
    if (!get().switcherOpen) return;
    set({ switcherOpen: false, switcherIndex: 0 });
  },

  emptyTrash: () => {
    playRetroSound('close', get().soundEnabled);
    set({ trashItems: [] });
  },

  restoreTrash: () => {
    playRetroSound('open', get().soundEnabled);
    set({ trashItems: [...TRASH_FILES] });
  },

  addSentMessage: (msg) => {
    playRetroSound('beep', get().soundEnabled);
    const now = new Date();
    const entry: SentMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      sentAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => ({ sentMessages: [entry, ...state.sentMessages] }));
    get().pushToast(SYSTEM_CHROME_COPY.toasts.noteQueued);
  },

  requestTerminalClear: () => {
    playRetroSound('click', get().soundEnabled);
    set((state) => ({ terminalClearSignal: state.terminalClearSignal + 1 }));
  },
}));

export function selectFocusedWindowId(windows: Record<WindowId, OSWindowState>): WindowId | null {
  return getFocusedWindowId(windows);
}
