import { useEffect, useMemo, useRef, useState } from "react";
import { PanelRightClose, PanelRightOpen, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import BasemapDropdown from "./BasemapDropdown";
import MapToolsDropdown from "./MapToolsDropdown";
import ThematicLayersDropdown from "./ThematicLayersDropdown";
import TreeContextPanel from "./tree/TreeContextPanel";
import TreeAiAnalysisModal from "./tree/TreeAiAnalysisModal";
import TreeThematicLegend from "./tree/TreeThematicLegend";
import { createMapEngine, type MapTool } from "../lib/mapEngine";
import {
  attachTreeSurveyLayer,
  buildThematicLegendItems,
  type TreeLayerMode,
} from "../hooks/useTreeSurveyLayer";
import type { TreeRecord } from "../data/treeSurveyData";
import { buildCurrentTreeSnapshot } from "../data/treeAuditHistory";
import { getTreeToolsRegionDataset } from "../data/treeSpatialData";
import {
  type LayerConfig,
  type LayerGroup,
  type ParcelRecord,
  type RegionKey,
} from "../data/mockData";

/** Toggle map top-right tools menu; component and routes remain available. */
const SHOW_MAP_TOOLS = false;

/** Engine vector layer ids — always hidden; trees render via attachTreeSurveyLayer. */
const WORKBENCH_MAP_HIDDEN_LAYERS = [
  "ortho",
  "region",
  "taluk",
  "village",
  "ward",
  "adminState",
  "adminDistrict",
  "adminTaluka",
  "adminVillage",
  "fmb",
  "fmbChains",
  "parcelBoundaries",
  "parcels",
  "variance",
  "dgps",
  "collabland",
  "crops",
  "buildings",
  "trees",
  "roads",
  "waterBodies",
  "forest",
  "cadastralDimensions",
] as const;

const TREE_STYLE_LAYER_IDS = new Set([
  "trees",
  "tree-health",
  "tree-species",
  "tree-water",
]);

const THEMATIC_MODE_TITLES: Record<Exclude<TreeLayerMode, "default">, string> = {
  health: "Health Status",
  species: "Species / Type",
  water: "Watering due",
};

function resolveTreeLayerMode(thematicLayers: LayerConfig[]): TreeLayerMode {
  if (thematicLayers.find((l) => l.id === "tree-health")?.visible) return "health";
  if (thematicLayers.find((l) => l.id === "tree-species")?.visible) return "species";
  if (thematicLayers.find((l) => l.id === "tree-water")?.visible) return "water";
  return "default";
}

type Props = {
  regionKey: RegionKey;
  layerGroups: LayerGroup[];
  thematicLayers: LayerConfig[];
  onToggleThematicLayer: (layerId: string, visible: boolean) => void;
  basemapId: string;
  onBasemapChange?: (id: string) => void;
  panelOpen?: boolean;
  onTogglePanel?: () => void;
};

type ParcelContextMenuState = {
  parcel: ParcelRecord;
  pixel: [number, number];
  geometryDirty: boolean;
};

type FmbChainPanelState = {
  fmbText: string;
  pixel: [number, number];
};

export default function MapView({
  regionKey: _regionKey,
  layerGroups,
  thematicLayers,
  onToggleThematicLayer,
  basemapId,
  onBasemapChange,
  panelOpen = false,
  onTogglePanel,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ReturnType<typeof createMapEngine> | null>(null);
  const [activeTool, setActiveTool] = useState<MapTool>("none");
  const [toast, setToast] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ParcelContextMenuState | null>(null);
  const [fmbChainPanel, setFmbChainPanel] = useState<FmbChainPanelState | null>(null);
  const [selectedTree, setSelectedTree] = useState<TreeRecord | null>(null);
  const [treeAiOpen, setTreeAiOpen] = useState(false);
  const [legendFilter, setLegendFilter] = useState<string | null>(null);
  const treeLayerCleanupRef = useRef<(() => void) | null>(null);

  const regionDataset = useMemo(() => getTreeToolsRegionDataset(), []);
  const treeLayerMode = useMemo(() => resolveTreeLayerMode(thematicLayers), [thematicLayers]);
  const legendItems = useMemo(() => buildThematicLegendItems(treeLayerMode), [treeLayerMode]);
  const legendTitle = treeLayerMode === "default" ? null : THEMATIC_MODE_TITLES[treeLayerMode];
  const showLegend = legendTitle !== null && legendItems.length > 0;

  useEffect(() => {
    setLegendFilter(null);
  }, [treeLayerMode]);

  useEffect(() => {
    if (!mapRef.current || engineRef.current) return;
    engineRef.current = createMapEngine(
      mapRef.current,
      regionDataset,
      {
        onToast: (message) => setToast(message),
        onParcelContext: (parcel, position, info) => {
          if (!info.geometryDirty) return;
          setContextMenu({
            parcel: parcel as ParcelRecord,
            pixel: [position.pixel[0], position.pixel[1]],
            geometryDirty: true,
          });
        },
        onFmbChainClick: (data, position) => {
          setContextMenu(null);
          setFmbChainPanel({
            fmbText: data.fmbText,
            pixel: [position.pixel[0], position.pixel[1]],
          });
        },
        onParcelClick: () => {
          setFmbChainPanel(null);
        },
        onMapClick: (_pixel, hasParcel) => {
          if (!hasParcel) {
            setContextMenu(null);
            setFmbChainPanel(null);
          }
        },
      },
      { treeSurveyOnly: true },
    );
    WORKBENCH_MAP_HIDDEN_LAYERS.forEach((layerId) => {
      engineRef.current?.setLayerVisibility(layerId, false);
    });
    engineRef.current?.setBasemap("basemap-osm");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = engineRef.current?.map;
    if (!map) return;

    treeLayerCleanupRef.current?.();
    const treesVisible = thematicLayers.find((l) => l.id === "trees")?.visible !== false;

    if (treesVisible) {
      treeLayerCleanupRef.current = attachTreeSurveyLayer(
        map,
        (tree) => {
          setSelectedTree(tree);
          setFmbChainPanel(null);
          setContextMenu(null);
        },
        treeLayerMode,
        treeLayerMode === "default" ? null : legendFilter,
        {
          selectedTreeId: selectedTree?.id ?? null,
          onEmptyClick: () => setSelectedTree(null),
        },
      );
    }

    return () => {
      treeLayerCleanupRef.current?.();
      treeLayerCleanupRef.current = null;
    };
  }, [thematicLayers, regionDataset, treeLayerMode, legendFilter, selectedTree?.id]);

  useEffect(() => {
    engineRef.current?.setBasemap(basemapId);
  }, [basemapId]);

  useEffect(() => {
    WORKBENCH_MAP_HIDDEN_LAYERS.forEach((layerId) => {
      engineRef.current?.setLayerVisibility(layerId, false);
    });
    layerGroups.forEach((group) => {
      group.layers.forEach((layer) => engineRef.current?.setLayerVisibility(layer.id, false));
    });
    thematicLayers.forEach((layer) => {
      if (TREE_STYLE_LAYER_IDS.has(layer.id)) return;
      engineRef.current?.setLayerVisibility(layer.id, false);
    });
    engineRef.current?.setLayerVisibility("trees", false);
  }, [layerGroups, thematicLayers]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      setContextMenu(null);
      setFmbChainPanel(null);
      setToast(null);
      setActiveTool("none");
      engineRef.current?.clearHighlights();
      engineRef.current?.resetTools(true);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSelectTool(tool: MapTool) {
    setActiveTool(tool);
    engineRef.current?.setTool(tool);
  }

  function handleSaveGeometry() {
    if (!contextMenu) return;
    const saved = engineRef.current?.commitParcelGeometry(contextMenu.parcel.id);
    if (saved) setContextMenu(null);
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <div ref={mapRef} className="absolute inset-0" />

      {toast ? (
        <div
          className={`pointer-events-none absolute top-4 flex flex-col gap-2 ${
            selectedTree ? "left-[20.5rem]" : "left-4"
          }`}
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-sky-600" />
            <span className="text-xs font-medium text-slate-700">{toast}</span>
          </div>
        </div>
      ) : null}

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        {onBasemapChange ? (
          <BasemapDropdown activeBasemapId={basemapId} onBasemapChange={onBasemapChange} />
        ) : null}
        <ThematicLayersDropdown layers={thematicLayers} onToggle={onToggleThematicLayer} />
        {SHOW_MAP_TOOLS ? (
          <MapToolsDropdown activeTool={activeTool} onSelectTool={handleSelectTool} />
        ) : null}
        {onTogglePanel ? (
          <button
            type="button"
            onClick={onTogglePanel}
            aria-label={panelOpen ? "Close side panel" : "Open side panel"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/95 text-slate-700 shadow-lg backdrop-blur-md transition hover:border-slate-200 hover:text-slate-900"
          >
            {panelOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>

      {showLegend && legendTitle ? (
        <TreeThematicLegend
          title={legendTitle}
          items={legendItems}
          activeKey={legendFilter}
          onSelect={setLegendFilter}
        />
      ) : null}

      {fmbChainPanel ? (
        <div
          className="absolute z-30 max-w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-amber-200/80 bg-white/95 shadow-lg backdrop-blur-sm"
          style={{
            left: Math.min(fmbChainPanel.pixel[0], (mapRef.current?.clientWidth ?? 400) - 240),
            top: Math.min(fmbChainPanel.pixel[1], (mapRef.current?.clientHeight ?? 400) - 160),
          }}
        >
          <div className="border-b border-amber-100 bg-amber-50/90 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">FMB Chain Record</p>
          </div>
          <pre className="whitespace-pre-wrap px-3 py-2.5 font-mono text-[11px] leading-relaxed text-slate-700">
            {fmbChainPanel.fmbText}
          </pre>
          <button
            type="button"
            onClick={() => setFmbChainPanel(null)}
            className="block w-full border-t border-slate-100 px-3 py-1.5 text-left text-[11px] font-medium text-slate-500 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      ) : null}

      {contextMenu?.geometryDirty ? (
        <div
          className="absolute z-30 min-w-[88px] overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-lg backdrop-blur-sm"
          style={{ left: contextMenu.pixel[0], top: contextMenu.pixel[1] }}
        >
          <button
            type="button"
            onClick={handleSaveGeometry}
            className="block w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Send for approval
          </button>
        </div>
      ) : null}

      <AnimatePresence>
        {selectedTree ? (
          <motion.div
            key={selectedTree.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="pointer-events-auto absolute left-4 top-4 z-30"
          >
            <TreeContextPanel
              snapshot={buildCurrentTreeSnapshot(selectedTree)}
              variant="overlay"
              photoLabel="Survey photos"
              onClose={() => setSelectedTree(null)}
              onOpenAi={() => setTreeAiOpen(true)}
              showHistoryLink
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <TreeAiAnalysisModal open={treeAiOpen} onClose={() => setTreeAiOpen(false)} />
    </div>
  );
}
