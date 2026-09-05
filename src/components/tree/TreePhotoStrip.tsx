import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getFallbackTreePhotoUrl } from "../../data/treeSurveyData";

type Props = {
  photos: string[];
  labels?: string[];
  label?: string;
  className?: string;
  /** Horizontal thumbnails (overlay) or vertical enlarged cards (audit). */
  layout?: "strip" | "stack";
};

export default function TreePhotoStrip({
  photos,
  labels,
  label = "Survey photos",
  className = "",
  layout = "strip",
}: Props) {
  const items = layout === "stack" ? photos : photos.slice(0, 4);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenIndex(null);
      if (event.key === "ArrowRight") {
        setOpenIndex((index) => (index === null ? null : (index + 1) % items.length));
      }
      if (event.key === "ArrowLeft") {
        setOpenIndex((index) =>
          index === null ? null : (index - 1 + items.length) % items.length,
        );
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openIndex, items.length]);

  if (items.length === 0) return null;

  const activeSrc = openIndex !== null ? items[openIndex] : null;

  return (
    <>
      {layout === "stack" ? (
        <div className={`space-y-2 ${className}`}>
          <p className="audit-section-label">{label}</p>
          <div className="space-y-2">
            {items.map((src, index) => {
              const slotLabel = labels?.[index] ?? `Photo ${index + 1}`;
              return (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenIndex(index);
                  }}
                  className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left transition hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  aria-label={`Open ${slotLabel}`}
                >
                  <div className="aspect-[4/3] w-full">
                    <img
                      src={src}
                      alt={slotLabel}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(event) => {
                        const img = event.currentTarget;
                        img.onerror = null;
                        img.src = getFallbackTreePhotoUrl();
                      }}
                    />
                  </div>
                  <p className="border-t border-slate-100 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-600">
                    {slotLabel}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={`shrink-0 border-t border-slate-100 bg-slate-50/80 ${className}`}>
          <p className="px-3 pt-2 text-[10px] font-medium text-slate-500">{label}</p>
          <div className="grid grid-cols-4 gap-1 px-2 pb-2 pt-1">
            {items.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenIndex(index);
                }}
                className="aspect-square overflow-hidden rounded-md border border-slate-200/80 bg-slate-100 transition hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                aria-label={`Open survey photo ${index + 1}`}
              >
                <img
                  src={src}
                  alt={`Survey photo ${index + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(event) => {
                    const img = event.currentTarget;
                    img.onerror = null;
                    img.src = getFallbackTreePhotoUrl();
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {createPortal(
        <AnimatePresence>
          {activeSrc !== null && openIndex !== null ? (
            <motion.div
              key="tree-photo-lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
              onClick={() => setOpenIndex(null)}
              role="presentation"
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Survey photo"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="relative flex max-h-[min(90vh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-slate-950 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                  <p className="text-xs font-medium text-white/90">
                    {labels?.[openIndex] ?? label} · {openIndex + 1} / {items.length}
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(null)}
                    className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                    aria-label="Close photo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black px-12 py-4">
                  <img
                    src={activeSrc}
                    alt={labels?.[openIndex] ?? `Survey photo ${openIndex + 1}`}
                    className="max-h-[min(70vh,560px)] max-w-full object-contain"
                    onError={(event) => {
                      const img = event.currentTarget;
                      img.onerror = null;
                      img.src = getFallbackTreePhotoUrl();
                    }}
                  />

                  {items.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenIndex((index) =>
                            index === null ? null : (index - 1 + items.length) % items.length,
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 p-2 text-white transition hover:bg-black/70"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenIndex((index) =>
                            index === null ? null : (index + 1) % items.length,
                          )
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 p-2 text-white transition hover:bg-black/70"
                        aria-label="Next photo"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  ) : null}
                </div>

                <div className="flex gap-1.5 overflow-x-auto border-t border-white/10 bg-slate-900 px-3 py-2">
                  {items.map((src, index) => (
                    <button
                      key={`thumb-${src}-${index}`}
                      type="button"
                      onClick={() => setOpenIndex(index)}
                      className={`h-12 w-12 shrink-0 overflow-hidden rounded-md border transition ${
                        index === openIndex
                          ? "border-white ring-1 ring-white"
                          : "border-white/15 opacity-70 hover:opacity-100"
                      }`}
                      aria-label={`Show photo ${index + 1}`}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
