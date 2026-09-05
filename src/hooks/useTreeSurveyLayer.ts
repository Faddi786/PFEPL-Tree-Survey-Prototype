import { useEffect, useRef } from "react";
import Feature from "ol/Feature";
import OlMap from "ol/Map";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { fromLonLat } from "ol/proj";
import { Fill, Stroke, Style, Circle as CircleStyle } from "ol/style";
import { unByKey } from "ol/Observable";
import type { TreeRecord } from "../data/treeSurveyData";
import { HEALTH_COLORS, TREE_SURVEY_RECORDS, WATERING_COLORS } from "../data/treeSurveyData";

export type TreeLayerMode = "default" | "health" | "species" | "water";

export type TreeLegendItem = {
  key: string;
  label: string;
  color: string;
  count: number;
};

const SPECIES_HUES = ["#15803d", "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#0891b2"];

export function speciesColor(species: string): string {
  const hash = species.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return SPECIES_HUES[hash % SPECIES_HUES.length];
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function treeCategoryKey(tree: TreeRecord, mode: TreeLayerMode): string | null {
  if (mode === "health") return tree.health;
  if (mode === "species") return tree.commonName;
  if (mode === "water") return tree.wateringStatus;
  return null;
}

export function buildThematicLegendItems(mode: TreeLayerMode): TreeLegendItem[] {
  if (mode === "default") return [];

  const counts: Record<string, number> = {};
  for (const tree of TREE_SURVEY_RECORDS) {
    const key = treeCategoryKey(tree, mode);
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  if (mode === "health") {
    return (["healthy", "stressed", "diseased"] as const).map((key) => ({
      key,
      label: capitalize(key),
      color: HEALTH_COLORS[key],
      count: counts[key] ?? 0,
    }));
  }

  if (mode === "water") {
    return (["ok", "due", "overdue"] as const).map((key) => ({
      key,
      label: key === "ok" ? "On cycle" : capitalize(key),
      color: WATERING_COLORS[key],
      count: counts[key] ?? 0,
    }));
  }

  return Object.keys(counts)
    .map((key) => {
      const sample = TREE_SURVEY_RECORDS.find((t) => t.commonName === key);
      return {
        key,
        label: key,
        color: speciesColor(sample?.species ?? key),
        count: counts[key] ?? 0,
      };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export type AttachTreeSurveyLayerOptions = {
  selectedTreeId?: string | null;
  onEmptyClick?: () => void;
};

function treeStyle(tree: TreeRecord, mode: TreeLayerMode, selected = false): Style {
  let color = "#15803d";
  if (mode === "health") {
    color = HEALTH_COLORS[tree.health];
  } else if (mode === "species") {
    color = speciesColor(tree.species);
  } else if (mode === "water") {
    color = WATERING_COLORS[tree.wateringStatus];
  }

  return new Style({
    image: new CircleStyle({
      radius: selected ? 9 : mode === "default" ? 6 : 7,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: selected ? "#0ea5e9" : "#ffffff", width: selected ? 3 : 2 }),
    }),
    zIndex: selected ? 20 : tree.health === "diseased" ? 10 : 1,
  });
}

export function attachTreeSurveyLayer(
  map: OlMap,
  onTreeClick: (tree: TreeRecord) => void,
  mode: TreeLayerMode = "default",
  categoryFilter: string | null = null,
  options: AttachTreeSurveyLayerOptions = {},
): () => void {
  const selectedTreeId = options.selectedTreeId ?? null;
  const features = TREE_SURVEY_RECORDS.filter((tree) => {
    if (!categoryFilter || mode === "default") return true;
    return treeCategoryKey(tree, mode) === categoryFilter;
  }).map((tree) => {
    const feature = new Feature({
      geometry: new Point(fromLonLat([tree.lng, tree.lat])),
      treeId: tree.id,
      tree,
    });
    feature.setStyle(treeStyle(tree, mode, tree.id === selectedTreeId));
    return feature;
  });

  const source = new VectorSource({ features });
  const layer = new VectorLayer({
    source,
    zIndex: 50,
    properties: { name: "tree-survey" },
  });
  map.addLayer(layer);

  const clickHandler = (evt: import("ol/MapBrowserEvent").default<PointerEvent>) => {
    let hit: TreeRecord | null = null;
    map.forEachFeatureAtPixel(evt.pixel, (feature, layerRef) => {
      if (layerRef !== layer) return;
      hit = feature.get("tree") as TreeRecord;
      return true;
    });
    if (hit) onTreeClick(hit);
    else options.onEmptyClick?.();
  };

  const clickKey = map.on("click", clickHandler as Parameters<OlMap["on"]>[1]);

  return () => {
    unByKey(clickKey);
    map.removeLayer(layer);
  };
}

export function useTreeSurveyLayer(
  map: OlMap | null | undefined,
  onTreeClick: (tree: TreeRecord) => void,
  mode: TreeLayerMode = "default",
  categoryFilter: string | null = null,
) {
  const onClickRef = useRef(onTreeClick);
  onClickRef.current = onTreeClick;

  useEffect(() => {
    if (!map) return;
    return attachTreeSurveyLayer(map, (tree) => onClickRef.current(tree), mode, categoryFilter);
  }, [map, mode, categoryFilter]);
}
