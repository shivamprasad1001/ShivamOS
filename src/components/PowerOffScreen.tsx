import React, { useEffect } from 'react';
import { SITE_META, SYSTEM_CHROME_COPY } from '../../data/content';
import { PowerPixelIcon } from './PixelIcons';

interface PowerOffScreenProps {
  phase: 'shutting-down' | 'off';
  onPowerOn: () => void;
}

export function PowerOffScreen({ phase, onPowerOn }: PowerOffScreenProps) {
  useEffect(() => {
    if (phase !== 'off') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPowerOn();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, onPowerOn]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        phase === 'shutting-down'
          ? SYSTEM_CHROME_COPY.powerScreen.shuttingDownTitle
          : SYSTEM_CHROME_COPY.powerScreen.safeHeadline
      }
      data-testid="power-screen"
      data-power-phase={phase}
      className="fixed inset-0 z-[100] bg-[#0B130B] text-[#E8E0C8] flex items-center justify-center p-6 select-none"
    >
      {phase === 'shutting-down' ? (
        <div className="max-w-lg w-full border-2 border-[#33FF66] bg-[#0B130B] p-6 space-y-3 text-center">
          <div
            className="text-lg sm:text-xl text-[#33FF66]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {SYSTEM_CHROME_COPY.powerScreen.shuttingDownTitle}
          </div>
          <p className="m-0 text-xs text-[#E8E0C8]">
            {SYSTEM_CHROME_COPY.powerScreen.shuttingDownDetail}
          </p>
          <div className="inline-block w-3 h-4 bg-[#33FF66] animate-caret-blink" />
        </div>
      ) : (
        <div className="max-w-xl w-full border-2 border-[#E4572E] bg-[#0B130B] p-8 flex flex-col items-center text-center space-y-5 shadow-[4px_4px_0_0_#1A1A1A]">
          <div className="w-12 h-12 border-2 border-[#E4572E] flex items-center justify-center text-[#E4572E]">
            <PowerPixelIcon size={24} />
          </div>

          <div className="space-y-2">
            <h1
              className="text-base sm:text-xl m-0 text-[#E4572E] leading-snug"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {SYSTEM_CHROME_COPY.powerScreen.safeHeadline}
            </h1>
            <p className="m-0 text-xs text-[#E8E0C8]">
              {SYSTEM_CHROME_COPY.powerScreen.safeSubline} ({SITE_META.ownerName})
            </p>
          </div>

          <button
            type="button"
            onClick={onPowerOn}
            autoFocus
            className="os-btn os-btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2"
          >
            <PowerPixelIcon size={14} className="text-[#F4EFE0]" />
            <span>{SYSTEM_CHROME_COPY.powerScreen.powerOnButton}</span>
          </button>

          <p className="m-0 text-[11px] text-[#D8CFB2]">
            {SYSTEM_CHROME_COPY.powerScreen.powerOnHint}
          </p>
        </div>
      )}
    </div>
  );
}
