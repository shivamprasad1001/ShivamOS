import React from 'react';
import { SYSTEM_CHROME_COPY } from '../../../data/content';
import { useWindowStore } from '../../store/windowStore';
import type { WallpaperMode } from '../../utils/windowLogic';
import { PWAInstallButton } from '../PWAInstallButton';

export function SettingsWindow() {
  const wallpaper = useWindowStore((s) => s.wallpaper);
  const crtEnabled = useWindowStore((s) => s.crtEnabled);
  const soundEnabled = useWindowStore((s) => s.soundEnabled);
  const reduceMotion = useWindowStore((s) => s.reduceMotion);

  const setWallpaper = useWindowStore((s) => s.setWallpaper);
  const toggleCrt = useWindowStore((s) => s.toggleCrt);
  const toggleSound = useWindowStore((s) => s.toggleSound);
  const toggleReduceMotion = useWindowStore((s) => s.toggleReduceMotion);
  const resetSettings = useWindowStore((s) => s.resetSettings);

  const copy = SYSTEM_CHROME_COPY.settings;

  return (
    <div className="p-4 sm:p-5 space-y-5 text-xs">
      <p className="m-0 text-[#4A463B]">{copy.subtitle}</p>

      {/* Wallpaper Pattern */}
      <section className="space-y-2.5">
        <h2
          className="text-xs font-bold border-b-2 border-[#1A1A1A] pb-1 m-0"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {copy.wallpaperHeading}
        </h2>
        <div
          role="radiogroup"
          aria-label={copy.wallpaperHeading}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
        >
          {copy.wallpapers.map((item) => {
            const active = wallpaper === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                data-settings-wallpaper={item.id}
                onClick={() => setWallpaper(item.id as WallpaperMode)}
                className={`border-2 border-[#1A1A1A] p-2 flex flex-col gap-2 text-left ${
                  active
                    ? 'bg-[#1A1A1A] text-[#F4EFE0] shadow-[2px_2px_0_0_#E4572E]'
                    : 'bg-[#F4EFE0] text-[#1A1A1A] hover:bg-[#E8E0C8]'
                }`}
              >
                <div
                  aria-hidden="true"
                  className={`desktop-${item.id} h-10 w-full border-2 border-[#1A1A1A]`}
                />
                <span className="font-bold text-[11px] flex items-center justify-between">
                  <span>{item.label}</span>
                  <span>{active ? '[*]' : ''}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Display & Effects */}
      <section className="space-y-2.5">
        <h2
          className="text-xs font-bold border-b-2 border-[#1A1A1A] pb-1 m-0"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {copy.displayHeading}
        </h2>
        <div className="border-2 border-[#1A1A1A] divide-y-2 divide-[#1A1A1A] bg-[#E8E0C8]">
          <div className="p-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-[#1A1A1A]">{copy.crtLabel}</div>
              <div className="text-[11px] text-[#4A463B]">{copy.crtDesc}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={crtEnabled}
              data-testid="settings-crt-toggle"
              onClick={toggleCrt}
              className={`px-3 py-1.5 border-2 border-[#1A1A1A] font-bold text-[11px] shrink-0 ${
                crtEnabled
                  ? 'bg-[#1A1A1A] text-[#33FF66]'
                  : 'bg-[#F4EFE0] text-[#1A1A1A] hover:bg-[#D8CFB2]'
              }`}
            >
              {crtEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="p-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-[#1A1A1A]">{copy.reduceMotionLabel}</div>
              <div className="text-[11px] text-[#4A463B]">{copy.reduceMotionDesc}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reduceMotion}
              data-testid="settings-reduce-motion-toggle"
              onClick={toggleReduceMotion}
              className={`px-3 py-1.5 border-2 border-[#1A1A1A] font-bold text-[11px] shrink-0 ${
                reduceMotion
                  ? 'bg-[#2A9D8F] text-[#F4EFE0]'
                  : 'bg-[#F4EFE0] text-[#1A1A1A] hover:bg-[#D8CFB2]'
              }`}
            >
              {reduceMotion ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </section>

      {/* Audio */}
      <section className="space-y-2.5">
        <h2
          className="text-xs font-bold border-b-2 border-[#1A1A1A] pb-1 m-0"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {copy.audioHeading}
        </h2>
        <div className="border-2 border-[#1A1A1A] bg-[#E8E0C8] p-3 flex items-center justify-between gap-3">
          <div>
            <div className="font-bold text-[#1A1A1A]">{copy.soundLabel}</div>
            <div className="text-[11px] text-[#4A463B]">{copy.soundDesc}</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={soundEnabled}
            data-testid="settings-sound-toggle"
            onClick={toggleSound}
            className={`px-3 py-1.5 border-2 border-[#1A1A1A] font-bold text-[11px] shrink-0 ${
              soundEnabled
                ? 'bg-[#2A9D8F] text-[#F4EFE0]'
                : 'bg-[#F4EFE0] text-[#1A1A1A] hover:bg-[#D8CFB2]'
            }`}
          >
            {soundEnabled ? 'ON' : 'MUTED'}
          </button>
        </div>
      </section>

      {/* Progressive Web App (Install & Offline) */}
      <section className="space-y-2.5">
        <h2
          className="text-xs font-bold border-b-2 border-[#1A1A1A] pb-1 m-0"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {SYSTEM_CHROME_COPY.pwa.sectionHeading}
        </h2>
        <PWAInstallButton variant="panel" />
      </section>

      {/* Reset Action */}
      <div className="pt-2 border-t-2 border-[#1A1A1A] flex justify-end">
        <button
          type="button"
          data-testid="settings-reset-btn"
          onClick={resetSettings}
          className="os-btn px-3 py-1.5 text-xs font-bold"
        >
          {copy.resetButton}
        </button>
      </div>
    </div>
  );
}
