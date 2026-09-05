import { forwardRef, useMemo, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";
import { FieldAuditTooltip } from "../audit/AuditAttributeTooltip";
import TreePhotoStrip from "./TreePhotoStrip";
import type { MutationAuditMeta } from "../../data/auditHistory";
import {
  AUDIT_IDENTITY_KEYS,
  AUDIT_MEASUREMENT_KEYS,
  AUDIT_SURVEY_KEYS,
  EVENT_KEYS,
  IDENTITY_KEYS,
  SURVEY_META_KEYS,
  TREE_FIELD_LABELS,
  formatTreeField,
  getTreeAuditPhotoLabels,
  treeContextSubtitle,
  type AuditLandmark,
  type TreeContextFieldKey,
  type TreeContextSnapshot,
} from "../../data/treeAuditHistory";
import { formatDistance } from "../../lib/mobileNavigation";

type Props = {
  snapshot: TreeContextSnapshot;
  className?: string;
  style?: React.CSSProperties;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "audit" | "overlay";
  fillHeight?: boolean;
  attributesScrollRef?: (el: HTMLDivElement | null) => void;
  onAttributesScroll?: (scrollTop: number, source: HTMLDivElement) => void;
  onCardMouseEnter?: () => void;
  onCardClick?: () => void;
  tooltipEnabled?: boolean;
  fieldAudit?: Partial<Record<TreeContextFieldKey, MutationAuditMeta>>;
  onLabelDoubleClick?: (key: TreeContextFieldKey, label: string) => void;
  onClose?: () => void;
  onOpenAi?: () => void;
  showHistoryLink?: boolean;
  layout?: "current" | "history";
  title?: string;
  photoLabel?: string;
  landmarks?: AuditLandmark[];
};

const TreeContextPanel = forwardRef<HTMLDivElement, Props>(function TreeContextPanel(
  {
    snapshot,
    className = "",
    style,
    subtitle,
    headerAction,
    footer,
    variant = "audit",
    fillHeight = false,
    attributesScrollRef,
    onAttributesScroll,
    onCardMouseEnter,
    onCardClick,
    tooltipEnabled = false,
    fieldAudit,
    onLabelDoubleClick,
    onClose,
    onOpenAi,
    showHistoryLink = false,
    title,
    photoLabel = "Survey photos",
    landmarks = [],
  },
  ref,
) {
  const isAudit = variant === "audit";
  const [fieldTooltip, setFieldTooltip] = useState<{
    meta: MutationAuditMeta;
    x: number;
    y: number;
  } | null>(null);

  const photoLabels = useMemo(
    () => getTreeAuditPhotoLabels(snapshot.photos),
    [snapshot.photos],
  );

  function showFieldTooltip(key: TreeContextFieldKey, event: React.MouseEvent) {
    if (!tooltipEnabled || !fieldAudit?.[key]) return;
    setFieldTooltip({ meta: fieldAudit[key]!, x: event.clientX, y: event.clientY });
  }

  const overlayFooter =
    footer ??
    (variant === "overlay" && (onOpenAi || showHistoryLink) ? (
      <div className="space-y-2">
        {onOpenAi ? (
          <button
            type="button"
            onClick={onOpenAi}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-700 py-2 text-xs font-medium text-white transition hover:bg-emerald-800"
          >
            <Sparkles className="h-3.5 w-3.5" />
            View AI pipeline
          </button>
        ) : null}
        {showHistoryLink ? (
          <Link
            to={`/workflows/audit-log?tree=${encodeURIComponent(snapshot.treeId)}`}
            className="block text-center text-[11px] font-medium text-sky-700 transition hover:text-sky-900"
          >
            Open survey history
          </Link>
        ) : null}
      </div>
    ) : null);

  /** Consistent header: Tree ID + revision line (same structure on every card). */
  const heading = title ?? snapshot.treeId;
  const headerSubtitle = subtitle ?? treeContextSubtitle(snapshot);

  function renderFieldRow(key: TreeContextFieldKey) {
    const label = TREE_FIELD_LABELS[key];
    return (
      <div key={key} className="grid grid-cols-[100px_1fr] gap-1.5 text-[10px] leading-4">
        <dt
          className="cursor-default select-none text-slate-500"
          onDoubleClick={() => onLabelDoubleClick?.(key, label)}
          title={onLabelDoubleClick ? "Double-click to compare revisions" : undefined}
        >
          {label}
        </dt>
        <dd
          className={`font-medium text-slate-800 ${
            tooltipEnabled && fieldAudit?.[key] ? "cursor-default" : ""
          }`}
          onMouseEnter={(event) => showFieldTooltip(key, event)}
          onMouseMove={(event) => showFieldTooltip(key, event)}
          onMouseLeave={() => setFieldTooltip(null)}
        >
          {formatTreeField(key, snapshot)}
        </dd>
      </div>
    );
  }

  function renderLandmarksSection() {
    if (landmarks.length === 0) return null;
    return (
      <div>
        <p className="audit-section-label">Nearby landmarks</p>
        <div className="space-y-1">
          {landmarks.map((landmark) => (
            <div
              key={landmark.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold text-slate-800">{landmark.name}</p>
                <p className="text-[9px] font-medium text-slate-500">
                  {landmark.kind === "water" ? "Water mark" : "Site landmark"}
                </p>
              </div>
              <p className="shrink-0 text-[9px] font-medium text-slate-500">
                {landmark.distanceM === 0 ? "At site" : formatDistance(landmark.distanceM)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={style}
      onMouseEnter={onCardMouseEnter}
      onClick={onCardClick}
      data-audit-log=""
      className={`flex w-[min(320px,calc(100vw-2rem))] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-lg backdrop-blur-sm ${
        fillHeight || isAudit ? "h-full min-h-0" : "max-h-[min(72vh,calc(100%-2rem))]"
      } ${className}`}
    >
      <div className="relative z-10 min-h-[3.25rem] shrink-0 overflow-visible border-b border-slate-100 px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[#1A1A1A]">{heading}</p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">{headerSubtitle}</p>
          </div>
          <div className="flex shrink-0 items-start gap-1.5">
            {headerAction ? <div className="relative z-20">{headerAction}</div> : null}
            {onClose ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onClose();
                }}
                className="rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div
        ref={attributesScrollRef}
        onScroll={(event) => {
          onAttributesScroll?.(event.currentTarget.scrollTop, event.currentTarget);
        }}
        className={`px-3 py-2 ${
          isAudit || fillHeight
            ? "audit-attributes-scroll min-h-0 flex-1 overflow-y-auto"
            : "min-h-0 overflow-y-auto"
        }`}
      >
        {isAudit ? (
          <dl className="space-y-0">
            <div>
              <p className="audit-section-label">Tree</p>
              <div className="space-y-1">{AUDIT_IDENTITY_KEYS.map((key) => renderFieldRow(key))}</div>
            </div>
            <div className="audit-section-divider" role="separator" />
            <div>
              <p className="audit-section-label">Attributes</p>
              <div className="space-y-1">
                {AUDIT_MEASUREMENT_KEYS.map((key) => renderFieldRow(key))}
              </div>
            </div>
            <div className="audit-section-divider" role="separator" />
            <div>
              <p className="audit-section-label">Survey</p>
              <div className="space-y-1">{AUDIT_SURVEY_KEYS.map((key) => renderFieldRow(key))}</div>
            </div>
            <div className="audit-section-divider" role="separator" />
            {renderLandmarksSection()}
            <div className="audit-section-divider" role="separator" />
            <TreePhotoStrip
              photos={snapshot.photos}
              labels={photoLabels}
              label={photoLabel}
              layout="stack"
            />
          </dl>
        ) : (
          <dl className="space-y-0">
            <div>
              <p className="audit-section-label">Tree</p>
              <div className="space-y-1">{IDENTITY_KEYS.map((key) => renderFieldRow(key))}</div>
            </div>
            <div className="audit-section-divider" role="separator" />
            <div>
              <p className="audit-section-label">Event</p>
              <div className="space-y-1">{EVENT_KEYS.map((key) => renderFieldRow(key))}</div>
            </div>
            <div className="audit-section-divider" role="separator" />
            <div>
              <p className="audit-section-label">Survey</p>
              <div className="space-y-1">{SURVEY_META_KEYS.map((key) => renderFieldRow(key))}</div>
            </div>
          </dl>
        )}
      </div>

      {!isAudit ? <TreePhotoStrip photos={snapshot.photos} label={photoLabel} layout="strip" /> : null}

      {overlayFooter ? (
        <div className="mt-auto shrink-0 border-t border-slate-100 px-3 py-2.5">{overlayFooter}</div>
      ) : null}

      {fieldTooltip ? (
        <FieldAuditTooltip meta={fieldTooltip.meta} x={fieldTooltip.x} y={fieldTooltip.y} />
      ) : null}
    </div>
  );
});

export default TreeContextPanel;
