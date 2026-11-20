import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Hand-drawn style 32x32 pixel-art inline SVGs with crisp-edges rendering.
 * Zero emojis used anywhere as icons.
 */

export function OsLogoIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      <rect x="2" y="1" width="12" height="14" fill="#1A1A1A" />
      <rect x="3" y="2" width="10" height="12" fill="#F4EFE0" />
      <rect x="4" y="3" width="8" height="6" fill="#1A1A1A" />
      <rect x="5" y="4" width="6" height="4" fill="#2A9D8F" />
      <rect x="6" y="5" width="1" height="1" fill="#F4EFE0" />
      <rect x="9" y="5" width="1" height="1" fill="#F4EFE0" />
      <rect x="6" y="7" width="4" height="1" fill="#F4EFE0" />
      <rect x="4" y="11" width="5" height="1" fill="#1A1A1A" />
      <rect x="10" y="11" width="2" height="1" fill="#E4572E" />
    </svg>
  );
}

export function AboutPixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      {/* Classic ID / Floppy card */}
      <rect x="4" y="3" width="24" height="26" fill="#1A1A1A" />
      <rect x="6" y="5" width="20" height="22" fill="#F4EFE0" />
      {/* Top accent stripe */}
      <rect x="6" y="5" width="20" height="4" fill="#E4572E" />
      <rect x="6" y="9" width="20" height="2" fill="#1A1A1A" />
      {/* Pixel portrait silhouette */}
      <rect x="13" y="13" width="6" height="5" fill="#1A1A1A" />
      <rect x="14" y="14" width="4" height="3" fill="#E8E0C8" />
      <rect x="10" y="19" width="12" height="4" fill="#2A9D8F" />
      <rect x="10" y="19" width="12" height="1" fill="#1A1A1A" />
      {/* Info lines */}
      <rect x="8" y="24" width="16" height="2" fill="#1A1A1A" />
    </svg>
  );
}

export function FolderPixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      {/* Tab */}
      <rect x="3" y="6" width="11" height="4" fill="#1A1A1A" />
      <rect x="5" y="8" width="7" height="2" fill="#E4572E" />
      {/* Main folder body */}
      <rect x="3" y="10" width="26" height="17" fill="#1A1A1A" />
      <rect x="5" y="12" width="22" height="13" fill="#F4EFE0" />
      <rect x="5" y="12" width="22" height="3" fill="#D8CFB2" />
      <rect x="5" y="15" width="22" height="2" fill="#1A1A1A" />
      {/* Label notch */}
      <rect x="11" y="19" width="10" height="3" fill="#2A9D8F" />
    </svg>
  );
}

export function DocumentPixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      {/* Page outline with dog-ear */}
      <rect x="5" y="3" width="16" height="26" fill="#1A1A1A" />
      <rect x="21" y="9" width="6" height="20" fill="#1A1A1A" />
      <rect x="21" y="5" width="2" height="4" fill="#1A1A1A" />
      <rect x="23" y="7" width="2" height="2" fill="#1A1A1A" />
      {/* Paper fill */}
      <rect x="7" y="5" width="12" height="22" fill="#F4EFE0" />
      <rect x="19" y="11" width="6" height="16" fill="#F4EFE0" />
      {/* Folded corner */}
      <rect x="19" y="5" width="2" height="6" fill="#1A1A1A" />
      <rect x="19" y="9" width="6" height="2" fill="#1A1A1A" />
      <rect x="21" y="7" width="2" height="2" fill="#D8CFB2" />
      {/* Text lines */}
      <rect x="9" y="9" width="8" height="2" fill="#E4572E" />
      <rect x="9" y="14" width="13" height="2" fill="#1A1A1A" />
      <rect x="9" y="18" width="13" height="2" fill="#1A1A1A" />
      <rect x="9" y="22" width="9" height="2" fill="#1A1A1A" />
    </svg>
  );
}

export function SkillsPixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      {/* CPU / ML Chip pins */}
      <rect x="10" y="3" width="2" height="4" fill="#1A1A1A" />
      <rect x="15" y="3" width="2" height="4" fill="#1A1A1A" />
      <rect x="20" y="3" width="2" height="4" fill="#1A1A1A" />
      <rect x="10" y="25" width="2" height="4" fill="#1A1A1A" />
      <rect x="15" y="25" width="2" height="4" fill="#1A1A1A" />
      <rect x="20" y="25" width="2" height="4" fill="#1A1A1A" />
      <rect x="3" y="10" width="4" height="2" fill="#1A1A1A" />
      <rect x="3" y="15" width="4" height="2" fill="#1A1A1A" />
      <rect x="3" y="20" width="4" height="2" fill="#1A1A1A" />
      <rect x="25" y="10" width="4" height="2" fill="#1A1A1A" />
      <rect x="25" y="15" width="4" height="2" fill="#1A1A1A" />
      <rect x="25" y="20" width="4" height="2" fill="#1A1A1A" />
      {/* Chip body */}
      <rect x="7" y="7" width="18" height="18" fill="#1A1A1A" />
      <rect x="9" y="9" width="14" height="14" fill="#F4EFE0" />
      <rect x="11" y="11" width="10" height="10" fill="#2A9D8F" />
      <rect x="13" y="13" width="6" height="6" fill="#1A1A1A" />
      <rect x="15" y="15" width="2" height="2" fill="#E4572E" />
    </svg>
  );
}

export function ContactPixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      <rect x="3" y="7" width="26" height="18" fill="#1A1A1A" />
      <rect x="5" y="9" width="22" height="14" fill="#F4EFE0" />
      {/* Envelope V flap */}
      <rect x="5" y="9" width="3" height="2" fill="#1A1A1A" />
      <rect x="8" y="11" width="3" height="2" fill="#1A1A1A" />
      <rect x="11" y="13" width="3" height="2" fill="#1A1A1A" />
      <rect x="14" y="15" width="4" height="2" fill="#1A1A1A" />
      <rect x="18" y="13" width="3" height="2" fill="#1A1A1A" />
      <rect x="21" y="11" width="3" height="2" fill="#1A1A1A" />
      <rect x="24" y="9" width="3" height="2" fill="#1A1A1A" />
      {/* Wax stamp */}
      <rect x="14" y="17" width="4" height="4" fill="#E4572E" />
    </svg>
  );
}

export function TerminalPixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      {/* Monitor frame */}
      <rect x="3" y="4" width="26" height="20" fill="#1A1A1A" />
      <rect x="5" y="6" width="22" height="16" fill="#F4EFE0" />
      {/* CRT screen */}
      <rect x="7" y="8" width="18" height="12" fill="#0B130B" />
      {/* Green prompt >_ */}
      <rect x="9" y="11" width="2" height="2" fill="#33FF66" />
      <rect x="11" y="13" width="2" height="2" fill="#33FF66" />
      <rect x="9" y="15" width="2" height="2" fill="#33FF66" />
      <rect x="15" y="15" width="5" height="2" fill="#33FF66" />
      {/* Monitor stand */}
      <rect x="12" y="24" width="8" height="2" fill="#1A1A1A" />
      <rect x="8" y="26" width="16" height="3" fill="#1A1A1A" />
      <rect x="10" y="27" width="12" height="1" fill="#D8CFB2" />
    </svg>
  );
}

export function TrashPixelIcon({
  size = 32,
  className = '',
  isEmpty = false,
}: IconProps & { isEmpty?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      {/* Handle */}
      <rect x="12" y="4" width="8" height="2" fill="#1A1A1A" />
      <rect x="12" y="6" width="2" height="2" fill="#1A1A1A" />
      <rect x="18" y="6" width="2" height="2" fill="#1A1A1A" />
      {/* Paper peeking out when not empty */}
      {!isEmpty && (
        <>
          <rect x="9" y="6" width="4" height="2" fill="#E4572E" />
          <rect x="19" y="5" width="4" height="3" fill="#2A9D8F" />
        </>
      )}
      {/* Lid */}
      <rect x="6" y="8" width="20" height="3" fill="#1A1A1A" />
      <rect x="8" y="9" width="16" height="1" fill="#F4EFE0" />
      {/* Can body */}
      <rect x="8" y="11" width="16" height="17" fill="#1A1A1A" />
      <rect x="10" y="13" width="12" height="13" fill="#F4EFE0" />
      {/* Vertical ribs */}
      <rect x="12" y="15" width="2" height="9" fill="#1A1A1A" />
      <rect x="15" y="15" width="2" height="9" fill="#1A1A1A" />
      <rect x="18" y="15" width="2" height="9" fill="#1A1A1A" />
    </svg>
  );
}

export function ProjectFilePixelIcon({
  type,
  size = 32,
  className = '',
}: IconProps & { type: 'detector' | 'transformer' | 'rag' | 'agent' | 'vision' }) {
  if (type === 'agent') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        shapeRendering="crispEdges"
        className={`pixel-crisp ${className}`}
        aria-hidden="true"
      >
        <rect x="4" y="4" width="24" height="24" fill="#1A1A1A" />
        <rect x="6" y="6" width="20" height="20" fill="#F4EFE0" />
        {/* Multi-agent orchestrator hub + 4 specialist nodes */}
        <rect x="14" y="14" width="4" height="4" fill="#E4572E" />
        {/* Connectors */}
        <rect x="11" y="11" width="3" height="2" fill="#1A1A1A" />
        <rect x="18" y="11" width="3" height="2" fill="#1A1A1A" />
        <rect x="11" y="19" width="3" height="2" fill="#1A1A1A" />
        <rect x="18" y="19" width="3" height="2" fill="#1A1A1A" />
        {/* Specialist agent nodes */}
        <rect x="8" y="8" width="4" height="4" fill="#2A9D8F" />
        <rect x="20" y="8" width="4" height="4" fill="#2A9D8F" />
        <rect x="8" y="20" width="4" height="4" fill="#1A1A1A" />
        <rect x="20" y="20" width="4" height="4" fill="#2A9D8F" />
      </svg>
    );
  }

  if (type === 'vision') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        shapeRendering="crispEdges"
        className={`pixel-crisp ${className}`}
        aria-hidden="true"
      >
        <rect x="4" y="4" width="24" height="24" fill="#1A1A1A" />
        <rect x="6" y="6" width="20" height="20" fill="#F4EFE0" />
        {/* Textile weave grid */}
        <rect x="8" y="10" width="16" height="1" fill="#D8CFB2" />
        <rect x="8" y="15" width="16" height="1" fill="#D8CFB2" />
        <rect x="8" y="20" width="16" height="1" fill="#D8CFB2" />
        <rect x="11" y="8" width="1" height="16" fill="#D8CFB2" />
        <rect x="16" y="8" width="1" height="16" fill="#D8CFB2" />
        <rect x="21" y="8" width="1" height="16" fill="#D8CFB2" />
        {/* Grad-CAM heatmap hotspot */}
        <rect x="11" y="11" width="10" height="10" fill="#2A9D8F" />
        <rect x="13" y="13" width="6" height="6" fill="#E4572E" />
        <rect x="15" y="15" width="2" height="2" fill="#F4EFE0" />
      </svg>
    );
  }

  if (type === 'detector') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        shapeRendering="crispEdges"
        className={`pixel-crisp ${className}`}
        aria-hidden="true"
      >
        <rect x="4" y="4" width="24" height="24" fill="#1A1A1A" />
        <rect x="6" y="6" width="20" height="20" fill="#F4EFE0" />
        {/* Bounding box reticle */}
        <rect x="8" y="8" width="6" height="2" fill="#E4572E" />
        <rect x="8" y="8" width="2" height="6" fill="#E4572E" />
        <rect x="18" y="8" width="6" height="2" fill="#E4572E" />
        <rect x="22" y="8" width="2" height="6" fill="#E4572E" />
        <rect x="8" y="22" width="6" height="2" fill="#E4572E" />
        <rect x="8" y="18" width="2" height="6" fill="#E4572E" />
        <rect x="18" y="22" width="6" height="2" fill="#E4572E" />
        <rect x="22" y="18" width="2" height="6" fill="#E4572E" />
        {/* Target object */}
        <rect x="13" y="13" width="6" height="6" fill="#2A9D8F" />
        <rect x="15" y="15" width="2" height="2" fill="#1A1A1A" />
      </svg>
    );
  }

  if (type === 'transformer') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        shapeRendering="crispEdges"
        className={`pixel-crisp ${className}`}
        aria-hidden="true"
      >
        <rect x="4" y="4" width="24" height="24" fill="#1A1A1A" />
        <rect x="6" y="6" width="20" height="20" fill="#F4EFE0" />
        {/* Attention matrix lower-triangular mask */}
        <rect x="9" y="9" width="4" height="4" fill="#2A9D8F" />
        <rect x="9" y="14" width="4" height="4" fill="#1A1A1A" />
        <rect x="14" y="14" width="4" height="4" fill="#E4572E" />
        <rect x="9" y="19" width="4" height="4" fill="#1A1A1A" />
        <rect x="14" y="19" width="4" height="4" fill="#1A1A1A" />
        <rect x="19" y="19" width="4" height="4" fill="#2A9D8F" />
        {/* Masked upper cells */}
        <rect x="14" y="9" width="4" height="4" fill="#D8CFB2" />
        <rect x="19" y="9" width="4" height="4" fill="#D8CFB2" />
        <rect x="19" y="14" width="4" height="4" fill="#D8CFB2" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      <rect x="4" y="4" width="24" height="24" fill="#1A1A1A" />
      <rect x="6" y="6" width="20" height="20" fill="#F4EFE0" />
      {/* RAG Document + Vector Index nodes */}
      <rect x="8" y="8" width="16" height="4" fill="#2A9D8F" />
      <rect x="8" y="14" width="7" height="4" fill="#1A1A1A" />
      <rect x="17" y="14" width="7" height="4" fill="#E4572E" />
      <rect x="8" y="20" width="11" height="4" fill="#1A1A1A" />
      <rect x="21" y="20" width="3" height="4" fill="#2A9D8F" />
    </svg>
  );
}

export function SpeakerPixelIcon({
  enabled,
  size = 16,
}: {
  enabled: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      shapeRendering="crispEdges"
      className="pixel-crisp"
      aria-hidden="true"
    >
      <rect x="2" y="6" width="3" height="4" fill="#1A1A1A" />
      <rect x="5" y="4" width="2" height="8" fill="#1A1A1A" />
      <rect x="7" y="2" width="2" height="12" fill="#1A1A1A" />
      {enabled ? (
        <>
          <rect x="11" y="5" width="1" height="6" fill="#2A9D8F" />
          <rect x="13" y="3" width="1" height="10" fill="#2A9D8F" />
        </>
      ) : (
        <>
          <rect x="11" y="5" width="1" height="1" fill="#E4572E" />
          <rect x="12" y="6" width="1" height="1" fill="#E4572E" />
          <rect x="13" y="7" width="1" height="2" fill="#E4572E" />
          <rect x="12" y="9" width="1" height="1" fill="#E4572E" />
          <rect x="11" y="10" width="1" height="1" fill="#E4572E" />
          <rect x="14" y="5" width="1" height="1" fill="#E4572E" />
          <rect x="14" y="10" width="1" height="1" fill="#E4572E" />
        </>
      )}
    </svg>
  );
}

export function CrtPixelIcon({
  enabled,
  size = 16,
}: {
  enabled: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      shapeRendering="crispEdges"
      className="pixel-crisp"
      aria-hidden="true"
    >
      <rect x="1" y="2" width="14" height="10" fill="#1A1A1A" />
      <rect x="3" y="4" width="10" height="6" fill={enabled ? '#33FF66' : '#E8E0C8'} />
      <rect x="3" y="6" width="10" height="1" fill="#1A1A1A" />
      <rect x="3" y="8" width="10" height="1" fill="#1A1A1A" />
      <rect x="6" y="12" width="4" height="1" fill="#1A1A1A" />
      <rect x="4" y="13" width="8" height="2" fill="#1A1A1A" />
    </svg>
  );
}

export function GamesPixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      {/* Retro Gamepad */}
      <rect x="3" y="9" width="26" height="14" fill="#1A1A1A" />
      <rect x="5" y="11" width="22" height="10" fill="#F4EFE0" />
      <rect x="5" y="23" width="6" height="3" fill="#1A1A1A" />
      <rect x="21" y="23" width="6" height="3" fill="#1A1A1A" />
      {/* D-pad */}
      <rect x="9" y="13" width="2" height="6" fill="#1A1A1A" />
      <rect x="7" y="15" width="6" height="2" fill="#1A1A1A" />
      {/* Center select/start */}
      <rect x="14" y="17" width="2" height="2" fill="#2A9D8F" />
      <rect x="17" y="17" width="2" height="2" fill="#2A9D8F" />
      {/* A/B action buttons */}
      <rect x="21" y="16" width="2" height="2" fill="#E4572E" />
      <rect x="24" y="14" width="2" height="2" fill="#E4572E" />
    </svg>
  );
}

export function PaintPixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      {/* Easel / Canvas frame */}
      <rect x="3" y="4" width="26" height="24" fill="#1A1A1A" />
      <rect x="5" y="6" width="22" height="20" fill="#F4EFE0" />
      {/* Pixel swatches */}
      <rect x="7" y="8" width="5" height="5" fill="#E4572E" />
      <rect x="13" y="8" width="5" height="5" fill="#2A9D8F" />
      <rect x="19" y="8" width="6" height="5" fill="#1A1A1A" />
      {/* Pixel brush diagonal */}
      <rect x="8" y="21" width="4" height="3" fill="#E4572E" />
      <rect x="12" y="19" width="3" height="3" fill="#1A1A1A" />
      <rect x="15" y="17" width="4" height="3" fill="#D8CFB2" />
      <rect x="19" y="15" width="5" height="3" fill="#1A1A1A" />
    </svg>
  );
}

export function NotesPixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      {/* Spiral notebook */}
      <rect x="5" y="4" width="22" height="25" fill="#1A1A1A" />
      <rect x="7" y="8" width="18" height="19" fill="#F4EFE0" />
      <rect x="7" y="6" width="18" height="2" fill="#2A9D8F" />
      {/* Spiral rings */}
      <rect x="8" y="2" width="2" height="4" fill="#1A1A1A" />
      <rect x="13" y="2" width="2" height="4" fill="#1A1A1A" />
      <rect x="18" y="2" width="2" height="4" fill="#1A1A1A" />
      <rect x="22" y="2" width="2" height="4" fill="#1A1A1A" />
      {/* Ruled lines */}
      <rect x="9" y="12" width="14" height="2" fill="#1A1A1A" />
      <rect x="9" y="16" width="11" height="2" fill="#1A1A1A" />
      <rect x="9" y="20" width="13" height="2" fill="#E4572E" />
    </svg>
  );
}

export function SnakePixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      <rect x="4" y="4" width="24" height="24" fill="#1A1A1A" />
      <rect x="6" y="6" width="20" height="20" fill="#0B130B" />
      {/* Snake body */}
      <rect x="8" y="18" width="10" height="4" fill="#33FF66" />
      <rect x="14" y="10" width="4" height="8" fill="#33FF66" />
      <rect x="14" y="10" width="8" height="4" fill="#33FF66" />
      {/* Eye */}
      <rect x="20" y="11" width="1" height="1" fill="#0B130B" />
      {/* Food pellet */}
      <rect x="22" y="18" width="3" height="3" fill="#E4572E" />
    </svg>
  );
}

export function MinePixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      <rect x="4" y="4" width="24" height="24" fill="#1A1A1A" />
      <rect x="6" y="6" width="20" height="20" fill="#E8E0C8" />
      {/* Mine spikes */}
      <rect x="15" y="8" width="2" height="16" fill="#1A1A1A" />
      <rect x="8" y="15" width="16" height="2" fill="#1A1A1A" />
      <rect x="10" y="10" width="12" height="12" fill="#1A1A1A" />
      <rect x="12" y="12" width="3" height="3" fill="#F4EFE0" />
      <rect x="17" y="17" width="3" height="3" fill="#E4572E" />
    </svg>
  );
}

export function PongPixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      <rect x="4" y="4" width="24" height="24" fill="#1A1A1A" />
      <rect x="6" y="6" width="20" height="20" fill="#0B130B" />
      {/* Left paddle */}
      <rect x="8" y="10" width="2" height="8" fill="#33FF66" />
      {/* Center net */}
      <rect x="15" y="8" width="2" height="3" fill="#2A9D8F" />
      <rect x="15" y="14" width="2" height="3" fill="#2A9D8F" />
      <rect x="15" y="20" width="2" height="3" fill="#2A9D8F" />
      {/* Right paddle */}
      <rect x="22" y="14" width="2" height="8" fill="#33FF66" />
      {/* Ball */}
      <rect x="18" y="11" width="3" height="3" fill="#E4572E" />
    </svg>
  );
}

export function TetrisPixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      <rect x="4" y="4" width="24" height="24" fill="#1A1A1A" />
      <rect x="6" y="6" width="20" height="20" fill="#0B130B" />
      {/* Falling T-tetromino (phosphor green) */}
      <rect x="14" y="8" width="4" height="4" fill="#33FF66" />
      <rect x="10" y="12" width="12" height="4" fill="#33FF66" />
      {/* Stacked bottom blocks (teal, tomato, cream) */}
      <rect x="8" y="20" width="8" height="4" fill="#2A9D8F" />
      <rect x="16" y="20" width="4" height="4" fill="#E4572E" />
      <rect x="20" y="16" width="4" height="8" fill="#F4EFE0" />
    </svg>
  );
}

export function MineFlagIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      shapeRendering="crispEdges"
      className="pixel-crisp"
      aria-hidden="true"
    >
      <rect x="6" y="2" width="2" height="9" fill="#1A1A1A" />
      <rect x="2" y="2" width="5" height="5" fill="#E4572E" />
      <rect x="3" y="11" width="8" height="2" fill="#1A1A1A" />
    </svg>
  );
}

export function MineBombIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      shapeRendering="crispEdges"
      className="pixel-crisp"
      aria-hidden="true"
    >
      <rect x="6" y="1" width="2" height="12" fill="#1A1A1A" />
      <rect x="1" y="6" width="12" height="2" fill="#1A1A1A" />
      <rect x="3" y="3" width="8" height="8" fill="#1A1A1A" />
      <rect x="5" y="5" width="2" height="2" fill="#F4EFE0" />
    </svg>
  );
}

/** Decorative pixel Wi-Fi indicator (clearly marked decorative — not real telemetry) */
export function WifiPixelIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      shapeRendering="crispEdges"
      className="pixel-crisp"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="12" height="2" fill="#1A1A1A" />
      <rect x="4" y="7" width="8" height="2" fill="#1A1A1A" />
      <rect x="6" y="10" width="4" height="2" fill="#2A9D8F" />
      <rect x="7" y="13" width="2" height="2" fill="#1A1A1A" />
    </svg>
  );
}

/** Decorative pixel battery indicator (clearly marked decorative — not real telemetry) */
export function BatteryPixelIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      shapeRendering="crispEdges"
      className="pixel-crisp"
      aria-hidden="true"
    >
      <rect x="1" y="4" width="12" height="8" fill="#1A1A1A" />
      <rect x="13" y="6" width="2" height="4" fill="#1A1A1A" />
      <rect x="2" y="5" width="10" height="6" fill="#F4EFE0" />
      <rect x="3" y="6" width="2" height="4" fill="#2A9D8F" />
      <rect x="6" y="6" width="2" height="4" fill="#2A9D8F" />
      <rect x="9" y="6" width="2" height="4" fill="#2A9D8F" />
    </svg>
  );
}

export function ExplorerPixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      <rect x="4" y="4" width="24" height="24" fill="#1A1A1A" />
      <rect x="6" y="6" width="20" height="20" fill="#F4EFE0" />
      <rect x="6" y="6" width="20" height="4" fill="#2A9D8F" />
      <rect x="6" y="10" width="20" height="2" fill="#1A1A1A" />
      {/* Left tree pane */}
      <rect x="13" y="12" width="2" height="14" fill="#1A1A1A" />
      <rect x="8" y="14" width="4" height="2" fill="#E4572E" />
      <rect x="8" y="18" width="4" height="2" fill="#1A1A1A" />
      <rect x="8" y="22" width="4" height="2" fill="#1A1A1A" />
      {/* Right list pane */}
      <rect x="17" y="14" width="7" height="2" fill="#1A1A1A" />
      <rect x="17" y="18" width="5" height="2" fill="#1A1A1A" />
      <rect x="17" y="22" width="7" height="2" fill="#2A9D8F" />
    </svg>
  );
}

export function SettingsPixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      <rect x="4" y="4" width="24" height="24" fill="#1A1A1A" />
      <rect x="6" y="6" width="20" height="20" fill="#F4EFE0" />
      {/* Three retro slider tracks */}
      <rect x="8" y="10" width="16" height="2" fill="#1A1A1A" />
      <rect x="11" y="8" width="4" height="6" fill="#E4572E" />
      <rect x="8" y="16" width="16" height="2" fill="#1A1A1A" />
      <rect x="18" y="14" width="4" height="6" fill="#2A9D8F" />
      <rect x="8" y="22" width="16" height="2" fill="#1A1A1A" />
      <rect x="13" y="20" width="4" height="6" fill="#1A1A1A" />
    </svg>
  );
}

export function PowerPixelIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      <rect x="7" y="1" width="2" height="7" fill="currentColor" />
      <rect x="4" y="3" width="2" height="2" fill="currentColor" />
      <rect x="10" y="3" width="2" height="2" fill="currentColor" />
      <rect x="2" y="5" width="2" height="6" fill="currentColor" />
      <rect x="12" y="5" width="2" height="6" fill="currentColor" />
      <rect x="4" y="11" width="2" height="2" fill="currentColor" />
      <rect x="10" y="11" width="2" height="2" fill="currentColor" />
      <rect x="6" y="12" width="4" height="2" fill="currentColor" />
    </svg>
  );
}

export function LockPixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      {/* Shackle */}
      <rect x="10" y="4" width="12" height="3" fill="#1A1A1A" />
      <rect x="8" y="7" width="3" height="7" fill="#1A1A1A" />
      <rect x="21" y="7" width="3" height="7" fill="#1A1A1A" />
      {/* Body */}
      <rect x="5" y="14" width="22" height="14" fill="#1A1A1A" />
      <rect x="7" y="16" width="18" height="10" fill="#F4EFE0" />
      {/* Keyhole */}
      <rect x="14" y="18" width="4" height="4" fill="#E4572E" />
      <rect x="15" y="22" width="2" height="3" fill="#1A1A1A" />
    </svg>
  );
}

export function CertificatePixelIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="crispEdges"
      className={`pixel-crisp ${className}`}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="26" height="20" fill="#1A1A1A" />
      <rect x="5" y="7" width="22" height="16" fill="#F4EFE0" />
      <rect x="8" y="10" width="12" height="2" fill="#1A1A1A" />
      <rect x="8" y="14" width="10" height="2" fill="#1A1A1A" />
      <rect x="8" y="18" width="8" height="2" fill="#2A9D8F" />
      {/* Ribbon seal */}
      <rect x="20" y="13" width="5" height="5" fill="#E4572E" />
      <rect x="21" y="18" width="1" height="5" fill="#E4572E" />
      <rect x="23" y="18" width="1" height="5" fill="#E4572E" />
    </svg>
  );
}

