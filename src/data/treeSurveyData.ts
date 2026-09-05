/** GreenWatch demo inventory — Social Forestry Division, Pune. */

import {
  BEATS,
  COMPARTMENTS,
  RANGES,
  SCHEMES,
  type EncroachmentStatus,
  type GnssSource,
  type WateringCycleStatus,
} from "./greenwatch";

export type TreeHealthStatus = "healthy" | "stressed" | "diseased";
export type WaterSoilStatus = "adequate" | "moderate" | "dry" | "waterlogged";

export type TreeRecord = {
  id: string;
  label: string;
  qrTagId: string;
  lat: number;
  lng: number;
  species: string;
  commonName: string;
  heightM: number;
  heightConfidence: number;
  crownSpreadM: number;
  crownConfidence: number;
  health: TreeHealthStatus;
  healthScore: number;
  waterStatus: WaterSoilStatus;
  waterScore: number;
  wateringStatus: WateringCycleStatus;
  wateringDueDate: string;
  lastWateredDate: string;
  lastPatrolDate: string;
  patrolOverdue: boolean;
  encroachmentStatus: EncroachmentStatus;
  range: string;
  beat: string;
  compartment: string;
  plantationScheme: string;
  gnssSource: GnssSource;
  lastSurveyDate: string;
  surveyor: string;
  photoUrl: string;
  canopyDiameterM: number;
  dbhCm: number;
  notes?: string;
};

export const HEALTH_COLORS: Record<TreeHealthStatus, string> = {
  healthy: "#16a34a",
  stressed: "#f59e0b",
  diseased: "#ef4444",
};

export const WATER_COLORS: Record<WaterSoilStatus, string> = {
  adequate: "#2563eb",
  moderate: "#60a5fa",
  dry: "#f97316",
  waterlogged: "#7c3aed",
};

export const WATERING_COLORS: Record<"ok" | "due" | "overdue", string> = {
  ok: "#16a34a",
  due: "#f59e0b",
  overdue: "#ef4444",
};

const SPECIES_POOL: Array<{ species: string; common: string; photo: string }> = [
  { species: "Azadirachta indica", common: "Neem", photo: "/assets/trees/species/neem.jpg" },
  { species: "Mangifera indica", common: "Mango", photo: "/assets/trees/species/mango.jpg" },
  { species: "Ficus religiosa", common: "Peepal", photo: "/assets/trees/species/peepal.jpg" },
  { species: "Tamarindus indica", common: "Tamarind", photo: "/assets/trees/species/tamarind.jpg" },
  { species: "Delonix regia", common: "Gulmohar", photo: "/assets/trees/species/gulmohar.jpg" },
  { species: "Cocos nucifera", common: "Coconut", photo: "/assets/trees/species/coconut.jpg" },
  { species: "Ficus benghalensis", common: "Banyan", photo: "/assets/trees/species/banyan.jpg" },
  { species: "Terminalia arjuna", common: "Arjun", photo: "/assets/trees/species/arjun.jpg" },
  { species: "Albizia lebbeck", common: "Siris", photo: "/assets/trees/species/siris.jpg" },
  { species: "Pongamia pinnata", common: "Pongam", photo: "/assets/trees/species/pongam.jpg" },
  { species: "Polyalthia longifolia", common: "Ashoka", photo: "/assets/trees/species/ashoka.jpg" },
  { species: "Casuarina equisetifolia", common: "Casuarina", photo: "/assets/trees/species/casuarina.jpg" },
];

const FALLBACK_TREE_PHOTO = "/assets/trees/ai-survey/02-full-tree.jpg";

export function getSpeciesPhotoUrl(species: string): string {
  return SPECIES_POOL.find((entry) => entry.species === species)?.photo ?? FALLBACK_TREE_PHOTO;
}

export function getFallbackTreePhotoUrl(): string {
  return FALLBACK_TREE_PHOTO;
}

const HEALTH_STATUSES: TreeHealthStatus[] = ["healthy", "healthy", "healthy", "stressed", "diseased"];
const WATER_STATUSES: WaterSoilStatus[] = ["adequate", "moderate", "dry", "waterlogged"];
const SURVEYORS = [
  "R. Priya · FO-1042",
  "S. Karthik · FO-1088",
  "M. Anitha · FO-1103",
  "V. Ramesh · FO-1115",
];

/** Social Forestry Division, Pune — sample plantation block. */
export const SURVEY_ORIGIN = { lat: 18.5314, lng: 73.8477 } as const;

/** Target inventory size for dense street-lined map demo. */
export const DEMO_TREE_COUNT = 520;

function seeded(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

type StreetSegment = {
  /** Start [lng, lat] */
  start: [number, number];
  /** End [lng, lat] */
  end: [number, number];
  /** Approximate metres between trees along the curb. */
  spacingM: number;
};

/**
 * Synthetic street grid + arterial corridors around the Green Belt survey block.
 * Trees are placed on both curbs so entire streets read as lined with inventory.
 */
function buildStreetCorridors(originLat: number, originLng: number): StreetSegment[] {
  // ~1.1 km E–W × ~0.95 km N–S urban block
  const west = originLng - 0.0052;
  const east = originLng + 0.0054;
  const south = originLat - 0.0044;
  const north = originLat + 0.0046;

  const ewLats = [
    south + 0.00035,
    south + 0.00115,
    south + 0.00195,
    south + 0.00275,
    originLat,
    originLat + 0.00085,
    originLat + 0.0017,
    originLat + 0.00255,
    north - 0.0004,
  ];

  const nsLngs = [
    west + 0.0004,
    west + 0.0015,
    west + 0.0027,
    originLng - 0.00035,
    originLng + 0.0009,
    originLng + 0.0022,
    east - 0.0011,
    east - 0.00035,
  ];

  const corridors: StreetSegment[] = [];

  for (const lat of ewLats) {
    corridors.push({
      start: [west + 0.00015, lat],
      end: [east - 0.00015, lat],
      spacingM: 14,
    });
  }

  for (const lng of nsLngs) {
    corridors.push({
      start: [lng, south + 0.0002],
      end: [lng, north - 0.0002],
      spacingM: 15,
    });
  }

  // Diagonal / canal-edge arterials for more natural coverage
  corridors.push(
    {
      start: [west + 0.0008, south + 0.0006],
      end: [east - 0.0006, north - 0.0008],
      spacingM: 16,
    },
    {
      start: [west + 0.0012, north - 0.0005],
      end: [east - 0.0009, south + 0.0009],
      spacingM: 17,
    },
    {
      start: [west + 0.0003, originLat - 0.0012],
      end: [east - 0.0002, originLat - 0.0004],
      spacingM: 13,
    },
  );

  return corridors;
}

function metersToDegLat(m: number) {
  return m / 111_320;
}

function metersToDegLng(m: number, lat: number) {
  return m / (111_320 * Math.cos((lat * Math.PI) / 180));
}

function placeAlongCorridor(
  segment: StreetSegment,
  sideSign: -1 | 1,
  curbOffsetM: number,
  seedBase: number,
): Array<{ lat: number; lng: number; seed: number }> {
  const [lng0, lat0] = segment.start;
  const [lng1, lat1] = segment.end;
  const dLat = lat1 - lat0;
  const dLng = lng1 - lng0;
  const midLat = (lat0 + lat1) / 2;
  const lengthM = Math.hypot(dLat * 111_320, dLng * 111_320 * Math.cos((midLat * Math.PI) / 180));
  if (lengthM < segment.spacingM * 0.5) return [];

  const steps = Math.max(1, Math.floor(lengthM / segment.spacingM));
  const ux = dLng / lengthM;
  const uy = dLat / lengthM;
  // Perpendicular unit (approx) for curb offset
  const px = -uy;
  const py = ux;

  const points: Array<{ lat: number; lng: number; seed: number }> = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const alongLat = lat0 + dLat * t;
    const alongLng = lng0 + dLng * t;
    const seed = seedBase + i * 17 + (sideSign === 1 ? 0 : 901);
    const jitterLat = (seeded(seed) - 0.5) * metersToDegLat(2.4);
    const jitterLng = (seeded(seed + 3) - 0.5) * metersToDegLng(2.4, alongLat);
    const offsetLat = sideSign * py * metersToDegLat(curbOffsetM);
    const offsetLng = sideSign * px * metersToDegLng(curbOffsetM, alongLat);
    points.push({
      lat: alongLat + offsetLat + jitterLat,
      lng: alongLng + offsetLng + jitterLng,
      seed,
    });
  }
  return points;
}

function buildRecordFromPoint(
  index: number,
  lat: number,
  lng: number,
  seed: number,
): TreeRecord {
  const r = seeded(seed);
  const r2 = seeded(seed + 99);
  const r3 = seeded(seed + 201);
  const speciesEntry = SPECIES_POOL[index % SPECIES_POOL.length];
  const health = HEALTH_STATUSES[Math.floor(r * HEALTH_STATUSES.length)];
  const water = WATER_STATUSES[Math.floor(r2 * WATER_STATUSES.length)];
  const heightM = 4 + Math.round(r * 18 * 10) / 10;
  const healthScore =
    health === "healthy"
      ? 75 + Math.floor(r2 * 25)
      : health === "stressed"
        ? 45 + Math.floor(r2 * 25)
        : 15 + Math.floor(r2 * 25);

  const month = 1 + (index % 6);
  const day = 5 + (index % 20);

  const canopy = 2 + Math.round(r * 8 * 10) / 10;
  const wateringStatus: WateringCycleStatus = r3 < 0.12 ? "overdue" : r3 < 0.28 ? "due" : "ok";
  const encroachmentStatus: EncroachmentStatus = r < 0.08 ? "flagged" : r < 0.12 ? "resolved" : "none";
  const patrolOverdue = index % 11 === 0;
  const wateringDueDay = wateringStatus === "ok" ? 18 : wateringStatus === "due" ? 4 : 28;
  const lastWaterMonth = wateringStatus === "overdue" ? 7 : 8;

  return {
    id: `TREE-${String(index + 1).padStart(4, "0")}`,
    label: `T-${String(index + 1).padStart(3, "0")}`,
    qrTagId: `GW-PUN-${String(index + 1).padStart(6, "0")}`,
    lat,
    lng,
    species: speciesEntry.species,
    commonName: speciesEntry.common,
    heightM,
    heightConfidence: 0.82 + r3 * 0.15,
    crownSpreadM: canopy,
    crownConfidence: 0.8 + r2 * 0.15,
    health,
    healthScore,
    waterStatus: water,
    waterScore:
      water === "adequate"
        ? 70 + Math.floor(r * 30)
        : water === "moderate"
          ? 45 + Math.floor(r * 25)
          : water === "dry"
            ? 10 + Math.floor(r * 25)
            : 80 + Math.floor(r * 20),
    wateringStatus,
    wateringDueDate: `2026-09-${String(wateringDueDay).padStart(2, "0")}`,
    lastWateredDate: `2026-${String(lastWaterMonth).padStart(2, "0")}-${String(8 + (index % 12)).padStart(2, "0")}`,
    lastPatrolDate: patrolOverdue ? "2026-07-22" : `2026-08-${String(10 + (index % 18)).padStart(2, "0")}`,
    patrolOverdue,
    encroachmentStatus,
    range: RANGES[index % RANGES.length],
    beat: BEATS[index % BEATS.length],
    compartment: COMPARTMENTS[index % COMPARTMENTS.length],
    plantationScheme: SCHEMES[index % SCHEMES.length],
    gnssSource: index % 5 === 0 ? "phone" : "dgps",
    lastSurveyDate: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    surveyor: SURVEYORS[index % SURVEYORS.length],
    photoUrl: speciesEntry.photo,
    canopyDiameterM: canopy,
    dbhCm: 15 + Math.round(r2 * 60),
    notes:
      health === "diseased"
        ? "Officer form: pest signs recorded — photo attached"
        : encroachmentStatus === "flagged"
          ? "Encroachment form submitted — pending Range QC"
          : undefined,
  };
}

/**
 * Dense street-inventory generator for a Pune social-forestry avenue / plantation block.
 */
export function generateTreeRecords(count = DEMO_TREE_COUNT): TreeRecord[] {
  const { lat: baseLat, lng: baseLng } = SURVEY_ORIGIN;
  const corridors = buildStreetCorridors(baseLat, baseLng);
  const candidates: Array<{ lat: number; lng: number; seed: number }> = [];

  corridors.forEach((segment, corridorIndex) => {
    const curbM = 4.5 + (corridorIndex % 3) * 0.6;
    candidates.push(...placeAlongCorridor(segment, 1, curbM, corridorIndex * 1000 + 42));
    candidates.push(...placeAlongCorridor(segment, -1, curbM, corridorIndex * 1000 + 520));
  });

  // Small plaza / park clusters so coverage isn't only linear
  const plazas: Array<{ lat: number; lng: number; n: number }> = [
    { lat: baseLat + 0.0012, lng: baseLng - 0.0018, n: 18 },
    { lat: baseLat - 0.0016, lng: baseLng + 0.0021, n: 16 },
    { lat: baseLat + 0.0028, lng: baseLng + 0.0014, n: 14 },
  ];
  plazas.forEach((plaza, pi) => {
    for (let i = 0; i < plaza.n; i += 1) {
      const seed = 8000 + pi * 100 + i;
      const ring = 0.3 + seeded(seed) * 0.7;
      const angle = seeded(seed + 5) * Math.PI * 2;
      candidates.push({
        lat: plaza.lat + Math.sin(angle) * metersToDegLat(18 * ring),
        lng: plaza.lng + Math.cos(angle) * metersToDegLng(18 * ring, plaza.lat),
        seed,
      });
    }
  });

  // Deterministic shuffle so sampling isn't corridor-ordered only
  const order = candidates
    .map((c, i) => ({ c, k: seeded(i * 13 + 7) }))
    .sort((a, b) => a.k - b.k)
    .map((row) => row.c);

  const target = Math.max(48, Math.min(count, order.length));
  const records: TreeRecord[] = [];
  for (let i = 0; i < target; i += 1) {
    const point = order[i];
    records.push(buildRecordFromPoint(i, point.lat, point.lng, point.seed));
  }

  return records;
}

export const TREE_SURVEY_RECORDS = generateTreeRecords();

export function getTreeById(id: string): TreeRecord | undefined {
  return TREE_SURVEY_RECORDS.find((t) => t.id === id);
}

export function getTreeStats() {
  const total = TREE_SURVEY_RECORDS.length;
  const speciesSet = new Set(TREE_SURVEY_RECORDS.map((t) => t.species));
  const healthAlerts = TREE_SURVEY_RECORDS.filter((t) => t.health !== "healthy").length;
  const surveyedToday = TREE_SURVEY_RECORDS.filter((t) => t.lastSurveyDate.startsWith("2026-06")).length;
  const avgHeight = TREE_SURVEY_RECORDS.reduce((s, t) => s + t.heightM, 0) / total;

  const wateringDue = TREE_SURVEY_RECORDS.filter((t) => t.wateringStatus !== "ok").length;
  const patrolOverdue = TREE_SURVEY_RECORDS.filter((t) => t.patrolOverdue).length;
  const encroachment = TREE_SURVEY_RECORDS.filter((t) => t.encroachmentStatus === "flagged").length;

  return {
    total,
    speciesCount: speciesSet.size,
    healthAlerts,
    wateringDue,
    patrolOverdue,
    encroachment,
    surveyedToday: Math.min(surveyedToday, 12),
    avgHeightM: Math.round(avgHeight * 10) / 10,
  };
}

export type TreeAiResult = {
  heightM: number;
  heightConfidence: number;
  species: string;
  commonName: string;
  speciesConfidence: number;
  health: TreeHealthStatus;
  healthScore: number;
  waterStatus: WaterSoilStatus;
  waterScore: number;
};

/** Mock AI pipeline — returns deterministic demo results after delay. */
export async function runTreeAiAnalysis(photoIndex = 0): Promise<TreeAiResult> {
  await new Promise((r) => setTimeout(r, 2800));
  const sample = TREE_SURVEY_RECORDS[photoIndex % TREE_SURVEY_RECORDS.length];
  return {
    heightM: sample.heightM + (Math.random() - 0.5) * 0.4,
    heightConfidence: 0.88 + Math.random() * 0.1,
    species: sample.species,
    commonName: sample.commonName,
    speciesConfidence: 0.91 + Math.random() * 0.08,
    health: sample.health,
    healthScore: sample.healthScore,
    waterStatus: sample.waterStatus,
    waterScore: sample.waterScore,
  };
}

export const TREE_AI_PIPELINE_STEPS = [
  { id: "capture", label: "Photo with QR tag in frame", detail: "Fixed-size tag card as scale" },
  { id: "detect", label: "Detect QR card", detail: "Known physical size → pixels-per-metre" },
  { id: "height", label: "Compute height", detail: "Stem + crown tip in metric units" },
  { id: "crown", label: "Compute crown spread", detail: "Canopy width from the same frame" },
  { id: "confidence", label: "Confidence", detail: "Officer reviews before commit" },
  { id: "accept", label: "Accept or override", detail: "Written to the tree record" },
];

export const TREE_THEMATIC_LAYERS = [
  { id: "trees", label: "Tree Inventory", visible: true },
  { id: "tree-health", label: "Health Status", visible: false },
  { id: "tree-species", label: "Species / Type", visible: false },
  { id: "tree-water", label: "Watering due", visible: false },
] as const;
