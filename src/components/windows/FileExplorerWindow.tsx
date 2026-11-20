import React, { useMemo, useRef, useState } from 'react';
import { SYSTEM_CHROME_COPY } from '../../../data/content';
import { useWindowStore } from '../../store/windowStore';
import {
  EXPLORER_NODE_ORDER,
  getExplorerItems,
  getExplorerPath,
  type ExplorerEntry,
  type ExplorerNodeId,
} from '../../utils/systemLogic';
import type { ViewportSize } from '../../utils/windowLogic';
import {
  CertificatePixelIcon,
  ContactPixelIcon,
  DocumentPixelIcon,
  FolderPixelIcon,
  ProjectFilePixelIcon,
} from '../PixelIcons';

interface FileExplorerWindowProps {
  viewport: ViewportSize;
}

function renderEntryIcon(kind: ExplorerEntry['iconKind']) {
  if (
    kind === 'agent' ||
    kind === 'vision' ||
    kind === 'detector' ||
    kind === 'transformer' ||
    kind === 'rag'
  ) {
    return <ProjectFilePixelIcon type={kind} size={20} className="shrink-0" />;
  }
  if (kind === 'document') return <DocumentPixelIcon size={20} className="shrink-0" />;
  if (kind === 'certificate') return <CertificatePixelIcon size={20} className="shrink-0" />;
  return <ContactPixelIcon size={20} className="shrink-0" />;
}

export function FileExplorerWindow({ viewport }: FileExplorerWindowProps) {
  const openWindow = useWindowStore((s) => s.openWindow);
  const openProperties = useWindowStore((s) => s.openProperties);

  const [activeNode, setActiveNode] = useState<ExplorerNodeId>('projects');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const treeRefs = useRef<Partial<Record<ExplorerNodeId, HTMLButtonElement | null>>>({});
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const entries = useMemo(() => getExplorerItems(activeNode), [activeNode]);
  const currentPath = getExplorerPath(activeNode);
  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId) ?? entries[0] ?? null;

  const activateEntry = (entry: ExplorerEntry) => {
    setSelectedEntryId(entry.id);
    if (entry.action.kind === 'window') {
      openWindow(entry.action.windowId, viewport);
    } else if (entry.action.kind === 'properties') {
      openProperties(entry.action.target);
    }
  };

  const handleTreeKeyDown = (node: ExplorerNodeId, e: React.KeyboardEvent<HTMLButtonElement>) => {
    const idx = EXPLORER_NODE_ORDER.indexOf(node);
    let nextIdx: number | null = null;
    if (e.key === 'ArrowDown') nextIdx = (idx + 1) % EXPLORER_NODE_ORDER.length;
    else if (e.key === 'ArrowUp')
      nextIdx = (idx - 1 + EXPLORER_NODE_ORDER.length) % EXPLORER_NODE_ORDER.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = EXPLORER_NODE_ORDER.length - 1;

    if (nextIdx !== null) {
      e.preventDefault();
      const nextNode = EXPLORER_NODE_ORDER[nextIdx];
      setActiveNode(nextNode);
      setSelectedEntryId(null);
      treeRefs.current[nextNode]?.focus();
    }
  };

  const handleItemKeyDown = (
    entry: ExplorerEntry,
    idx: number,
    e: React.KeyboardEvent<HTMLButtonElement>
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (entry.action.kind !== 'external') {
        activateEntry(entry);
      }
      return;
    }

    let nextIdx: number | null = null;
    if (e.key === 'ArrowDown') nextIdx = (idx + 1) % entries.length;
    else if (e.key === 'ArrowUp') nextIdx = (idx - 1 + entries.length) % entries.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = entries.length - 1;

    if (nextIdx !== null && entries[nextIdx]) {
      e.preventDefault();
      const nextEntry = entries[nextIdx];
      setSelectedEntryId(nextEntry.id);
      itemRefs.current[nextEntry.id]?.focus();
    }
  };

  const copy = SYSTEM_CHROME_COPY.explorer;

  return (
    <div className="flex flex-col min-h-full text-xs">
      {/* Path Bar */}
      <div className="border-b-2 border-[#1A1A1A] bg-[#E8E0C8] px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-bold text-[#4A463B] shrink-0">{copy.pathLabel}:</span>
          <div
            data-testid="explorer-path-bar"
            className="flex-1 min-w-[160px] px-2 py-1 border-2 border-[#1A1A1A] bg-[#F4EFE0] font-mono font-bold truncate"
          >
            {currentPath}
          </div>
        </div>
        <span className="font-semibold text-[#4A463B] tabular-nums whitespace-nowrap">
          {entries.length} {entries.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Main Split Pane: Folder Tree + Directory Contents */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-[156px_minmax(0,1fr)] divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-[#1A1A1A]">
        {/* Left Folder Tree */}
        <aside className="bg-[#E8E0C8] p-2.5 space-y-1.5 min-w-0">
          <div className="px-1.5 text-[10px] font-bold uppercase tracking-wider text-[#4A463B]">
            {copy.treeHeading}
          </div>
          <div role="tree" aria-label={copy.treeHeading} className="space-y-1">
            {EXPLORER_NODE_ORDER.map((node) => {
              const isSelected = activeNode === node;
              const nodeMeta = copy.nodes[node];
              return (
                <button
                  key={node}
                  ref={(el) => {
                    treeRefs.current[node] = el;
                  }}
                  type="button"
                  role="treeitem"
                  aria-selected={isSelected}
                  data-explorer-node={node}
                  onClick={() => {
                    setActiveNode(node);
                    setSelectedEntryId(null);
                  }}
                  onKeyDown={(e) => handleTreeKeyDown(node, e)}
                  className={`w-full px-2 py-1.5 border-2 text-left font-bold flex items-center gap-2 ${
                    isSelected
                      ? 'border-[#1A1A1A] bg-[#1A1A1A] text-[#F4EFE0]'
                      : 'border-transparent text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-[#F4EFE0]'
                  }`}
                >
                  <FolderPixelIcon size={16} className="shrink-0" />
                  <span className="truncate">{nodeMeta.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right File List */}
        <div className="bg-[#F4EFE0] flex flex-col justify-between min-w-0">
          <div className="p-3 space-y-2 min-w-0">
            {entries.length === 0 ? (
              <p className="text-xs text-[#4A463B] py-6 text-center m-0">{copy.emptyMessage}</p>
            ) : (
              <div
                role="listbox"
                aria-label={`${copy.nodes[activeNode].label} contents`}
                className="border-2 border-[#1A1A1A] divide-y-2 divide-[#1A1A1A] bg-[#F4EFE0] min-w-0"
              >
                {entries.map((entry, idx) => {
                  const isSelected = selectedEntry?.id === entry.id;
                  return (
                    <div
                      key={entry.id}
                      data-explorer-item={entry.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setSelectedEntryId(entry.id);
                        openProperties(entry.propertiesTarget);
                      }}
                      className={`flex items-center justify-between gap-2 px-2.5 py-2 min-w-0 ${
                        isSelected ? 'bg-[#E8E0C8]' : 'bg-[#F4EFE0] hover:bg-[#E8E0C8]/70'
                      }`}
                    >
                      <button
                        ref={(el) => {
                          itemRefs.current[entry.id] = el;
                        }}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => setSelectedEntryId(entry.id)}
                        onDoubleClick={() => {
                          if (entry.action.kind !== 'external') {
                            activateEntry(entry);
                          }
                        }}
                        onKeyDown={(e) => handleItemKeyDown(entry, idx, e)}
                        className="flex-1 min-w-0 text-left flex items-center gap-2.5"
                      >
                        <span className="p-1 border border-[#1A1A1A] bg-[#F4EFE0] shrink-0">
                          {renderEntryIcon(entry.iconKind)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#1A1A1A] truncate">{entry.name}</div>
                          <div className="text-[11px] text-[#4A463B] truncate">
                            {entry.type}
                            {entry.detail ? ` · ${entry.detail}` : ''}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {entry.action.kind === 'external' ? (
                          <a
                            href={entry.action.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="os-btn px-2.5 py-1 text-[11px] font-bold no-underline text-[#1A1A1A]"
                          >
                            {copy.openAction} ↗
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => activateEntry(entry)}
                            className="os-btn os-btn-primary px-2.5 py-1 text-[11px] font-bold"
                          >
                            {copy.openAction}
                          </button>
                        )}
                        <button
                          type="button"
                          data-explorer-props={entry.id}
                          onClick={() => {
                            setSelectedEntryId(entry.id);
                            openProperties(entry.propertiesTarget);
                          }}
                          className="os-btn px-2 py-1 text-[11px] font-bold"
                        >
                          {copy.propertiesAction}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t-2 border-[#1A1A1A] bg-[#E8E0C8] px-3 py-1.5 text-[11px] text-[#4A463B]">
            {copy.footerHint}
          </div>
        </div>
      </div>
    </div>
  );
}
