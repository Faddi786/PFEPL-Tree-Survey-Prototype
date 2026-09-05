import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AuditCardMenu from "../audit/AuditCardMenu";
import TreeContextPanel from "./TreeContextPanel";
import TreeAttributeCompareModal from "./TreeAttributeCompareModal";
import {
  buildCurrentTreeFieldAudit,
  buildCurrentTreeSnapshot,
  formatTreeField,
  getAuditLandmarks,
  type TreeAuditHistoryEntry,
  type TreeContextFieldKey,
} from "../../data/treeAuditHistory";
import type { TreeRecord } from "../../data/treeSurveyData";

type Props = {
  tree: TreeRecord;
  history: TreeAuditHistoryEntry[];
  historyExpanded?: boolean;
  onHistoryExpandedChange?: (expanded: boolean) => void;
  cardTopOffset?: string;
  visible?: boolean;
};

const CARD_STAGGER_MS = 120;
const CARD_SLIDE_MS = 480;
const CARD_BOTTOM_PADDING = "1rem";
const CARD_SCROLL_STEP = 336;
const BEHIND_OFFSET = "calc(-1 * min(320px, calc(100vw - 2rem)) - 0.5rem)";
const SCROLL_ANIM_MS = 280;
const PANEL_FADE_MS = 0.225;

function cardHeight(topOffset: string) {
  return `calc(100vh - ${topOffset} - ${CARD_BOTTOM_PADDING})`;
}

function animateScrollTo(element: HTMLDivElement, target: number, duration = SCROLL_ANIM_MS) {
  const start = element.scrollTop;
  const delta = target - start;
  if (Math.abs(delta) < 1) {
    element.scrollTop = target;
    return;
  }

  const startTime = performance.now();

  function step(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    element.scrollTop = start + delta * eased;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

export default function TreeAuditHistoryRow({
  tree,
  history,
  historyExpanded = false,
  onHistoryExpandedChange,
  cardTopOffset = "4.75rem",
  visible = true,
}: Props) {
  const rowScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollContainersRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const isSyncingRef = useRef(false);
  const scrollLockedRef = useRef(true);
  const lockArmedRef = useRef(false);

  const [phase, setPhase] = useState<"idle" | "revealed" | "hiding">(
    historyExpanded ? "revealed" : "idle",
  );
  const [visibleCards, setVisibleCards] = useState(historyExpanded ? history.length : 0);
  const [scrollLocked, setScrollLocked] = useState(true);
  const [lockArmed, setLockArmed] = useState(false);
  const [tooltipEnabled, setTooltipEnabled] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [compareAttribute, setCompareAttribute] = useState<{
    key: TreeContextFieldKey;
    label: string;
  } | null>(null);
  const prevTreeIdRef = useRef(tree.id);

  scrollLockedRef.current = scrollLocked;
  lockArmedRef.current = lockArmed;

  function toggleScrollLock() {
    setScrollLocked((value) => {
      const next = !value;
      if (next) {
        setLockArmed(true);
        lockArmedRef.current = true;
      } else {
        setLockArmed(false);
        lockArmedRef.current = false;
      }
      return next;
    });
  }

  const expandedHeight = cardHeight(cardTopOffset);
  const currentSnapshot = useMemo(() => buildCurrentTreeSnapshot(tree), [tree]);
  const currentFieldAudit = useMemo(() => buildCurrentTreeFieldAudit(tree), [tree]);
  const landmarks = useMemo(() => getAuditLandmarks(tree, 4), [tree]);

  const updateRowScrollState = useCallback(() => {
    const el = rowScrollRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(max > 4 && el.scrollLeft < max - 4);
  }, []);

  const scrollRowBy = useCallback(
    (direction: -1 | 1) => {
      const el = rowScrollRef.current;
      if (!el) return;
      el.scrollBy({ left: direction * CARD_SCROLL_STEP, behavior: "smooth" });
      window.setTimeout(updateRowScrollState, 320);
    },
    [updateRowScrollState],
  );

  useEffect(() => {
    if (prevTreeIdRef.current === tree.id) return;
    prevTreeIdRef.current = tree.id;

    if (historyExpanded) {
      setPhase("revealed");
      setVisibleCards(history.length);
    } else {
      setPhase("idle");
      setVisibleCards(0);
    }
  }, [tree.id, historyExpanded, history.length]);

  useEffect(() => {
    updateRowScrollState();
    const el = rowScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateRowScrollState, { passive: true });
    window.addEventListener("resize", updateRowScrollState);
    const timer = window.setTimeout(updateRowScrollState, CARD_SLIDE_MS + 80);
    return () => {
      el.removeEventListener("scroll", updateRowScrollState);
      window.removeEventListener("resize", updateRowScrollState);
      window.clearTimeout(timer);
    };
  }, [updateRowScrollState, visibleCards, phase, tree.id, history.length]);

  const registerScrollContainer = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) scrollContainersRef.current.set(id, el);
    else scrollContainersRef.current.delete(id);
  }, []);

  const syncScrollFrom = useCallback((scrollTop: number, sourceId: string, animateOthers = false) => {
    if (!scrollLockedRef.current || isSyncingRef.current) return;

    isSyncingRef.current = true;
    scrollContainersRef.current.forEach((el, id) => {
      if (id === sourceId) return;
      if (animateOthers) animateScrollTo(el, scrollTop);
      else el.scrollTop = scrollTop;
    });
    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  }, []);

  const handleAttributesScroll = useCallback(
    (scrollTop: number, source: HTMLDivElement) => {
      if (!scrollLockedRef.current || lockArmedRef.current) return;
      const sourceId = [...scrollContainersRef.current.entries()].find(([, el]) => el === source)?.[0];
      if (!sourceId) return;
      syncScrollFrom(scrollTop, sourceId, false);
    },
    [syncScrollFrom],
  );

  const handleCardClick = useCallback(
    (cardId: string) => {
      if (!scrollLockedRef.current) return;
      const source = scrollContainersRef.current.get(cardId);
      if (!source) return;
      setLockArmed(false);
      lockArmedRef.current = false;
      syncScrollFrom(source.scrollTop, cardId, true);
    },
    [syncScrollFrom],
  );

  const handleCardMouseEnter = useCallback(
    (cardId: string) => {
      if (!scrollLockedRef.current || lockArmedRef.current) return;
      const source = scrollContainersRef.current.get(cardId);
      if (!source) return;
      syncScrollFrom(source.scrollTop, cardId, true);
    },
    [syncScrollFrom],
  );

  function startReveal() {
    if (phase !== "idle") return;
    onHistoryExpandedChange?.(true);
    setPhase("revealed");
    setVisibleCards(0);
    history.forEach((_, index) => {
      window.setTimeout(
        () => setVisibleCards((count) => Math.max(count, index + 1)),
        index * CARD_STAGGER_MS,
      );
    });
  }

  function startHide() {
    if (phase !== "revealed") return;
    setPhase("hiding");
    const total = history.length;
    history.forEach((_, index) => {
      window.setTimeout(() => setVisibleCards(total - index - 1), index * CARD_STAGGER_MS);
    });
    window.setTimeout(() => {
      setPhase("idle");
      setVisibleCards(0);
      onHistoryExpandedChange?.(false);
    }, total * CARD_STAGGER_MS + CARD_SLIDE_MS);
  }

  function toggleHistory() {
    if (phase === "idle") startReveal();
    else if (phase === "revealed") startHide();
  }

  const showHistoryCards = phase === "revealed" || phase === "hiding";
  const historyVisible = phase === "revealed" || phase === "hiding";

  const attributeCompareRows = compareAttribute
    ? [
        {
          revision: "Current",
          value: formatTreeField(compareAttribute.key, currentSnapshot),
          fieldAudit: currentFieldAudit[compareAttribute.key],
        },
        ...history.map((entry) => ({
          revision: entry.label,
          value: formatTreeField(compareAttribute.key, entry.snapshot),
          fieldAudit: entry.fieldAudit[compareAttribute.key],
        })),
      ]
    : [];

  return (
    <>
      <AnimatePresence>
        {visible ? (
          <motion.div
            key={tree.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: PANEL_FADE_MS, ease: "easeOut" }}
            className="pointer-events-none absolute left-0 right-0 z-20 px-4"
            style={{
              top: cardTopOffset,
              bottom: CARD_BOTTOM_PADDING,
              height: expandedHeight,
            }}
          >
            {canScrollLeft ? (
              <button
                type="button"
                onClick={() => scrollRowBy(-1)}
                className="pointer-events-auto absolute left-1 top-1/2 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md backdrop-blur-sm transition hover:bg-white"
                aria-label="Previous audit cards"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : null}
            {canScrollRight ? (
              <button
                type="button"
                onClick={() => scrollRowBy(1)}
                className="pointer-events-auto absolute right-1 top-1/2 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md backdrop-blur-sm transition hover:bg-white"
                aria-label="Next audit cards"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : null}

            <div
              ref={rowScrollRef}
              data-audit-log=""
              className="audit-history-scroll pointer-events-auto flex h-full w-full items-stretch gap-2 overflow-x-auto overflow-y-hidden pb-1"
              onWheel={(event) => {
                const el = rowScrollRef.current;
                if (!el || el.scrollWidth <= el.clientWidth) return;
                if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
                if (event.shiftKey) {
                  event.preventDefault();
                  el.scrollLeft += event.deltaY;
                  updateRowScrollState();
                }
              }}
            >
              <div className="relative z-30 h-full shrink-0">
                <TreeContextPanel
                  snapshot={currentSnapshot}
                  variant="audit"
                  layout="current"
                  title={currentSnapshot.treeId}
                  subtitle={`Current · ${currentSnapshot.lastSurveyDate} · ${currentSnapshot.fieldTag}`}
                  landmarks={landmarks}
                  fillHeight
                  photoLabel="Survey photos"
                  attributesScrollRef={(el) => registerScrollContainer("current", el)}
                  onAttributesScroll={handleAttributesScroll}
                  onCardMouseEnter={() => handleCardMouseEnter("current")}
                  onCardClick={() => handleCardClick("current")}
                  tooltipEnabled={tooltipEnabled}
                  fieldAudit={currentFieldAudit}
                  onLabelDoubleClick={(key, label) => setCompareAttribute({ key, label })}
                  headerAction={
                    <AuditCardMenu
                      historyVisible={historyVisible}
                      onToggleHistory={toggleHistory}
                      scrollLocked={scrollLocked}
                      onToggleScrollLock={toggleScrollLock}
                      tooltipEnabled={tooltipEnabled}
                      onToggleTooltip={() => setTooltipEnabled((value) => !value)}
                    />
                  }
                />
              </div>

              {showHistoryCards
                ? history.map((entry, index) => {
                    const cardVisible = index < visibleCards;
                    const cardId = `history-${entry.version}`;
                    return (
                      <div
                        key={`${tree.id}-history-${entry.version}`}
                        className="relative h-full shrink-0"
                        style={{
                          zIndex: 20 - index,
                          transition: `transform ${CARD_SLIDE_MS}ms ease-out, opacity ${CARD_SLIDE_MS}ms ease-out`,
                          opacity: cardVisible ? 1 : 0,
                          transform: cardVisible ? "translateX(0)" : `translateX(${BEHIND_OFFSET})`,
                          pointerEvents: cardVisible ? "auto" : "none",
                        }}
                      >
                        <TreeContextPanel
                          snapshot={entry.snapshot}
                          variant="audit"
                          layout="history"
                          title={entry.snapshot.treeId}
                          landmarks={landmarks}
                          fillHeight
                          subtitle={`${entry.label} · ${entry.snapshot.lastSurveyDate} · ${entry.snapshot.fieldTag}`}
                          photoLabel="Survey photos"
                          attributesScrollRef={(el) => registerScrollContainer(cardId, el)}
                          onAttributesScroll={handleAttributesScroll}
                          onCardMouseEnter={() => handleCardMouseEnter(cardId)}
                          onCardClick={() => handleCardClick(cardId)}
                          tooltipEnabled={tooltipEnabled}
                          fieldAudit={entry.fieldAudit}
                          onLabelDoubleClick={(key, label) => setCompareAttribute({ key, label })}
                        />
                      </div>
                    );
                  })
                : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {compareAttribute ? (
        <TreeAttributeCompareModal
          title={`Compare — ${compareAttribute.label}`}
          attributeLabel={compareAttribute.label}
          rows={attributeCompareRows}
          tooltipEnabled={tooltipEnabled}
          onClose={() => setCompareAttribute(null)}
        />
      ) : null}
    </>
  );
}
