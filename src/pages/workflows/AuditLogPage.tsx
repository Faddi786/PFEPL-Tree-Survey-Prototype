import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { fromLonLat } from "ol/proj";
import TreeAuditHistoryRow from "../../components/tree/TreeAuditHistoryRow";
import { createMapEngine } from "../../lib/mapEngine";
import { attachTreeSurveyLayer } from "../../hooks/useTreeSurveyLayer";
import {
  generateTreeAuditHistory,
  searchAuditTree,
  searchTrees,
} from "../../data/treeAuditHistory";
import { getTreeById, type TreeRecord } from "../../data/treeSurveyData";
import { getTreeToolsRegionDataset } from "../../data/treeSpatialData";

const MAX_SEARCH_SUGGESTIONS = 6;
const PANEL_FADE_MS = 225;

function treeSuggestionLabel(tree: TreeRecord): string {
  return `${tree.label} • ${tree.commonName}`;
}

function treeSuggestionMeta(tree: TreeRecord): string {
  return `${tree.id} • ${tree.species}`;
}

export default function AuditLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const topControlsRef = useRef<HTMLDivElement | null>(null);
  const searchFormRef = useRef<HTMLFormElement | null>(null);
  const engineRef = useRef<ReturnType<typeof createMapEngine> | null>(null);
  const treeLayerCleanupRef = useRef<(() => void) | null>(null);
  const selectedTreeRef = useRef<TreeRecord | null>(null);
  const panelVisibleRef = useRef(false);
  const regionDataset = useMemo(() => getTreeToolsRegionDataset(), []);

  const [selectedTree, setSelectedTree] = useState<TreeRecord | null>(null);
  const [panelTree, setPanelTree] = useState<TreeRecord | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [cardTopOffset, setCardTopOffset] = useState("4.75rem");

  selectedTreeRef.current = selectedTree;
  panelVisibleRef.current = panelVisible;

  useEffect(() => {
    function measureTopControls() {
      const el = topControlsRef.current ?? searchFormRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setCardTopOffset(`${rect.bottom + 10}px`);
    }

    measureTopControls();
    const raf = requestAnimationFrame(measureTopControls);
    window.addEventListener("resize", measureTopControls);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measureTopControls);
    };
  }, []);

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    return searchTrees(q).slice(0, MAX_SEARCH_SUGGESTIONS);
  }, [searchQuery]);

  const displayTree = panelTree;

  const auditHistory = useMemo(() => {
    if (!displayTree) return [];
    return generateTreeAuditHistory(displayTree);
  }, [displayTree]);

  function hideAttributePanel() {
    setPanelVisible(false);
    setShowSuggestions(false);
    setHistoryExpanded(false);
  }

  function dismissPanel() {
    hideAttributePanel();
    window.setTimeout(() => {
      setSelectedTree(null);
      setPanelTree(null);
      setSearchFeedback(null);
      setSearchQuery("");
      setSearchParams({}, { replace: true });
    }, PANEL_FADE_MS);
  }

  function selectTree(tree: TreeRecord) {
    setSelectedTree(tree);
    setPanelTree(tree);
    setPanelVisible(true);
    setSearchQuery(tree.label);
    setSearchFeedback(null);
    setShowSuggestions(false);
    setHistoryExpanded(true);
    setSearchParams({ tree: tree.id }, { replace: true });

    const map = engineRef.current?.map;
    map?.getView().animate({
      center: fromLonLat([tree.lng, tree.lat]),
      zoom: Math.max(map.getView().getZoom() ?? 16, 18),
      duration: 450,
    });
  }

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    if (searchSuggestions.length === 1) {
      selectTree(searchSuggestions[0]);
      return;
    }
    const match = searchAuditTree(searchQuery);
    if (!match) {
      setSearchFeedback("No tree matched that search.");
      setShowSuggestions(false);
      return;
    }
    selectTree(match);
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

      setShowSuggestions(false);
      if (!panelVisibleRef.current || !selectedTreeRef.current) return;

      event.preventDefault();
      hideAttributePanel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!mapRef.current || engineRef.current) return;

    engineRef.current = createMapEngine(mapRef.current, regionDataset, {}, { treeSurveyOnly: true });
    engineRef.current.setBasemap("basemap-osm");
    engineRef.current.setParcelSelectionEnabled(false);

    const map = engineRef.current.map;
    const resize = () => map.updateSize();
    requestAnimationFrame(resize);
    window.addEventListener("resize", resize);

    const observer = new ResizeObserver(resize);
    if (mapRef.current) observer.observe(mapRef.current);

    return () => {
      window.removeEventListener("resize", resize);
      observer.disconnect();
      treeLayerCleanupRef.current?.();
      treeLayerCleanupRef.current = null;
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [regionDataset]);

  useEffect(() => {
    const map = engineRef.current?.map;
    if (!map) return;

    treeLayerCleanupRef.current?.();
    treeLayerCleanupRef.current = attachTreeSurveyLayer(
      map,
      (tree) => selectTree(tree),
      "default",
      null,
      {
        selectedTreeId: selectedTree?.id ?? null,
        onEmptyClick: () => {
          if (selectedTreeRef.current) dismissPanel();
        },
      },
    );

    return () => {
      treeLayerCleanupRef.current?.();
      treeLayerCleanupRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTree?.id]);

  useEffect(() => {
    const requestedId = searchParams.get("tree");
    if (!requestedId) return;
    if (selectedTreeRef.current?.id === requestedId) return;
    const match = getTreeById(requestedId);
    if (match) selectTree(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div
      data-audit-log
      className="flex h-screen flex-col overflow-hidden bg-[#F7F7F5] text-[#1A1A1A]"
      style={{ "--audit-card-top": cardTopOffset } as React.CSSProperties}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div ref={mapRef} className="absolute inset-0" />

        <div
          ref={topControlsRef}
          className="pointer-events-none absolute inset-x-4 top-4 z-30 flex items-start gap-3"
        >
          <div className="pointer-events-auto flex min-w-0 items-center gap-2">
            <Link
              to="/app"
              aria-label="Back"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm transition hover:border-slate-200 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div ref={searchRef} className="relative w-[min(320px,calc(100vw-8rem))]">
              <form
                ref={searchFormRef}
                onSubmit={handleSearchSubmit}
                className="relative z-30 flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm"
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setShowSuggestions(true);
                    if (searchFeedback) setSearchFeedback(null);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) setShowSuggestions(true);
                  }}
                  placeholder="Search tree ID, species, tag…"
                  className="min-w-0 flex-1 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
                  autoComplete="off"
                />
              </form>

              {showSuggestions && searchSuggestions.length > 0 ? (
                <ul
                  role="listbox"
                  className="audit-search-dropdown absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 shadow-lg backdrop-blur-sm"
                >
                  {searchSuggestions.map((tree) => (
                    <li key={tree.id} role="option">
                      <button
                        type="button"
                        onClick={() => selectTree(tree)}
                        className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition hover:bg-slate-50"
                      >
                        <span className="text-xs font-medium text-slate-800">
                          {treeSuggestionLabel(tree)}
                        </span>
                        <span className="text-[10px] text-slate-500">{treeSuggestionMeta(tree)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {showSuggestions && searchQuery.trim() && searchSuggestions.length === 0 ? (
                <p className="audit-search-dropdown absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 text-[11px] text-slate-500 shadow-sm backdrop-blur-sm">
                  No matching trees
                </p>
              ) : null}

              {searchFeedback ? (
                <p className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800 shadow-sm">
                  {searchFeedback}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {displayTree && auditHistory.length > 0 ? (
          <TreeAuditHistoryRow
            tree={displayTree}
            history={auditHistory}
            historyExpanded={historyExpanded}
            onHistoryExpandedChange={setHistoryExpanded}
            cardTopOffset={cardTopOffset}
            visible={panelVisible}
          />
        ) : null}
      </div>
    </div>
  );
}
