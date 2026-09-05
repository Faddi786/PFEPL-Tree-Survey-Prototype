import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Feature from "ol/Feature";
import OlMap from "ol/Map";
import View from "ol/View";
import Point from "ol/geom/Point";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { fromLonLat } from "ol/proj";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { createBasemapSource } from "../../lib/basemaps";
import {
  HEALTH_COLORS,
  SURVEY_ORIGIN,
  TREE_SURVEY_RECORDS,
  type TreeRecord,
} from "../../data/treeSurveyData";

export type NilAiMapHandle = {
  highlightTrees: (ids: string[], options?: { colorByHealth?: boolean }) => void;
  clearHighlights: () => void;
};

type HighlightState = {
  ids: Set<string>;
  colorByHealth: boolean;
};

function treeStyle(tree: TreeRecord, highlight: HighlightState | null): Style {
  const hasSelection = Boolean(highlight && highlight.ids.size);
  const selected = hasSelection && highlight!.ids.has(tree.id);
  const dimmed = hasSelection && !selected;
  const color =
    selected || highlight?.colorByHealth || !hasSelection
      ? HEALTH_COLORS[tree.health]
      : "#15803d";

  return new Style({
    image: new CircleStyle({
      radius: selected ? 9 : dimmed ? 4 : 6,
      fill: new Fill({
        color: dimmed ? "rgba(21, 128, 61, 0.22)" : color,
      }),
      stroke: new Stroke({
        color: selected ? "#0f172a" : "#ffffff",
        width: selected ? 2.4 : dimmed ? 1 : 1.8,
      }),
    }),
    zIndex: selected ? 30 : tree.health === "diseased" ? 8 : 1,
  });
}

const NilAiMap = forwardRef<NilAiMapHandle>(function NilAiMap(_, ref) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const olMapRef = useRef<OlMap | null>(null);
  const sourceRef = useRef<VectorSource | null>(null);
  const highlightRef = useRef<HighlightState | null>(null);

  function restyle() {
    const source = sourceRef.current;
    if (!source) return;
    source.getFeatures().forEach((feature) => {
      const tree = feature.get("tree") as TreeRecord;
      feature.setStyle(treeStyle(tree, highlightRef.current));
    });
  }

  function fitToIds(ids: string[]) {
    const map = olMapRef.current;
    const source = sourceRef.current;
    if (!map || !source || !ids.length) return;
    const idSet = new Set(ids);
    const matched = source.getFeatures().filter((feature) => idSet.has(String(feature.get("treeId"))));
    if (!matched.length) return;

    let extent = matched[0].getGeometry()?.getExtent();
    matched.slice(1).forEach((feature) => {
      const geometry = feature.getGeometry();
      if (!geometry || !extent) return;
      const next = geometry.getExtent();
      extent = [
        Math.min(extent[0], next[0]),
        Math.min(extent[1], next[1]),
        Math.max(extent[2], next[2]),
        Math.max(extent[3], next[3]),
      ];
    });

    if (extent && extent.every((value) => Number.isFinite(value))) {
      map.getView().fit(extent, {
        padding: [48, 48, 48, 48],
        duration: 700,
        maxZoom: 18,
      });
    }
  }

  useImperativeHandle(ref, () => ({
    highlightTrees: (ids, options) => {
      highlightRef.current = {
        ids: new Set(ids),
        colorByHealth: options?.colorByHealth ?? true,
      };
      restyle();
      fitToIds(ids);
    },
    clearHighlights: () => {
      highlightRef.current = null;
      restyle();
      olMapRef.current?.getView().animate({
        center: fromLonLat([SURVEY_ORIGIN.lng, SURVEY_ORIGIN.lat]),
        zoom: 16,
        duration: 500,
      });
    },
  }));

  useEffect(() => {
    if (!mapRef.current || olMapRef.current) return;

    const features = TREE_SURVEY_RECORDS.map((tree) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([tree.lng, tree.lat])),
        treeId: tree.id,
        tree,
      });
      feature.setStyle(treeStyle(tree, null));
      return feature;
    });

    const source = new VectorSource({ features });
    sourceRef.current = source;

    const map = new OlMap({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: createBasemapSource("basemap-osm") }),
        new VectorLayer({ source, zIndex: 50 }),
      ],
      view: new View({
        center: fromLonLat([SURVEY_ORIGIN.lng, SURVEY_ORIGIN.lat]),
        zoom: 16,
        maxZoom: 19,
      }),
      controls: [],
    });
    olMapRef.current = map;

    const resize = () => map.updateSize();
    requestAnimationFrame(resize);
    window.addEventListener("resize", resize);
    const observer = new ResizeObserver(resize);
    observer.observe(mapRef.current);

    return () => {
      window.removeEventListener("resize", resize);
      observer.disconnect();
      map.setTarget(undefined);
      olMapRef.current = null;
      sourceRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <div ref={mapRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-16 rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm lg:left-4 lg:top-14">
        <p className="text-[11px] font-semibold text-slate-800">Green Belt tree inventory</p>
        <p className="text-[10px] text-slate-500">Street survey · health-coded points</p>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-1.5 rounded-xl border border-white/80 bg-white/90 px-2.5 py-2 shadow-sm backdrop-blur-sm">
        {(
          [
            ["healthy", "Healthy"],
            ["stressed", "Stressed"],
            ["diseased", "Diseased"],
          ] as const
        ).map(([key, label]) => (
          <span key={key} className="inline-flex items-center gap-1 text-[10px] text-slate-600">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: HEALTH_COLORS[key] }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
});

export default NilAiMap;
