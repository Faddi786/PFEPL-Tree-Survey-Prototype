/** Demo DPR (Daily Progress Report) data for NILAM mobile app — tree survey focus. */

import {
  TREE_SURVEY_RECORDS,
  type TreeHealthStatus,
  type WaterSoilStatus,
} from "./treeSurveyData";

export type DprDaySummary = {
  date: string; // YYYY-MM-DD
  day: number;
  parcelsCollected: number;
  pointsCollected: number;
  location: string;
  completed: boolean;
};

export type DprParcelSummary = {
  id: string;
  parcelNumber: string;
  parcelsCollected: number;
  pointsCollected: number;
  village: string;
};

/** One surveyed tree in a DPR zone detail report. */
export type DprTreePoint = {
  id: string;
  treeId: string;
  label: string;
  commonName: string;
  species: string;
  heightM: number;
  dbhCm: number;
  canopyDiameterM: number;
  health: TreeHealthStatus;
  healthScore: number;
  waterStatus: WaterSoilStatus;
  surveyor: string;
  surveyedAt: string;
  photoUrl: string;
  lat: number;
  lng: number;
};

export type DprParcelDetail = {
  parcelId: string;
  parcelNumber: string;
  village: string;
  boundary: Array<{ x: number; y: number }>;
  trees: DprTreePoint[];
};

/** @deprecated Prefer DprTreePoint — kept for any older imports. */
export type DprGnssPoint = DprTreePoint;

const VILLAGES = ["Thanjavur North", "Kumbakonam East", "Papanasam", "Orathanadu", "Budalur"];
const LOCATIONS = ["Ward 12 · Main Rd", "Tank bund · Sector B", "Revenue block 4", "Village centre", "Canal side"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function isCurrentMonth(year: number, month: number) {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() + 1 === month;
}

function isPastMonth(year: number, month: number) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return year < y || (year === y && month < m);
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateDaySummary(year: number, month: number, day: number): DprDaySummary {
  const date = `${year}-${pad(month)}-${pad(day)}`;
  const seed = year * 10000 + month * 100 + day;
  const parcelsCollected = 2 + Math.floor(seededRandom(seed) * 6);
  const pointsCollected = parcelsCollected * (3 + Math.floor(seededRandom(seed + 1) * 4));
  const location = LOCATIONS[day % LOCATIONS.length];
  const now = new Date();
  const isToday =
    year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
  const completed = isPastMonth(year, month) || (isCurrentMonth(year, month) && !isToday);

  return { date, day, parcelsCollected, pointsCollected, location, completed };
}

export function getDprMonthSummaries(year: number, month: number): DprDaySummary[] {
  const total = daysInMonth(year, month);
  const now = new Date();
  const isCurrent = isCurrentMonth(year, month);
  const maxDay = isCurrent ? now.getDate() : total;
  const rows: DprDaySummary[] = [];
  for (let d = 1; d <= maxDay; d++) {
    rows.push(generateDaySummary(year, month, d));
  }
  return rows;
}

export function getDprParcelsForDate(date: string): DprParcelSummary[] {
  const [y, m, d] = date.split("-").map(Number);
  const daySummary = generateDaySummary(y, m, d);
  const parcels: DprParcelSummary[] = [];
  for (let i = 0; i < daySummary.parcelsCollected; i++) {
    const seed = y * 10000 + m * 100 + d + i * 7;
    const points = 3 + Math.floor(seededRandom(seed) * 5);
    parcels.push({
      id: `dpr-${date}-p${i + 1}`,
      parcelNumber: `${120 + i * 3}/${i + 1}`,
      parcelsCollected: 1,
      pointsCollected: points,
      village: VILLAGES[i % VILLAGES.length],
    });
  }
  return parcels;
}

function makeBoundary(seed: number): Array<{ x: number; y: number }> {
  const cx = 50 + seededRandom(seed) * 20;
  const cy = 50 + seededRandom(seed + 1) * 20;
  const verts = 5 + Math.floor(seededRandom(seed + 2) * 3);
  return Array.from({ length: verts }, (_, i) => {
    const angle = (i / verts) * Math.PI * 2;
    const r = 18 + seededRandom(seed + i + 3) * 12;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  });
}

export function getDprParcelDetail(parcelId: string): DprParcelDetail | undefined {
  const match = parcelId.match(/^dpr-(\d{4}-\d{2}-\d{2})-p(\d+)$/);
  if (!match) return undefined;
  const [, date, idxStr] = match;
  const idx = Number(idxStr);
  const [y, m, d] = date.split("-").map(Number);
  const seed = y * 10000 + m * 100 + d + idx * 13;
  const parcels = getDprParcelsForDate(date);
  const parcel = parcels.find((p) => p.id === parcelId);
  if (!parcel) return undefined;

  const pool = TREE_SURVEY_RECORDS;
  const boundary = makeBoundary(seed);
  const trees: DprTreePoint[] = [];

  for (let i = 0; i < parcel.pointsCollected; i++) {
    const pSeed = seed + i * 17;
    const tree = pool[Math.floor(seededRandom(pSeed) * pool.length)] ?? pool[i % pool.length];
    const hour = 8 + Math.floor(seededRandom(pSeed + 1) * 8);
    const minute = Math.floor(seededRandom(pSeed + 2) * 60);
    const tagNum = ((d * 37 + idx * 11 + i) % 900) + 100;
    trees.push({
      id: `${parcelId}-tree${i + 1}`,
      treeId: tree.id,
      label: `T-${String(tagNum).padStart(3, "0")}`,
      commonName: tree.commonName,
      species: tree.species,
      heightM: Number((tree.heightM * (0.85 + seededRandom(pSeed + 3) * 0.3)).toFixed(1)),
      dbhCm: Number((tree.dbhCm * (0.85 + seededRandom(pSeed + 4) * 0.3)).toFixed(0)),
      canopyDiameterM: Number(
        (tree.canopyDiameterM * (0.85 + seededRandom(pSeed + 5) * 0.3)).toFixed(1),
      ),
      health: tree.health,
      healthScore: Math.min(
        100,
        Math.max(40, Math.round(tree.healthScore + (seededRandom(pSeed + 6) - 0.5) * 12)),
      ),
      waterStatus: tree.waterStatus,
      surveyor: tree.surveyor,
      surveyedAt: `${date} ${pad(hour)}:${pad(minute)}`,
      photoUrl: tree.photoUrl,
      lat: tree.lat,
      lng: tree.lng,
    });
  }

  return {
    parcelId,
    parcelNumber: parcel.parcelNumber,
    village: parcel.village,
    boundary,
    trees,
  };
}

export function formatMonthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

export function getDefaultDprMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
