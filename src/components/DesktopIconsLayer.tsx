import React, { useEffect, useRef, useState } from 'react';
import {
  DESKTOP_ICON_LABELS,
  SYSTEM_CHROME_COPY,
  WINDOW_MANAGER_COPY,
} from '../../data/content';
import { useWindowStore } from '../store/windowStore';
import {
  ALL_DESKTOP_ICON_IDS,
  ICON_HEIGHT,
  ICON_WIDTH,
  type CustomDesktopFolder,
  type DesktopIconId,
  type Point,
} from '../utils/desktopLogic';
import type { ViewportSize } from '../utils/windowLogic';
import {
  AboutPixelIcon,
  ContactPixelIcon,
  DocumentPixelIcon,
  FolderPixelIcon,
  GamesPixelIcon,
  NotesPixelIcon,
  PaintPixelIcon,
  SkillsPixelIcon,
  TerminalPixelIcon,
  TrashPixelIcon,
} from './PixelIcons';

export function renderDesktopIconGraphic(
  id: DesktopIconId,
  isTrashEmpty: boolean,
  size = 36
): React.ReactNode {
  switch (id) {
    case 'about':
      return <AboutPixelIcon size={size} />;
    case 'projects':
      return <FolderPixelIcon size={size} />;
    case 'resume':
      return <DocumentPixelIcon size={size} />;
    case 'skills':
      return <SkillsPixelIcon size={size} />;
    case 'contact':
      return <ContactPixelIcon size={size} />;
    case 'terminal':
      return <TerminalPixelIcon size={size} />;
    case 'games':
      return <GamesPixelIcon size={size} />;
    case 'paint':
      return <PaintPixelIcon size={size} />;
    case 'notes':
      return <NotesPixelIcon size={size} />;
    case 'trash':
      return <TrashPixelIcon size={size} isEmpty={isTrashEmpty} />;
  }
}

export type IconContextTarget =
  | { kind: 'desktop-icon'; iconId: DesktopIconId }
  | { kind: 'custom-folder'; folderId: string };

interface DesktopIconsLayerProps {
  viewport: ViewportSize;
  isTrashEmpty: boolean;
  onDismissContextMenu: () => void;
  onIconContextMenu: (target: IconContextTarget, clientX: number, clientY: number) => void;
}

const DRAG_THRESHOLD_PX = 4;

function InlineRenameInput({
  initialValue,
  onCommit,
  onCancel,
}: {
  initialValue: string;
  onCommit: (nextValue: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      data-testid="icon-rename-input"
      aria-label="Rename icon"
      value={draft}
      maxLength={24}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          onCommit(draft);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
      className="w-full px-1 py-0.5 text-[11px] font-bold text-center bg-[#F4EFE0] text-[#1A1A1A] border-2 border-[#E4572E] outline-none"
    />
  );
}

export function DesktopIconsLayer({
  viewport,
  isTrashEmpty,
  onDismissContextMenu,
  onIconContextMenu,
}: DesktopIconsLayerProps) {
  const iconPositions = useWindowStore((s) => s.iconPositions);
  const selectedIconIds = useWindowStore((s) => s.selectedIconIds);
  const selectedFolderIds = useWindowStore((s) => s.selectedFolderIds);
  const customIconLabels = useWindowStore((s) => s.customIconLabels);
  const customFolders = useWindowStore((s) => s.customFolders);
  const renamingId = useWindowStore((s) => s.renamingId);
  const refreshTick = useWindowStore((s) => s.refreshTick);

  const selectIcons = useWindowStore((s) => s.selectIcons);
  const toggleSelectIcon = useWindowStore((s) => s.toggleSelectIcon);
  const selectFolder = useWindowStore((s) => s.selectFolder);
  const moveDesktopIcons = useWindowStore((s) => s.moveDesktopIcons);
  const moveCustomFolder = useWindowStore((s) => s.moveCustomFolder);
  const startRenaming = useWindowStore((s) => s.startRenaming);
  const commitRename = useWindowStore((s) => s.commitRename);
  const cancelRenaming = useWindowStore((s) => s.cancelRenaming);
  const openWindow = useWindowStore((s) => s.openWindow);
  const pushToast = useWindowStore((s) => s.pushToast);

  const [draggingIds, setDraggingIds] = useState<string[]>([]);
  const buttonRefs = useRef<Partial<Record<DesktopIconId, HTMLButtonElement | null>>>({});

  const dragRef = useRef<{
    kind: 'icon';
    primaryId: DesktopIconId;
    pointerX: number;
    pointerY: number;
    origins: Partial<Record<DesktopIconId, Point>>;
    hasMoved: boolean;
  } | null>(null);

  const folderDragRef = useRef<{
    folderId: string;
    pointerX: number;
    pointerY: number;
    origin: Point;
    hasMoved: boolean;
  } | null>(null);

  const handlePointerDown = (id: DesktopIconId, e: React.PointerEvent<HTMLButtonElement>) => {
    if (renamingId === id) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    onDismissContextMenu();

    const isModifier = e.shiftKey || e.ctrlKey || e.metaKey;
    let activeSelection: DesktopIconId[];

    if (isModifier) {
      toggleSelectIcon(id);
      const alreadySelected = selectedIconIds.includes(id);
      activeSelection = alreadySelected
        ? selectedIconIds.filter((item) => item !== id)
        : [...selectedIconIds, id];
    } else if (selectedIconIds.includes(id)) {
      activeSelection = selectedIconIds;
    } else {
      selectIcons([id], []);
      activeSelection = [id];
    }

    const draggedGroup = activeSelection.includes(id) ? activeSelection : [id];
    const origins: Partial<Record<DesktopIconId, Point>> = {};
    draggedGroup.forEach((iconId) => {
      origins[iconId] = { ...iconPositions[iconId] };
    });

    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      kind: 'icon',
      primaryId: id,
      pointerX: e.clientX,
      pointerY: e.clientY,
      origins,
      hasMoved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.pointerX;
    const dy = e.clientY - drag.pointerY;

    if (!drag.hasMoved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
      return;
    }

    if (!drag.hasMoved) {
      drag.hasMoved = true;
      setDraggingIds(Object.keys(drag.origins));
    }

    const updates: Partial<Record<DesktopIconId, Point>> = {};
    (Object.keys(drag.origins) as DesktopIconId[]).forEach((iconId) => {
      const origin = drag.origins[iconId]!;
      updates[iconId] = { x: origin.x + dx, y: origin.y + dy };
    });
    moveDesktopIcons(updates, viewport, false);
  };

  const finishDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDraggingIds([]);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (drag.hasMoved) {
      const dx = e.clientX - drag.pointerX;
      const dy = e.clientY - drag.pointerY;
      const updates: Partial<Record<DesktopIconId, Point>> = {};
      (Object.keys(drag.origins) as DesktopIconId[]).forEach((iconId) => {
        const origin = drag.origins[iconId]!;
        updates[iconId] = { x: origin.x + dx, y: origin.y + dy };
      });
      moveDesktopIcons(updates, viewport, true);
    }
  };

  const handleFolderPointerDown = (
    folder: CustomDesktopFolder,
    e: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (renamingId === folder.id) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    onDismissContextMenu();
    selectFolder(folder.id);

    e.currentTarget.setPointerCapture(e.pointerId);
    folderDragRef.current = {
      folderId: folder.id,
      pointerX: e.clientX,
      pointerY: e.clientY,
      origin: { x: folder.x, y: folder.y },
      hasMoved: false,
    };
  };

  const handleFolderPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = folderDragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.pointerX;
    const dy = e.clientY - drag.pointerY;
    if (!drag.hasMoved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    if (!drag.hasMoved) {
      drag.hasMoved = true;
      setDraggingIds([drag.folderId]);
    }
    moveCustomFolder(drag.folderId, drag.origin.x + dx, drag.origin.y + dy, viewport, false);
  };

  const finishFolderDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = folderDragRef.current;
    if (!drag) return;
    folderDragRef.current = null;
    setDraggingIds([]);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (drag.hasMoved) {
      const dx = e.clientX - drag.pointerX;
      const dy = e.clientY - drag.pointerY;
      moveCustomFolder(drag.folderId, drag.origin.x + dx, drag.origin.y + dy, viewport, true);
    }
  };

  const handleIconKeyDown = (id: DesktopIconId, e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (renamingId === id) return;
    if (e.key === 'F2') {
      e.preventDefault();
      e.stopPropagation();
      startRenaming(id);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      openWindow(id, viewport);
      return;
    }

    const idx = ALL_DESKTOP_ICON_IDS.indexOf(id);
    if (idx === -1) return;

    let nextIdx: number | null = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      nextIdx = (idx + 1) % ALL_DESKTOP_ICON_IDS.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      nextIdx = (idx - 1 + ALL_DESKTOP_ICON_IDS.length) % ALL_DESKTOP_ICON_IDS.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = ALL_DESKTOP_ICON_IDS.length - 1;
    }

    if (nextIdx !== null) {
      e.preventDefault();
      const nextId = ALL_DESKTOP_ICON_IDS[nextIdx];
      selectIcons([nextId], []);
      buttonRefs.current[nextId]?.focus();
    }
  };

  return (
    <nav
      key={`icons-refresh-${refreshTick}`}
      aria-label="Desktop icons"
      className={`no-print ${refreshTick > 0 ? 'animate-desktop-refresh' : ''}`}
    >
      {ALL_DESKTOP_ICON_IDS.map((id) => {
        const pos = iconPositions[id];
        const isSelected = selectedIconIds.includes(id);
        const isDragging = draggingIds.includes(id);
        const isRenaming = renamingId === id;
        const label = customIconLabels[id] ?? DESKTOP_ICON_LABELS[id];

        return (
          <button
            key={id}
            ref={(el) => {
              buttonRefs.current[id] = el;
            }}
            type="button"
            data-icon-id={id}
            data-selected={isSelected ? 'true' : 'false'}
            aria-label={`${label} icon`}
            title={`${label} — ${WINDOW_MANAGER_COPY.iconDoubleClickHint}`}
            onPointerDown={(e) => handlePointerDown(id, e)}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onDoubleClick={(e) => {
              if (isRenaming) return;
              e.stopPropagation();
              onDismissContextMenu();
              openWindow(id, viewport);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              selectIcons([id], []);
              onIconContextMenu({ kind: 'desktop-icon', iconId: id }, e.clientX, e.clientY);
            }}
            onKeyDown={(e) => handleIconKeyDown(id, e)}
            style={{
              position: 'absolute',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              width: `${ICON_WIDTH}px`,
              height: `${ICON_HEIGHT}px`,
              zIndex: isDragging ? 25 : 10,
            }}
            className="group flex flex-col items-center justify-start gap-1.5 px-0.5 py-1.5 text-center select-none touch-none focus-visible:outline-2 focus-visible:outline-[#E4572E]"
          >
            <span
              className={`p-1.5 border-2 transition-none ${
                isSelected
                  ? 'border-[#1A1A1A] bg-[#F4EFE0] shadow-[2px_2px_0_0_#1A1A1A]'
                  : 'border-transparent bg-transparent group-hover:border-[#1A1A1A] group-hover:bg-[#F4EFE0]/80'
              }`}
            >
              {renderDesktopIconGraphic(id, isTrashEmpty, 36)}
            </span>
            {isRenaming ? (
              <InlineRenameInput
                initialValue={label}
                onCommit={(nextVal) => commitRename(id, nextVal)}
                onCancel={cancelRenaming}
              />
            ) : (
              <span
                className={`px-1 py-0.5 text-[11px] font-bold leading-tight whitespace-nowrap max-w-full truncate ${
                  isSelected
                    ? 'bg-[#1A1A1A] text-[#F4EFE0]'
                    : 'bg-[#E8E0C8]/95 text-[#1A1A1A] group-hover:bg-[#1A1A1A] group-hover:text-[#F4EFE0]'
                }`}
              >
                {label}
              </span>
            )}
          </button>
        );
      })}

      {/* User-Created Visual Desktop Folders */}
      {customFolders.map((folder) => {
        const isSelected = selectedFolderIds.includes(folder.id);
        const isDragging = draggingIds.includes(folder.id);
        const isRenaming = renamingId === folder.id;

        return (
          <button
            key={folder.id}
            type="button"
            data-custom-folder-id={folder.id}
            data-selected={isSelected ? 'true' : 'false'}
            aria-label={`${folder.name} folder`}
            title={`${folder.name} — ${WINDOW_MANAGER_COPY.iconDoubleClickHint}`}
            onPointerDown={(e) => handleFolderPointerDown(folder, e)}
            onPointerMove={handleFolderPointerMove}
            onPointerUp={finishFolderDrag}
            onPointerCancel={finishFolderDrag}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
              if (isRenaming) return;
              e.stopPropagation();
              onDismissContextMenu();
              pushToast(SYSTEM_CHROME_COPY.toasts.customFolderEmpty);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              selectFolder(folder.id);
              onIconContextMenu({ kind: 'custom-folder', folderId: folder.id }, e.clientX, e.clientY);
            }}
            onKeyDown={(e) => {
              if (isRenaming) return;
              if (e.key === 'F2') {
                e.preventDefault();
                startRenaming(folder.id);
              } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                pushToast(SYSTEM_CHROME_COPY.toasts.customFolderEmpty);
              }
            }}
            style={{
              position: 'absolute',
              left: `${folder.x}px`,
              top: `${folder.y}px`,
              width: `${ICON_WIDTH}px`,
              height: `${ICON_HEIGHT}px`,
              zIndex: isDragging ? 25 : 10,
            }}
            className="group flex flex-col items-center justify-start gap-1.5 px-0.5 py-1.5 text-center select-none touch-none focus-visible:outline-2 focus-visible:outline-[#E4572E]"
          >
            <span
              className={`p-1.5 border-2 transition-none ${
                isSelected
                  ? 'border-[#1A1A1A] bg-[#F4EFE0] shadow-[2px_2px_0_0_#1A1A1A]'
                  : 'border-transparent bg-transparent group-hover:border-[#1A1A1A] group-hover:bg-[#F4EFE0]/80'
              }`}
            >
              <FolderPixelIcon size={36} />
            </span>
            {isRenaming ? (
              <InlineRenameInput
                initialValue={folder.name}
                onCommit={(nextVal) => commitRename(folder.id, nextVal)}
                onCancel={cancelRenaming}
              />
            ) : (
              <span
                className={`px-1 py-0.5 text-[11px] font-bold leading-tight whitespace-nowrap max-w-full truncate ${
                  isSelected
                    ? 'bg-[#1A1A1A] text-[#F4EFE0]'
                    : 'bg-[#E8E0C8]/95 text-[#1A1A1A] group-hover:bg-[#1A1A1A] group-hover:text-[#F4EFE0]'
                }`}
              >
                {folder.name}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
