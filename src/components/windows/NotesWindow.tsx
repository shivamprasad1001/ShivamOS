import React, { useEffect, useState } from 'react';
import { useWindowStore } from '../../store/windowStore';
import { playRetroSound } from '../../utils/sound';

interface StickyNote {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
}

const NOTES_STORAGE_KEY = 'shivamos_notes_v1';

const DEFAULT_NOTES: StickyNote[] = [
  {
    id: 'note-1',
    title: 'scratchpad.txt',
    body: 'Notes while exploring ShivamOS:\n- Check yolo-custom-trainer, MiniGPT (1.2M), and Gwen in Projects\n- Try terminal.exe: "ls games", "open tetris", or "wallpaper grid"\n- Beat CPU on Hard in pong.exe\n- Try pixel art in paint.exe with multiple canvases!',
    updatedAt: 'Saved locally',
  },
];

function loadNotes(): StickyNote[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(NOTES_STORAGE_KEY) : null;
    if (!raw) return DEFAULT_NOTES;
    const parsed = JSON.parse(raw) as StickyNote[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_NOTES;
  } catch {
    return DEFAULT_NOTES;
  }
}

export function NotesWindow() {
  const soundEnabled = useWindowStore((s) => s.soundEnabled);
  const pushToast = useWindowStore((s) => s.pushToast);

  const [notes, setNotes] = useState<StickyNote[]>(loadNotes);
  const [activeId, setActiveId] = useState<string>(() => loadNotes()[0].id);
  const [saveBadge, setSaveBadge] = useState<string>('Saved to localStorage');

  useEffect(() => {
    try {
      window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // ignore quota errors
    }
  }, [notes]);

  const activeNote = notes.find((n) => n.id === activeId) ?? notes[0];

  const updateActive = (patch: Partial<Pick<StickyNote, 'title' | 'body'>>) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNote.id ? { ...n, ...patch, updatedAt: `Saved ${nowStr}` } : n
      )
    );
    setSaveBadge('Saving...');
    window.setTimeout(() => setSaveBadge('Saved ✓'), 300);
  };

  const handleSaveExplicit = () => {
    try {
      window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
      playRetroSound('click', soundEnabled);
      setSaveBadge('Saved ✓');
      pushToast(`Saved ${activeNote.title}`);
    } catch {
      pushToast('Storage quota exceeded');
    }
  };

  const handleNewNote = () => {
    playRetroSound('open', soundEnabled);
    const id = `note-${Date.now()}`;
    const next: StickyNote = {
      id,
      title: `note_${notes.length + 1}.txt`,
      body: '',
      updatedAt: 'New note',
    };
    setNotes((prev) => [...prev, next]);
    setActiveId(id);
    pushToast(`Created ${next.title}`);
  };

  const handleDuplicateNote = () => {
    playRetroSound('open', soundEnabled);
    const id = `note-${Date.now()}`;
    const copy: StickyNote = {
      id,
      title: `copy_${activeNote.title}`,
      body: activeNote.body,
      updatedAt: 'Duplicated note',
    };
    setNotes((prev) => [...prev, copy]);
    setActiveId(id);
    pushToast(`Duplicated ${activeNote.title}`);
  };

  const handleDeleteNote = () => {
    if (notes.length <= 1) {
      updateActive({ body: '' });
      pushToast('Cleared note');
      return;
    }
    playRetroSound('close', soundEnabled);
    const remaining = notes.filter((n) => n.id !== activeNote.id);
    setNotes(remaining);
    setActiveId(remaining[0].id);
    pushToast(`Deleted note`);
  };

  const handleExportTxt = () => {
    const blob = new Blob([activeNote.body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeNote.title.endsWith('.txt') ? activeNote.title : `${activeNote.title}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    playRetroSound('score', soundEnabled);
    pushToast(`Downloaded ${link.download}`);
  };

  const wordCount = activeNote.body.trim() ? activeNote.body.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col min-h-full text-xs">
      {/* Note Tabs & Actions */}
      <div className="border-b-2 border-[#1A1A1A] bg-[#E8E0C8] px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1.5">
        {/* Responsive Note Selector (Dropdown on mobile, tabs on desktop) */}
        <div className="flex items-center gap-1 min-w-0 max-w-full">
          <label htmlFor="notes-switcher" className="font-bold text-[#4A463B] text-[11px] shrink-0 sm:hidden">
            FILE:
          </label>
          <select
            id="notes-switcher"
            aria-label="Select note"
            value={activeNote.id}
            onChange={(e) => setActiveId(e.target.value)}
            className="sm:hidden border border-[#1A1A1A] bg-[#F4EFE0] px-1.5 py-0.5 text-xs font-bold max-w-[140px] truncate"
          >
            {notes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title || 'untitled.txt'}
              </option>
            ))}
          </select>

          {/* Desktop Tab Bar */}
          <div className="hidden sm:flex flex-wrap items-center gap-1" role="tablist" aria-label="Saved notes">
            {notes.map((note) => (
              <button
                key={note.id}
                type="button"
                role="tab"
                aria-selected={note.id === activeNote.id}
                onClick={() => setActiveId(note.id)}
                className={`px-2 py-1 text-[11px] font-bold border-2 border-[#1A1A1A] max-w-[130px] truncate ${
                  note.id === activeNote.id
                    ? 'bg-[#1A1A1A] text-[#F4EFE0]'
                    : 'bg-[#F4EFE0] text-[#1A1A1A] hover:bg-[#D8CFB2]'
                }`}
              >
                {note.title || 'untitled.txt'}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNewNote}
            className="os-btn os-btn-teal px-2 py-1 text-[10px] sm:text-[11px] font-bold"
          >
            + New
          </button>
          <button
            type="button"
            onClick={handleSaveExplicit}
            className="os-btn px-2 py-1 text-[10px] sm:text-[11px] font-bold"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleDuplicateNote}
            className="os-btn px-2 py-1 text-[10px] sm:text-[11px] font-bold"
          >
            Clone
          </button>
          <button
            type="button"
            onClick={handleExportTxt}
            className="os-btn px-2 py-1 text-[10px] sm:text-[11px] font-bold"
          >
            Export
          </button>
          <button
            type="button"
            onClick={handleDeleteNote}
            className="os-btn px-2 py-1 text-[10px] sm:text-[11px] font-bold"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Note Title Input */}
      <div className="border-b-2 border-[#1A1A1A] bg-[#F4EFE0] px-3 py-1.5 flex items-center gap-2">
        <label htmlFor="note-title-input" className="font-bold text-[#4A463B] shrink-0 text-xs">
          File Name:
        </label>
        <input
          id="note-title-input"
          type="text"
          value={activeNote.title}
          onChange={(e) => updateActive({ title: e.target.value })}
          className="flex-1 min-w-0 bg-transparent border-0 font-bold text-xs text-[#1A1A1A] focus:outline-none"
        />
      </div>

      {/* Note Textarea */}
      <div className="flex-1 flex flex-col p-2.5 sm:p-3">
        <label htmlFor="note-body-input" className="sr-only">
          Note contents
        </label>
        <textarea
          id="note-body-input"
          value={activeNote.body}
          onChange={(e) => updateActive({ body: e.target.value })}
          placeholder="Write notes here — saved automatically in browser storage..."
          className="flex-1 min-h-[220px] w-full border-2 border-[#1A1A1A] bg-[#E8E0C8] p-3 text-xs leading-relaxed text-[#1A1A1A] resize-none focus:outline-none"
        />
      </div>

      {/* Footer stats */}
      <footer className="border-t-2 border-[#1A1A1A] bg-[#E8E0C8] px-3 py-1.5 flex items-center justify-between text-[11px] text-[#4A463B] tabular-nums">
        <span className="font-medium text-[#2A9D8F]">{saveBadge}</span>
        <span>
          {wordCount} words · {activeNote.body.length} chars
        </span>
      </footer>
    </div>
  );
}
