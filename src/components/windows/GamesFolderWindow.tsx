import React from 'react';
import { useWindowStore } from '../../store/windowStore';
import type { ViewportSize, WindowId } from '../../utils/windowLogic';
import { MinePixelIcon, PongPixelIcon, SnakePixelIcon, TetrisPixelIcon } from '../PixelIcons';

interface GamesFolderWindowProps {
  viewport: ViewportSize;
}

interface GameEntry {
  id: WindowId;
  fileName: string;
  title: string;
  genre: string;
  controls: string;
  sizeKb: string;
  renderIcon: () => React.ReactNode;
}

const ARCADE_GAMES: GameEntry[] = [
  {
    id: 'game-snake',
    fileName: 'snake.exe',
    title: 'CRT Pixel Snake',
    genre: 'Arcade · High-Score',
    controls: 'WASD / Arrows / D-Pad',
    sizeKb: '128 KB',
    renderIcon: () => <SnakePixelIcon size={40} />,
  },
  {
    id: 'game-tetris',
    fileName: 'tetris.exe',
    title: 'Retro Block Stacker',
    genre: 'Puzzle · 10×20 CSS Grid',
    controls: 'Arrows / WASD / Space Drop',
    sizeKb: '156 KB',
    renderIcon: () => <TetrisPixelIcon size={40} />,
  },
  {
    id: 'game-minesweeper',
    fileName: 'minesweeper.exe',
    title: 'Mine Field 95',
    genre: 'Logic · 3 Board Sizes',
    controls: 'Click Reveal · Right-Click Flag',
    sizeKb: '164 KB',
    renderIcon: () => <MinePixelIcon size={40} />,
  },
  {
    id: 'game-pong',
    fileName: 'pong.exe',
    title: 'Neural CPU Pong',
    genre: '1P Match · First to 5',
    controls: 'W/S · Arrows · Mouse Drag',
    sizeKb: '142 KB',
    renderIcon: () => <PongPixelIcon size={40} />,
  },
];

export function GamesFolderWindow({ viewport }: GamesFolderWindowProps) {
  const openWindow = useWindowStore((s) => s.openWindow);

  return (
    <div className="flex flex-col min-h-full">
      <div className="border-b-2 border-[#1A1A1A] bg-[#E8E0C8] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="font-semibold tabular-nums">
          C:\SHIVAM\GAMES · {ARCADE_GAMES.length} executables · 590 KB
        </div>
        <span className="text-[11px] text-[#4A463B]">
          Tip: Toggle SFX in top bar for retro audio
        </span>
      </div>

      <div className="p-4 sm:p-5 flex-1">
        <p className="text-xs text-[#4A463B] mb-4 mt-0">
          Select any executable below to launch it in its own window.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ARCADE_GAMES.map((game) => (
            <button
              key={game.id}
              type="button"
              onClick={() => openWindow(game.id, viewport)}
              className="group text-left border-2 border-[#1A1A1A] bg-[#F4EFE0] hover:bg-[#1A1A1A] hover:text-[#F4EFE0] p-4 flex flex-col items-center gap-3"
            >
              <div className="p-1 bg-[#F4EFE0] border-2 border-[#1A1A1A]">
                {game.renderIcon()}
              </div>
              <div className="text-center space-y-1 w-full">
                <div
                  className="text-xs font-bold"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {game.fileName}
                </div>
                <div className="text-xs font-semibold text-[#2A9D8F] group-hover:text-[#33FF66]">
                  {game.title}
                </div>
                <div className="text-[11px] text-[#4A463B] group-hover:text-[#E8E0C8]">
                  {game.genre}
                </div>
                <div className="text-[10px] text-[#4A463B] group-hover:text-[#D8CFB2] pt-0.5">
                  {game.controls}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
