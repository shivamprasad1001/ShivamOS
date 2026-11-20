import {
  CERTIFICATES_DATA,
  DESKTOP_ICON_LABELS,
  PROJECTS,
  RESUME_DATA,
  SITE_META,
  SYSTEM_CHROME_COPY,
  type CertificateItem,
  type ProjectItem,
} from '../../data/content';
import type { CustomDesktopFolder, DesktopIconId, StorageLike } from './desktopLogic';
import type { WallpaperMode, WindowId } from './windowLogic';

export type PowerState = 'booting' | 'locked' | 'desktop' | 'shutting-down' | 'off';

export type ExplorerNodeId = 'projects' | 'resume' | 'contact' | 'certificates';

export const EXPLORER_NODE_ORDER: ExplorerNodeId[] = [
  'projects',
  'resume',
  'contact',
  'certificates',
];

export const SETTINGS_STORAGE_KEY = 'shivamos_settings_v1';
export const TOAST_DURATION_MS = 3000;
export const TOAST_EXIT_MS = 120;

export interface SystemSettings {
  wallpaper: WallpaperMode;
  soundEnabled: boolean;
  crtEnabled: boolean;
  reduceMotion: boolean;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  wallpaper: 'dither',
  soundEnabled: false,
  crtEnabled: false,
  reduceMotion: false,
};

const VALID_WALLPAPERS = new Set<WallpaperMode>(['dither', 'dots', 'grid', 'diagonal']);

function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

export function detectSystemReducedMotion(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    return false;
  }
}

/**
 * Load persisted OS settings from localStorage (wrapped in try/catch).
 */
export function loadSystemSettings(
  storage: StorageLike | null = getBrowserStorage(),
  fallbackReduceMotion: boolean = detectSystemReducedMotion()
): SystemSettings {
  const defaults: SystemSettings = {
    ...DEFAULT_SYSTEM_SETTINGS,
    reduceMotion: fallbackReduceMotion,
  };
  if (!storage) return defaults;

  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;

    const record = parsed as Record<string, unknown>;
    return {
      wallpaper:
        typeof record.wallpaper === 'string' && VALID_WALLPAPERS.has(record.wallpaper as WallpaperMode)
          ? (record.wallpaper as WallpaperMode)
          : defaults.wallpaper,
      soundEnabled:
        typeof record.soundEnabled === 'boolean' ? record.soundEnabled : defaults.soundEnabled,
      crtEnabled: typeof record.crtEnabled === 'boolean' ? record.crtEnabled : defaults.crtEnabled,
      reduceMotion:
        typeof record.reduceMotion === 'boolean' ? record.reduceMotion : defaults.reduceMotion,
    };
  } catch {
    return defaults;
  }
}

/**
 * Persist OS settings to localStorage (wrapped in try/catch).
 */
export function saveSystemSettings(
  settings: SystemSettings,
  storage: StorageLike | null = getBrowserStorage()
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

/**
 * Maintain a deduplicated MRU list of recently opened windows for the Start menu.
 */
export function pushRecentWindow(
  recent: WindowId[],
  id: WindowId,
  maxItems: number = 5
): WindowId[] {
  const filtered = recent.filter((item) => item !== id);
  return [id, ...filtered].slice(0, Math.max(1, maxItems));
}

export interface ExplorerEntry {
  id: string;
  name: string;
  type: string;
  detail?: string;
  iconKind:
    | 'agent'
    | 'vision'
    | 'detector'
    | 'transformer'
    | 'rag'
    | 'document'
    | 'contact'
    | 'certificate'
    | 'link';
  action:
    | { kind: 'window'; windowId: WindowId }
    | { kind: 'external'; url: string }
    | { kind: 'properties'; target: PropertiesTarget };
  propertiesTarget: PropertiesTarget;
}

export type PropertiesTarget =
  | { kind: 'project'; projectId: ProjectItem['id'] }
  | { kind: 'desktop-icon'; iconId: DesktopIconId }
  | { kind: 'custom-folder'; folderId: string }
  | { kind: 'resume' }
  | { kind: 'certificate'; certId: CertificateItem['id'] };

export interface ResolvedProperties {
  title: string;
  name: string;
  type: string;
  location: string;
  /** Omitted when empty (no fabricated dates) */
  modifiedDate?: string;
  repoUrl?: string;
  stack?: string[];
  status?: string;
  summary?: string;
  iconKind:
    | 'agent'
    | 'vision'
    | 'detector'
    | 'transformer'
    | 'rag'
    | 'document'
    | 'folder'
    | 'certificate'
    | DesktopIconId;
}

export function getExplorerPath(node: ExplorerNodeId): string {
  return SYSTEM_CHROME_COPY.explorer.nodes[node].path;
}

/**
 * Return verified File Explorer entries for a given directory node from data/content.ts.
 * Contains zero fake files.
 */
export function getExplorerItems(node: ExplorerNodeId): ExplorerEntry[] {
  if (node === 'projects') {
    return PROJECTS.map((project) => ({
      id: project.id,
      name: project.fileName,
      type: project.windowKind === 'program' ? 'Program' : 'Document',
      detail: project.resultMetric || undefined,
      iconKind: project.iconType,
      action: { kind: 'window', windowId: project.id },
      propertiesTarget: { kind: 'project', projectId: project.id },
    }));
  }

  if (node === 'resume') {
    return [
      {
        id: 'resume-txt',
        name: RESUME_DATA.fileName,
        type: 'Text Document',
        detail: RESUME_DATA.header.title,
        iconKind: 'document',
        action: { kind: 'window', windowId: 'resume' },
        propertiesTarget: { kind: 'resume' },
      },
      {
        id: 'resume-pdf',
        name: 'resume.pdf',
        type: 'PDF Link (GitHub)',
        detail: SITE_META.resumePdfUrl,
        iconKind: 'document',
        action: { kind: 'external', url: SITE_META.resumePdfUrl },
        propertiesTarget: { kind: 'resume' },
      },
    ];
  }

  if (node === 'contact') {
    const entries: ExplorerEntry[] = [
      {
        id: 'contact-composer',
        name: 'Mail Composer',
        type: 'Application',
        detail: `${SITE_META.email} · ${SITE_META.location}`,
        iconKind: 'contact',
        action: { kind: 'window', windowId: 'contact' },
        propertiesTarget: { kind: 'desktop-icon', iconId: 'contact' },
      },
      {
        id: 'contact-website',
        name: 'Website.url',
        type: 'Internet Shortcut',
        detail: SITE_META.websiteUrl,
        iconKind: 'link',
        action: { kind: 'external', url: SITE_META.websiteUrl },
        propertiesTarget: { kind: 'desktop-icon', iconId: 'contact' },
      },
      {
        id: 'contact-github',
        name: 'GitHub.url',
        type: 'Internet Shortcut',
        detail: SITE_META.githubUrl,
        iconKind: 'link',
        action: { kind: 'external', url: SITE_META.githubUrl },
        propertiesTarget: { kind: 'desktop-icon', iconId: 'contact' },
      },
      {
        id: 'contact-linkedin',
        name: 'LinkedIn.url',
        type: 'Internet Shortcut',
        detail: SITE_META.linkedinUrl,
        iconKind: 'link',
        action: { kind: 'external', url: SITE_META.linkedinUrl },
        propertiesTarget: { kind: 'desktop-icon', iconId: 'contact' },
      },
    ];
    return entries;
  }

  return CERTIFICATES_DATA.map((cert) => ({
    id: cert.id,
    name: cert.fileName,
    type: 'Certificate Record',
    detail: `${cert.issuer} · ${cert.period}`,
    iconKind: 'certificate',
    action: { kind: 'properties', target: { kind: 'certificate', certId: cert.id } },
    propertiesTarget: { kind: 'certificate', certId: cert.id },
  }));
}

/**
 * Resolve verified property metadata for the Properties dialog.
 * Size is omitted unless real; modifiedDate is omitted unless provided in data/content.ts.
 */
export function resolveProperties(
  target: PropertiesTarget,
  customLabels: Partial<Record<DesktopIconId, string>> = {},
  customFolders: CustomDesktopFolder[] = []
): ResolvedProperties | null {
  if (target.kind === 'project') {
    const project = PROJECTS.find((p) => p.id === target.projectId);
    if (!project) return null;
    return {
      title: `${project.fileName} — ${SYSTEM_CHROME_COPY.properties.titleSuffix}`,
      name: project.fileName,
      type: project.windowKind === 'program' ? 'Project Program' : 'Project Document',
      location: SYSTEM_CHROME_COPY.explorer.nodes.projects.path,
      modifiedDate: project.modifiedDate || undefined,
      repoUrl: project.links.github || undefined,
      stack: project.stack,
      status: project.resultMetric || undefined,
      summary: project.headline,
      iconKind: project.iconType,
    };
  }

  if (target.kind === 'resume') {
    return {
      title: `${RESUME_DATA.fileName} — ${SYSTEM_CHROME_COPY.properties.titleSuffix}`,
      name: RESUME_DATA.fileName,
      type: 'Plain Text Document',
      location: SYSTEM_CHROME_COPY.explorer.nodes.resume.path,
      summary: RESUME_DATA.summary,
      iconKind: 'document',
    };
  }

  if (target.kind === 'certificate') {
    const cert = CERTIFICATES_DATA.find((c) => c.id === target.certId);
    if (!cert) return null;
    return {
      title: `${cert.fileName} — ${SYSTEM_CHROME_COPY.properties.titleSuffix}`,
      name: cert.fileName,
      type: 'Traineeship Certificate',
      location: SYSTEM_CHROME_COPY.explorer.nodes.certificates.path,
      status: `${cert.issuer} · ${cert.period}${cert.grade ? ` (${cert.grade})` : ''}`,
      summary: cert.summary,
      iconKind: 'certificate',
    };
  }

  if (target.kind === 'custom-folder') {
    const folder = customFolders.find((f) => f.id === target.folderId);
    if (!folder) return null;
    return {
      title: `${folder.name} — ${SYSTEM_CHROME_COPY.properties.titleSuffix}`,
      name: folder.name,
      type: 'Desktop Folder',
      location: 'C:\\SHIVAM\\DESKTOP',
      summary: SYSTEM_CHROME_COPY.toasts.customFolderEmpty,
      iconKind: 'folder',
    };
  }

  const label = customLabels[target.iconId] ?? DESKTOP_ICON_LABELS[target.iconId];
  const typeMap: Record<DesktopIconId, string> = {
    about: 'System Document',
    projects: 'File Folder',
    resume: 'Text Document',
    skills: 'System Profiler',
    contact: 'Mail Application',
    terminal: 'Command Shell',
    games: 'Application Folder',
    paint: 'Graphics Application',
    notes: 'Text Editor',
    trash: 'System Folder',
  };

  return {
    title: `${label} — ${SYSTEM_CHROME_COPY.properties.titleSuffix}`,
    name: label,
    type: typeMap[target.iconId],
    location: 'C:\\SHIVAM\\DESKTOP',
    iconKind: target.iconId,
  };
}
