import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DEFAULT_OTHER_FEATURE_ID,
  OTHER_FEATURES,
  type DecisionOption,
  type OtherFeatureId,
  type StepPanel,
  type StepTone,
} from "../data/otherFeatures";

type OpenPhoto = {
  src: string;
  label: string;
  caption: string;
};

function toneClass(tone: StepTone | undefined): string {
  switch (tone) {
    case "ok":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "warn":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "bad":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "info":
      return "border-sky-200 bg-sky-50 text-sky-900";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function ContentPanel({
  panel,
  onOpenPhoto,
  decisionSelected,
  onDecisionSelect,
}: {
  panel: StepPanel;
  onOpenPhoto: (photo: OpenPhoto) => void;
  decisionSelected?: string;
  onDecisionSelect?: (label: string) => void;
}) {
  switch (panel.type) {
    case "form":
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="mb-2 text-sm font-semibold text-[#1A1A1A]">{panel.title}</h3>
          <div className="space-y-1.5">
            {panel.fields.map((field) => (
              <div
                key={field.label}
                className="flex items-center justify-between gap-3 rounded-lg bg-[#F7F7F5] px-3 py-2 text-sm"
              >
                <span className="text-slate-500">{field.label}</span>
                <span className="text-right font-medium text-slate-800">{field.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "kv":
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="mb-2 text-sm font-semibold text-[#1A1A1A]">{panel.title}</h3>
          <div className="space-y-1.5">
            {panel.rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-500">{row.label}</span>
                <span className="text-right font-medium text-slate-800">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "table":
      return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-3 py-2">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">{panel.title}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  {panel.headers.map((header) => (
                    <th key={header} className="px-3 py-2 font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {panel.rows.map((row, index) => (
                  <tr key={`${panel.title}-${index}`} className="border-t border-slate-100">
                    {row.map((cell, cellIndex) => (
                      <td key={`${index}-${cellIndex}`} className="px-3 py-2 text-slate-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    case "map":
      return (
        <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-3">
          <h3 className="mb-1 text-sm font-semibold text-[#1A1A1A]">{panel.title}</h3>
          <p className="mb-2 text-xs text-emerald-800">{panel.location}</p>
          <div className="space-y-1.5">
            {panel.pins.map((pin) => (
              <div
                key={pin.label}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-800">{pin.label}</span>
                <span className="text-xs text-slate-500">{pin.meta}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "status":
      return (
        <div className={`rounded-xl border px-3 py-2.5 ${toneClass(panel.tone)}`}>
          <p className="text-sm font-semibold">{panel.title}</p>
          {panel.items.length > 0 ? (
            <ul className="mt-1 space-y-0.5 text-xs opacity-90">
              {panel.items.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    case "photos":
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="mb-2 text-sm font-semibold text-[#1A1A1A]">{panel.title}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {panel.items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onOpenPhoto(item)}
                className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left transition hover:border-emerald-300"
              >
                <img
                  src={item.src}
                  alt={item.label}
                  className="h-24 w-full object-cover"
                  loading="lazy"
                />
                <div className="bg-white px-2 py-1.5">
                  <p className="text-xs font-medium text-slate-700">{item.label}</p>
                  <p className="text-[11px] text-slate-400">{item.caption}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    case "stats":
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="mb-2 text-sm font-semibold text-[#1A1A1A]">{panel.title}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {panel.items.map((item) => (
              <div key={item.label} className="rounded-xl bg-[#F7F7F5] px-3 py-2.5">
                <p className="text-base font-semibold text-[#1A1A1A]">{item.value}</p>
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "decision": {
      const selected = decisionSelected ?? panel.selected;
      const activeOption: DecisionOption | undefined =
        panel.options.find((option) => option.label === selected) ?? panel.options[0];
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <h3 className="mb-2 text-sm font-semibold text-[#1A1A1A]">{panel.title}</h3>
            <div className="flex flex-wrap gap-2">
              {panel.options.map((option) => {
                const isSelected = option.label === selected;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => onDecisionSelect?.(option.label)}
                    className={`rounded-full border px-3 py-1.5 text-left text-xs font-semibold transition ${
                      isSelected
                        ? toneClass(option.tone)
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <span className="block">{option.label}</span>
                    {option.note ? (
                      <span className="mt-0.5 block text-[10px] font-normal opacity-80">
                        {option.note}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
          {activeOption?.detailPanels?.map((detail, index) => (
            <ContentPanel
              key={`${activeOption.label}-${index}`}
              panel={detail}
              onOpenPhoto={onOpenPhoto}
            />
          ))}
        </div>
      );
    }
    case "list":
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="mb-2 text-sm font-semibold text-[#1A1A1A]">{panel.title}</h3>
          <div className="space-y-1.5">
            {panel.items.map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between gap-2 rounded-xl bg-[#F7F7F5] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
                  {item.meta ? <p className="text-[11px] text-slate-500">{item.meta}</p> : null}
                </div>
                {item.badge ? (
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneClass(item.tone)}`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function OtherFeaturesPage() {
  const [activeId, setActiveId] = useState<OtherFeatureId>(DEFAULT_OTHER_FEATURE_ID);
  const [stepIndex, setStepIndex] = useState(0);
  const [openPhoto, setOpenPhoto] = useState<OpenPhoto | null>(null);
  const [decisionByStep, setDecisionByStep] = useState<Record<string, string>>({});

  const feature = useMemo(
    () => OTHER_FEATURES.find((item) => item.id === activeId) ?? OTHER_FEATURES[0],
    [activeId],
  );

  function selectFeature(id: OtherFeatureId) {
    setActiveId(id);
    setStepIndex(0);
    setOpenPhoto(null);
    setDecisionByStep({});
  }

  useEffect(() => {
    if (!openPhoto) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenPhoto(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openPhoto]);

  const totalSteps = feature.steps.length;
  const safeIndex = Math.min(stepIndex, totalSteps - 1);
  const currentStep = feature.steps[safeIndex];
  const atEnd = stepIndex >= totalSteps - 1;
  const decisionKey = `${feature.id}:${safeIndex}`;

  function decisionSelectedFor(panel: StepPanel): string | undefined {
    if (panel.type !== "decision") return undefined;
    return decisionByStep[decisionKey] ?? panel.selected;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F7F7F5] p-2 lg:p-3">
      <main className="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r border-slate-200/70">
          <header className="flex shrink-0 items-center gap-3 border-b border-slate-200/70 px-4 py-2.5">
            <Link
              to="/app"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
            <h1 className="text-base font-semibold text-[#1A1A1A]">{feature.title}</h1>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-500">
              {feature.caseId}
            </span>
          </header>

          <div className="shrink-0 border-b border-slate-200/70 px-3 py-2">
            <div className="flex gap-1.5 overflow-x-auto">
              {feature.steps.map((step, index) => {
                const isCurrent = index === safeIndex;
                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => setStepIndex(index)}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      isCurrent
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {index + 1}. {step.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 lg:p-4">
            <div>
              <p className="text-xs font-medium text-slate-400">
                Step {safeIndex + 1}/{totalSteps} · {currentStep.actor}
              </p>
              <p className="mt-0.5 text-sm text-slate-600">{currentStep.purpose}</p>
            </div>

            {currentStep.panels.map((panel, index) => (
              <ContentPanel
                key={`${feature.id}-${safeIndex}-${index}`}
                panel={panel}
                onOpenPhoto={setOpenPhoto}
                decisionSelected={decisionSelectedFor(panel)}
                onDecisionSelect={(label) =>
                  setDecisionByStep((prev) => ({ ...prev, [decisionKey]: label }))
                }
              />
            ))}
          </div>

          <footer className="flex shrink-0 items-center justify-between border-t border-slate-200/70 px-4 py-2.5">
            <button
              type="button"
              onClick={() => setStepIndex((value) => Math.max(value - 1, 0))}
              disabled={stepIndex === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <span className="text-xs text-slate-400">
              {safeIndex + 1}/{totalSteps}
            </span>
            <button
              type="button"
              onClick={() => setStepIndex((value) => Math.min(value + 1, totalSteps - 1))}
              disabled={atEnd}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </footer>
        </section>

        <aside className="flex w-[220px] shrink-0 flex-col overflow-hidden bg-[#FBFBFA] lg:w-[240px]">
          <div className="shrink-0 border-b border-slate-200/70 px-3 py-2.5">
            <p className="text-sm font-semibold text-[#1A1A1A]">Other Features</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {OTHER_FEATURES.map((item) => {
              const selected = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectFeature(item.id)}
                  className={`mb-0.5 w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    selected
                      ? "bg-emerald-50 font-semibold text-emerald-900"
                      : "text-slate-700 hover:bg-white"
                  }`}
                >
                  {item.shortLabel}
                </button>
              );
            })}
          </div>
        </aside>

        {openPhoto ? (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={openPhoto.label}
            onClick={() => setOpenPhoto(null)}
          >
            <div
              className="relative max-h-full w-full max-w-4xl overflow-hidden rounded-2xl bg-white"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{openPhoto.label}</p>
                  <p className="text-xs text-slate-500">{openPhoto.caption}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenPhoto(null)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200"
                  aria-label="Close image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="bg-slate-950 p-2">
                <img
                  src={openPhoto.src}
                  alt={openPhoto.label}
                  className="max-h-[75vh] w-full object-contain"
                />
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
