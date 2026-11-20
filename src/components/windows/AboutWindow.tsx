import React, { useEffect, useState } from 'react';
import { ABOUT_CONTENT, PROJECTS } from '../../../data/content';
import { useWindowStore } from '../../store/windowStore';
import type { ViewportSize } from '../../utils/windowLogic';

interface AboutWindowProps {
  viewport: ViewportSize;
}

const VISITOR_STORAGE_KEY = 'shivamos_local_visits_v2';
const LAST_LOGIN_STORAGE_KEY = 'shivamos_last_login_v1';

export function AboutWindow({ viewport }: AboutWindowProps) {
  const openWindow = useWindowStore((s) => s.openWindow);
  const [visitorCount, setVisitorCount] = useState<number>(1);
  const [lastLogin, setLastLogin] = useState<string>('');

  useEffect(() => {
    const nowFormatted = new Date().toLocaleString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    try {
      const storedCount = window.localStorage.getItem(VISITOR_STORAGE_KEY);
      const parsed = storedCount ? parseInt(storedCount, 10) : 0;
      const nextCount = Number.isFinite(parsed) && parsed >= 0 ? parsed + 1 : 1;
      window.localStorage.setItem(VISITOR_STORAGE_KEY, String(nextCount));
      setVisitorCount(nextCount);

      const prevLogin = window.localStorage.getItem(LAST_LOGIN_STORAGE_KEY);
      setLastLogin(prevLogin || nowFormatted);
      window.localStorage.setItem(LAST_LOGIN_STORAGE_KEY, nowFormatted);
    } catch {
      setVisitorCount(1);
      setLastLogin(nowFormatted);
    }
  }, []);

  const counterDigits = String(visitorCount).padStart(6, '0').split('');

  return (
    <div className="flex flex-col min-h-full justify-between">
      <div className="p-4 sm:p-5 space-y-4">
        {/* Identity Header */}
        <div className="border-b-2 border-[#1A1A1A] pb-3 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1
              className="text-2xl sm:text-3xl leading-none tracking-tight text-[#1A1A1A]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {ABOUT_CONTENT.heading}
            </h1>
            <p className="text-xs sm:text-[13px] font-medium text-[#4A463B] m-0">
              {ABOUT_CONTENT.subline}
            </p>
          </div>
          {/* Pixelated monogram stamp */}
          <div
            aria-hidden="true"
            className="w-12 h-12 border-2 border-[#1A1A1A] bg-[#E8E0C8] flex items-center justify-center shrink-0"
          >
            <svg width="32" height="32" viewBox="0 0 16 16" shapeRendering="crispEdges">
              <rect x="2" y="2" width="12" height="12" fill="#1A1A1A" />
              <rect x="3" y="3" width="10" height="10" fill="#F4EFE0" />
              <rect x="5" y="4" width="6" height="2" fill="#E4572E" />
              <rect x="5" y="6" width="2" height="2" fill="#E4572E" />
              <rect x="5" y="7" width="6" height="2" fill="#1A1A1A" />
              <rect x="9" y="9" width="2" height="2" fill="#2A9D8F" />
              <rect x="5" y="10" width="6" height="2" fill="#2A9D8F" />
            </svg>
          </div>
        </div>

        {/* Plain first-person bio */}
        <div className="space-y-2.5 text-xs sm:text-[13px] leading-relaxed text-[#1A1A1A]">
          {ABOUT_CONTENT.paragraphs.map((para, idx) => (
            <p key={idx} className="m-0">
              {para}
            </p>
          ))}
        </div>

        {/* Compact spec table */}
        <dl className="border-2 border-[#1A1A1A] bg-[#E8E0C8] divide-y-2 divide-[#1A1A1A] text-xs m-0">
          {ABOUT_CONTENT.highlights.map((item) => (
            <div key={item.label} className="grid grid-cols-[108px_minmax(0,1fr)]">
              <dt className="px-2.5 py-1.5 font-bold border-r-2 border-[#1A1A1A] bg-[#F4EFE0]">
                {item.label}
              </dt>
              <dd className="px-2.5 py-1.5 m-0">{item.value}</dd>
            </div>
          ))}
        </dl>

        {/* Action Strip */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => openWindow('projects', viewport)}
            className="os-btn os-btn-primary px-4 py-1.5 text-xs font-bold whitespace-nowrap"
          >
            Open Projects ({PROJECTS.length})
          </button>
          <button
            type="button"
            onClick={() => openWindow('resume', viewport)}
            className="os-btn px-4 py-1.5 text-xs font-bold whitespace-nowrap"
          >
            Read Resume
          </button>
          <button
            type="button"
            onClick={() => openWindow('contact', viewport)}
            className="os-btn px-4 py-1.5 text-xs font-bold whitespace-nowrap"
          >
            Contact
          </button>
        </div>
      </div>

      {/* Retro Last Login + Visitor Counter Footer */}
      <footer className="border-t-2 border-[#1A1A1A] bg-[#E8E0C8] pl-4 pr-7 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#1A1A1A]">
        <div className="tabular-nums">
          <span className="font-bold">Last login:</span> {lastLogin || 'initializing...'} on tty01
        </div>
        <div className="flex items-center gap-2" aria-label={`Visitor number ${visitorCount}`}>
          <span className="font-bold">VISITORS:</span>
          <span className="inline-flex border-2 border-[#1A1A1A] bg-[#0B130B] text-[#33FF66] px-1 py-0.5 gap-0.5 tabular-nums">
            {counterDigits.map((digit, i) => (
              <span
                key={i}
                className="inline-block w-3 text-center leading-none text-sm"
                style={{ fontFamily: 'var(--font-terminal)' }}
              >
                {digit}
              </span>
            ))}
          </span>
        </div>
      </footer>
    </div>
  );
}
