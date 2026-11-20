import React from 'react';
import type { ProjectItem } from '../../../data/content';
import { ProjectFilePixelIcon } from '../PixelIcons';

interface ProjectDetailWindowProps {
  project: ProjectItem;
}

export function ProjectDetailWindow({ project }: ProjectDetailWindowProps) {
  const hasResult = Boolean(project.resultMetric || project.resultDetail);
  const hasDemoLink = Boolean(project.links.demo);

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Program / Document Header — populated exclusively from data/content.ts */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#1A1A1A] pb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="border-2 border-[#1A1A1A] bg-[#E8E0C8] p-1.5 shrink-0">
            <ProjectFilePixelIcon type={project.iconType} size={32} />
          </div>
          <div className="min-w-0">
            <h3
              className="text-base sm:text-lg leading-tight text-[#1A1A1A] m-0"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {project.headline}
            </h3>
            <p className="text-xs text-[#4A463B] mt-1 mb-0">
              {project.fileName} · {project.windowKind === 'program' ? 'Program' : 'Document'}
            </p>
          </div>
        </div>

        {project.resultMetric && (
          <div className="border-2 border-[#1A1A1A] bg-[#2A9D8F] text-[#F4EFE0] px-2.5 py-1 text-xs font-bold tabular-nums shrink-0">
            {project.resultMetric}
          </div>
        )}
      </div>

      {/* Structured dossier reading strictly from ProjectItem fields */}
      <div className="space-y-2.5 text-xs sm:text-[13px] leading-relaxed">
        <div>
          <span className="font-bold text-[#E4572E]">Problem: </span>
          <span>{project.problem}</span>
        </div>
        <div>
          <span className="font-bold text-[#1A1A1A]">What I built: </span>
          <span>{project.built}</span>
        </div>
        {hasResult && (
          <div>
            <span className="font-bold text-[#2A9D8F]">Result: </span>
            {project.resultMetric && (
              <span className="font-semibold tabular-nums">
                {project.resultMetric}
                {project.resultDetail ? '. ' : ''}
              </span>
            )}
            {project.resultDetail && <span>{project.resultDetail}</span>}
          </div>
        )}
        <div>
          <span className="font-bold text-[#1A1A1A]">Stack: </span>
          <span className="text-[#4A463B]">{project.stack.join(' · ')}</span>
        </div>
      </div>

      {/* Verified Spec Strip (rendered only when specs exist in content.ts) */}
      {project.specs.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-3 border-2 border-[#1A1A1A] bg-[#E8E0C8] divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-[#1A1A1A] text-xs m-0">
          {project.specs.map((spec) => (
            <div key={spec.label} className="p-2.5">
              <dt className="font-bold text-[11px] text-[#4A463B]">{spec.label}</dt>
              <dd className="m-0 mt-0.5 font-semibold tabular-nums">{spec.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Links — omits demo link if empty in content.ts */}
      <div className="flex flex-wrap items-center gap-3 pt-1 pb-1">
        {project.links.github && (
          <a
            href={project.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="os-btn os-btn-primary px-4 py-1.5 text-xs font-bold no-underline whitespace-nowrap"
          >
            {project.links.githubLabel} ↗
          </a>
        )}
        {hasDemoLink && (
          <a
            href={project.links.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="os-btn os-btn-teal px-4 py-1.5 text-xs font-bold no-underline whitespace-nowrap"
          >
            {project.links.demoLabel || 'Live Link'} ↗
          </a>
        )}
      </div>
    </div>
  );
}
