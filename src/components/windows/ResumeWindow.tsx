import React from 'react';
import {
  generatePlainTextResume,
  PROJECTS,
  RESUME_DATA,
  SKILLS_DATA,
  SYSTEM_CHROME_COPY,
} from '../../../data/content';
import { useWindowStore } from '../../store/windowStore';

export function ResumeWindow() {
  const pushToast = useWindowStore((s) => s.pushToast);

  const handleDownloadTxt = () => {
    const content = generatePlainTextResume();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Shivam_Prasad_Resume_2026.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    pushToast(SYSTEM_CHROME_COPY.toasts.resumeDownloaded);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col min-h-full print-only-resume">
      {/* Document Action Strip */}
      <div className="no-print border-b-2 border-[#1A1A1A] bg-[#E8E0C8] px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold">{RESUME_DATA.fileName} · Read-Only</span>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={RESUME_DATA.header.resumePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="os-btn px-3 py-1 text-xs font-bold whitespace-nowrap no-underline text-[#1A1A1A]"
          >
            Source PDF ↗
          </a>
          <button
            type="button"
            onClick={handleDownloadTxt}
            className="os-btn px-3 py-1 text-xs font-bold whitespace-nowrap"
          >
            Download .TXT
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="os-btn os-btn-primary px-3 py-1 text-xs font-bold whitespace-nowrap"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Resume Sheet */}
      <article className="p-4 sm:p-6 space-y-5 text-xs sm:text-[13px] leading-relaxed">
        <header className="border-b-2 border-[#1A1A1A] pb-3 space-y-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1
              className="text-xl sm:text-2xl m-0"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {RESUME_DATA.header.name}
            </h1>
            <span className="font-bold text-[#2A9D8F]">{RESUME_DATA.header.title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#4A463B]">
            <span>{RESUME_DATA.header.location}</span>
            {RESUME_DATA.header.email && (
              <>
                <span aria-hidden="true">·</span>
                <a
                  href={`mailto:${RESUME_DATA.header.email}`}
                  className="underline text-[#1A1A1A] hover:text-[#E4572E]"
                >
                  {RESUME_DATA.header.email}
                </a>
              </>
            )}
            {RESUME_DATA.header.website && (
              <>
                <span aria-hidden="true">·</span>
                <a
                  href={RESUME_DATA.header.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#1A1A1A] hover:text-[#2A9D8F]"
                >
                  {RESUME_DATA.header.websiteLabel}
                </a>
              </>
            )}
            <span aria-hidden="true">·</span>
            <a
              href={RESUME_DATA.header.github}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[#1A1A1A] hover:text-[#2A9D8F]"
            >
              GitHub
            </a>
            <span aria-hidden="true">·</span>
            <a
              href={RESUME_DATA.header.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[#1A1A1A] hover:text-[#2A9D8F]"
            >
              LinkedIn
            </a>
          </div>
        </header>

        <section className="space-y-1.5">
          <h2
            className="text-xs font-bold border-b border-[#1A1A1A] pb-1 m-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Summary
          </h2>
          <p className="m-0">{RESUME_DATA.summary}</p>
        </section>

        <section className="space-y-2">
          <h2
            className="text-xs font-bold border-b border-[#1A1A1A] pb-1 m-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Technical Skills
          </h2>
          <div className="space-y-1 text-xs">
            {SKILLS_DATA.map((group) => (
              <div key={group.category}>
                <span className="font-bold">{group.category}: </span>
                <span>{group.items.map((item) => item.name).join(', ')}</span>
              </div>
            ))}
          </div>
        </section>

        {RESUME_DATA.experience.length > 0 && (
          <section className="space-y-2">
            <h2
              className="text-xs font-bold border-b border-[#1A1A1A] pb-1 m-0"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Experience
            </h2>
            {RESUME_DATA.experience.map((exp) => (
              <div key={`${exp.company}-${exp.role}`} className="space-y-1.5">
                <div className="flex flex-wrap justify-between gap-2 font-bold">
                  <span>
                    {exp.role} · {exp.company}
                  </span>
                  <span className="tabular-nums">{exp.period}</span>
                </div>
                <ul className="m-0 pl-4 list-disc space-y-1 text-xs">
                  {exp.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        <section className="space-y-3">
          <h2
            className="text-xs font-bold border-b border-[#1A1A1A] pb-1 m-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Projects
          </h2>
          {PROJECTS.map((project) => (
            <div key={project.id} className="space-y-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-bold">{project.headline}</span>
                {project.resultMetric && (
                  <span className="text-xs font-bold text-[#E4572E] tabular-nums">
                    {project.resultMetric}
                  </span>
                )}
              </div>
              <p className="m-0 text-xs">{project.built}</p>
              <p className="m-0 text-[11px] text-[#4A463B]">
                Stack: {project.stack.join(' · ')}
              </p>
            </div>
          ))}
        </section>

        {RESUME_DATA.publications.length > 0 && (
          <section className="space-y-1.5">
            <h2
              className="text-xs font-bold border-b border-[#1A1A1A] pb-1 m-0"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Publications &amp; Research
            </h2>
            <ul className="m-0 pl-4 list-disc space-y-1 text-xs">
              {RESUME_DATA.publications.map((pub) => (
                <li key={pub.title}>
                  <span className="font-bold">{pub.title}</span>, {pub.venue}.
                </li>
              ))}
            </ul>
          </section>
        )}

        {RESUME_DATA.hackathons.length > 0 && (
          <section className="space-y-1.5">
            <h2
              className="text-xs font-bold border-b border-[#1A1A1A] pb-1 m-0"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Competitions &amp; Hackathons
            </h2>
            <ul className="m-0 pl-4 list-disc space-y-1 text-xs">
              {RESUME_DATA.hackathons.map((hack) => (
                <li key={hack.name}>
                  <span className="font-bold">{hack.name}: </span>
                  <span>{hack.description}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-2">
          <h2
            className="text-xs font-bold border-b border-[#1A1A1A] pb-1 m-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Education
          </h2>
          {RESUME_DATA.education.map((edu) => (
            <div key={edu.degree} className="space-y-0.5">
              <div className="flex flex-wrap justify-between gap-2 font-bold">
                <span>{edu.degree}</span>
                <span className="tabular-nums">{edu.period}</span>
              </div>
              <div className="text-xs text-[#4A463B]">{edu.institution}</div>
              {edu.coursework && (
                <div className="text-[11px] text-[#4A463B]">
                  <span className="font-bold text-[#1A1A1A]">Relevant: </span>
                  {edu.coursework}
                </div>
              )}
            </div>
          ))}
        </section>

        <section className="space-y-1">
          <h2
            className="text-xs font-bold border-b border-[#1A1A1A] pb-1 m-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Additional
          </h2>
          <p className="m-0 text-xs">
            <span className="font-bold">Languages: </span>
            <span>{RESUME_DATA.additional.languages}</span>
            <span className="mx-2" aria-hidden="true">|</span>
            <span className="font-bold">Availability: </span>
            <span>{RESUME_DATA.additional.availability}</span>
          </p>
        </section>
      </article>
    </div>
  );
}
