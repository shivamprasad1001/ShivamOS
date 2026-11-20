import React, { useState } from 'react';
import { SYSTEM_CHROME_COPY } from '../../data/content';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useWindowStore } from '../store/windowStore';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'panel';
}

function DownloadPixelIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x="5" y="1" width="2" height="6" fill="currentColor" />
      <rect x="3" y="5" width="2" height="2" fill="currentColor" />
      <rect x="7" y="5" width="2" height="2" fill="currentColor" />
      <rect x="5" y="7" width="2" height="1" fill="currentColor" />
      <rect x="1" y="9" width="10" height="2" fill="currentColor" />
    </svg>
  );
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const pushToast = useWindowStore((s) => s.pushToast);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const copy = SYSTEM_CHROME_COPY.pwa;

  const handleInstallClick = async () => {
    const accepted = await install();
    if (accepted) {
      pushToast('ShivamOS installed.');
    }
  };

  const iosDialog = showIOSGuide ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={copy.iosModalTitle}
      className="fixed inset-0 z-[95] bg-[#1A1A1A]/50 flex items-center justify-center p-4"
      onClick={() => setShowIOSGuide(false)}
    >
      <div
        className="w-full max-w-sm bg-[#F4EFE0] border-2 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] text-[#1A1A1A]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-8 px-2.5 bg-[#1A1A1A] text-[#F4EFE0] flex items-center justify-between border-b-2 border-[#1A1A1A]">
          <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {copy.iosModalTitle}
          </span>
          <button
            type="button"
            aria-label="Close iOS install guide"
            onClick={() => setShowIOSGuide(false)}
            className="w-5 h-5 border-2 border-[#F4EFE0] bg-[#E4572E] text-[#F4EFE0] text-xs font-bold flex items-center justify-center leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-4 space-y-2.5 text-xs">
          <p className="m-0 font-semibold">{copy.iosStep1}</p>
          <p className="m-0 font-semibold">{copy.iosStep2}</p>
          <p className="m-0 font-semibold">{copy.iosStep3}</p>
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="os-btn os-btn-primary px-3 py-1.5 text-xs font-bold"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  if (variant === 'compact') {
    if (isInstalled) return null;

    if (isInstallable) {
      return (
        <button
          type="button"
          data-testid="pwa-install-btn"
          onClick={handleInstallClick}
          title={copy.installButton}
          aria-label={copy.installButton}
          className="h-6 px-2 flex items-center gap-1 text-[11px] font-bold border-2 border-[#1A1A1A] bg-[#E4572E] text-[#F4EFE0] hover:bg-[#1A1A1A] whitespace-nowrap shrink-0"
        >
          <DownloadPixelIcon size={11} />
          <span>{copy.installShort}</span>
        </button>
      );
    }

    if (isIOS) {
      return (
        <>
          <button
            type="button"
            data-testid="pwa-install-ios-btn"
            onClick={() => setShowIOSGuide(true)}
            title={copy.installIosButton}
            aria-label={copy.installIosButton}
            className="h-6 px-2 flex items-center gap-1 text-[11px] font-bold border-2 border-[#1A1A1A] bg-[#2A9D8F] text-[#F4EFE0] hover:bg-[#1A1A1A] whitespace-nowrap shrink-0"
          >
            <DownloadPixelIcon size={11} />
            <span>{copy.installShort}</span>
          </button>
          {iosDialog}
        </>
      );
    }

    return null;
  }

  // Settings panel variant: always informs the user of PWA install availability & status
  return (
    <>
      <div
        data-testid="pwa-settings-panel"
        className="border-2 border-[#1A1A1A] bg-[#E8E0C8] p-3 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="font-bold text-[#1A1A1A]">{copy.installButton}</div>
          <div className="text-[11px] text-[#4A463B]">
            {isInstalled
              ? copy.installedDesc
              : isInstallable
                ? copy.readyDesc
                : isIOS
                  ? copy.iosDesc
                  : copy.manualDesc}
          </div>
        </div>

        {isInstalled ? (
          <span className="px-2.5 py-1 border-2 border-[#1A1A1A] bg-[#2A9D8F] text-[#F4EFE0] text-[10px] font-bold whitespace-nowrap">
            {copy.installedBadge}
          </span>
        ) : isInstallable ? (
          <button
            type="button"
            data-testid="pwa-settings-install-btn"
            onClick={handleInstallClick}
            className="os-btn os-btn-primary px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap"
          >
            <DownloadPixelIcon size={12} />
            <span>{copy.installButton}</span>
          </button>
        ) : isIOS ? (
          <button
            type="button"
            data-testid="pwa-settings-ios-btn"
            onClick={() => setShowIOSGuide(true)}
            className="os-btn os-btn-teal px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap"
          >
            <DownloadPixelIcon size={12} />
            <span>{copy.installIosButton}</span>
          </button>
        ) : (
          <span className="px-2.5 py-1 border-2 border-[#1A1A1A] bg-[#F4EFE0] text-[#1A1A1A] text-[10px] font-bold whitespace-nowrap">
            PWA READY
          </span>
        )}
      </div>
      {iosDialog}
    </>
  );
};
