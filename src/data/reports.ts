import type { WorkflowId } from "./workflows";

export type ReportId = WorkflowId;

export type KpiCard = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

export type ChartPoint = { label: string; value: number };

export type RbacRole = {
  role: string;
  description: string;
  users: number;
  permissions: Record<string, boolean>;
};

export type ReportDefinition = {
  id: ReportId;
  title: string;
  subtitle: string;
  period: string;
  kpis: KpiCard[];
  statusBreakdown: ChartPoint[];
  monthlyTrend: ChartPoint[];
  regionSplit: ChartPoint[];
  insights: string[];
  rbacMatrix?: {
    functions: string[];
    roles: RbacRole[];
  };
};

export const REPORT_MONTH_OPTIONS = [
  { id: "2026-04", label: "Apr" },
  { id: "2026-05", label: "May" },
  { id: "2026-06", label: "Jun" },
  { id: "2026-07", label: "Jul" },
  { id: "2026-08", label: "Aug" },
  { id: "2026-09", label: "Sep" },
];
export const REPORT_YEAR_OPTIONS = [{ id: "2026", label: "2026" }];
export const ALL_REPORT_MONTH_IDS = REPORT_MONTH_OPTIONS.map((m) => m.id);
export const ALL_REPORT_YEAR_IDS = REPORT_YEAR_OPTIONS.map((y) => y.id);

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];

const RBAC_FUNCTIONS = [
  "Map workbench",
  "QR scan & forms",
  "Height/crown accept",
  "Patrol schedule",
  "QC field submissions",
  "Conversational analyst",
  "GIS / PDF export",
  "QR tag issuance",
  "User management",
];

const RBAC_ROLES: RbacRole[] = [
  {
    role: "Field Officer",
    description: "QR scan, digital forms, photo measure, GNSS, offline sync",
    users: 48,
    permissions: {
      "Map workbench": true,
      "QR scan & forms": true,
      "Height/crown accept": true,
      "Patrol schedule": false,
      "QC field submissions": false,
      "Conversational analyst": false,
      "GIS / PDF export": false,
      "QR tag issuance": false,
      "User management": false,
    },
  },
  {
    role: "Supervisor / Range Officer",
    description: "Patrol assignment, QC, encroachment queue",
    users: 12,
    permissions: {
      "Map workbench": true,
      "QR scan & forms": true,
      "Height/crown accept": true,
      "Patrol schedule": true,
      "QC field submissions": true,
      "Conversational analyst": true,
      "GIS / PDF export": true,
      "QR tag issuance": false,
      "User management": false,
    },
  },
  {
    role: "Forest Analyst",
    description: "Cross-range analytics and field-data reports",
    users: 6,
    permissions: {
      "Map workbench": true,
      "QR scan & forms": false,
      "Height/crown accept": false,
      "Patrol schedule": false,
      "QC field submissions": false,
      "Conversational analyst": true,
      "GIS / PDF export": true,
      "QR tag issuance": false,
      "User management": false,
    },
  },
  {
    role: "System Administrator",
    description: "Users, layers, QR issuance, platform config",
    users: 3,
    permissions: {
      "Map workbench": true,
      "QR scan & forms": false,
      "Height/crown accept": false,
      "Patrol schedule": true,
      "QC field submissions": true,
      "Conversational analyst": true,
      "GIS / PDF export": true,
      "QR tag issuance": true,
      "User management": true,
    },
  },
  {
    role: "View-only (other dept.)",
    description: "Authorised read-only map/data, no PII",
    users: 9,
    permissions: {
      "Map workbench": true,
      "QR scan & forms": false,
      "Height/crown accept": false,
      "Patrol schedule": false,
      "QC field submissions": false,
      "Conversational analyst": false,
      "GIS / PDF export": false,
      "QR tag issuance": false,
      "User management": false,
    },
  },
];

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: "field-patrol",
    title: "Patrol compliance",
    subtitle: "Scheduled beat coverage, QR/GNSS check-in, overdue stretches",
    period: "Demo block · Social Forestry Division, Pune",
    kpis: [
      { label: "Patrols this cycle", value: 24, tone: "info" },
      { label: "Completed", value: 18, tone: "success" },
      { label: "In progress", value: 4, tone: "warning" },
      { label: "Overdue", value: 2, tone: "danger" },
      { label: "Trees scanned", value: 1840, tone: "success" },
      { label: "Coverage", value: "76%", tone: "neutral" },
    ],
    statusBreakdown: [
      { label: "Complete", value: 18 },
      { label: "In progress", value: 4 },
      { label: "Overdue", value: 2 },
    ],
    monthlyTrend: MONTHS.map((label, i) => ({ label, value: 12 + i * 2 })),
    regionSplit: [
      { label: "Haveli", value: 8 },
      { label: "Maval", value: 6 },
      { label: "Khed", value: 5 },
      { label: "Baramati", value: 5 },
    ],
    insights: [
      "Khed Beat 3 is past its due window — coverage alert already raised.",
      "QR + GNSS check-in is the completion rule; paper diaries are not the system of record.",
    ],
  },
  {
    id: "qr-measure",
    title: "Height & crown (QR scale)",
    subtitle: "Photo measurements accepted by officers using the QR tag as scale",
    period: "Baseline survey block",
    kpis: [
      { label: "Measurements accepted", value: 412, tone: "success" },
      { label: "Officer overrides", value: 19, tone: "warning" },
      { label: "Avg height (m)", value: 11.4, tone: "info" },
      { label: "Avg crown (m)", value: 6.2, tone: "info" },
      { label: "Mean confidence", value: "89%", tone: "neutral" },
      { label: "Pending review", value: 7, tone: "warning" },
    ],
    statusBreakdown: [
      { label: "Accepted", value: 412 },
      { label: "Overridden", value: 19 },
      { label: "Pending", value: 7 },
    ],
    monthlyTrend: MONTHS.map((label, i) => ({ label, value: 40 + i * 12 })),
    regionSplit: [
      { label: "Avenue", value: 180 },
      { label: "Nagar Van", value: 120 },
      { label: "Canal belt", value: 90 },
      { label: "Nursery", value: 48 },
    ],
    insights: [
      "Height and crown are computed from the QR card in the photograph — not from an AI species model.",
      "Species, health and watering remain officer-entered forms.",
    ],
  },
  {
    id: "audit-log",
    title: "Survey & patrol history",
    subtitle: "Immutable attribute history with campaign compare",
    period: "Seven-year retention (demo)",
    kpis: [
      { label: "Versioned trees", value: 520, tone: "info" },
      { label: "Edits this month", value: 86, tone: "neutral" },
      { label: "Campaigns", value: 2, tone: "success" },
      { label: "Photo evidence", value: 1480, tone: "info" },
    ],
    statusBreakdown: [
      { label: "Baseline DGPS", value: 520 },
      { label: "Patrol updates", value: 186 },
    ],
    monthlyTrend: MONTHS.map((label, i) => ({ label, value: 20 + i * 8 })),
    regionSplit: [
      { label: "Haveli", value: 210 },
      { label: "Maval", value: 140 },
      { label: "Khed", value: 100 },
      { label: "Baramati", value: 70 },
    ],
    insights: ["Before/after compare is kept across annual census campaigns rather than overwriting notes."],
  },
  {
    id: "search-rbac",
    title: "Access control",
    subtitle: "Roles as specified for the Division",
    period: "Platform RBAC",
    kpis: [
      { label: "Active users", value: 78, tone: "info" },
      { label: "Field officers", value: 48, tone: "success" },
      { label: "View-only depts", value: 9, tone: "neutral" },
      { label: "MFA", value: "On", tone: "success" },
    ],
    statusBreakdown: [
      { label: "Field", value: 48 },
      { label: "Supervisors", value: 12 },
      { label: "Analysts", value: 6 },
      { label: "Admin", value: 3 },
      { label: "View-only", value: 9 },
    ],
    monthlyTrend: MONTHS.map((label) => ({ label, value: 78 })),
    regionSplit: [
      { label: "Division HQ", value: 18 },
      { label: "Ranges", value: 60 },
    ],
    insights: ["View-only access for other Forest circles and allied departments is authorised by the Division."],
    rbacMatrix: { functions: RBAC_FUNCTIONS, roles: RBAC_ROLES },
  },
];

export const REPORT_LOOKUP = Object.fromEntries(
  REPORT_DEFINITIONS.map((report) => [report.id, report]),
) as Record<ReportId, ReportDefinition>;

export function buildFilteredReport(
  report: ReportDefinition,
  _months: string[],
  _years: string[],
): ReportDefinition {
  return report;
}
