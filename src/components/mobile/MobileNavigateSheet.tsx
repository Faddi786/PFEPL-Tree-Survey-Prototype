import { Navigation, X } from "lucide-react";
import type { TreeRecord } from "../../data/treeSurveyData";

type Props = {
  open: boolean;
  destination: TreeRecord | null;
  navigating: boolean;
  arrived: boolean;
  onClose: () => void;
  onStart: () => void;
  onStop: () => void;
};

export default function MobileNavigateSheet({
  open,
  destination,
  navigating,
  arrived,
  onClose,
  onStart,
  onStop,
}: Props) {
  if (!open) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 rounded-t-2xl border-t border-slate-200 bg-white/95 shadow-[0_-8px_30px_rgba(0,0,0,0.1)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1A1A1A]">
          {arrived
            ? "Arrived"
            : destination
              ? `${destination.label} · ${destination.commonName}`
              : "Navigate"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 pb-3 pt-2">
        {arrived ? (
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-full bg-[#1A1A1A] py-2 text-xs font-medium text-white"
          >
            Done
          </button>
        ) : navigating ? (
          <button
            type="button"
            onClick={onStop}
            className="flex w-full items-center justify-center rounded-full border border-slate-200 py-2 text-xs font-medium text-slate-700"
          >
            End
          </button>
        ) : (
          <button
            type="button"
            disabled={!destination}
            onClick={onStart}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#1A1A1A] py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Navigation className="h-3.5 w-3.5" />
            Start
          </button>
        )}
      </div>
    </div>
  );
}
