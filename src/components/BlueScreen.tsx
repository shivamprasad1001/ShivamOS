import React, { useEffect } from 'react';
import { BSOD_CONTENT } from '../../data/content';

interface BlueScreenProps {
  onDismiss: (openResume?: boolean) => void;
}

export function BlueScreen({ onDismiss }: BlueScreenProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onDismiss(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onDismiss]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ShivamOS System Exception"
      className="fixed inset-0 z-[100] bg-[#0000AA] text-[#F4EFE0] flex items-center justify-center p-6 sm:p-12"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <span
            className="inline-block bg-[#F4EFE0] text-[#0000AA] px-4 py-1 text-base font-bold tracking-widest"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {BSOD_CONTENT.header}
          </span>
        </div>

        <p className="text-base sm:text-lg font-semibold leading-relaxed">
          {BSOD_CONTENT.headline}
        </p>

        <div className="space-y-3 text-sm sm:text-base leading-relaxed">
          {BSOD_CONTENT.lines.map((line, i) => (
            <p key={i} className="m-0">
              {line}
            </p>
          ))}
        </div>

        <p className="text-xs sm:text-sm border-2 border-[#F4EFE0] p-3 font-semibold tracking-wide">
          {BSOD_CONTENT.errorCode}
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => onDismiss(true)}
            className="px-4 py-2 text-sm font-bold bg-[#F4EFE0] text-[#0000AA] border-2 border-[#F4EFE0] hover:bg-[#E4572E] hover:text-[#F4EFE0] hover:border-[#E4572E]"
          >
            Open Shivam’s Resume Directly
          </button>
          <button
            type="button"
            onClick={() => onDismiss(false)}
            className="px-4 py-2 text-sm font-bold bg-transparent text-[#F4EFE0] border-2 border-[#F4EFE0] hover:bg-[#F4EFE0] hover:text-[#0000AA]"
          >
            Reboot to Desktop [Esc]
          </button>
        </div>
      </div>
    </div>
  );
}
