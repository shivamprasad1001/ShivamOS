import React, { useState } from 'react';
import { useWindowStore } from '../../store/windowStore';
import { DocumentPixelIcon } from '../PixelIcons';

export function TrashWindow() {
  const trashItems = useWindowStore((s) => s.trashItems);
  const emptyTrash = useWindowStore((s) => s.emptyTrash);
  const restoreTrash = useWindowStore((s) => s.restoreTrash);

  const [selectedId, setSelectedId] = useState<string | null>(trashItems[0]?.id ?? null);
  const [confirmingEmpty, setConfirmingEmpty] = useState(false);

  const selectedFile = trashItems.find((f) => f.id === selectedId) ?? trashItems[0] ?? null;

  return (
    <div className="flex flex-col min-h-full text-xs">
      {/* Toolbar */}
      <div className="border-b-2 border-[#1A1A1A] bg-[#E8E0C8] px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold tabular-nums">
          Trash · {trashItems.length} {trashItems.length === 1 ? 'item' : 'items'}
        </span>
        <div className="flex items-center gap-2">
          {trashItems.length > 0 ? (
            !confirmingEmpty ? (
              <button
                type="button"
                onClick={() => setConfirmingEmpty(true)}
                className="os-btn os-btn-primary px-3 py-1 text-xs font-bold whitespace-nowrap"
              >
                Empty Trash
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#E4572E]">Confirm?</span>
                <button
                  type="button"
                  onClick={() => {
                    emptyTrash();
                    setConfirmingEmpty(false);
                    setSelectedId(null);
                  }}
                  className="os-btn os-btn-primary px-2.5 py-1 text-xs font-bold"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingEmpty(false)}
                  className="os-btn px-2.5 py-1 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={() => {
                restoreTrash();
                setSelectedId('trash-1');
              }}
              className="os-btn os-btn-teal px-3 py-1 text-xs font-bold whitespace-nowrap"
            >
              Restore Artifacts
            </button>
          )}
        </div>
      </div>

      {/* Trash Body */}
      <div className="p-4 space-y-4 flex-1">
        {trashItems.length === 0 ? (
          <div className="border-2 border-[#1A1A1A] bg-[#E8E0C8] p-6 text-center space-y-2">
            <p className="font-bold m-0" style={{ fontFamily: 'var(--font-display)' }}>
              Trash is empty.
            </p>
            <p className="m-0 text-[#4A463B]">
              All overfit checkpoints and buzzword drafts have been wiped from disk.
            </p>
          </div>
        ) : (
          <>
            <div className="border-2 border-[#1A1A1A] bg-[#F4EFE0] divide-y-2 divide-[#1A1A1A]">
              {trashItems.map((file) => {
                const isSelected = selectedFile?.id === file.id;
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setSelectedId(file.id)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#1A1A1A] text-[#F4EFE0]'
                        : 'bg-[#F4EFE0] text-[#1A1A1A] hover:bg-[#E8E0C8]'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-bold min-w-0">
                      <DocumentPixelIcon size={18} className="shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </span>
                    <span className="tabular-nums text-[11px] shrink-0 opacity-85">
                      {file.size}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedFile && (
              <div className="border-2 border-[#1A1A1A] bg-[#E8E0C8] p-3 space-y-1">
                <div className="flex items-center justify-between gap-2 font-bold">
                  <span>{selectedFile.name}</span>
                  <span className="text-[11px] text-[#4A463B] tabular-nums">
                    Deleted {selectedFile.deletedAt}
                  </span>
                </div>
                <p className="m-0 text-[#1A1A1A]">{selectedFile.note}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
