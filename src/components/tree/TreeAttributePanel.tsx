import { motion } from "framer-motion";
import { Calendar, Droplets, Navigation, QrCode, Ruler, X } from "lucide-react";
import type { TreeRecord } from "../../data/treeSurveyData";
import { getFallbackTreePhotoUrl, HEALTH_COLORS } from "../../data/treeSurveyData";

type Props = {
  tree: TreeRecord;
  onClose: () => void;
  onOpenAi?: () => void;
  onNavigate?: () => void;
};

export default function TreeAttributePanel({ tree, onClose, onOpenAi, onNavigate }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="absolute bottom-4 right-4 z-30 w-[min(22rem,calc(100%-2rem))] overflow-hidden rounded-2xl border border-emerald-200/80 bg-white/95 shadow-xl backdrop-blur-md"
    >
      <div className="flex items-start justify-between border-b border-emerald-100 bg-emerald-50/90 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">{tree.label} · {tree.commonName}</p>
          <p className="text-[10px] italic text-slate-500">{tree.species}</p>
          <p className="mt-0.5 font-mono text-[10px] text-emerald-800">{tree.qrTagId}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative h-32 bg-slate-100">
        <img
          src={tree.photoUrl}
          alt={`${tree.commonName} (${tree.species})`}
          className="h-full w-full object-cover"
          onError={(e) => {
            const img = e.currentTarget;
            img.onerror = null;
            img.src = getFallbackTreePhotoUrl();
          }}
        />
        <span
          className="absolute bottom-2 left-3 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
          style={{ backgroundColor: HEALTH_COLORS[tree.health] }}
        >
          Officer: {tree.health}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
            <div className="mb-1 flex items-center gap-1 text-[10px] text-slate-500">
              <Ruler className="h-3 w-3" /> Height (QR scale)
            </div>
            <p className="text-lg font-semibold tabular-nums text-[#1A1A1A]">{tree.heightM} m</p>
            <p className="text-[9px] text-slate-400">{(tree.heightConfidence * 100).toFixed(0)}% · officer accepted</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
            <div className="mb-1 flex items-center gap-1 text-[10px] text-slate-500">
              <Droplets className="h-3 w-3" /> Watering
            </div>
            <p className="text-sm font-semibold capitalize">{tree.wateringStatus}</p>
            <p className="text-[9px] text-slate-400">Due {tree.wateringDueDate}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <span className="text-slate-500">Crown spread</span>
          <span className="text-right font-medium">{tree.crownSpreadM} m</span>
          <span className="text-slate-500">Encroachment</span>
          <span className="text-right font-medium capitalize">{tree.encroachmentStatus}</span>
          <span className="text-slate-500">Range / beat</span>
          <span className="text-right font-medium">{tree.range} · {tree.beat}</span>
          <span className="text-slate-500">Block</span>
          <span className="text-right font-medium">{tree.compartment}</span>
          <span className="text-slate-500">GNSS</span>
          <span className="text-right font-medium uppercase">{tree.gnssSource}</span>
          <span className="flex items-center gap-1 text-slate-500">
            <Calendar className="h-3 w-3" /> Last patrol
          </span>
          <span className="text-right font-medium">{tree.lastPatrolDate}</span>
        </div>

        {tree.notes ? (
          <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-900">{tree.notes}</p>
        ) : null}

        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#1A1A1A] py-2 text-xs font-medium text-white transition hover:bg-slate-800"
          >
            <Navigation className="h-3.5 w-3.5" />
            Navigate to this tree
          </button>
        ) : null}

        {onOpenAi ? (
          <button
            type="button"
            onClick={onOpenAi}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-700 py-2 text-xs font-medium text-white transition hover:bg-emerald-800"
          >
            <QrCode className="h-3.5 w-3.5" />
            Review QR measurement
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}
