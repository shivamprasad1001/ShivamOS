import React from 'react';
import { useWindowStore } from '../store/windowStore';

interface ToastContainerProps {
  isMobile: boolean;
}

export function ToastContainer({ isMobile }: ToastContainerProps) {
  const toasts = useWindowStore((s) => s.toasts);
  const dismissToast = useWindowStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="toast-container"
      className={`no-print fixed right-4 z-[70] flex flex-col gap-2 max-w-[300px] pointer-events-none ${
        isMobile ? 'bottom-4' : 'bottom-12'
      }`}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          data-testid="system-toast"
          className={`pointer-events-auto border-2 border-[#1A1A1A] bg-[#F4EFE0] text-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A] px-3 py-2 flex items-center justify-between gap-3 text-xs font-bold ${
            toast.isLeaving ? 'animate-toast-out' : 'animate-toast-in'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="inline-block w-2 h-2 bg-[#2A9D8F] border border-[#1A1A1A] shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">{toast.message}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(toast.id)}
            className="w-5 h-5 shrink-0 border border-[#1A1A1A] bg-[#E8E0C8] hover:bg-[#1A1A1A] hover:text-[#F4EFE0] flex items-center justify-center text-[11px] leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
