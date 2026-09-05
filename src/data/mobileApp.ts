import { DEFAULT_REGION_KEY, PARCEL_BOUNDARY_STROKE, VARIANCE_BAND_COLORS_SOLID, type ParcelRecord } from "./mockData";
import { getWorkbenchRegionDatasetSync } from "./workbenchParcels";
import { getTreeStats } from "./treeSurveyData";

/**
 * Temporary rapid-testing flag: skip lobby / unlock / login / splash and open the
 * Home tab inside PhoneFrame immediately. Set to `false` to restore the full intro flow.
 */
export const SKIP_MOBILE_INTRO = true;

export type MobileTab = "home" | "map" | "emergency" | "capture" | "sync" | "assist" | "scan" | "dgps";

export type MobileOverlayScreen =
  | "profile"
  | "settings"
  | "app-settings"
  | "rover-settings"
  | "dpr-date"
  | "dpr-parcel";

/** Local copy — surveyor portrait for Home / Profile (public/assets/mobile/surveyor.jpg). */
export const SURVEYOR_PHOTO_URL = "/assets/mobile/surveyor.jpg";

export type FieldOfficer = {
  id: string;
  name: string;
  role: string;
  badge: string;
  assignedVillage: string;
  assignedTaluk: string;
  region: string;
};

export type FieldPacket = {
  id: string;
  village: string;
  parcelCount: number;
  status: "assigned" | "downloaded" | "in-progress" | "synced";
  dueDate: string;
  progressPct: number;
};

export type CapturedGnssPoint = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  accuracyM: number;
  source: "bluetooth" | "ntrip" | "file";
  capturedAt: string;
  synced: boolean;
};

export const DEMO_FIELD_OFFICER: FieldOfficer = {
  id: "surveyor.ts.1042",
  name: "R. Priya",
  role: "Field Officer",
  badge: "FO-1042",
  assignedVillage: "Haveli Range · Beat 2",
  assignedTaluk: "Social Forestry Division, Pune",
  region: "NH-48 avenue · assigned patrol",
};

export type SurveyorProfile = FieldOfficer & {
  employeeId: string;
  department: string;
  phone: string;
  email: string;
  assignedDistrict: string;
  joiningDate: string;
  supervisor: string;
};

export const DEMO_SURVEYOR_PROFILE: SurveyorProfile = {
  ...DEMO_FIELD_OFFICER,
  employeeId: "EMP-TS-2022-1042",
  department: "Social Forestry Division, Pune",
  phone: "+91 98765 43210",
  email: "priya.r@mahaforest.gov.in",
  assignedDistrict: "Pune",
  joiningDate: "08 Jan 2022",
  supervisor: "Range Officer · Haveli",
};

export const FIELD_PACKETS: FieldPacket[] = [
  {
    id: "pkt-tree-a-042",
    village: "Haveli Beat 2 · NH-48",
    parcelCount: 86,
    status: "in-progress",
    dueDate: "18 Jun 2026",
    progressPct: 58,
  },
  {
    id: "pkt-tree-b-011",
    village: "Khed Beat 3 · Nagar Van A",
    parcelCount: 64,
    status: "assigned",
    dueDate: "25 Jun 2026",
    progressPct: 0,
  },
];

function khutalDataset() {
  return getWorkbenchRegionDatasetSync(DEFAULT_REGION_KEY);
}

export const MOBILE_PARCELS: ParcelRecord[] = khutalDataset().parcels.slice(0, 60);

export function searchMobileParcels(query: string): ParcelRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return MOBILE_PARCELS.slice(0, 18);
  return MOBILE_PARCELS.filter(
    (p) =>
      p.surveyNo.toLowerCase().includes(q) ||
      p.subDiv.toLowerCase().includes(q) ||
      p.ulpin.toLowerCase().includes(q) ||
      p.village.toLowerCase().includes(q),
  ).slice(0, 12);
}

export function getMobileParcel(id: string): ParcelRecord | undefined {
  return khutalDataset().parcels.find((p) => p.id === id);
}

export const INITIAL_GNSS_POINTS: CapturedGnssPoint[] = [
  {
    id: "tree-001",
    label: "TREE-A-012",
    lat: 18.5318,
    lng: 73.8472,
    accuracyM: 0.08,
    source: "bluetooth",
    capturedAt: "2026-06-10 09:14",
    synced: true,
  },
  {
    id: "tree-002",
    label: "TREE-A-013",
    lat: 10.9262,
    lng: 79.8374,
    accuracyM: 0.11,
    source: "ntrip",
    capturedAt: "2026-06-10 09:22",
    synced: false,
  },
  {
    id: "tree-003",
    label: "TREE-A-014",
    lat: 10.9251,
    lng: 79.8381,
    accuracyM: 0.09,
    source: "bluetooth",
    capturedAt: "2026-06-10 10:05",
    synced: true,
  },
  {
    id: "tree-004",
    label: "TREE-A-015",
    lat: 10.9247,
    lng: 79.8362,
    accuracyM: 0.12,
    source: "file",
    capturedAt: "2026-06-10 10:18",
    synced: false,
  },
  {
    id: "tree-005",
    label: "TREE-A-016",
    lat: 10.9265,
    lng: 79.8385,
    accuracyM: 0.07,
    source: "ntrip",
    capturedAt: "2026-06-10 10:31",
    synced: false,
  },
];

export function formatArea(sqM: number): string {
  const cents = sqM / 40.4686;
  if (cents >= 100) return `${(sqM / 4046.86).toFixed(2)} ac`;
  return `${cents.toFixed(1)} cents`;
}

export function getMobileTreeStats() {
  return getTreeStats();
}

export { VARIANCE_BAND_COLORS_SOLID, PARCEL_BOUNDARY_STROKE };
