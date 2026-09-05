import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, MessageSquareOff, X } from "lucide-react";
import { FieldAuditTooltip } from "../audit/AuditAttributeTooltip";
import type { MutationAuditMeta } from "../../data/auditHistory";

export type TreeCompareRow = {
  revision: string;
  value: string;
  fieldAudit?: MutationAuditMeta;
};

type Props = {
  title: string;
  attributeLabel: string;
  rows: TreeCompareRow[];
  tooltipEnabled: boolean;
  onClose: () => void;
};

const MODAL_TRANSITION = { duration: 0.2, ease: "easeOut" as const };

export default function TreeAttributeCompareModal({
  title,
  attributeLabel,
  rows,
  tooltipEnabled,
  onClose,
}: Props) {
  const [visible, setVisible] = useState(true);
  const [localTooltips, setLocalTooltips] = useState(tooltipEnabled);
  const [tooltip, setTooltip] = useState<{ meta: MutationAuditMeta; x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    setLocalTooltips(tooltipEnabled);
  }, [tooltipEnabled]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setVisible(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return createPortal(
    <AnimatePresence onExitComplete={onClose}>
      {visible ? (
        <motion.div
          key="tree-compare-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={MODAL_TRANSITION}
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/25 p-4 backdrop-blur-[1px]"
          onClick={() => setVisible(false)}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={MODAL_TRANSITION}
            className="flex max-h-[min(80vh,560px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setLocalTooltips((value) => !value)}
                  aria-label={localTooltips ? "Turn off tooltips" : "Turn on tooltips"}
                  aria-pressed={localTooltips}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-slate-100 ${
                    localTooltips ? "text-slate-800" : "text-slate-500"
                  }`}
                >
                  {localTooltips ? (
                    <MessageSquare className="h-4 w-4" />
                  ) : (
                    <MessageSquareOff className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setVisible(false)}
                  aria-label="Close"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-left text-[10px] leading-4">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 font-medium text-slate-500">Revision</th>
                    <th className="px-4 py-2 font-medium text-slate-500">{attributeLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.revision}-${index}`} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-slate-600">{row.revision}</td>
                      <td
                        className={`px-4 py-2 font-medium text-slate-800 ${
                          localTooltips && row.fieldAudit ? "cursor-default" : ""
                        }`}
                        onMouseEnter={
                          localTooltips && row.fieldAudit
                            ? (event) =>
                                setTooltip({
                                  meta: row.fieldAudit!,
                                  x: event.clientX,
                                  y: event.clientY,
                                })
                            : undefined
                        }
                        onMouseMove={
                          localTooltips && row.fieldAudit
                            ? (event) =>
                                setTooltip({
                                  meta: row.fieldAudit!,
                                  x: event.clientX,
                                  y: event.clientY,
                                })
                            : undefined
                        }
                        onMouseLeave={localTooltips ? () => setTooltip(null) : undefined}
                      >
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tooltip ? <FieldAuditTooltip meta={tooltip.meta} x={tooltip.x} y={tooltip.y} /> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
