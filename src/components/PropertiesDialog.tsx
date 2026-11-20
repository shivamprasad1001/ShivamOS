import React, { useEffect, useRef } from 'react';
import { SYSTEM_CHROME_COPY } from '../../data/content';
import { useWindowStore } from '../store/windowStore';
import { resolveProperties, type ResolvedProperties } from '../utils/systemLogic';
import { renderDesktopIconGraphic } from './DesktopIconsLayer';
import {
  CertificatePixelIcon,
  DocumentPixelIcon,
  FolderPixelIcon,
  ProjectFilePixelIcon,
} from './PixelIcons';

function renderPropertiesIcon(kind: ResolvedProperties['iconKind'], isTrashEmpty: boolean) {
  if (
    kind === 'agent' ||
    kind === 'vision' ||
    kind === 'detector' ||
    kind === 'transformer' ||
    kind === 'rag'
  ) {
    return <ProjectFilePixelIcon type={kind} size={36} />;
  }
  if (kind === 'document') return <DocumentPixelIcon size={36} />;
  if (kind === 'folder') return <FolderPixelIcon size={36} />;
  if (kind === 'certificate') return <CertificatePixelIcon size={36} />;
  return renderDesktopIconGraphic(kind, isTrashEmpty, 36);
}

export function PropertiesDialog() {
  const propertiesTarget = useWindowStore((s) => s.propertiesTarget);
  const customIconLabels = useWindowStore((s) => s.customIconLabels);
  const customFolders = useWindowStore((s) => s.customFolders);
  const trashItems = useWindowStore((s) => s.trashItems);
  const closeProperties = useWindowStore((s) => s.closeProperties);

  const okButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!propertiesTarget) return;
    okButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeProperties();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [propertiesTarget, closeProperties]);

  if (!propertiesTarget) return null;

  const props = resolveProperties(propertiesTarget, customIconLabels, customFolders);
  if (!props) return null;

  const isTrashEmpty = trashItems.length === 0;
  const copy = SYSTEM_CHROME_COPY.properties;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={props.title}
      data-testid="properties-dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeProperties();
        }
      }}
      className="no-print fixed inset-0 z-[85] bg-[#1A1A1A]/30 flex items-center justify-center p-4"
    >
      <div className="os-window animate-window-open w-full max-w-lg bg-[#F4EFE0] border-2 border-[#1A1A1A] shadow-[4px_4px_0_0_#1A1A1A]">
        {/* Title Bar */}
        <div className="h-8 px-3 bg-[#1A1A1A] text-[#F4EFE0] flex items-center justify-between gap-2 border-b-2 border-[#1A1A1A]">
          <span
            className="text-xs truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {props.title}
          </span>
          <button
            type="button"
            aria-label="Close properties"
            onClick={closeProperties}
            className="w-5 h-5 border-2 border-[#F4EFE0] bg-[#E4572E] text-[#F4EFE0] text-xs font-bold leading-none flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* Header icon + name */}
          <div className="flex items-center gap-3 pb-3 border-b-2 border-[#1A1A1A]">
            <div className="p-2 border-2 border-[#1A1A1A] bg-[#E8E0C8] shrink-0">
              {renderPropertiesIcon(props.iconKind, isTrashEmpty)}
            </div>
            <div className="min-w-0">
              <div
                className="text-sm font-bold break-all"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {props.name}
              </div>
              <div className="text-[11px] text-[#4A463B] mt-0.5">{props.type}</div>
            </div>
          </div>

          {/* Verified metadata table (size omitted; modifiedDate omitted if empty) */}
          <dl className="grid grid-cols-[100px_1fr] gap-y-2 gap-x-3 m-0">
            <dt className="font-bold text-[#4A463B]">{copy.nameLabel}</dt>
            <dd className="m-0 font-semibold break-all">{props.name}</dd>

            <dt className="font-bold text-[#4A463B]">{copy.typeLabel}</dt>
            <dd className="m-0">{props.type}</dd>

            <dt className="font-bold text-[#4A463B]">{copy.locationLabel}</dt>
            <dd className="m-0 font-mono break-all">{props.location}</dd>

            {props.modifiedDate && (
              <>
                <dt className="font-bold text-[#4A463B]">{copy.modifiedLabel}</dt>
                <dd className="m-0 tabular-nums">{props.modifiedDate}</dd>
              </>
            )}

            {props.status && (
              <>
                <dt className="font-bold text-[#4A463B]">{copy.statusLabel}</dt>
                <dd className="m-0 font-semibold text-[#2A9D8F]">{props.status}</dd>
              </>
            )}

            {props.stack && props.stack.length > 0 && (
              <>
                <dt className="font-bold text-[#4A463B]">{copy.stackLabel}</dt>
                <dd className="m-0 flex flex-wrap gap-1">
                  {props.stack.map((tech) => (
                    <span
                      key={tech}
                      className="px-1.5 py-0.5 border border-[#1A1A1A] bg-[#E8E0C8] text-[10px] font-bold"
                    >
                      {tech}
                    </span>
                  ))}
                </dd>
              </>
            )}

            {props.repoUrl && (
              <>
                <dt className="font-bold text-[#4A463B]">{copy.repoLabel}</dt>
                <dd className="m-0 break-words">
                  <a
                    href={props.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold hover:text-[#E4572E]"
                  >
                    {props.repoUrl}
                  </a>
                </dd>
              </>
            )}

            {props.summary && (
              <>
                <dt className="font-bold text-[#4A463B]">{copy.summaryLabel}</dt>
                <dd className="m-0 leading-relaxed">{props.summary}</dd>
              </>
            )}
          </dl>

          {/* Footer */}
          <div className="pt-2 border-t-2 border-[#1A1A1A] flex justify-end">
            <button
              ref={okButtonRef}
              type="button"
              data-testid="properties-ok-btn"
              onClick={closeProperties}
              className="os-btn os-btn-primary px-5 py-1.5 text-xs font-bold"
            >
              {copy.closeButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
