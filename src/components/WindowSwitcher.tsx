import React from 'react';
import { WINDOW_MANAGER_COPY } from '../../data/content';
import { useWindowStore } from '../store/windowStore';
import { getSwitcherWindowOrder, type WindowId } from '../utils/windowLogic';
import {
  AboutPixelIcon,
  ContactPixelIcon,
  DocumentPixelIcon,
  ExplorerPixelIcon,
  FolderPixelIcon,
  GamesPixelIcon,
  MinePixelIcon,
  NotesPixelIcon,
  PaintPixelIcon,
  PongPixelIcon,
  ProjectFilePixelIcon,
  SettingsPixelIcon,
  SkillsPixelIcon,
  SnakePixelIcon,
  TerminalPixelIcon,
  TetrisPixelIcon,
  TrashPixelIcon,
} from './PixelIcons';

export function renderWindowIcon(id: WindowId, isTrashEmpty: boolean, size = 24): React.ReactNode {
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
    case 'trash':
      return <TrashPixelIcon size={size} isEmpty={isTrashEmpty} />;
    case 'games':
      return <GamesPixelIcon size={size} />;
    case 'game-snake':
      return <SnakePixelIcon size={size} />;
    case 'game-tetris':
      return <TetrisPixelIcon size={size} />;
    case 'game-minesweeper':
      return <MinePixelIcon size={size} />;
    case 'game-pong':
      return <PongPixelIcon size={size} />;
    case 'paint':
      return <PaintPixelIcon size={size} />;
    case 'notes':
      return <NotesPixelIcon size={size} />;
    case 'project-orchestratorflow':
      return <ProjectFilePixelIcon type="agent" size={size} />;
    case 'project-gwen':
      return <ProjectFilePixelIcon type="rag" size={size} />;
    case 'project-minigpt':
      return <ProjectFilePixelIcon type="transformer" size={size} />;
    case 'project-textile-defect':
      return <ProjectFilePixelIcon type="vision" size={size} />;
    case 'project-yolov8':
      return <ProjectFilePixelIcon type="detector" size={size} />;
    case 'explorer':
      return <ExplorerPixelIcon size={size} />;
    case 'settings':
      return <SettingsPixelIcon size={size} />;
  }
}

export function WindowSwitcher() {
  const switcherOpen = useWindowStore((s) => s.switcherOpen);
  const switcherIndex = useWindowStore((s) => s.switcherIndex);
  const windows = useWindowStore((s) => s.windows);
  const trashItems = useWindowStore((s) => s.trashItems);
  const selectSwitcherIndex = useWindowStore((s) => s.selectSwitcherIndex);
  const commitSwitcher = useWindowStore((s) => s.commitSwitcher);
  const cancelSwitcher = useWindowStore((s) => s.cancelSwitcher);

  if (!switcherOpen) return null;

  const order = getSwitcherWindowOrder(windows);
  const activeIdx = Math.min(Math.max(switcherIndex, 0), Math.max(0, order.length - 1));
  const activeWin = order[activeIdx];
  const isTrashEmpty = trashItems.length === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={WINDOW_MANAGER_COPY.switcherTitle}
      data-testid="window-switcher"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          cancelSwitcher();
        }
      }}
      className="no-print fixed inset-0 z-[80] flex items-center justify-center bg-[#1A1A1A]/25 p-4"
    >
      <div className="os-window animate-window-open w-full max-w-xl bg-[#F4EFE0] border-2 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A]">
        {/* Header bar */}
        <div className="h-8 px-3 bg-[#1A1A1A] text-[#F4EFE0] flex items-center justify-between border-b-2 border-[#1A1A1A]">
          <span className="text-xs tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            {WINDOW_MANAGER_COPY.switcherTitle}
          </span>
          <span className="text-[11px] font-bold text-[#E8E0C8]">
            {WINDOW_MANAGER_COPY.switcherShortcutLabel}
          </span>
        </div>

        {/* Window list */}
        <div className="p-3">
          {order.length === 0 ? (
            <p className="text-xs text-center py-6 m-0 text-[#4A463B]">
              {WINDOW_MANAGER_COPY.switcherEmpty}
            </p>
          ) : (
            <div role="listbox" aria-label={WINDOW_MANAGER_COPY.switcherTitle} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {order.map((win, idx) => {
                const isSelected = idx === activeIdx;
                return (
                  <button
                    key={win.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-switcher-id={win.id}
                    onMouseEnter={() => selectSwitcherIndex(idx)}
                    onClick={() => {
                      selectSwitcherIndex(idx);
                      commitSwitcher();
                    }}
                    className={`flex items-center gap-2 p-2 border-2 text-left transition-none ${
                      isSelected
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-[#F4EFE0] shadow-[2px_2px_0_0_#E4572E]'
                        : 'border-[#1A1A1A] bg-[#E8E0C8] text-[#1A1A1A] hover:bg-[#F4EFE0]'
                    }`}
                  >
                    <span className="shrink-0 p-1 bg-[#F4EFE0] border border-[#1A1A1A]">
                      {renderWindowIcon(win.id, isTrashEmpty)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold truncate">
                        {win.title.split('—')[0].trim()}
                      </div>
                      {win.isMinimized && (
                        <span
                          className={`inline-block mt-0.5 px-1 text-[9px] font-bold border ${
                            isSelected
                              ? 'border-[#F4EFE0] text-[#E8E0C8]'
                              : 'border-[#1A1A1A] bg-[#2A9D8F] text-[#F4EFE0]'
                          }`}
                        >
                          {WINDOW_MANAGER_COPY.minimizedTag}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer active window title + hint */}
        <div className="px-3 py-2 border-t-2 border-[#1A1A1A] bg-[#E8E0C8] flex flex-col gap-0.5">
          {activeWin && (
            <div className="text-xs font-bold truncate text-[#1A1A1A]">{activeWin.title}</div>
          )}
          <div className="text-[10px] text-[#4A463B]">{WINDOW_MANAGER_COPY.switcherHint}</div>
        </div>
      </div>
    </div>
  );
}
