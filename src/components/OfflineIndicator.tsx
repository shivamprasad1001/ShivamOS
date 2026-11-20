import React from 'react';
import { SYSTEM_CHROME_COPY } from '../../data/content';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="offline-indicator"
      className="no-print fixed top-10 left-1/2 -translate-x-1/2 z-[85] px-3 py-1.5 bg-[#E4572E] text-[#F4EFE0] border-2 border-[#1A1A1A] shadow-[3px_3px_0_0_#1A1A1A] flex items-center gap-2 text-[11px] font-bold whitespace-nowrap"
    >
      <span className="w-2 h-2 bg-[#F4EFE0] inline-block" aria-hidden="true" />
      <span>{SYSTEM_CHROME_COPY.pwa.offlineBanner}</span>
    </div>
  );
};
