import React from 'react';
import { SITE_META, SKILLS_DATA } from '../../../data/content';

export function SkillsWindow() {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* System Profiler Header — zero progress bars, zero percentage rings */}
      <div className="border-2 border-[#1A1A1A] bg-[#E8E0C8] p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div>
          <div className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            System Profiler · {SITE_META.ownerName}
          </div>
          <div className="text-[#4A463B]">
            Installed ML tooling, frameworks, and day-to-day production usage.
          </div>
        </div>
        <div className="font-bold text-[#2A9D8F] tabular-nums">
          {SKILLS_DATA.reduce((acc, g) => acc + g.items.length, 0)} modules indexed
        </div>
      </div>

      {/* Category Spec Tables */}
      <div className="space-y-4">
        {SKILLS_DATA.map((group) => (
          <section key={group.category} className="border-2 border-[#1A1A1A] bg-[#F4EFE0]">
            <header className="border-b-2 border-[#1A1A1A] bg-[#E8E0C8] px-3 py-1.5 flex items-center justify-between">
              <h3
                className="text-xs font-bold m-0 text-[#1A1A1A]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {group.category}
              </h3>
              <span className="text-[11px] font-semibold text-[#4A463B] tabular-nums">
                {group.items.length} entries
              </span>
            </header>
            <div className="divide-y-2 divide-[#1A1A1A]">
              {group.items.map((item) => (
                <div
                  key={item.name}
                  className="grid grid-cols-1 sm:grid-cols-[184px_1fr] text-xs"
                >
                  <div className="px-3 py-2 font-bold bg-[#F4EFE0] sm:border-r-2 sm:border-[#1A1A1A]">
                    {item.name}
                  </div>
                  <div className="px-3 py-2 text-[#4A463B] sm:text-[#1A1A1A]">
                    {item.usage}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
