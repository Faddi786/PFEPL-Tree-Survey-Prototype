/** GreenWatch demo constants — Social Forestry Division, Pune. */

export const GREENWATCH_DIVISION = {
  circle: "Pune Circle",
  division: "Social Forestry Division, Pune",
  department: "Maharashtra Forest Department",
} as const;

export const RANGES = ["Haveli Range", "Maval Range", "Khed Range", "Baramati Range"] as const;
export const BEATS = ["Beat 1", "Beat 2", "Beat 3", "Beat 4"] as const;
export const COMPARTMENTS = [
  "Nagar Van Block A",
  "Canal-side plantation",
  "NH-48 avenue",
  "Nursery – Hadapsar",
  "CAMPA block 2024",
] as const;
export const SCHEMES = ["CAMPA", "Nagar Van Yojana", "Avenue plantation", "Nursery stock"] as const;

export type EncroachmentStatus = "none" | "flagged" | "resolved";
export type WateringCycleStatus = "ok" | "due" | "overdue";
export type GnssSource = "dgps" | "phone";
export type GreenwatchRole =
  | "Field Officer"
  | "Supervisor / Range Officer"
  | "Forest Analyst"
  | "System Administrator"
  | "View-only (other department)";

export type PatrolStatus = "scheduled" | "in-progress" | "complete" | "overdue";

export type PatrolAssignment = {
  id: string;
  beat: string;
  range: string;
  route: string;
  assignedTo: string;
  dueWindow: string;
  treesAssigned: number;
  treesScanned: number;
  status: PatrolStatus;
  completionPct: number;
};

export type GreenwatchAlert = {
  id: string;
  family: "condition" | "watering" | "coverage";
  title: string;
  detail: string;
  range: string;
  beat: string;
  raisedAt: string;
};

export const PATROL_ASSIGNMENTS: PatrolAssignment[] = [
  {
    id: "PTL-2026-081",
    beat: "Beat 2",
    range: "Haveli Range",
    route: "NH-48 km 12–18",
    assignedTo: "R. Priya · FO-1042",
    dueWindow: "1–4 Sep 2026",
    treesAssigned: 86,
    treesScanned: 61,
    status: "in-progress",
    completionPct: 71,
  },
  {
    id: "PTL-2026-082",
    beat: "Beat 1",
    range: "Maval Range",
    route: "Canal belt west",
    assignedTo: "S. Karthik · FO-1088",
    dueWindow: "2–5 Sep 2026",
    treesAssigned: 54,
    treesScanned: 54,
    status: "complete",
    completionPct: 100,
  },
  {
    id: "PTL-2026-083",
    beat: "Beat 3",
    range: "Khed Range",
    route: "Nagar Van Block A",
    assignedTo: "M. Anitha · FO-1103",
    dueWindow: "28 Aug–1 Sep 2026",
    treesAssigned: 72,
    treesScanned: 18,
    status: "overdue",
    completionPct: 25,
  },
  {
    id: "PTL-2026-084",
    beat: "Beat 4",
    range: "Baramati Range",
    route: "Nursery – Hadapsar",
    assignedTo: "V. Ramesh · FO-1115",
    dueWindow: "4–7 Sep 2026",
    treesAssigned: 40,
    treesScanned: 0,
    status: "scheduled",
    completionPct: 0,
  },
];

export const GREENWATCH_ALERTS: GreenwatchAlert[] = [
  {
    id: "ALT-H-12",
    family: "condition",
    title: "Diseased trees — Haveli Beat 2",
    detail: "Officer health form: leaf blight on 6 avenue trees. Photo-backed.",
    range: "Haveli Range",
    beat: "Beat 2",
    raisedAt: "2026-09-03",
  },
  {
    id: "ALT-E-04",
    family: "condition",
    title: "Encroachment flagged — NH-48",
    detail: "Fence line over plantation strip. GNSS + photo submitted.",
    range: "Haveli Range",
    beat: "Beat 2",
    raisedAt: "2026-09-02",
  },
  {
    id: "ALT-W-19",
    family: "watering",
    title: "Watering cycle overdue — Nagar Van A",
    detail: "Young plantation stretch past due date with no new watering log.",
    range: "Khed Range",
    beat: "Beat 3",
    raisedAt: "2026-09-01",
  },
  {
    id: "ALT-C-07",
    family: "coverage",
    title: "Patrol overdue — Khed Beat 3",
    detail: "Assigned stretch not scanned within due window.",
    range: "Khed Range",
    beat: "Beat 3",
    raisedAt: "2026-09-02",
  },
];

export const QR_TAG_ISSUANCE = [
  { qr: "GW-PUN-000182", treeId: "TREE-0182", status: "Mounted", issued: "2026-08-12" },
  { qr: "GW-PUN-000183", treeId: "TREE-0183", status: "Re-tagged", issued: "2026-09-01" },
  { qr: "GW-PUN-000401", treeId: "—", status: "Printed, unmounted", issued: "2026-09-03" },
];

export const GREENWATCH_USERS: Array<{
  id: string;
  name: string;
  role: GreenwatchRole;
  unit: string;
}> = [
  { id: "fo.priya", name: "R. Priya", role: "Field Officer", unit: "Haveli Range · Beat 2" },
  { id: "ro.deshmukh", name: "A. Deshmukh", role: "Supervisor / Range Officer", unit: "Haveli Range" },
  { id: "an.kulkarni", name: "S. Kulkarni", role: "Forest Analyst", unit: "SF Division, Pune" },
  { id: "adm.sf", name: "Platform Admin", role: "System Administrator", unit: "Division HQ" },
  { id: "view.pwd", name: "PWD observer", role: "View-only (other department)", unit: "Authorised read-only" },
];
