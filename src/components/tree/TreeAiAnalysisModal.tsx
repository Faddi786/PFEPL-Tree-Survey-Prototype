import { AnimatePresence, motion } from "framer-motion";
import { Brain, Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { TREE_AI_PIPELINE_STEPS } from "../../data/treeSurveyData";

type Props = {
  open: boolean;
  onClose: () => void;
  autoPlay?: boolean;
};

export default function TreeAiAnalysisModal({ open, onClose, autoPlay = true }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!open || !autoPlay) return;
    setActiveStep(0);
    setRunning(true);
    let step = 0;
    const interval = window.setInterval(() => {
      step += 1;
      if (step >= TREE_AI_PIPELINE_STEPS.length) {
        window.clearInterval(interval);
        setRunning(false);
        return;
      }
      setActiveStep(step);
    }, 650);
    return () => window.clearInterval(interval);
  }, [open, autoPlay]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-200/60 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-5 py-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-emerald-700" />
            <div>
              <h3 className="text-base font-semibold text-[#1A1A1A]">QR-tag scale measurement</h3>
              <p className="text-[11px] text-slate-500">Height and crown only — officer Accept required</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1 p-5">
          {TREE_AI_PIPELINE_STEPS.map((step, index) => {
            const done = index < activeStep;
            const current = index === activeStep && running;

            return (
              <motion.div
                key={step.id}
                layout
                className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition ${
                  current ? "border-emerald-300 bg-emerald-50/80" : done ? "border-emerald-100 bg-emerald-50/40" : "border-slate-100 bg-white"
                }`}
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                  {done ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : current ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${current ? "text-emerald-900" : "text-[#1A1A1A]"}`}>{step.label}</p>
                  <p className="text-[10px] text-slate-500">{step.detail}</p>
                </div>
                <AnimatePresence>
                  {current ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] font-medium text-emerald-700"
                    >
                      Running…
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-3">
          <p className="text-center text-[11px] text-slate-500">
            {running
              ? "Processing tree photo through ML models…"
              : activeStep >= TREE_AI_PIPELINE_STEPS.length - 1
                ? "Analysis complete — attributes saved to survey point"
                : "Pipeline ready"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
