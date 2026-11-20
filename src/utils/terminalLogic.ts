import { ABOUT_CONTENT, PROJECTS, SITE_META } from '../../data/content';
import type { WallpaperMode, WindowId } from './windowLogic';

export interface TerminalEntry {
  id: string;
  kind: 'input' | 'output' | 'error' | 'accent';
  text: string;
}

export interface TerminalCommandResult {
  lines: Array<{ kind: TerminalEntry['kind']; text: string }>;
  openWindow?: WindowId;
  setWallpaper?: WallpaperMode;
  clear?: boolean;
  triggerBsod?: boolean;
}

export const TERMINAL_COMMANDS = [
  'help',
  'whoami',
  'ls',
  'ls projects',
  'ls games',
  'open about',
  'open projects',
  'open games',
  'open snake',
  'open minesweeper',
  'open pong',
  'open tetris',
  'open paint',
  'open notes',
  'open resume',
  'open skills',
  'open contact',
  'open trash',
  'open orchestratorflow',
  'open gwen',
  'open mini-gpt',
  'open textile-defect',
  'open yolov8',
  'cat orchestratorflow',
  'cat gwen',
  'cat mini-gpt',
  'cat textile-defect',
  'cat yolov8',
  'wallpaper dither',
  'wallpaper dots',
  'wallpaper grid',
  'wallpaper diagonal',
  'contact',
  'uname',
  'date',
  'clear',
];

const OPEN_TARGET_MAP: Record<string, WindowId> = {
  about: 'about',
  'about me': 'about',
  'readme.txt': 'about',
  projects: 'projects',
  resume: 'resume',
  'resume.txt': 'resume',
  skills: 'skills',
  contact: 'contact',
  trash: 'trash',
  terminal: 'terminal',
  explorer: 'explorer',
  settings: 'settings',
  games: 'games',
  snake: 'game-snake',
  'snake.exe': 'game-snake',
  minesweeper: 'game-minesweeper',
  'minesweeper.exe': 'game-minesweeper',
  pong: 'game-pong',
  'pong.exe': 'game-pong',
  tetris: 'game-tetris',
  'tetris.exe': 'game-tetris',
  paint: 'paint',
  'paint.app': 'paint',
  notes: 'notes',
  'notes.txt': 'notes',
  orchestratorflow: 'project-orchestratorflow',
  'orchestratorflow.app': 'project-orchestratorflow',
  gwen: 'project-gwen',
  'gwen_rag.exe': 'project-gwen',
  'mini-gpt': 'project-minigpt',
  minigpt: 'project-minigpt',
  'minigpt.py': 'project-minigpt',
  'textile-defect': 'project-textile-defect',
  textile: 'project-textile-defect',
  'textile_defect.app': 'project-textile-defect',
  yolov8: 'project-yolov8',
  'yolo-custom-trainer': 'project-yolov8',
  'yolo-custom-trainer.app': 'project-yolov8',
};

const VALID_WALLPAPERS: WallpaperMode[] = ['dither', 'dots', 'grid', 'diagonal'];

/**
 * Pure terminal command evaluator. Decoupled from React/DOM for deterministic testing.
 */
export function executeTerminalCommand(rawInput: string, now: Date = new Date()): TerminalCommandResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { lines: [] };
  }

  const lower = trimmed.toLowerCase();
  const [cmd, ...rest] = lower.split(/\s+/);
  const arg = rest.join(' ').trim();

  if (cmd === 'clear' || cmd === 'cls') {
    return { lines: [], clear: true };
  }

  if (cmd === 'help' || cmd === '?') {
    return {
      lines: [
        { kind: 'accent', text: 'SHIVAMOS SHELL v7.96 — AVAILABLE COMMANDS:' },
        { kind: 'output', text: '  help                   Show this command reference' },
        { kind: 'output', text: '  whoami                 Print engineer profile' },
        { kind: 'output', text: '  ls [projects|games]    List desktop items, projects, or games' },
        { kind: 'output', text: '  open <target>          Launch app/game (resume, snake, tetris, minesweeper, pong, paint, notes...)' },
        { kind: 'output', text: '  cat <project>          Print quick summary (yolov8, mini-gpt, gwen)' },
        { kind: 'output', text: '  wallpaper <pattern>    Switch desktop pattern (dither, dots, grid, diagonal)' },
        { kind: 'output', text: '  contact                Print direct email and links' },
        { kind: 'output', text: '  uname / date / clear   System info or clear screen' },
      ],
    };
  }

  if (cmd === 'whoami') {
    return {
      lines: [
        { kind: 'accent', text: `${SITE_META.ownerName.toLowerCase().replace(/\s+/g, '')}@ghaziabad-workstation` },
        { kind: 'output', text: `${ABOUT_CONTENT.subline}` },
        { kind: 'output', text: 'Focus: Custom ML models end to end (dataset -> train -> eval -> deploy).' },
      ],
    };
  }

  if (cmd === 'ls') {
    if (!arg || arg === '.' || arg === 'desktop') {
      return {
        lines: [
          { kind: 'output', text: 'drwx  About_Me/        Projects/        Games/' },
          { kind: 'output', text: '-rw-  Resume.txt       Skills.sys       Contact.msg' },
          { kind: 'output', text: '-rwx  Paint.app        Notes.txt        terminal.exe' },
          { kind: 'output', text: 'drwx  Trash/' },
          { kind: 'accent', text: 'Tip: run "ls projects", "ls games", or "open snake".' },
        ],
      };
    }

    if (arg === 'projects' || arg === './projects' || arg === '/projects') {
      return {
        lines: [
          { kind: 'accent', text: 'Directory of C:\\SHIVAM\\PROJECTS' },
          ...PROJECTS.map((p) => ({
            kind: 'output' as const,
            text: `  ${p.fileName.padEnd(26, ' ')}${p.resultMetric ? ` [${p.resultMetric}]` : ''}`,
          })),
          {
            kind: 'output',
            text: 'Run "open orchestratorflow", "open gwen", "open minigpt", "open textile-defect", or "open yolov8".',
          },
        ],
      };
    }

    if (arg === 'games' || arg === './games' || arg === '/games') {
      return {
        lines: [
          { kind: 'accent', text: 'Directory of C:\\SHIVAM\\GAMES' },
          { kind: 'output', text: '  snake.exe              128 KB   [CRT Pixel Snake]' },
          { kind: 'output', text: '  tetris.exe             156 KB   [Retro 10x20 Block Stacker]' },
          { kind: 'output', text: '  minesweeper.exe        164 KB   [Classic 90s Mine Field]' },
          { kind: 'output', text: '  pong.exe               142 KB   [1P vs Neural CPU Pong]' },
          { kind: 'output', text: 'Run "open snake", "open tetris", "open minesweeper", or "open pong" to play.' },
        ],
      };
    }

    return {
      lines: [{ kind: 'error', text: `ls: cannot access '${arg}': No such file or directory` }],
    };
  }

  if (cmd === 'open') {
    if (!arg) {
      return {
        lines: [
          { kind: 'error', text: 'Usage: open <about|projects|games|snake|tetris|minesweeper|pong|paint|notes|resume|skills|contact>' },
        ],
      };
    }

    const windowId = OPEN_TARGET_MAP[arg];
    if (windowId) {
      return {
        lines: [{ kind: 'accent', text: `Launching ${arg}... window focused.` }],
        openWindow: windowId,
      };
    }

    return {
      lines: [{ kind: 'error', text: `open: unknown target '${arg}'. Run 'help' for valid targets.` }],
    };
  }

  if (cmd === 'wallpaper') {
    if (VALID_WALLPAPERS.includes(arg as WallpaperMode)) {
      return {
        lines: [{ kind: 'accent', text: `Desktop wallpaper set to "${arg}".` }],
        setWallpaper: arg as WallpaperMode,
      };
    }
    return {
      lines: [{ kind: 'error', text: 'Usage: wallpaper <dither|dots|grid|diagonal>' }],
    };
  }

  if (cmd === 'cat') {
    const aliasMap: Record<string, string> = {
      yolov8: 'yolo-custom-trainer',
      'mini-gpt': 'minigpt',
      'textile-defect': 'textile-defect-detection',
      textile: 'textile-defect-detection',
    };
    const lookup = aliasMap[arg] ?? arg;
    const project = PROJECTS.find(
      (p) => p.slug === lookup || p.fileName.toLowerCase() === arg
    );
    if (project) {
      const catLines: Array<{ kind: TerminalEntry['kind']; text: string }> = [
        { kind: 'accent', text: `=== ${project.headline} ===` },
        { kind: 'output', text: `Problem: ${project.problem}` },
      ];
      if (project.resultMetric) {
        catLines.push({ kind: 'output', text: `Result:  ${project.resultMetric}` });
      }
      catLines.push({ kind: 'output', text: `Stack:   ${project.stack.join(', ')}` });
      return { lines: catLines };
    }
    return {
      lines: [
        {
          kind: 'error',
          text: `cat: '${arg || '(empty)'}' not found. Try: cat orchestratorflow, cat gwen, cat minigpt, cat textile-defect, cat yolov8`,
        },
      ],
    };
  }

  if (cmd === 'contact') {
    const contactLines: Array<{ kind: TerminalEntry['kind']; text: string }> = [
      { kind: 'accent', text: 'DIRECT CONTACT CHANNELS:' },
    ];
    if (SITE_META.email) {
      contactLines.push({ kind: 'output', text: `  Email:    ${SITE_META.email}` });
    }
    if (SITE_META.websiteUrl) {
      contactLines.push({ kind: 'output', text: `  Website:  ${SITE_META.websiteUrl}` });
    }
    contactLines.push(
      { kind: 'output', text: `  GitHub:   ${SITE_META.githubUrl}` },
      { kind: 'output', text: `  LinkedIn: ${SITE_META.linkedinUrl}` },
      { kind: 'output', text: `  Location: ${SITE_META.location}` },
      { kind: 'output', text: 'Opening Contact window...' }
    );
    return {
      lines: contactLines,
      openWindow: 'contact',
    };
  }

  if (cmd === 'uname') {
    return {
      lines: [{ kind: 'output', text: 'ShivamOS 7.96.0 x86_64 ML-Kernel (Ghaziabad Build)' }],
    };
  }

  if (cmd === 'date') {
    return {
      lines: [{ kind: 'output', text: now.toUTCString() }],
    };
  }

  if (cmd === 'bsod' || (cmd === 'sudo' && arg.startsWith('rm'))) {
    return {
      lines: [{ kind: 'error', text: 'KERNEL PANIC: triggering system halt...' }],
      triggerBsod: true,
    };
  }

  return {
    lines: [
      { kind: 'error', text: `Command not found: '${trimmed}'. Type 'help' to see available commands.` },
    ],
  };
}

/**
 * Tab autocomplete helper for terminal input.
 */
export function autocompleteTerminalInput(current: string): string {
  const lower = current.trimStart().toLowerCase();
  if (!lower) return current;
  const match = TERMINAL_COMMANDS.find((c) => c.startsWith(lower));
  return match ?? current;
}

/**
 * Pure arrow-key command history navigation helper.
 */
export function navigateHistory(
  history: string[],
  currentIndex: number,
  direction: 'up' | 'down'
): { nextIndex: number; value: string } {
  if (history.length === 0) {
    return { nextIndex: -1, value: '' };
  }

  if (direction === 'up') {
    const nextIndex =
      currentIndex === -1 ? history.length - 1 : Math.max(0, currentIndex - 1);
    return { nextIndex, value: history[nextIndex] };
  }

  if (currentIndex === -1) {
    return { nextIndex: -1, value: '' };
  }

  const nextIndex = currentIndex + 1;
  if (nextIndex >= history.length) {
    return { nextIndex: -1, value: '' };
  }

  return { nextIndex, value: history[nextIndex] };
}
