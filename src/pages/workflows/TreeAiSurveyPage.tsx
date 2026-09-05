import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Brain,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  ScanLine,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  generateTreeAiSurveyResult,
  getTreeAiSurveyPhotoUrl,
  TREE_AI_SURVEY_ANALYSIS_STEPS,
  TREE_AI_SURVEY_PHOTOS,
  type TreeAiSurveyResult,
  type TreeSurveyPhotoSlot,
} from "../../data/treeAiSurveyDemo";
import { HEALTH_COLORS } from "../../data/treeSurveyData";

type Phase = "idle" | "uploading" | "ready" | "analyzing" | "results" | "saved";

function healthStatusColor(status: TreeAiSurveyResult["healthStatus"]) {
  if (status === "healthy") return HEALTH_COLORS.healthy;
  if (status === "stressed") return HEALTH_COLORS.stressed;
  return HEALTH_COLORS.diseased;
}

function waterStressColor(level: TreeAiSurveyResult["waterStressLevel"]) {
  if (level === "low") return "#2563eb";
  if (level === "moderate") return "#f59e0b";
  return "#ef4444";
}

function pestRiskColor(level: TreeAiSurveyResult["pestRiskLevel"]) {
  if (level === "low") return HEALTH_COLORS.healthy;
  if (level === "moderate") return HEALTH_COLORS.stressed;
  return HEALTH_COLORS.diseased;
}

const TOP_ATTRIBUTES: {
  key: keyof TreeAiSurveyResult | "pestRisk";
  label: string;
  format: (result: TreeAiSurveyResult) => { value: string; sub?: string; color?: string };
}[] = [
  {
    key: "estimatedHeightM",
    label: "Estimated height",
    format: (r) => ({
      value: `${r.estimatedHeightM} m`,
      sub: `${(r.heightConfidence * 100).toFixed(0)}% confidence`,
    }),
  },
  {
    key: "speciesCommon",
    label: "Species",
    format: (r) => ({
      value: r.speciesCommon,
      sub: `${r.speciesScientific} · ${(r.speciesConfidence * 100).toFixed(0)}% conf`,
    }),
  },
  {
    key: "healthScore",
    label: "Health score",
    format: (r) => ({
      value: `${r.healthScore}/100`,
      sub: r.healthStatus,
      color: healthStatusColor(r.healthStatus),
    }),
  },
  {
    key: "damagePercent",
    label: "Damage / decay",
    format: (r) => ({ value: `${r.damagePercent}%`, sub: r.damageNotes }),
  },
  {
    key: "waterStressLevel",
    label: "Water stress",
    format: (r) => ({
      value: r.waterStressLevel,
      sub: `Score ${r.waterStressScore}/100`,
      color: waterStressColor(r.waterStressLevel),
    }),
  },
  {
    key: "dbhEstimateCm",
    label: "DBH estimate",
    format: (r) => ({
      value: `${r.dbhEstimateCm} cm`,
      sub: `${(r.dbhConfidence * 100).toFixed(0)}% confidence`,
    }),
  },
  {
    key: "crownSpreadM",
    label: "Crown spread",
    format: (r) => ({ value: `${r.crownSpreadM} m`, sub: `Lean ${r.leanAngleDeg}°` }),
  },
  {
    key: "floweringStatus",
    label: "Flowering status",
    format: (r) => ({ value: r.floweringStatus }),
  },
  {
    key: "pestRisk",
    label: "Pest risk",
    format: (r) => ({
      value: r.pestRiskLevel,
      sub: r.pestRiskSummary,
      color: pestRiskColor(r.pestRiskLevel),
    }),
  },
  {
    key: "rootFlareStatus",
    label: "Root flare",
    format: (r) => ({ value: r.rootFlareStatus }),
  },
  {
    key: "canopyDensityPct",
    label: "Canopy density",
    format: (r) => ({
      value: `${r.canopyDensityPct}%`,
      sub: r.canopyClosureClass,
    }),
  },
  {
    key: "groveContext",
    label: "Grove context",
    format: (r) => ({ value: r.groveContext }),
  },
  {
    key: "ageClass",
    label: "Age class",
    format: (r) => ({ value: r.ageClass }),
  },
  {
    key: "carbonStorageKg",
    label: "Carbon storage",
    format: (r) => ({
      value: `${r.carbonStorageKg} kg CO₂e`,
      sub: `Biomass ~${r.biomassEstimateKg} kg`,
    }),
  },
  {
    key: "soilTypeAtBase",
    label: "Soil at base",
    format: (r) => ({ value: r.soilTypeAtBase }),
  },
  {
    key: "sunExposure",
    label: "Sun exposure",
    format: (r) => ({ value: r.sunExposure }),
  },
  {
    key: "branchStructureClass",
    label: "Branch structure",
    format: (r) => ({ value: r.branchStructureClass }),
  },
  {
    key: "fruitingStatus",
    label: "Fruiting status",
    format: (r) => ({ value: r.fruitingStatus }),
  },
  {
    key: "habitatValueNote",
    label: "Habitat value",
    format: (r) => ({ value: r.habitatValueNote }),
  },
  {
    key: "gpsAccuracyM",
    label: "Survey quality",
    format: (r) => ({
      value: r.surveyQuality,
      sub: `GPS ±${r.gpsAccuracyM} m · Last treatment ${r.lastTreatmentDate.split(" · ")[0]}`,
    }),
  },
];

function PhotoLightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: TreeSurveyPhotoSlot[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}) {
  const photo = photos[index];
  const total = photos.length;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        onClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onNavigate((index - 1 + total) % total);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onNavigate((index + 1) % total);
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [index, total, onClose, onNavigate]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[300] flex flex-col bg-slate-900/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={photo.label}
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{photo.label}</p>
          <p className="text-[11px] text-slate-300">
            {photo.purpose} · {index + 1} / {total}
          </p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          aria-label="Close image viewer"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-14 py-4 sm:px-20"
        onClick={(event) => event.stopPropagation()}
      >
        {total > 1 ? (
          <button
            type="button"
            onClick={() => onNavigate((index - 1 + total) % total)}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-sm transition hover:bg-white/20 sm:left-6"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : null}

        <motion.img
          key={photo.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          src={getTreeAiSurveyPhotoUrl(photo.filename)}
          alt={photo.label}
          className="max-h-[calc(100vh-8rem)] max-w-full rounded-lg object-contain shadow-2xl"
        />

        {total > 1 ? (
          <button
            type="button"
            onClick={() => onNavigate((index + 1) % total)}
            aria-label="Next image"
            className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-sm transition hover:bg-white/20 sm:right-6"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-white/10 bg-white/5 px-4 py-3 text-center sm:px-6">
        <p className="text-[11px] text-slate-300">Use ← → arrow keys to navigate · Esc to close</p>
      </div>
    </motion.div>,
    document.body,
  );
}

export default function TreeAiSurveyPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [uploadedIds, setUploadedIds] = useState<Set<string>>(new Set());
  const [activeAnalysisStep, setActiveAnalysisStep] = useState(0);
  const [highlightPhotoId, setHighlightPhotoId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [result, setResult] = useState<TreeAiSurveyResult | null>(null);
  const [saved, setSaved] = useState(false);

  const allUploaded = uploadedIds.size === TREE_AI_SURVEY_PHOTOS.length;

  const uploadedPhotos = useMemo(
    () => TREE_AI_SURVEY_PHOTOS.filter((slot) => uploadedIds.has(slot.id)),
    [uploadedIds],
  );

  const batchUpload = useCallback(() => {
    setPhase("uploading");
    let index = 0;

    const revealNext = () => {
      if (index >= TREE_AI_SURVEY_PHOTOS.length) {
        setPhase("ready");
        return;
      }
      const slot = TREE_AI_SURVEY_PHOTOS[index];
      setUploadedIds((prev) => new Set([...prev, slot.id]));
      index += 1;
      window.setTimeout(revealNext, 180);
    };

    window.setTimeout(revealNext, 300);
  }, []);

  const runAnalysis = useCallback(() => {
    setPhase("analyzing");
    setActiveAnalysisStep(0);
    setHighlightPhotoId(TREE_AI_SURVEY_ANALYSIS_STEPS[0]?.photoId ?? null);

    let stepIndex = 0;

    const advance = () => {
      if (stepIndex >= TREE_AI_SURVEY_ANALYSIS_STEPS.length) {
        setResult(generateTreeAiSurveyResult());
        setPhase("results");
        setHighlightPhotoId(null);
        return;
      }

      const step = TREE_AI_SURVEY_ANALYSIS_STEPS[stepIndex];
      setActiveAnalysisStep(stepIndex);
      setHighlightPhotoId(step.photoId ?? null);

      window.setTimeout(() => {
        stepIndex += 1;
        advance();
      }, step.durationMs);
    };

    advance();
  }, []);

  function handleAcceptSave() {
    setSaved(true);
    setPhase("saved");
  }

  useEffect(() => {
    if (phase !== "analyzing") return;
    setActiveAnalysisStep(0);
  }, [phase]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F7F7F5] text-[#1A1A1A]">
      <header className="shrink-0 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-sm lg:px-6">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <Link
            to="/app"
            aria-label="Back to workbench"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {phase === "idle" ? (
              <button
                type="button"
                onClick={batchUpload}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                <Upload className="h-4 w-4" />
                Upload images
              </button>
            ) : phase === "uploading" ? (
              <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing {uploadedIds.size}/{TREE_AI_SURVEY_PHOTOS.length} photos…
              </span>
            ) : phase === "ready" ? (
              <button
                type="button"
                onClick={runAnalysis}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Brain className="h-4 w-4" />
                Run AI Analysis
              </button>
            ) : phase === "analyzing" ? (
              <span className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI analysis running…
              </span>
            ) : phase === "results" ? (
              <button
                type="button"
                onClick={handleAcceptSave}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Accept &amp; Add to Inventory
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                <Check className="h-4 w-4" />
                Saved to tree inventory
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            {/* Photo grid */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-[#1A1A1A]">Survey photo set</h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {phase === "idle"
                      ? "Click Upload images to load 10 pre-captured tree photos"
                      : `${uploadedIds.size} of ${TREE_AI_SURVEY_PHOTOS.length} photos loaded`}
                  </p>
                </div>
                {allUploaded && phase !== "idle" ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
                    Complete set
                  </span>
                ) : null}
              </div>

              <div className="relative mt-3">
                {phase === "idle" ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-8">
                    <ImagePlus className="h-10 w-10 text-slate-300" />
                    <p className="text-center text-sm text-slate-500">
                      Canopy, bark, leaf, flower, fruit, trunk, branch, root/base, and soil views
                    </p>
                    <button
                      type="button"
                      onClick={batchUpload}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-xs font-medium text-white"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload images
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {TREE_AI_SURVEY_PHOTOS.map((slot, index) => {
                      const isUploaded = uploadedIds.has(slot.id);
                      const isHighlighted = highlightPhotoId === slot.id;
                      const uploadedIndex = uploadedPhotos.findIndex((p) => p.id === slot.id);

                      return (
                        <motion.div
                          key={slot.id}
                          initial={phase === "uploading" ? { opacity: 0, scale: 0.92 } : false}
                          animate={{ opacity: isUploaded ? 1 : 0.35, scale: 1 }}
                          transition={{ delay: index * 0.04, duration: 0.25 }}
                          className={`relative overflow-hidden rounded-xl border ${
                            isHighlighted
                              ? "border-sky-400 ring-2 ring-sky-300/60"
                              : isUploaded
                                ? "border-slate-200"
                                : "border-dashed border-slate-200"
                          }`}
                        >
                          {isUploaded ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setLightboxIndex(uploadedIndex >= 0 ? uploadedIndex : 0)}
                                className="relative block w-full cursor-zoom-in text-left"
                                aria-label={`View ${slot.label}`}
                              >
                                <img
                                  src={getTreeAiSurveyPhotoUrl(slot.filename)}
                                  alt={slot.label}
                                  className="aspect-[4/3] w-full object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2.5">
                                  <p className="text-[11px] font-semibold text-white">{slot.label}</p>
                                  <p className="text-[10px] text-white/75">{slot.purpose}</p>
                                </div>
                              </button>
                              {isHighlighted && phase === "analyzing" ? (
                                <motion.div
                                  className="pointer-events-none absolute inset-0 bg-sky-400/10"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                                  transition={{ duration: 1.2, repeat: Infinity }}
                                />
                              ) : null}
                              {isHighlighted && phase === "analyzing" ? (
                                <motion.div
                                  className="pointer-events-none absolute inset-x-2 top-2 h-0.5 rounded-full bg-gradient-to-r from-transparent via-sky-400 to-transparent"
                                  animate={{ top: ["8%", "92%", "8%"] }}
                                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                />
                              ) : null}
                            </>
                          ) : (
                            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1 bg-slate-50 p-2">
                              <ImagePlus className="h-5 w-5 text-slate-300" />
                              <p className="text-center text-[9px] text-slate-400">{slot.label}</p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {phase === "analyzing" ? (
                  <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-sky-200/50" />
                ) : null}
              </div>

              <AnimatePresence>
                {lightboxIndex !== null && uploadedPhotos.length > 0 ? (
                  <PhotoLightbox
                    key="photo-lightbox"
                    photos={uploadedPhotos}
                    index={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={setLightboxIndex}
                  />
                ) : null}
              </AnimatePresence>
            </section>

            {/* Analysis / Results panel */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              {phase === "idle" || phase === "uploading" ? (
                <div className="flex min-h-[320px] flex-col justify-center gap-2 text-center">
                  <ScanLine className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">Analysis panel</p>
                  <p className="text-xs text-slate-400">
                    Upload the full photo set, then run AI analysis to extract tree attributes.
                  </p>
                </div>
              ) : phase === "ready" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-sm font-semibold">Ready for analysis</h2>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500">
                    All {TREE_AI_SURVEY_PHOTOS.length} survey photos loaded. The AI pipeline will fuse multi-view imagery to
                    estimate height, classify species, assess bark health, detect water stress, and generate a comprehensive
                    attribute report.
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-slate-600">
                    {TREE_AI_SURVEY_ANALYSIS_STEPS.slice(0, 5).map((step) => (
                      <li key={step.id} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                        {step.label.replace("…", "")}
                      </li>
                    ))}
                    <li className="text-slate-400">+ {TREE_AI_SURVEY_ANALYSIS_STEPS.length - 5} more steps…</li>
                  </ul>
                  <button
                    type="button"
                    onClick={runAnalysis}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] py-2.5 text-xs font-semibold text-white"
                  >
                    <Brain className="h-3.5 w-3.5" />
                    Run AI Analysis
                  </button>
                </div>
              ) : phase === "analyzing" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">AI processing</h2>
                    <span className="text-[10px] text-slate-500">
                      Step {activeAnalysisStep + 1}/{TREE_AI_SURVEY_ANALYSIS_STEPS.length}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                      animate={{
                        width: `${((activeAnalysisStep + 1) / TREE_AI_SURVEY_ANALYSIS_STEPS.length) * 100}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="max-h-[340px] space-y-1 overflow-y-auto pr-1">
                    {TREE_AI_SURVEY_ANALYSIS_STEPS.map((step, index) => {
                      const done = index < activeAnalysisStep;
                      const current = index === activeAnalysisStep;

                      return (
                        <motion.div
                          key={step.id}
                          layout
                          className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 ${
                            current
                              ? "border-sky-300 bg-sky-50/80"
                              : done
                                ? "border-emerald-100 bg-emerald-50/50"
                                : "border-slate-100 bg-white"
                          }`}
                        >
                          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                            {done ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : current ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" />
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-medium ${current ? "text-sky-900" : "text-[#1A1A1A]"}`}>
                              {step.label}
                            </p>
                            <p className="text-[10px] text-slate-500">{step.detail}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : result ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      <h2 className="text-sm font-semibold">Survey attributes</h2>
                    </div>

                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/40">
                      {TOP_ATTRIBUTES.map((attr) => {
                        const { value, sub, color } = attr.format(result);
                        return (
                          <AttributeRow
                            key={attr.label}
                            label={attr.label}
                            value={value}
                            sub={sub}
                            color={color}
                          />
                        );
                      })}
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Recommended action</p>
                      <p className="mt-1 text-xs leading-relaxed text-emerald-900">{result.recommendedAction}</p>
                    </div>

                    {saved ? (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
                      >
                        <p className="font-semibold">Added to tree inventory</p>
                        <p className="mt-1 text-emerald-700">
                          Survey point synced · {result.surveyor} · GeoJSON + attributes queued for WebGIS publish.
                        </p>
                      </motion.div>
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              ) : null}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function AttributeRow({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2.5">
      <p className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="min-w-0 text-right">
        <p className="text-sm font-semibold capitalize leading-snug" style={color ? { color } : undefined}>
          {value}
        </p>
        {sub ? <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{sub}</p> : null}
      </div>
    </div>
  );
}
