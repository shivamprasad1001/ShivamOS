import React, { useState } from 'react';
import { PROJECTS, SYSTEM_CHROME_COPY, type ProjectItem } from '../../../data/content';
import { useWindowStore } from '../../store/windowStore';
import type { ViewportSize } from '../../utils/windowLogic';
import { ProjectFilePixelIcon } from '../PixelIcons';

interface ProjectsFolderWindowProps {
  viewport: ViewportSize;
}

export function ProjectsFolderWindow({ viewport }: ProjectsFolderWindowProps) {
  const openWindow = useWindowStore((s) => s.openWindow);
  const openProperties = useWindowStore((s) => s.openProperties);
  const [viewMode, setViewMode] = useState<'icons' | 'list'>('icons');
  const [selectedId, setSelectedId] = useState<ProjectItem['id'] | null>(null);

  const handleOpenProject = (project: ProjectItem) => {
    setSelectedId(project.id);
    openWindow(project.id, viewport);
  };

  const handleInspectProject = (project: ProjectItem) => {
    setSelectedId(project.id);
    openProperties({ kind: 'project', projectId: project.id });
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Folder Status / Toolbar Bar */}
      <div className="border-b-2 border-[#1A1A1A] bg-[#E8E0C8] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="font-semibold tabular-nums">
          C:\SHIVAM\PROJECTS · {PROJECTS.length} items
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Folder view mode">
          <button
            type="button"
            onClick={() => setViewMode('icons')}
            aria-pressed={viewMode === 'icons'}
            className={`px-2.5 py-1 text-[11px] font-bold border-2 border-[#1A1A1A] ${
              viewMode === 'icons'
                ? 'bg-[#1A1A1A] text-[#F4EFE0]'
                : 'bg-[#F4EFE0] text-[#1A1A1A] hover:bg-[#D8CFB2]'
            }`}
          >
            Icons
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            className={`px-2.5 py-1 text-[11px] font-bold border-2 border-[#1A1A1A] ${
              viewMode === 'list'
                ? 'bg-[#1A1A1A] text-[#F4EFE0]'
                : 'bg-[#F4EFE0] text-[#1A1A1A] hover:bg-[#D8CFB2]'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Folder Canvas */}
      <div className="p-4 sm:p-6 flex-1">
        <p className="text-xs text-[#4A463B] mb-4 mt-0">
          Select any file below to open its project window, or click Properties for metadata.
        </p>

        {viewMode === 'icons' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PROJECTS.map((project) => {
              const isSelected = selectedId === project.id;
              return (
                <div
                  key={project.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleInspectProject(project);
                  }}
                  className={`border-2 border-[#1A1A1A] flex flex-col justify-between transition-none ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-[#F4EFE0]'
                      : 'bg-[#F4EFE0] text-[#1A1A1A] hover:bg-[#E8E0C8]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenProject(project)}
                    className="p-4 flex flex-col items-center gap-3 text-center flex-1"
                  >
                    <div className="p-1 bg-[#F4EFE0] border-2 border-[#1A1A1A]">
                      <ProjectFilePixelIcon type={project.iconType} size={40} />
                    </div>
                    <div className="space-y-1 w-full">
                      <div
                        className="text-xs font-bold break-all"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {project.fileName}
                      </div>
                      {project.resultMetric && (
                        <div
                          className={`text-[11px] font-semibold tabular-nums ${
                            isSelected ? 'text-[#33FF66]' : 'text-[#2A9D8F]'
                          }`}
                        >
                          {project.resultMetric}
                        </div>
                      )}
                      <div
                        className={`text-[11px] ${
                          isSelected ? 'text-[#E8E0C8]' : 'text-[#4A463B]'
                        }`}
                      >
                        {project.windowKind === 'program' ? 'Program' : 'Document'}
                      </div>
                    </div>
                  </button>
                  <div className="border-t-2 border-[#1A1A1A] bg-[#E8E0C8] px-2 py-1.5 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenProject(project)}
                      className="os-btn os-btn-primary px-2 py-0.5 text-[10px] font-bold flex-1"
                    >
                      {SYSTEM_CHROME_COPY.explorer.openAction}
                    </button>
                    <button
                      type="button"
                      data-project-properties={project.id}
                      onClick={() => handleInspectProject(project)}
                      className="os-btn px-2 py-0.5 text-[10px] font-bold"
                    >
                      {SYSTEM_CHROME_COPY.explorer.propertiesAction}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-[#1A1A1A] bg-[#F4EFE0]">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-3 py-2 border-b-2 border-[#1A1A1A] bg-[#E8E0C8] text-[11px] font-bold">
              <span>Name</span>
              <span>Status / Result</span>
              <span>Type</span>
              <span>Info</span>
            </div>
            <div className="divide-y-2 divide-[#1A1A1A]">
              {PROJECTS.map((project) => (
                <div
                  key={project.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleInspectProject(project);
                  }}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-3 py-2 text-xs hover:bg-[#E8E0C8]"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenProject(project)}
                    className="flex items-center gap-2.5 font-bold min-w-0 text-left hover:underline"
                  >
                    <ProjectFilePixelIcon type={project.iconType} size={20} className="shrink-0" />
                    <span className="truncate">{project.fileName}</span>
                  </button>
                  <span className="tabular-nums text-[11px] font-semibold whitespace-nowrap">
                    {project.resultMetric || '—'}
                  </span>
                  <span className="text-[11px] whitespace-nowrap opacity-80">
                    {project.windowKind === 'program' ? 'Program' : 'Document'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleInspectProject(project)}
                    className="os-btn px-2 py-0.5 text-[10px] font-bold whitespace-nowrap"
                  >
                    {SYSTEM_CHROME_COPY.explorer.propertiesAction}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
