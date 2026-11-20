import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowStore } from '../../store/windowStore';
import {
  applyBrush,
  createNewPainting,
  floodFillGrid,
  interpolateLine,
  loadSavedPaintings,
  PAINT_BG_HEX,
  PAINT_PALETTE,
  savePaintingsToStorage,
  type SavedPainting,
} from '../../utils/games/paintLogic';
import { playRetroSound } from '../../utils/sound';

type PaintTool = 'pencil' | 'eraser' | 'fill' | 'picker';
type BrushSize = 1 | 2 | 3;

const CELL_SIZE = 18;

export function PaintWindow() {
  const soundEnabled = useWindowStore((s) => s.soundEnabled);
  const pushToast = useWindowStore((s) => s.pushToast);

  const [paintState, setPaintState] = useState<{
    paintings: SavedPainting[];
    activeId: string;
  }>(() => loadSavedPaintings());

  const activePainting =
    paintState.paintings.find((p) => p.id === paintState.activeId) ?? paintState.paintings[0];

  const [tool, setTool] = useState<PaintTool>('pencil');
  const [brushSize, setBrushSize] = useState<BrushSize>(1);
  const [color, setColor] = useState<string>(PAINT_PALETTE[0].hex);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [savedBadge, setSavedBadge] = useState<string>('Saved');
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [renameValue, setRenameValue] = useState<string>('');

  // Undo & Redo stacks
  const [undoStack, setUndoStack] = useState<string[][]>([]);
  const [redoStack, setRedoStack] = useState<string[][]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastCoordRef = useRef<{ x: number; y: number } | null>(null);

  // Auto-save whenever paintings or activeId change
  useEffect(() => {
    savePaintingsToStorage(paintState.paintings, paintState.activeId);
  }, [paintState]);

  // Flash saved feedback
  const triggerSaveIndicator = useCallback(() => {
    setSavedBadge('Saved ✓');
    const timer = window.setTimeout(() => setSavedBadge('Saved'), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  // Update current active painting pixels and history
  const updatePixels = useCallback(
    (nextPixels: string[], pushToHistory = true) => {
      if (pushToHistory) {
        setUndoStack((prev) => [...prev.slice(-24), activePainting.pixels]);
        setRedoStack([]); // Clear redo on new action
      }
      setPaintState((prev) => {
        const nextList = prev.paintings.map((p) =>
          p.id === activePainting.id ? { ...p, pixels: nextPixels, updatedAt: Date.now() } : p
        );
        return { ...prev, paintings: nextList };
      });
      triggerSaveIndicator();
    },
    [activePainting.id, activePainting.pixels, triggerSaveIndicator]
  );

  // Render pixels onto HTML5 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = activePainting.cols;
    const rows = activePainting.rows;
    canvas.width = cols * CELL_SIZE;
    canvas.height = rows * CELL_SIZE;

    // Draw background and pixels
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hex = activePainting.pixels[r * cols + c] || PAINT_BG_HEX;
        ctx.fillStyle = hex;
        ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Optional pixel grid lines
    if (showGrid) {
      ctx.strokeStyle = 'rgba(26, 26, 26, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const x = c * CELL_SIZE;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rows * CELL_SIZE);
      }
      for (let r = 0; r <= rows; r++) {
        const y = r * CELL_SIZE;
        ctx.moveTo(0, y);
        ctx.lineTo(cols * CELL_SIZE, y);
      }
      ctx.stroke();
    }

    // Hover cursor indicator
    if (hoverCoord && hoverCoord.x >= 0 && hoverCoord.x < cols && hoverCoord.y >= 0 && hoverCoord.y < rows) {
      ctx.strokeStyle = '#E4572E';
      ctx.lineWidth = 2;
      const half = Math.floor(brushSize / 2);
      const startX = (hoverCoord.x - half) * CELL_SIZE;
      const startY = (hoverCoord.y - half) * CELL_SIZE;
      const size = brushSize * CELL_SIZE;
      ctx.strokeRect(startX + 1, startY + 1, size - 2, size - 2);
    }
  }, [activePainting.cols, activePainting.rows, activePainting.pixels, showGrid, hoverCoord, brushSize]);

  // Convert client pointer event coordinates to pixel column and row
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = (e.clientX - rect.left) * scaleX;
    const clientY = (e.clientY - rect.top) * scaleY;

    const col = Math.floor(clientX / CELL_SIZE);
    const row = Math.floor(clientY / CELL_SIZE);

    if (col < 0 || col >= activePainting.cols || row < 0 || row >= activePainting.rows) {
      return null;
    }
    return { x: col, y: row };
  };

  // Drawing Handlers with continuous touch-slide and Bresenham line interpolation
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (!coords) return;

    e.currentTarget.setPointerCapture(e.pointerId);

    // Color Eyedropper Tool
    if (tool === 'picker') {
      const idx = coords.y * activePainting.cols + coords.x;
      const pickedColor = activePainting.pixels[idx] || PAINT_BG_HEX;
      setColor(pickedColor);
      setTool('pencil');
      playRetroSound('click', soundEnabled);
      return;
    }

    // Fill Bucket Tool
    if (tool === 'fill') {
      const targetColor = color;
      const nextPixels = floodFillGrid(
        activePainting.pixels,
        activePainting.cols,
        activePainting.rows,
        coords.x,
        coords.y,
        targetColor
      );
      if (nextPixels !== activePainting.pixels) {
        playRetroSound('click', soundEnabled);
        updatePixels(nextPixels, true);
      }
      return;
    }

    // Pencil / Eraser continuous stroke start
    isDrawingRef.current = true;
    lastCoordRef.current = coords;

    const targetColor = tool === 'eraser' ? PAINT_BG_HEX : color;
    const nextPixels = applyBrush(
      activePainting.pixels,
      activePainting.cols,
      activePainting.rows,
      coords.x,
      coords.y,
      brushSize,
      targetColor
    );
    if (nextPixels !== activePainting.pixels) {
      updatePixels(nextPixels, true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setHoverCoord(coords);

    if (!isDrawingRef.current || !coords) return;
    e.preventDefault();

    const last = lastCoordRef.current || coords;
    const targetColor = tool === 'eraser' ? PAINT_BG_HEX : color;

    // Use Bresenham interpolation to paint unbroken lines on rapid mouse movement or touch glide
    const points = interpolateLine(last.x, last.y, coords.x, coords.y);
    let currentGrid = activePainting.pixels;
    let modified = false;

    for (const pt of points) {
      const next = applyBrush(
        currentGrid,
        activePainting.cols,
        activePainting.rows,
        pt.x,
        pt.y,
        brushSize,
        targetColor
      );
      if (next !== currentGrid) {
        currentGrid = next;
        modified = true;
      }
    }

    lastCoordRef.current = coords;
    if (modified) {
      updatePixels(currentGrid, false); // Don't spam undo stack inside one contiguous stroke
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastCoordRef.current = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
  };

  // Undo / Redo Actions
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    playRetroSound('click', soundEnabled);
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, activePainting.pixels]);
    setUndoStack((prev) => prev.slice(0, -1));
    updatePixels(previous, false);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    playRetroSound('click', soundEnabled);
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, activePainting.pixels]);
    setRedoStack((prev) => prev.slice(0, -1));
    updatePixels(next, false);
  };

  const handleClear = () => {
    playRetroSound('close', soundEnabled);
    const blank = Array.from(
      { length: activePainting.cols * activePainting.rows },
      () => PAINT_BG_HEX
    );
    updatePixels(blank, true);
  };

  // Multi-Painting Management: New, Switch, Rename, Duplicate, Delete
  const handleNewPainting = () => {
    playRetroSound('open', soundEnabled);
    const newPaint = createNewPainting();
    setPaintState((prev) => ({
      paintings: [...prev.paintings, newPaint],
      activeId: newPaint.id,
    }));
    setUndoStack([]);
    setRedoStack([]);
    pushToast(`Created ${newPaint.title}`);
  };

  const handleDuplicatePainting = () => {
    playRetroSound('open', soundEnabled);
    const copy: SavedPainting = {
      id: `paint-${Date.now()}`,
      title: `copy_${activePainting.title}`,
      cols: activePainting.cols,
      rows: activePainting.rows,
      pixels: [...activePainting.pixels],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPaintState((prev) => ({
      paintings: [...prev.paintings, copy],
      activeId: copy.id,
    }));
    pushToast(`Duplicated ${activePainting.title}`);
  };

  const handleDeletePainting = () => {
    if (paintState.paintings.length <= 1) {
      handleClear();
      return;
    }
    playRetroSound('close', soundEnabled);
    const remaining = paintState.paintings.filter((p) => p.id !== activePainting.id);
    setPaintState({
      paintings: remaining,
      activeId: remaining[0].id,
    });
    setUndoStack([]);
    setRedoStack([]);
    pushToast(`Deleted ${activePainting.title}`);
  };

  const handleStartRename = () => {
    setRenameValue(activePainting.title);
    setIsRenaming(true);
  };

  const handleConfirmRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed) {
      const finalTitle = trimmed.endsWith('.bmp') || trimmed.endsWith('.png') ? trimmed : `${trimmed}.bmp`;
      setPaintState((prev) => ({
        ...prev,
        paintings: prev.paintings.map((p) =>
          p.id === activePainting.id ? { ...p, title: finalTitle, updatedAt: Date.now() } : p
        ),
      }));
    }
    setIsRenaming(false);
  };

  // Export as high-resolution PNG
  const handleExportPng = () => {
    const scale = 16;
    const canvas = document.createElement('canvas');
    canvas.width = activePainting.cols * scale;
    canvas.height = activePainting.rows * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let y = 0; y < activePainting.rows; y++) {
      for (let x = 0; x < activePainting.cols; x++) {
        ctx.fillStyle = activePainting.pixels[y * activePainting.cols + x] || PAINT_BG_HEX;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    const link = document.createElement('a');
    const baseName = activePainting.title.replace(/\.[^/.]+$/, '');
    link.download = `${baseName}_pixel_art.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playRetroSound('score', soundEnabled);
    pushToast(`Exported ${link.download}`);
  };

  return (
    <div
      className="p-2 sm:p-3 flex flex-col gap-2 select-none min-h-full"
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        isDrawingRef.current = false;
        lastCoordRef.current = null;
        setHoverCoord(null);
      }}
    >
      {/* 1. Multi-Painting Selector Strip */}
      <div className="border-2 border-[#1A1A1A] bg-[#E8E0C8] px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1.5 text-xs">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <label htmlFor="painting-select" className="font-bold text-[#4A463B] text-[11px] shrink-0">
            FILE:
          </label>
          {isRenaming ? (
            <div className="flex items-center gap-1 flex-1 max-w-[220px]">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename();
                  if (e.key === 'Escape') setIsRenaming(false);
                }}
                className="px-1.5 py-0.5 border border-[#1A1A1A] bg-[#F4EFE0] text-xs font-bold w-full"
                autoFocus
              />
              <button
                type="button"
                onClick={handleConfirmRename}
                className="os-btn px-2 py-0.5 text-[10px] font-bold"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 min-w-0">
              <select
                id="painting-select"
                aria-label="Active painting"
                value={activePainting.id}
                onChange={(e) => {
                  setPaintState((prev) => ({ ...prev, activeId: e.target.value }));
                  setUndoStack([]);
                  setRedoStack([]);
                }}
                className="border border-[#1A1A1A] bg-[#F4EFE0] px-1.5 py-0.5 text-xs font-bold truncate max-w-[150px] sm:max-w-[200px]"
              >
                {paintState.paintings.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleStartRename}
                title="Rename active painting"
                className="os-btn px-1.5 py-0.5 text-[10px] font-bold"
              >
                Rename
              </button>
            </div>
          )}
        </div>

        {/* Gallery / File Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNewPainting}
            className="os-btn os-btn-teal px-2 py-0.5 text-[10px] sm:text-[11px] font-bold"
          >
            + New
          </button>
          <button
            type="button"
            onClick={handleDuplicatePainting}
            className="os-btn px-2 py-0.5 text-[10px] sm:text-[11px] font-bold"
          >
            Clone
          </button>
          <button
            type="button"
            onClick={handleDeletePainting}
            disabled={paintState.paintings.length <= 1}
            className="os-btn px-2 py-0.5 text-[10px] sm:text-[11px] font-bold disabled:opacity-40"
          >
            Delete
          </button>
          <span className="text-[10px] font-mono font-bold text-[#2A9D8F] ml-1 shrink-0">
            {savedBadge}
          </span>
        </div>
      </div>

      {/* 2. Tool & Action Toolbar */}
      <div className="border-2 border-[#1A1A1A] bg-[#F4EFE0] p-1.5 sm:p-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Tools: Pencil, Eraser, Fill, Eyedropper */}
        <div className="flex items-center gap-1" role="group" aria-label="Paint tools">
          {(
            [
              { id: 'pencil', label: 'Pencil' },
              { id: 'eraser', label: 'Eraser' },
              { id: 'fill', label: 'Bucket' },
              { id: 'picker', label: 'Pick' },
            ] as Array<{ id: PaintTool; label: string }>
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTool(t.id)}
              aria-pressed={tool === t.id}
              className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold border-2 border-[#1A1A1A] ${
                tool === t.id
                  ? 'bg-[#1A1A1A] text-[#F4EFE0]'
                  : 'bg-[#F4EFE0] text-[#1A1A1A] hover:bg-[#D8CFB2]'
              }`}
            >
              {t.label}
            </button>
          ))}

          {/* Brush Sizes: 1px, 2px, 3px */}
          <div className="flex items-center gap-0.5 ml-1 border-l-2 border-[#1A1A1A] pl-1.5" role="group" aria-label="Brush size">
            {([1, 2, 3] as BrushSize[]).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setBrushSize(size)}
                aria-pressed={brushSize === size}
                aria-label={`Brush size ${size}px`}
                className={`w-6 h-6 border-2 border-[#1A1A1A] flex items-center justify-center text-[10px] font-bold ${
                  brushSize === size ? 'bg-[#E4572E] text-[#F4EFE0]' : 'bg-[#E8E0C8] text-[#1A1A1A]'
                }`}
              >
                {size}x
              </button>
            ))}
          </div>
        </div>

        {/* Undo / Redo / Grid / Export */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="os-btn px-2 py-1 text-[10px] sm:text-[11px] font-bold disabled:opacity-40"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="os-btn px-2 py-1 text-[10px] sm:text-[11px] font-bold disabled:opacity-40"
          >
            Redo
          </button>
          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            aria-pressed={showGrid}
            className={`os-btn px-2 py-1 text-[10px] sm:text-[11px] font-bold ${showGrid ? 'bg-[#2A9D8F] text-[#F4EFE0]' : ''}`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="os-btn px-2 py-1 text-[10px] sm:text-[11px] font-bold"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleExportPng}
            className="os-btn os-btn-teal px-2 py-1 text-[10px] sm:text-[11px] font-bold"
          >
            Export .PNG
          </button>
        </div>
      </div>

      {/* 3. Color Palette Swatches (16 retro colors + custom hex picker) */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-[#E8E0C8] border-2 border-[#1A1A1A] p-1.5">
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Color palette">
          {PAINT_PALETTE.map((swatch) => {
            const active = color === swatch.hex && tool !== 'eraser';
            return (
              <button
                key={swatch.hex}
                type="button"
                aria-label={`Select color ${swatch.name}`}
                aria-pressed={active}
                onClick={() => {
                  setColor(swatch.hex);
                  if (tool === 'eraser') setTool('pencil');
                }}
                className={`w-6 h-6 sm:w-7 sm:h-7 border-2 border-[#1A1A1A] transition-transform ${
                  active ? 'outline-2 outline-offset-1 outline-[#E4572E] scale-110 z-10' : ''
                }`}
                style={{ backgroundColor: swatch.hex }}
                title={swatch.name}
              />
            );
          })}

          {/* Custom color input */}
          <div className="flex items-center ml-1 border-l border-[#1A1A1A] pl-1">
            <input
              type="color"
              aria-label="Custom color picker"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                if (tool === 'eraser') setTool('pencil');
              }}
              className="w-6 h-6 border-2 border-[#1A1A1A] cursor-pointer p-0 bg-transparent"
              title="Pick custom color"
            />
          </div>
        </div>

        <div className="text-[10px] font-mono font-bold text-[#4A463B] tabular-nums shrink-0">
          {activePainting.cols}×{activePainting.rows} px · {hoverCoord ? `(${hoverCoord.x}, ${hoverCoord.y})` : 'Ready'}
        </div>
      </div>

      {/* 4. Superior HTML5 Canvas Drawing Surface (Responsive for both Mobile touch & PC mouse) */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-1 border-2 border-[#1A1A1A] bg-[#1A1A1A] shadow-[3px_3px_0_0_#1A1A1A]">
        <canvas
          ref={canvasRef}
          data-testid="paint-canvas"
          aria-label="Pixel art canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="touch-none cursor-crosshair max-w-full h-auto aspect-[28/18] block bg-[#F4EFE0] border border-[#1A1A1A]"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
}
