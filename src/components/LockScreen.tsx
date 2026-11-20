import React, { useEffect, useState } from 'react';
import { SITE_META, SYSTEM_CHROME_COPY } from '../../data/content';
import { LockPixelIcon, OsLogoIcon } from './PixelIcons';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [timeText, setTimeText] = useState('');
  const [dateText, setDateText] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeText(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateText(
        now.toLocaleDateString([], {
          weekday: 'long',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      onUnlock();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onUnlock]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={SYSTEM_CHROME_COPY.lockScreen.badge}
      data-testid="lock-screen"
      onClick={onUnlock}
      className="desktop-dither fixed inset-0 z-[95] flex items-center justify-center p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="os-window animate-window-open w-full max-w-md bg-[#F4EFE0] border-2 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A]"
      >
        {/* Title bar */}
        <div className="h-8 px-3 bg-[#1A1A1A] text-[#F4EFE0] flex items-center justify-between border-b-2 border-[#1A1A1A]">
          <span className="flex items-center gap-2 text-xs" style={{ fontFamily: 'var(--font-display)' }}>
            <OsLogoIcon size={14} />
            {SITE_META.osName} {SITE_META.osVersion}
          </span>
          <span className="text-[10px] font-bold text-[#E8E0C8]">
            {SYSTEM_CHROME_COPY.lockScreen.badge}
          </span>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center space-y-5">
          <div className="p-3 border-2 border-[#1A1A1A] bg-[#E8E0C8] shadow-[2px_2px_0_0_#1A1A1A]">
            <LockPixelIcon size={40} />
          </div>

          <div className="space-y-1">
            <div
              className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight text-[#1A1A1A]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {timeText || '12:00:00 PM'}
            </div>
            <div className="text-xs font-semibold text-[#4A463B]">
              {dateText}
            </div>
          </div>

          <div className="w-full border-2 border-[#1A1A1A] bg-[#E8E0C8] px-3 py-2 text-xs flex items-center justify-between">
            <span className="font-bold">{SITE_META.ownerName}</span>
            <span className="px-1.5 py-0.5 bg-[#2A9D8F] text-[#F4EFE0] border border-[#1A1A1A] text-[10px] font-bold">
              {SYSTEM_CHROME_COPY.lockScreen.guestAccount}
            </span>
          </div>

          <button
            type="button"
            onClick={onUnlock}
            autoFocus
            className="os-btn os-btn-primary w-full py-2.5 px-4 text-xs font-bold tracking-wide"
          >
            {SYSTEM_CHROME_COPY.lockScreen.prompt}
          </button>

          <p className="m-0 text-[11px] text-[#4A463B]">
            {SYSTEM_CHROME_COPY.lockScreen.skipHint}
          </p>
        </div>
      </div>
    </div>
  );
}
