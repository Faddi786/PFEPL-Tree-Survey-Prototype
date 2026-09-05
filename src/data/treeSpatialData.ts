import * as turf from "@turf/turf";
import type { RegionDataset } from "./mockData";
import {
  HEALTH_COLORS,
  TREE_SURVEY_RECORDS,
  type TreeHealthStatus,
  type TreeRecord,
  type WaterSoilStatus,
} from "./treeSurveyData";

/** Tree footprint used by spatial tools (canopy circle). */
export type TreeSpatialFeature = {
  id: string;
  surveyNo: string;
  ring: [number, number][];
  areaSqM: number;
  owner: string;
  classification: string;
  village: string;
  tree: TreeRecord;
};

/** Alias kept for spatial tool demo compatibility. */
export type CadastralParcel = TreeSpatialFeature;

export type BufferFeatureType = "road" | "river" | "canal";

export type AreaDiffCase = {
  id: string;
  surveyNo: string;
  village: string;
  fmbAreaSqM: number;
  dgpsAreaSqM: number;
  diffSqM: number;
  variancePct: number;
  status: "minor" | "moderate" | "critical";
  parcelId: string;
};

export type EncroachmentCase = {
  id: string;
  surveyNo: string;
  govtLandType: string;
  encroachedAreaSqM: number;
  buildingType: string;
  status: "open" | "notified" | "resolved";
  ring: [number, number][];
  govtLandRing: [number, number][];
  parcelId: string;
};

export type OverlapCase = {
  id: string;
  parcelA: string;
  parcelB: string;
  overlapAreaSqM: number;
  village: string;
  severity: "low" | "medium" | "high";
  ringA: [number, number][];
  ringB: [number, number][];
  overlapRing: [number, number][];
};

export type IntersectLayerPair = {
  id: string;
  label: string;
  layerA: string;
  layerB: string;
  description: string;
  layerARing: [number, number][];
  layerBRing: [number, number][];
  intersectRing: [number, number][];
  intersectAreaSqM: number;
  parcelCount: number;
};

const SURVEY_BLOCK = "Green Belt Block A";
const SURVEY_CENTER: [number, number] = [79.8372, 10.9254];

let cachedFeatures: TreeSpatialFeature[] | null = null;
let cachedById: Map<string, TreeSpatialFeature> | null = null;

export function syncTreeSpatialDataset(_dataset?: RegionDataset): void {
  cachedFeatures = null;
  cachedById = null;
}

function treePoint(tree: TreeSpatialFeature | TreeRecord) {
  const record = "tree" in tree ? tree.tree : tree;
  return turf.point([record.lng, record.lat]);
}

function metersBetween(a: TreeSpatialFeature, b: TreeSpatialFeature) {
  return turf.distance(treePoint(a), treePoint(b), { units: "meters" });
}

function canopyRadiusM(tree: TreeSpatialFeature) {
  return Math.max(tree.tree.canopyDiameterM / 2, 1.5);
}

function canopyRing(tree: TreeRecord): [number, number][] {
  const radiusM = Math.max(tree.canopyDiameterM / 2, 1.5);
  const radiusDeg = radiusM / 111_320;
  const points: [number, number][] = [];
  for (let i = 0; i <= 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2;
    points.push([
      tree.lng + radiusDeg * Math.cos(angle),
      tree.lat + radiusDeg * Math.sin(angle) * 0.92,
    ]);
  }
  return points;
}

function treeToFeature(tree: TreeRecord): TreeSpatialFeature {
  const ring = canopyRing(tree);
  const poly = turf.polygon([ring]);
  return {
    id: tree.id,
    surveyNo: tree.label,
    ring,
    areaSqM: Math.round(turf.area(poly)),
    owner: tree.surveyor,
    classification: tree.commonName,
    village: SURVEY_BLOCK,
    tree,
  };
}

export function getTreeRecords(): TreeRecord[] {
  return TREE_SURVEY_RECORDS;
}

export function getCadastralParcels(): TreeSpatialFeature[] {
  if (cachedFeatures) return cachedFeatures;
  cachedFeatures = TREE_SURVEY_RECORDS.map(treeToFeature);
  cachedById = new Map(cachedFeatures.map((feature) => [feature.id, feature]));
  return cachedFeatures;
}

export function getTreeBySpatialId(id: string): TreeSpatialFeature | undefined {
  if (!cachedById) getCadastralParcels();
  return cachedById?.get(id);
}

export function getWorkbenchDataset(): RegionDataset {
  return getTreeToolsRegionDataset();
}

export function getTreeToolsRegionDataset(): RegionDataset {
  const features = getCadastralParcels();
  const collection = turf.featureCollection(features.map((f) => turf.polygon([f.ring], { id: f.id })));
  const bbox = turf.bbox(collection) as [number, number, number, number];
  const center: [number, number] = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];

  return {
    center,
    zoom: 16,
    cadastralView: { center, zoom: 16 },
    parcelAttrs: {},
    parcels: [],
    geojson: {
      region: { type: "FeatureCollection", features: [] },
      taluk: { type: "FeatureCollection", features: [] },
      village: { type: "FeatureCollection", features: [] },
      ward: { type: "FeatureCollection", features: [] },
      fmb: { type: "FeatureCollection", features: [] },
      fmbChains: { type: "FeatureCollection", features: [] },
      parcels: { type: "FeatureCollection", features: [] },
      parcelBoundaries: { type: "FeatureCollection", features: [] },
      variance: { type: "FeatureCollection", features: [] },
      dgps: { type: "FeatureCollection", features: [] },
      collabland: { type: "FeatureCollection", features: [] },
      ortho: { type: "FeatureCollection", features: [] },
      crops: { type: "FeatureCollection", features: [] },
      buildings: { type: "FeatureCollection", features: [] },
      trees: { type: "FeatureCollection", features: [] },
      roads: { type: "FeatureCollection", features: [] },
      waterBodies: { type: "FeatureCollection", features: [] },
      forest: { type: "FeatureCollection", features: [] },
      cadastralDimensions: { type: "FeatureCollection", features: [] },
    },
    controlPoints: [],
  };
}

export function getSpatialContext() {
  return {
    village: SURVEY_BLOCK,
    taluk: "Urban Forestry",
    district: "Puducherry",
    ut: "Puducherry",
    center: SURVEY_CENTER,
    zoom: 16,
  };
}

export function getSelectedParcelId(): string {
  const trees = getCadastralParcels();
  if (!trees.length) return "";
  let best = trees[0];
  let bestCount = -1;
  for (const tree of trees) {
    const count = treesTouching(tree).length;
    if (count > bestCount) {
      best = tree;
      bestCount = count;
      if (count >= 4) break;
    }
  }
  return best.id;
}

function convexRingFromTrees(trees: TreeSpatialFeature[]): [number, number][] {
  if (!trees.length) return [];
  const collection = turf.featureCollection(trees.map((t) => treePoint(t)));
  const hull = turf.convex(collection);
  if (hull?.geometry?.type === "Polygon") {
    return hull.geometry.coordinates[0] as [number, number][];
  }
  const bbox = turf.bbox(collection) as [number, number, number, number];
  const [minX, minY, maxX, maxY] = bbox;
  return [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
    [minX, minY],
  ];
}

export function getVillageBoundaryRing(): [number, number][] {
  return convexRingFromTrees(getCadastralParcels());
}

export function getFloodZoneRing(): [number, number][] {
  const dryTrees = getCadastralParcels().filter(
    (t) => t.tree.waterStatus === "dry" || t.tree.waterStatus === "waterlogged",
  );
  return dryTrees.length ? convexRingFromTrees(dryTrees) : getVillageBoundaryRing();
}

export function getViewportExtent(): [number, number][] {
  return getVillageBoundaryRing();
}

export function getDgpsSurveyPoint(): [number, number] {
  const trees = getCadastralParcels();
  const stressed = trees.find((t) => t.tree.health === "stressed") ?? trees[0];
  if (!stressed) return SURVEY_CENTER;
  const metersEast = 12;
  const lngOffset = metersEast / (111_320 * Math.cos((stressed.tree.lat * Math.PI) / 180));
  return [stressed.tree.lng + lngOffset, stressed.tree.lat];
}

export function getBufferFeatures(): Record<
  BufferFeatureType,
  { label: string; line: [number, number][]; color: string }
> {
  const ring = getVillageBoundaryRing();
  const bbox = turf.bbox(turf.polygon([ring])) as [number, number, number, number];
  const [minX, minY, maxX, maxY] = bbox;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  return {
    road: {
      label: "Survey corridor road",
      line: [
        [minX + (maxX - minX) * 0.05, minY + (maxY - minY) * 0.2],
        [midX, midY],
        [maxX - (maxX - minX) * 0.08, maxY - (maxY - minY) * 0.15],
      ],
      color: "#475569",
    },
    river: {
      label: "Irrigation channel",
      line: [
        [minX, minY + (maxY - minY) * 0.12],
        [midX, minY + (maxY - minY) * 0.14],
        [maxX, minY + (maxY - minY) * 0.1],
      ],
      color: "#0284c7",
    },
    canal: {
      label: "Green belt path",
      line: [
        [minX + (maxX - minX) * 0.55, minY + (maxY - minY) * 0.12],
        [midX, midY - (maxY - minY) * 0.05],
        [minX + (maxX - minX) * 0.58, maxY - (maxY - minY) * 0.2],
      ],
      color: "#0d9488",
    },
  };
}

export function buildBufferFeature(
  featureType: BufferFeatureType,
  distanceM: number,
): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null {
  const line = getBufferFeatures()[featureType].line;
  const buffered = turf.buffer(turf.lineString(line), distanceM, { units: "meters" });
  if (!buffered?.geometry) return null;
  if (buffered.geometry.type === "Polygon" || buffered.geometry.type === "MultiPolygon") {
    return buffered as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  }
  return null;
}

export function bufferRingsFromFeature(
  feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
): [number, number][][] {
  if (feature.geometry.type === "Polygon") {
    return [feature.geometry.coordinates[0] as [number, number][]];
  }
  return feature.geometry.coordinates.map((poly) => poly[0] as [number, number][]);
}

export function buildBufferPolygon(featureType: BufferFeatureType, distanceM: number): [number, number][] {
  const feature = buildBufferFeature(featureType, distanceM);
  if (!feature) return [];
  return bufferRingsFromFeature(feature)[0] ?? [];
}

export function distanceToBufferLine(tree: TreeSpatialFeature, featureType: BufferFeatureType): number {
  const line = turf.lineString(getBufferFeatures()[featureType].line);
  return turf.pointToLineDistance(treePoint(tree), line, { units: "meters" });
}

export function getParcelsInBuffer(featureType: BufferFeatureType, distanceM: number): TreeSpatialFeature[] {
  return getCadastralParcels()
    .map((tree) => ({ tree, distance: distanceToBufferLine(tree, featureType) }))
    .filter((row) => row.distance <= distanceM)
    .sort((a, b) => a.distance - b.distance)
    .map((row) => row.tree);
}

export function getTreePointsInPolygon(polygon: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>): string[] {
  return getCadastralParcels()
    .filter((tree) => {
      try {
        return turf.booleanPointInPolygon(treePoint(tree), polygon);
      } catch {
        return false;
      }
    })
    .map((tree) => tree.id);
}

export function isTreeInsideRing(tree: TreeSpatialFeature, ring: [number, number][]): boolean {
  if (ring.length < 4) return false;
  try {
    return turf.booleanPointInPolygon(treePoint(tree), turf.polygon([ring]));
  } catch {
    return false;
  }
}

export function treesTouching(selected: TreeSpatialFeature): TreeSpatialFeature[] {
  const selectedRadius = canopyRadiusM(selected);
  return getCadastralParcels().filter((other) => {
    if (other.id === selected.id) return false;
    return metersBetween(selected, other) <= selectedRadius + canopyRadiusM(other) + 0.75;
  });
}

export function treesCrossedByLine(line: [number, number][]): TreeSpatialFeature[] {
  const road = turf.lineString(line);
  return getCadastralParcels().filter((tree) => {
    try {
      return turf.pointToLineDistance(treePoint(tree), road, { units: "meters" }) <= canopyRadiusM(tree);
    } catch {
      return false;
    }
  });
}

export function isGovtParcel(_attrs: unknown): boolean {
  return false;
}

function areaDiffStatus(variancePct: number): AreaDiffCase["status"] {
  if (variancePct >= 15) return "critical";
  if (variancePct >= 8) return "moderate";
  return "minor";
}

export function getAreaDiffCases(): AreaDiffCase[] {
  return getCadastralParcels()
    .map((tree) => {
      const expectedHeight = tree.tree.heightM;
      const aiHeight = expectedHeight * (0.85 + (tree.tree.heightConfidence - 0.82) * 0.5);
      const variancePct = Math.abs(((expectedHeight - aiHeight) / expectedHeight) * 100);
      if (variancePct < 3) return null;
      const fmbAreaSqM = tree.areaSqM;
      const dgpsAreaSqM = Math.max(1, Math.round(fmbAreaSqM * (1 - variancePct / 100)));
      return {
        id: `ad-${tree.id}`,
        surveyNo: tree.surveyNo,
        village: tree.village,
        fmbAreaSqM,
        dgpsAreaSqM,
        diffSqM: Math.abs(fmbAreaSqM - dgpsAreaSqM),
        variancePct: Math.round(variancePct * 10) / 10,
        status: areaDiffStatus(variancePct),
        parcelId: tree.id,
      } satisfies AreaDiffCase;
    })
    .filter((row): row is AreaDiffCase => row !== null)
    .sort((a, b) => b.variancePct - a.variancePct)
    .slice(0, 8);
}

export function getOverlapCases(): OverlapCase[] {
  const trees = getCadastralParcels();
  const cases: OverlapCase[] = [];

  for (let i = 0; i < trees.length; i += 1) {
    const radiusA = canopyRadiusM(trees[i]);
    for (let j = i + 1; j < trees.length; j += 1) {
      if (metersBetween(trees[i], trees[j]) > radiusA + canopyRadiusM(trees[j])) continue;
      try {
        const polyA = turf.polygon([trees[i].ring]);
        const polyB = turf.polygon([trees[j].ring]);
        const intersection = turf.intersect(turf.featureCollection([polyA, polyB]));
        if (!intersection?.geometry) continue;
        let overlapRing: [number, number][] = [];
        if (intersection.geometry.type === "Polygon") {
          overlapRing = intersection.geometry.coordinates[0] as [number, number][];
        } else if (intersection.geometry.type === "MultiPolygon") {
          overlapRing = intersection.geometry.coordinates[0][0] as [number, number][];
        }
        if (overlapRing.length < 4) continue;
        const overlapAreaSqM = Math.round(turf.area(intersection));
        if (overlapAreaSqM < 1) continue;
        cases.push({
          id: `ov-${cases.length + 1}`,
          parcelA: trees[i].surveyNo,
          parcelB: trees[j].surveyNo,
          overlapAreaSqM,
          village: trees[i].village,
          severity: overlapAreaSqM >= 12 ? "high" : overlapAreaSqM >= 4 ? "medium" : "low",
          ringA: trees[i].ring,
          ringB: trees[j].ring,
          overlapRing,
        });
      } catch {
        // skip invalid geometry pairs
      }
    }
  }
  return cases.sort((a, b) => b.overlapAreaSqM - a.overlapAreaSqM);
}

export function getEncroachmentCases(): EncroachmentCase[] {
  const trees = getParcelsInBuffer("road", 25);
  const roadBuffer = buildBufferPolygon("road", 25);
  if (!roadBuffer.length) return [];

  return trees.map((tree, index) => ({
    id: `enc-${index + 1}`,
    surveyNo: tree.surveyNo,
    govtLandType: "Road setback zone",
    encroachedAreaSqM: Math.max(1, Math.round(tree.areaSqM * 0.35)),
    buildingType: tree.tree.health === "diseased" ? "Canopy overhang" : "Root zone overlap",
    status: tree.tree.health === "diseased" ? "notified" : "open",
    ring: tree.ring,
    govtLandRing: roadBuffer,
    parcelId: tree.id,
  }));
}

export function getGovtLandRing(): [number, number][] {
  return buildBufferPolygon("road", 30) || getVillageBoundaryRing();
}

export function getIntersectLayerPairs(): IntersectLayerPair[] {
  const trees = getCadastralParcels();
  const blockRing = getVillageBoundaryRing();
  const healthRing = (() => {
    const alerts = trees.filter((t) => t.tree.health !== "healthy");
    if (!alerts.length) return blockRing;
    const collection = turf.featureCollection(alerts.map((t) => turf.polygon([t.ring])));
    const hull = turf.convex(collection);
    if (hull?.geometry?.type === "Polygon") return hull.geometry.coordinates[0] as [number, number][];
    return blockRing;
  })();
  const waterRing = getFloodZoneRing();
  const roadRing = buildBufferPolygon("road", 35) || blockRing;

  const pairs = [
    {
      id: "int-health",
      label: "All trees × Health alert zone",
      layerA: "Tree inventory",
      layerB: "Health alert zone",
      description: "Trees inside stressed/diseased cluster envelope",
      layerARing: blockRing,
      layerBRing: healthRing,
    },
    {
      id: "int-water",
      label: "Trees × Water stress zone",
      layerA: "Survey trees",
      layerB: "Water stress envelope",
      description: "Trees in dry or waterlogged stress areas",
      layerARing: blockRing,
      layerBRing: waterRing,
    },
    {
      id: "int-block",
      label: "Trees × Survey block boundary",
      layerA: "Tree points",
      layerB: "Block boundary",
      description: "Trees within assigned survey block",
      layerARing: blockRing,
      layerBRing: blockRing,
    },
    {
      id: "int-road",
      label: "Trees × Road corridor buffer",
      layerA: "Canopy footprints",
      layerB: "Road setback corridor",
      description: "Trees within road acquisition / setback buffer",
      layerARing: blockRing,
      layerBRing: roadRing,
    },
  ];

  return pairs.map((pair) => {
    let intersectRing: [number, number][] = pair.layerARing;
    let intersectAreaSqM = 0;
    try {
      const layerA = turf.polygon([pair.layerARing]);
      const layerB = turf.polygon([pair.layerBRing]);
      const intersection = turf.intersect(turf.featureCollection([layerA, layerB]));
      if (intersection?.geometry?.type === "Polygon") {
        intersectRing = intersection.geometry.coordinates[0] as [number, number][];
        intersectAreaSqM = Math.round(turf.area(intersection));
      }
    } catch {
      intersectAreaSqM = 0;
    }

    const layerBPoly = turf.polygon([pair.layerBRing]);
    const parcelCount = trees.filter((tree) => {
      try {
        return turf.booleanPointInPolygon(treePoint(tree), layerBPoly);
      } catch {
        return false;
      }
    }).length;

    return { ...pair, intersectRing, intersectAreaSqM, parcelCount };
  });
}

export function getParcelById(parcelId: string): TreeSpatialFeature | undefined {
  return getTreeBySpatialId(parcelId);
}

export function getTransformPreviewParcel(): TreeSpatialFeature | undefined {
  return getCadastralParcels()[0];
}

export function treeHealthColor(health: TreeHealthStatus): string {
  return HEALTH_COLORS[health];
}

export function treeWaterColor(water: WaterSoilStatus): string {
  const map = {
    adequate: "#2563eb",
    moderate: "#60a5fa",
    dry: "#f97316",
    waterlogged: "#7c3aed",
  } as const;
  return map[water];
}

export { SPATIAL_TOOL_CATALOG as MORE_TOOLS_TABS, type MoreToolsTabId } from "./spatialToolCatalog";
