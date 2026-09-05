import * as turf from "@turf/turf";
import type { GeometryAuditMeta, MutationAuditMeta } from "./auditHistory";
import { getBufferFeatures, getFloodZoneRing } from "./treeSpatialData";
import {
  TREE_SURVEY_RECORDS,
  type TreeHealthStatus,
  type TreeRecord,
  type WaterSoilStatus,
} from "./treeSurveyData";

export type TreeContextFieldKey =
  | "treeId"
  | "fieldTag"
  | "species"
  | "commonName"
  | "surveyBlock"
  | "sector"
  | "heightM"
  | "heightConfidence"
  | "canopyDiameterM"
  | "dbhCm"
  | "canopyAreaSqM"
  | "health"
  | "healthScore"
  | "waterStatus"
  | "waterScore"
  | "notes"
  | "lastSurveyDate"
  | "surveyor"
  | "source"
  | "coordinates"
  | "photoRef"
  | "action"
  | "actor"
  | "approvedBy"
  | "changeRef";

export type TreeContextSnapshot = {
  treeId: string;
  fieldTag: string;
  species: string;
  commonName: string;
  surveyBlock: string;
  sector: string;
  heightM: number;
  heightConfidence: number;
  canopyDiameterM: number;
  dbhCm: number;
  canopyAreaSqM: number;
  health: TreeHealthStatus;
  healthScore: number;
  waterStatus: WaterSoilStatus;
  waterScore: number;
  notes: string;
  lastSurveyDate: string;
  surveyor: string;
  source: string;
  lat: number;
  lng: number;
  photoUrl: string;
  /** Field survey photos for this tree (stable identity + angle shots). */
  photos: string[];
  action: string;
  actor: string;
  approvedBy: string;
  changeRef: string;
};

export type TreeFieldDiff = {
  key: TreeContextFieldKey;
  from: string;
  to: string;
};

export type TreeAuditHistoryEntry = {
  version: number;
  timestamp: string;
  label: string;
  snapshot: TreeContextSnapshot;
  geometry: GeoJSON.Polygon;
  fieldAudit: Partial<Record<TreeContextFieldKey, MutationAuditMeta>>;
  geometryAudit: GeometryAuditMeta;
  diffs: TreeFieldDiff[];
};

/** Stable across audits for one tree — never shown as “changed”. */
export const IDENTITY_KEYS: TreeContextFieldKey[] = [
  "treeId",
  "fieldTag",
  "species",
  "commonName",
  "surveyBlock",
  "sector",
  "coordinates",
];

/** Only measured / assessed attributes may differ between revisions. */
export const COMPARABLE_KEYS: TreeContextFieldKey[] = [
  "heightM",
  "heightConfidence",
  "canopyDiameterM",
  "dbhCm",
  "canopyAreaSqM",
  "health",
  "healthScore",
  "waterStatus",
  "waterScore",
];

export const EVENT_KEYS: TreeContextFieldKey[] = ["action", "actor", "approvedBy", "changeRef"];

export const SURVEY_META_KEYS: TreeContextFieldKey[] = ["lastSurveyDate", "surveyor", "source"];

/** Slim audit card — only high-value fields (no event / score fluff). */
export const AUDIT_IDENTITY_KEYS: TreeContextFieldKey[] = [
  "treeId",
  "fieldTag",
  "species",
  "commonName",
  "coordinates",
];

export const AUDIT_MEASUREMENT_KEYS: TreeContextFieldKey[] = [
  "heightM",
  "dbhCm",
  "canopyDiameterM",
  "health",
  "waterStatus",
];

export const AUDIT_SURVEY_KEYS: TreeContextFieldKey[] = ["lastSurveyDate", "surveyor"];

export type AuditLandmark = {
  id: string;
  name: string;
  /** Water marks vs other site references. */
  kind: "water" | "path";
  distanceM: number;
};

export function diffSnapshots(
  from: TreeContextSnapshot,
  to: TreeContextSnapshot,
): TreeFieldDiff[] {
  return COMPARABLE_KEYS.filter(
    (key) => formatTreeField(key, from) !== formatTreeField(key, to),
  ).map((key) => ({
    key,
    from: formatTreeField(key, from),
    to: formatTreeField(key, to),
  }));
}

export const TREE_CONTEXT_SECTIONS: Array<{
  label: string;
  keys: TreeContextFieldKey[];
}> = [
  {
    label: "Tree identification",
    keys: ["treeId", "fieldTag", "species", "commonName", "surveyBlock", "sector"],
  },
  {
    label: "Measurements",
    keys: ["heightM", "heightConfidence", "canopyDiameterM", "dbhCm", "canopyAreaSqM"],
  },
  {
    label: "Health & condition",
    keys: ["health", "healthScore", "waterStatus", "waterScore"],
  },
  {
    label: "Survey record",
    keys: ["lastSurveyDate", "surveyor", "source", "coordinates"],
  },
  {
    label: "Change log",
    keys: ["action", "actor", "approvedBy", "changeRef"],
  },
];

const SECTORS = ["Green Belt", "Kottucherry", "Thalatheru", "Karaikal town"] as const;
const SURVEY_BLOCK = "Green Belt Block A";
const QC_OFFICERS = [
  "Urban Forestry QC",
  "Dr. K. Meena · QC",
  "Joint Director — Parks",
  "Block Officer — Green Belt",
];

function seedFromId(id: string): number {
  return id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

/**
 * Shared gallery for ALL trees. Enough unique URLs for 7 cards × 3 shots
 * with zero repeats across the whole audit strip.
 */
const SHARED_AUDIT_IMAGE_URLS: readonly string[] = [
  "/assets/trees/ai-survey/02-full-tree.jpg",
  "/assets/trees/ai-survey/01-canopy.jpg",
  "/assets/trees/ai-survey/03-bark.jpg",
  "/assets/trees/ai-survey/06-fruit.jpg",
  "/assets/trees/ai-survey/04-leaf.jpg",
  "/assets/trees/ai-survey/05-flower.jpg",
  "/assets/trees/ai-survey/08-trunk.jpg",
  "/assets/trees/ai-survey/09-branch.jpg",
  "/assets/trees/ai-survey/07-root-base.jpg",
  "/assets/trees/ai-survey/10-soil-base.jpg",
  "/assets/trees/species/neem.jpg",
  "/assets/trees/species/mango.jpg",
  "/assets/trees/species/peepal.jpg",
  "/assets/trees/species/gulmohar.jpg",
  "/assets/trees/species/banyan.jpg",
  "/assets/trees/species/coconut.jpg",
  "/assets/trees/species/tamarind.jpg",
  "/assets/trees/species/arjun.jpg",
  "/assets/trees/species/siris.jpg",
  "/assets/trees/species/pongam.jpg",
  "/assets/trees/species/ashoka.jpg",
  "/assets/trees/species/casuarina.jpg",
];

/** Same photo field labels on every audit card. */
const AUDIT_PHOTO_FIELD_LABELS = ["Full tree", "Canopy", "Bark"] as const;

const AUDIT_PHOTOS_PER_CARD = AUDIT_PHOTO_FIELD_LABELS.length;
const AUDIT_CARD_SLOTS = 7; // Current + 6 prior revisions

export type TreeAuditPhotoSlot = { url: string; label: string };

/**
 * Map revision ids used in history builders onto card slots 0..6.
 * Current uses 0 (or 7); prior revisions use 1..6.
 */
function auditCardSlot(revision: number): number {
  const rev = Math.max(0, Math.floor(revision));
  if (rev === 0 || rev === 7) return 0;
  return ((rev - 1) % (AUDIT_CARD_SLOTS - 1)) + 1;
}

/**
 * Same labels + same image bank for every tree.
 * Each card owns a private slice of the gallery — no URL is reused on another card.
 */
export function getTreeAuditPhotoSlots(_tree: TreeRecord, revision = 0): TreeAuditPhotoSlot[] {
  const slot = auditCardSlot(revision);
  const start = slot * AUDIT_PHOTOS_PER_CARD;

  return AUDIT_PHOTO_FIELD_LABELS.map((label, fieldIndex) => {
    const url = SHARED_AUDIT_IMAGE_URLS[start + fieldIndex];
    if (!url) {
      throw new Error(`Audit photo gallery too small for card slot ${slot}`);
    }
    return { label, url };
  });
}

/** Survey photos per revision (identical across trees; unique across cards). */
export function getTreeAuditPhotos(tree: TreeRecord, revision = 0): string[] {
  return getTreeAuditPhotoSlots(tree, revision).map((slot) => slot.url);
}

/** Always Full tree → Canopy → Bark, matching the fixed field order. */
export function getTreeAuditPhotoLabels(photosOrCount: string[] | number): string[] {
  const count = typeof photosOrCount === "number" ? photosOrCount : photosOrCount.length;
  return AUDIT_PHOTO_FIELD_LABELS.slice(0, count).map((label) => label);
}

/** Always the same 4 landmarks on every audit card (stable fields). */
export function getAuditLandmarks(tree: TreeRecord, _limit = 4): AuditLandmark[] {
  const buffers = getBufferFeatures();
  const point = turf.point([tree.lng, tree.lat]);

  function lineDistanceM(line: [number, number][]): number {
    return Math.round(
      turf.pointToLineDistance(point, turf.lineString(line), { units: "meters" }),
    );
  }

  const floodRing = getFloodZoneRing();
  const floodPoly = turf.polygon([floodRing]);
  const floodDistanceM = turf.booleanPointInPolygon(point, floodPoly)
    ? 0
    : Math.round(turf.pointToPolygonDistance(point, floodPoly, { units: "meters" }));

  return [
    {
      id: "wm-irrigation",
      name: "Irrigation channel",
      kind: "water",
      distanceM: lineDistanceM(buffers.river.line),
    },
    {
      id: "wm-drainage",
      name: "Drainage canal mark",
      kind: "water",
      distanceM: lineDistanceM(buffers.canal.line),
    },
    {
      id: "wm-flood",
      name: floodDistanceM === 0 ? "Inside flood / water mark" : "Flood / water stress zone",
      kind: "water",
      distanceM: floodDistanceM,
    },
    {
      id: "lm-corridor",
      name: "Survey corridor road",
      kind: "path",
      distanceM: lineDistanceM(buffers.road.line),
    },
  ];
}

export const TREE_FIELD_LABELS: Record<TreeContextFieldKey, string> = {
  treeId: "Tree ID",
  fieldTag: "Field tag",
  species: "Species",
  commonName: "Common name",
  surveyBlock: "Survey block",
  sector: "Sector",
  heightM: "Height",
  heightConfidence: "Height confidence",
  canopyDiameterM: "Canopy diameter",
  dbhCm: "DBH",
  canopyAreaSqM: "Canopy area",
  health: "Health status",
  healthScore: "Health score",
  waterStatus: "Water / soil",
  waterScore: "Water score",
  notes: "Alert notes",
  lastSurveyDate: "Survey date",
  surveyor: "Surveyor",
  source: "Capture source",
  coordinates: "Coordinates",
  photoRef: "Photo",
  action: "Action",
  actor: "Changed by",
  approvedBy: "Approved by",
  changeRef: "Audit ref",
};

function canopyAreaSqM(diameterM: number): number {
  const radius = Math.max(diameterM / 2, 0.5);
  return Math.round(Math.PI * radius * radius * 10) / 10;
}

export function canopyPolygon(lat: number, lng: number, diameterM: number): GeoJSON.Polygon {
  const radiusM = Math.max(diameterM / 2, 1.5);
  const radiusDeg = radiusM / 111_320;
  const ring: [number, number][] = [];
  for (let i = 0; i <= 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2;
    ring.push([lng + radiusDeg * Math.cos(angle), lat + radiusDeg * Math.sin(angle) * 0.92]);
  }
  return { type: "Polygon", coordinates: [ring] };
}

function shiftIsoDate(iso: string, monthsBack: number, daysBack: number): string {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  date.setMonth(date.getMonth() - monthsBack);
  date.setDate(date.getDate() - daysBack);
  return date.toISOString().slice(0, 10);
}

function cardTimestamp(isoDate: string, hour: number, minute: number): string {
  const parts = isoDate.split("-");
  if (parts.length < 2) return isoDate;
  return `${parts[0]}-${parts[1]} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatTreeField(key: TreeContextFieldKey, snapshot: TreeContextSnapshot): string {
  switch (key) {
    case "heightM":
      return `${snapshot.heightM.toFixed(1)} m`;
    case "heightConfidence":
      return `${Math.round(snapshot.heightConfidence * 100)}%`;
    case "canopyDiameterM":
      return `${snapshot.canopyDiameterM.toFixed(1)} m`;
    case "dbhCm":
      return `${snapshot.dbhCm} cm`;
    case "canopyAreaSqM":
      return `${snapshot.canopyAreaSqM.toLocaleString()} sq.m`;
    case "health":
    case "waterStatus":
      return capitalize(snapshot[key]);
    case "healthScore":
    case "waterScore":
      return `${snapshot[key]} / 100`;
    case "coordinates":
      return `${snapshot.lat.toFixed(5)}, ${snapshot.lng.toFixed(5)}`;
    case "photoRef":
      return snapshot.photoUrl ? "On file" : "—";
    case "notes":
      return snapshot.notes || "None";
    default:
      return String(snapshot[key] ?? "—");
  }
}

export function treeContextSubtitle(snapshot: TreeContextSnapshot): string {
  return `${snapshot.treeId} • ${snapshot.sector}`;
}

function snapshotFromTree(
  tree: TreeRecord,
  extras: Partial<TreeContextSnapshot> = {},
  revision = 0,
): TreeContextSnapshot {
  const seed = seedFromId(tree.id);
  const sector = SECTORS[seed % SECTORS.length];
  const canopyDiameterM = extras.canopyDiameterM ?? tree.canopyDiameterM;
  const photos = extras.photos ?? getTreeAuditPhotos(tree, revision);

  // Identity fields always come from the live tree — never diverge across audits.
  return {
    heightM: tree.heightM,
    heightConfidence: tree.heightConfidence,
    canopyDiameterM,
    dbhCm: tree.dbhCm,
    canopyAreaSqM: canopyAreaSqM(canopyDiameterM),
    health: tree.health,
    healthScore: tree.healthScore,
    waterStatus: tree.waterStatus,
    waterScore: tree.waterScore,
    notes: "",
    lastSurveyDate: tree.lastSurveyDate,
    surveyor: tree.surveyor,
    source: "AI + GNSS field capture",
    photoUrl: tree.photoUrl,
    action: "Published survey",
    actor: tree.surveyor,
    approvedBy: QC_OFFICERS[seed % QC_OFFICERS.length],
    changeRef: `TS-AUD-${tree.id.replace("TREE-", "")}`,
    ...extras,
    // Locked identity (overwrite extras so history cannot change them)
    treeId: tree.id,
    fieldTag: tree.label,
    species: tree.species,
    commonName: tree.commonName,
    surveyBlock: SURVEY_BLOCK,
    sector,
    lat: tree.lat,
    lng: tree.lng,
    photos,
    canopyAreaSqM: canopyAreaSqM(extras.canopyDiameterM ?? canopyDiameterM),
    notes: "",
  };
}

function fieldMeta(
  changedBy: string,
  changedAt: string,
  approvedBy: string | null,
  notes: string,
  ref: string,
): MutationAuditMeta {
  return {
    changedBy,
    changedAt,
    approvedBy,
    approvedAt: approvedBy ? changedAt : null,
    mutationRef: ref,
    notes,
  };
}

function geometryMeta(
  changedBy: string,
  changedAt: string,
  approvedBy: string | null,
  areaSqM: number,
  notes: string,
): GeometryAuditMeta {
  return {
    changedBy,
    changedAt,
    approvedBy,
    approvedAt: approvedBy ? changedAt : null,
    areaSqM,
    mutationNotes: notes,
  };
}

export function buildCurrentTreeSnapshot(tree: TreeRecord): TreeContextSnapshot {
  return snapshotFromTree(
    tree,
    {
      action: "Published survey",
      actor: tree.surveyor,
      source: "AI + GNSS field capture",
      photos: getTreeAuditPhotos(tree, 0),
    },
    0,
  );
}

export function buildCurrentTreeFieldAudit(tree: TreeRecord): Partial<Record<TreeContextFieldKey, MutationAuditMeta>> {
  const snapshot = buildCurrentTreeSnapshot(tree);
  const at = `${tree.lastSurveyDate} 09:40`;
  const ref = snapshot.changeRef;
  return {
    heightM: fieldMeta(tree.surveyor, at, snapshot.approvedBy, "AI height accepted after field check", ref),
    health: fieldMeta(tree.surveyor, at, snapshot.approvedBy, "Health score published from canopy model", ref),
    waterStatus: fieldMeta(tree.surveyor, at, snapshot.approvedBy, "Soil / water proxy from leaf stress", ref),
    action: fieldMeta(tree.surveyor, at, snapshot.approvedBy, "Current published inventory state", ref),
  };
}

export function buildCurrentTreeGeometryAudit(tree: TreeRecord): GeometryAuditMeta {
  const snapshot = buildCurrentTreeSnapshot(tree);
  return geometryMeta(
    tree.surveyor,
    `${tree.lastSurveyDate} 09:40`,
    snapshot.approvedBy,
    snapshot.canopyAreaSqM,
    "Current canopy outline from AI segmentation",
  );
}

export function generateTreeAuditHistory(tree: TreeRecord): TreeAuditHistoryEntry[] {
  const seed = seedFromId(tree.id);
  const hour = 9 + (seed % 8);
  const minute = (seed * 7) % 60;

  const date1 = shiftIsoDate(tree.lastSurveyDate, 18, 8);
  const date2 = shiftIsoDate(tree.lastSurveyDate, 14, 6);
  const date3 = shiftIsoDate(tree.lastSurveyDate, 11, 4);
  const date4 = shiftIsoDate(tree.lastSurveyDate, 8, 3);
  const date5 = shiftIsoDate(tree.lastSurveyDate, 5, 2);
  const date6 = shiftIsoDate(tree.lastSurveyDate, 2, 1);

  const h1 = Math.max(4.0, Math.round((tree.heightM - 4.2) * 10) / 10);
  const h2 = Math.max(h1 + 0.6, Math.round((tree.heightM - 3.4) * 10) / 10);
  const h3 = Math.max(h2 + 0.5, Math.round((tree.heightM - 2.6) * 10) / 10);
  const h4 = Math.max(h3 + 0.5, Math.round((tree.heightM - 1.8) * 10) / 10);
  const h5 = Math.max(h4 + 0.4, Math.round((tree.heightM - 1.0) * 10) / 10);
  const h6 = Math.max(h5 + 0.3, Math.round((tree.heightM - 0.4) * 10) / 10);

  const c1 = Math.max(1.4, Math.round((tree.canopyDiameterM - 2.8) * 10) / 10);
  const c2 = Math.max(c1 + 0.4, Math.round((tree.canopyDiameterM - 2.2) * 10) / 10);
  const c3 = Math.max(c2 + 0.4, Math.round((tree.canopyDiameterM - 1.6) * 10) / 10);
  const c4 = Math.max(c3 + 0.3, Math.round((tree.canopyDiameterM - 1.1) * 10) / 10);
  const c5 = Math.max(c4 + 0.3, Math.round((tree.canopyDiameterM - 0.6) * 10) / 10);
  const c6 = Math.max(c5 + 0.2, Math.round((tree.canopyDiameterM - 0.2) * 10) / 10);

  const d1 = Math.max(8, tree.dbhCm - 18);
  const d2 = Math.max(d1 + 2, tree.dbhCm - 14);
  const d3 = Math.max(d2 + 2, tree.dbhCm - 11);
  const d4 = Math.max(d3 + 2, tree.dbhCm - 8);
  const d5 = Math.max(d4 + 2, tree.dbhCm - 5);
  const d6 = Math.max(d5 + 1, tree.dbhCm - 2);

  const qc = QC_OFFICERS[seed % QC_OFFICERS.length];
  const s1 = "M. Anitha · TS-1103";
  const s2 = "S. Karthik · TS-1088";
  const s3 = "R. Priya · TS-1042";
  const s4 = "V. Ramesh · TS-1115";
  const s5 = "Tree AI pipeline";
  const s6 = tree.surveyor;

  const v1 = snapshotFromTree(
    tree,
    {
      heightM: h1,
      heightConfidence: 0.52,
      canopyDiameterM: c1,
      dbhCm: d1,
      health: "healthy",
      healthScore: 90,
      waterStatus: "adequate",
      waterScore: 78,
      lastSurveyDate: date1,
      surveyor: s1,
      source: "Initial inventory walk",
      action: "Tree added to inventory",
      actor: s1,
      approvedBy: "Block Officer — Green Belt",
      changeRef: `TS-REV-${tree.id.replace("TREE-", "")}-01`,
      photos: getTreeAuditPhotos(tree, 1),
    },
    1,
  );

  const v2 = snapshotFromTree(
    tree,
    {
      heightM: h2,
      heightConfidence: 0.61,
      canopyDiameterM: c2,
      dbhCm: d2,
      health: "healthy",
      healthScore: 84,
      waterStatus: "moderate",
      waterScore: 62,
      lastSurveyDate: date2,
      surveyor: s2,
      source: "Seasonal QC pass",
      action: "Seasonal height check",
      actor: s2,
      approvedBy: qc,
      changeRef: `TS-REV-${tree.id.replace("TREE-", "")}-02`,
      photos: getTreeAuditPhotos(tree, 2),
    },
    2,
  );

  const v3 = snapshotFromTree(
    tree,
    {
      heightM: h3,
      heightConfidence: 0.7,
      canopyDiameterM: c3,
      dbhCm: d3,
      health: "stressed",
      healthScore: 58,
      waterStatus: "dry",
      waterScore: 34,
      lastSurveyDate: date3,
      surveyor: s3,
      source: "Drought stress patrol",
      action: "Water stress flag",
      actor: s3,
      approvedBy: qc,
      changeRef: `TS-REV-${tree.id.replace("TREE-", "")}-03`,
      photos: getTreeAuditPhotos(tree, 3),
    },
    3,
  );

  const v4 = snapshotFromTree(
    tree,
    {
      heightM: h4,
      heightConfidence: 0.81,
      canopyDiameterM: c4,
      dbhCm: d4,
      health: "stressed",
      healthScore: 54,
      waterStatus: "moderate",
      waterScore: 52,
      lastSurveyDate: date4,
      surveyor: s5,
      source: "AI re-measure",
      action: "AI height / health update",
      actor: s5,
      approvedBy: qc,
      changeRef: `TS-REV-${tree.id.replace("TREE-", "")}-04`,
      photos: getTreeAuditPhotos(tree, 4),
    },
    4,
  );

  const v5 = snapshotFromTree(
    tree,
    {
      heightM: h5,
      heightConfidence: 0.86,
      canopyDiameterM: c5,
      dbhCm: d5,
      health: tree.health === "diseased" ? "stressed" : "healthy",
      healthScore: tree.health === "diseased" ? 61 : 88,
      waterStatus: tree.waterStatus === "adequate" ? "moderate" : "adequate",
      waterScore: 64,
      lastSurveyDate: date5,
      surveyor: s4,
      source: "Handheld GNSS + photo",
      action: "Post-treatment re-survey",
      actor: s4,
      approvedBy: qc,
      changeRef: `TS-REV-${tree.id.replace("TREE-", "")}-05`,
      photos: getTreeAuditPhotos(tree, 5),
    },
    5,
  );

  const v6 = snapshotFromTree(
    tree,
    {
      heightM: h6,
      heightConfidence: 0.9,
      canopyDiameterM: c6,
      dbhCm: d6,
      health: tree.health === "diseased" ? "stressed" : tree.health,
      healthScore: Math.max(50, tree.healthScore - 4),
      waterStatus: tree.waterStatus,
      waterScore: Math.max(30, tree.waterScore - 3),
      lastSurveyDate: date6,
      surveyor: s6,
      source: "Field re-survey",
      action: "Pre-publish field check",
      actor: s6,
      approvedBy: qc,
      changeRef: `TS-REV-${tree.id.replace("TREE-", "")}-06`,
      photos: getTreeAuditPhotos(tree, 6),
    },
    6,
  );

  const versions: Array<{
    version: number;
    label: string;
    snapshot: TreeContextSnapshot;
    diffs: TreeFieldDiff[];
    notes: string;
  }> = [
    {
      version: 6,
      label: "Latest prior",
      snapshot: v6,
      diffs: diffSnapshots(v5, v6),
      notes: "Pre-publish field verification",
    },
    {
      version: 5,
      label: "Revision 5",
      snapshot: v5,
      diffs: diffSnapshots(v4, v5),
      notes: "Post-treatment recovery survey",
    },
    {
      version: 4,
      label: "Revision 4",
      snapshot: v4,
      diffs: diffSnapshots(v3, v4),
      notes: "AI canopy / height correction after photo ingest",
    },
    {
      version: 3,
      label: "Revision 3",
      snapshot: v3,
      diffs: diffSnapshots(v2, v3),
      notes: "Drought stress patrol capture",
    },
    {
      version: 2,
      label: "Revision 2",
      snapshot: v2,
      diffs: diffSnapshots(v1, v2),
      notes: "Seasonal QC height and canopy check",
    },
    {
      version: 1,
      label: "First inventory",
      snapshot: v1,
      diffs: [],
      notes: "Initial GNSS stake and species capture",
    },
  ];

  return versions.map((entry, index) => {
    const at = `${entry.snapshot.lastSurveyDate} ${String(hour + index).padStart(2, "0")}:${String((minute + index * 7) % 60).padStart(2, "0")}`;
    const ref = entry.snapshot.changeRef;
    return {
      version: entry.version,
      timestamp: cardTimestamp(entry.snapshot.lastSurveyDate, hour + index, (minute + index * 7) % 60),
      label: entry.label,
      snapshot: entry.snapshot,
      diffs: entry.diffs,
      geometry: canopyPolygon(tree.lat, tree.lng, entry.snapshot.canopyDiameterM),
      fieldAudit: {
        heightM: fieldMeta(entry.snapshot.actor, at, entry.snapshot.approvedBy, entry.notes, ref),
        health: fieldMeta(entry.snapshot.actor, at, entry.snapshot.approvedBy, entry.notes, ref),
        action: fieldMeta(entry.snapshot.actor, at, entry.snapshot.approvedBy, entry.notes, ref),
        canopyDiameterM: fieldMeta(
          entry.snapshot.actor,
          at,
          entry.snapshot.approvedBy,
          "Canopy outline from survey photos",
          ref,
        ),
      },
      geometryAudit: geometryMeta(
        entry.snapshot.actor,
        at,
        entry.snapshot.approvedBy,
        entry.snapshot.canopyAreaSqM,
        entry.notes,
      ),
    };
  });
}

export function buildCurrentTreeDiffs(
  tree: TreeRecord,
  history: TreeAuditHistoryEntry[],
): TreeFieldDiff[] {
  const latestPrior =
    [...history].sort((a, b) => b.version - a.version)[0] ?? null;
  if (!latestPrior) return [];
  return diffSnapshots(latestPrior.snapshot, buildCurrentTreeSnapshot(tree));
}

export function searchTrees(query: string): TreeRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const compact = q.replace(/\s+/g, "");
  return TREE_SURVEY_RECORDS.filter((tree) => {
    const haystack = [
      tree.id,
      tree.label,
      tree.species,
      tree.commonName,
      tree.surveyor,
      tree.health,
      tree.waterStatus,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q) || tree.id.toLowerCase().replace("-", "").includes(compact);
  });
}

export function searchAuditTree(query: string): TreeRecord | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const exact =
    TREE_SURVEY_RECORDS.find((tree) => tree.id.toLowerCase() === q) ??
    TREE_SURVEY_RECORDS.find((tree) => tree.label.toLowerCase() === q);
  if (exact) return exact;

  return searchTrees(query)[0] ?? null;
}
