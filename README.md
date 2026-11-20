# ShivamOS — AI/ML Engineer Portfolio

> A retro 90s desktop operating system portfolio built with React 19, TypeScript, Tailwind CSS, and Vite. Features interactive window management, custom pixel-art icons, sound effects, CRT scanline effects, retro terminal, multi-painting pixel art studio, note editor, and retro arcade games with touch & gamepad navigation.

![ShivamOS Preview](public/icons/icon-512x512.png)

---

## 🌟 Features

### 🖥️ 1. Authentic Retro OS Experience
- **Boot Sequence & Lock Screen**: Retro BIOS memory test, scanline transitions, and guest login lock screen with live clock.
- **Window Manager**: Draggable, resizable (8px grid snap), cascaded window placement, edge snapping (left/right split), minimize/maximize/close with 120ms stepped animations, and Alt+Tab window switcher (`Ctrl+W` to close).
- **Taskbar & Start Menu**: Dynamic active tasks, quick launcher, system tray with live clock, audio SFX toggle, CRT toggle, and shut-down/reboot routines.
- **Desktop System**: Free-form draggable icons on an 8px grid with localStorage persistence, rubber-band marquee selection, and right-click context menus (Open, Rename, Properties, Wallpaper, New Folder).
- **Design Tokens**: Retro cream paper (`#F4EFE0`, `#E8E0C8`), ink (`#1A1A1A`), tomato (`#E4572E`), teal (`#2A9D8F`), 0px border radius, and hard offset drop shadows.

### 🕹️ 2. Retro Arcade Games with Auto-Activating D-Pad
- **Tetris (`tetris.exe`)**: 10×20 responsive CSS grid, gravity scaling, ghost piece preview, hard drop, rotation, and game state save/resume in `localStorage`.
- **CRT Snake (`snake.exe`)**: 60fps canvas simulation, food spawning, particle sparks, speed tiers, and high-score tracking.
- **Arcade Pong (`pong.exe`)**: 1-Player vs AI Pong with collision physics, rally counters, difficulty selection, and particle effects.
- **Minesweeper (`minesweeper.exe`)**: Beginner (9×9), Intermediate (16×16), and Expert (16×30) minefields with safe first clicks, flag mode, and best clear times.
- **Auto-Activating Retro D-Pad Controller**:
  - Automatically pops up on mobile/tablet emulator mode and desktop whenever any game opens.
  - Molded cross D-Pad with continuous touch-and-slide gesture steering and Delayed Auto-Shift (DAS).
  - Automatically hides when games are closed to maximize screen space.

### 🎨 3. Creative Tools & Productivity
- **Pixel Paint Studio (`paint.exe`)**:
  - **Multiple Paintings**: Create, rename, clone, delete, and switch between multiple saved canvases.
  - **Touch & Mouse Continuous Drawing**: HTML5 canvas engine with Bresenham line interpolation (no missing pixels on fast sweeps or touch drags).
  - **Creative Tools**: Pencil, Eraser, Bucket Fill (4-way BFS flood fill), and Eyedropper color picker.
  - **16 Retro Colors + Custom Picker**: Full retro palette plus custom hex picker.
  - **Undo/Redo & PNG Export**: Multi-step history and 16× high-resolution PNG export.
- **Sticky Notes (`notes.exe`)**:
  - Auto-saved to `localStorage`.
  - Multi-note tabs and dropdown selector, clone, delete, word/char counters, and `.txt` export.
- **Retro Terminal (`terminal.exe`)**:
  - Interactive shell with `help`, `whoami`, `ls projects`, `cat <project>`, `open <app>`, `wallpaper <mode>`, `history`, and tab-autocompletion.
- **File Explorer (`explorer.exe`)**:
  - Hierarchical directory tree navigation across Projects, Resume, Contact, and System files.

### 📱 4. Mobile & PWA Ready
- **PWA v2.0**: Installable on iOS and Android with offline caching via Service Worker.
- **WinEmulator Shell**: Full-screen handheld emulator layout on mobile viewports (<1024px) mimicking vintage Windows handheld systems.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/) with code splitting and lazy-loaded windows
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with retro design tokens
- **PWA**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) with Workbox service workers
- **Testing**: Node.js native test runner (`tsx --test`) with 49 unit tests
- **Audio**: Web Audio API synthesizing 8-bit square/triangle wave chiptune sound effects

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- `pnpm` (recommended) or `npm`

### Installation
```bash
# Clone the repository
git clone https://github.com/shivamprasad1001/ShivamOS.git
cd ShivamOS

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests & Building
```bash
# Run unit tests
pnpm test

# Type check
npx tsc --noEmit

# Production build
pnpm run build
```

---

## 👤 Author

**Shivam Prasad**
- **GitHub**: [@shivamprasad1001](https://github.com/shivamprasad1001)
- **LinkedIn**: [shivamprasad1001](https://www.linkedin.com/in/shivamprasad1001/)

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
