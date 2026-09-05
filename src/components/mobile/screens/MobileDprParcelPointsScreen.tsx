import { ArrowLeft, TreeDeciduous, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getDprParcelDetail, type DprTreePoint } from "../../../data/mobileDprData";
import { HEALTH_COLORS } from "../../../data/treeSurveyData";
import { useMobileApp } from "../MobileAppContext";

const FALLBACK_PHOTO = "/assets/trees/ai-survey/02-full-tree.jpg";

function TreePhoto({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-emerald-50 ${className ?? ""}`}>
        <TreeDeciduous className="h-10 w-10 text-emerald-600/70" />
      </div>
    );
  }
  return (
    <img
      src={src || FALLBACK_PHOTO}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function SingleTreePhoto({ tree, onClose }: { tree: DprTreePoint; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black/92">
      <div className="flex items-center justify-between px-3 py-2.5 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {tree.label} · {tree.commonName}
          </p>
          <p className="truncate text-[10px] text-white/70">{tree.species}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full bg-white/10 p-2"
          aria-label="Close photo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-3">
        <TreePhoto
          src={tree.photoUrl}
          alt={tree.commonName}
          className="max-h-full max-w-full rounded-lg object-contain"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 px-3 pb-4 pt-2 text-[10px] text-white/85">
        <div className="rounded-lg bg-white/10 px-2.5 py-2">
          <p className="text-[8px] uppercase tracking-wide text-white/55">Height</p>
          <p className="font-medium">{tree.heightM} m</p>
        </div>
        <div className="rounded-lg bg-white/10 px-2.5 py-2">
          <p className="text-[8px] uppercase tracking-wide text-white/55">DBH</p>
          <p className="font-medium">{tree.dbhCm} cm</p>
        </div>
        <div className="rounded-lg bg-white/10 px-2.5 py-2">
          <p className="text-[8px] uppercase tracking-wide text-white/55">Health</p>
          <p className="font-medium capitalize">{tree.health}</p>
        </div>
        <div className="rounded-lg bg-white/10 px-2.5 py-2">
          <p className="text-[8px] uppercase tracking-wide text-white/55">Surveyed</p>
          <p className="font-medium tabular-nums">{tree.surveyedAt}</p>
        </div>
      </div>
    </div>
  );
}

export default function MobileDprParcelPointsScreen() {
  const { dprSelectedParcelId, backFromDprParcel } = useMobileApp();
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedTreeId(null);
  }, [dprSelectedParcelId]);

  if (!dprSelectedParcelId) return null;

  const detail = getDprParcelDetail(dprSelectedParcelId);
  if (!detail) return null;

  const selectedTree = detail.trees.find((t) => t.id === selectedTreeId) ?? null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#F7F7F5]">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5">
        <button type="button" onClick={backFromDprParcel} className="rounded-lg p-1.5 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">
            Tree survey · Zone {detail.parcelNumber}
          </p>
          <p className="text-[10px] text-slate-500">
            {detail.village} · {detail.trees.length} trees
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Trees surveyed
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[36px_52px_minmax(0,1fr)_40px_36px_52px] gap-1 border-b border-slate-100 bg-slate-50 px-2 py-1.5 text-[8px] font-semibold uppercase tracking-wide text-slate-500">
            <span />
            <span>ID</span>
            <span>Species</span>
            <span className="text-right">Ht</span>
            <span className="text-right">DBH</span>
            <span className="text-right">Health</span>
          </div>
          {detail.trees.map((tree) => (
            <button
              key={tree.id}
              type="button"
              onClick={() => setSelectedTreeId(tree.id)}
              className="block w-full border-b border-slate-50 px-2 py-2 text-left last:border-0 active:bg-slate-50"
            >
              <div className="grid grid-cols-[36px_52px_minmax(0,1fr)_40px_36px_52px] items-center gap-1 text-[10px]">
                <TreePhoto
                  src={tree.photoUrl}
                  alt={tree.commonName}
                  className="h-9 w-9 rounded-md object-cover ring-1 ring-slate-200"
                />
                <span className="font-semibold tabular-nums text-slate-900">{tree.label}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-800">{tree.commonName}</span>
                  <span className="block truncate text-[8px] italic text-slate-400">
                    {tree.species}
                  </span>
                </span>
                <span className="text-right tabular-nums text-slate-700">{tree.heightM} m</span>
                <span className="text-right tabular-nums text-slate-700">{tree.dbhCm}</span>
                <span
                  className="truncate text-right text-[9px] font-semibold capitalize"
                  style={{ color: HEALTH_COLORS[tree.health] }}
                >
                  {tree.health}
                </span>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-px overflow-hidden rounded-md bg-slate-100">
                <div className="bg-slate-50 px-1.5 py-1">
                  <p className="text-[7px] font-semibold uppercase tracking-wide text-slate-400">
                    Score
                  </p>
                  <p className="text-[10px] font-medium text-slate-800">{tree.healthScore}/100</p>
                </div>
                <div className="bg-slate-50 px-1.5 py-1">
                  <p className="text-[7px] font-semibold uppercase tracking-wide text-slate-400">
                    Water
                  </p>
                  <p className="text-[10px] font-medium capitalize text-slate-800">
                    {tree.waterStatus}
                  </p>
                </div>
                <div className="bg-slate-50 px-1.5 py-1">
                  <p className="text-[7px] font-semibold uppercase tracking-wide text-slate-400">
                    Canopy
                  </p>
                  <p className="text-[10px] font-medium text-slate-800">{tree.canopyDiameterM} m</p>
                </div>
                <div className="bg-slate-50 px-1.5 py-1">
                  <p className="text-[7px] font-semibold uppercase tracking-wide text-slate-400">
                    Surveyor
                  </p>
                  <p className="truncate text-[10px] font-medium text-slate-800">{tree.surveyor}</p>
                </div>
                <div className="col-span-2 bg-slate-50 px-1.5 py-1">
                  <p className="text-[7px] font-semibold uppercase tracking-wide text-slate-400">
                    Surveyed
                  </p>
                  <p className="text-[10px] font-medium tabular-nums text-slate-800">
                    {tree.surveyedAt}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedTree ? (
        <SingleTreePhoto tree={selectedTree} onClose={() => setSelectedTreeId(null)} />
      ) : null}
    </div>
  );
}
