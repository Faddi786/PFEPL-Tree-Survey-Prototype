import { useEffect, useRef, useState } from "react";
import { createMapEngine } from "../../lib/mapEngine";
import {
  disposeToolsPageEngine,
  handleToolsEscape,
  handleToolsMapClick,
  type ToolsEngineCallbacks,
} from "../../lib/toolsPageEngine";
import { attachTreeSurveyLayer } from "../../hooks/useTreeSurveyLayer";
import {
  getTreeToolsRegionDataset,
  syncTreeSpatialDataset,
} from "../../data/treeSpatialData";
import type { RegionDataset } from "../../data/mockData";
import type { TransformMethod } from "../../data/transformationMock";

export type ToolsMapHandle = ReturnType<typeof createMapEngine>;

/** Street basemap + tree survey points only — no cadastral overlays. */
const TOOLS_MAP_HIDDEN_LAYERS = [
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

type Props = {
  activeTransform?: TransformMethod | null;
  activeMeasurement?: "distance" | "draw-polygon" | null;
  activeMutation?: "split" | "merge" | "vertex-edit" | null;
  onEngineReady?: (engine: ToolsMapHandle) => void;
  onToast?: ToolsEngineCallbacks["onToast"];
  onParcelSelect?: ToolsEngineCallbacks["onParcelSelect"];
  onDatasetChange?: (dataset: RegionDataset) => void;
};

export default function ToolsMap({
  activeTransform,
  activeMeasurement = null,
  activeMutation = null,
  onEngineReady,
  onToast,
  onParcelSelect,
  onDatasetChange,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ToolsMapHandle | null>(null);
  const treeLayerCleanupRef = useRef<(() => void) | null>(null);
  const activeTransformRef = useRef(activeTransform);
  const activeMeasurementRef = useRef(activeMeasurement);
  const activeMutationRef = useRef(activeMutation);
  const onToastRef = useRef(onToast);
  const onParcelSelectRef = useRef(onParcelSelect);
  const [regionDataset] = useState<RegionDataset>(() => getTreeToolsRegionDataset());

  useEffect(() => {
    activeTransformRef.current = activeTransform;
  }, [activeTransform]);

  useEffect(() => {
    activeMeasurementRef.current = activeMeasurement;
  }, [activeMeasurement]);

  useEffect(() => {
    activeMutationRef.current = activeMutation;
  }, [activeMutation]);

  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  useEffect(() => {
    onParcelSelectRef.current = onParcelSelect;
  }, [onParcelSelect]);

  useEffect(() => {
    if (!mapRef.current || engineRef.current) return;

    const treeDataset = getTreeToolsRegionDataset();
    const engine = createMapEngine(
      mapRef.current,
      treeDataset,
      {
        onToast: (message) => onToastRef.current?.(message),
        onMapClick: (pixel, _hasParcel, modifiers) => {
          const currentEngine = engineRef.current;
          if (!currentEngine) return;

          const mapCoord = currentEngine.map.getCoordinateFromPixel(pixel);
          handleToolsMapClick(
            currentEngine,
            mapCoord,
            activeTransformRef.current,
            { onToast: onToastRef.current },
            { shiftKey: modifiers?.shiftKey },
          );
        },
        onSelectionChange: () => {
          const currentEngine = engineRef.current;
          if (!currentEngine) return;
          onParcelSelectRef.current?.(currentEngine.getSelectedParcelCount(), []);
        },
      },
      { treeSurveyOnly: true },
    );
    engineRef.current = engine;
    engine.setBasemap("basemap-osm");
    TOOLS_MAP_HIDDEN_LAYERS.forEach((layerId) => {
      engine.setLayerVisibility(layerId, false);
    });
    engine.setParcelSelectionEnabled(false);

    treeLayerCleanupRef.current = attachTreeSurveyLayer(engine.map, () => {}, "default");
    syncTreeSpatialDataset(treeDataset);
    onEngineReady?.(engine);

    const map = engine.map;
    const resize = () => map.updateSize();
    requestAnimationFrame(resize);
    window.addEventListener("resize", resize);
    const observer = new ResizeObserver(resize);
    observer.observe(mapRef.current);

    return () => {
      window.removeEventListener("resize", resize);
      observer.disconnect();
      treeLayerCleanupRef.current?.();
      treeLayerCleanupRef.current = null;
      disposeToolsPageEngine(map);
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    syncTreeSpatialDataset(regionDataset);
    onDatasetChange?.(regionDataset);
  }, [regionDataset, onDatasetChange]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const engine = engineRef.current;
      if (!engine) return;

      handleToolsEscape(
        engine,
        {
          activeMeasurement: activeMeasurementRef.current,
          activeMutation: activeMutationRef.current,
        },
        {
          onToast: onToastRef.current,
          onParcelSelect: onParcelSelectRef.current,
        },
      );
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative z-0 h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
