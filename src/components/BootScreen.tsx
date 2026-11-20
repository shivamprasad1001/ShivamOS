import React, { useEffect, useState } from 'react';
import { BOOT_SEQUENCE_LINES, SITE_META } from '../../data/content';

interface BootScreenProps {
  onComplete: () => void;
}

export function BootScreen({ onComplete }: BootScreenProps) {
  const [visibleLines, setVisibleLines] = useState(1);

  useEffect(() => {
    document.body.classList.add('is-busy');

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setVisibleLines(BOOT_SEQUENCE_LINES.length);
      const t = window.setTimeout(onComplete, 450);
      return () => {
        window.clearTimeout(t);
        document.body.classList.remove('is-busy');
      };
    }

    const lineInterval = window.setInterval(() => {
      setVisibleLines((prev) => Math.min(prev + 1, BOOT_SEQUENCE_LINES.length));
    }, 240);

    const finishTimer = window.setTimeout(() => {
      onComplete();
    }, 2000);

    const handleSkipKey = (e: KeyboardEvent) => {
      e.preventDefault();
      onComplete();
    };

    window.addEventListener('keydown', handleSkipKey);

    return () => {
      window.clearInterval(lineInterval);
      window.clearTimeout(finishTimer);
      window.removeEventListener('keydown', handleSkipKey);
      document.body.classList.remove('is-busy');
    };
  }, [onComplete]);

  const progressPct = Math.round((visibleLines / BOOT_SEQUENCE_LINES.length) * 100);

  return (
    <div
      role="dialog"
      aria-label="ShivamOS Boot Sequence"
      onClick={onComplete}
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[#0B130B] text-[#33FF66] p-6 sm:p-12 select-none"
      style={{ fontFamily: 'var(--font-terminal)' }}
    >
      <div className="max-w-3xl space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#33FF66] pb-3 mb-4">
          <div className="text-2xl sm:text-3xl tracking-wider">
            {SITE_META.osName.toUpperCase()} ROM BIOS v{SITE_META.osVersion}
          </div>
          <div className="text-xl tabular-nums">POST: {progressPct}%</div>
        </div>

        <div className="space-y-1 text-xl sm:text-2xl leading-snug">
          {BOOT_SEQUENCE_LINES.slice(0, visibleLines).map((line, idx) => (
            <p key={idx} className="m-0">
              {line}
            </p>
          ))}
          <p className="m-0 flex items-center gap-2 pt-2">
            <span>BOOTING KERNEL</span>
            <span className="inline-block w-3 h-5 bg-[#33FF66] animate-caret-blink" />
          </p>
        </div>
      </div>

      <div className="max-w-3xl space-y-4">
        <div className="border-2 border-[#33FF66] p-1">
          <div
            className="h-4 bg-[#33FF66]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 text-lg sm:text-xl">
          <span>{SITE_META.ownerName} · {SITE_META.role} · {SITE_META.location}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className="border-2 border-[#33FF66] px-4 py-1 text-[#0B130B] bg-[#33FF66] hover:bg-[#F4EFE0] hover:border-[#F4EFE0] font-bold tracking-wide"
          >
            Skip Boot [Any Key / Click]
          </button>
        </div>
      </div>
    </div>
  );
}
