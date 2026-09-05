export type WorkflowId =
  | "field-patrol"
  | "qr-measure"
  | "audit-log"
  | "search-rbac";

export type WorkflowConfig = {
  id: WorkflowId;
  title: string;
  description: string;
  defaultSteps: string[];
  showInPanel?: boolean;
};

export const WORKFLOW_CONFIGS: WorkflowConfig[] = [
  {
    id: "field-patrol",
    title: "Field patrol & survey",
    description: "Assigned beat patrol with QR check-in, digital forms, and GNSS.",
    defaultSteps: ["Receive assignment", "QR scan check-in", "Forms + photo", "Sync packet"],
    showInPanel: false,
  },
  {
    id: "qr-measure",
    title: "Height & crown (QR scale)",
    description: "Photograph the tree with the QR tag card in frame, review confidence, accept or override.",
    defaultSteps: ["QR in frame", "Compute height/crown", "Officer review", "Accept & save"],
    showInPanel: false,
  },
  {
    id: "audit-log",
    title: "Survey audit / history",
    description: "Immutable survey and patrol history with before/after compare.",
    showInPanel: true,
  },
  {
    id: "search-rbac",
    title: "Roles & access",
    description: "Field Officer, Range Officer, Analyst, Admin, and authorised view-only access.",
    defaultSteps: ["Role login", "Search", "Policy", "Audit"],
    showInPanel: false,
  },
];

export const WORKFLOW_LOOKUP = Object.fromEntries(WORKFLOW_CONFIGS.map((cfg) => [cfg.id, cfg]));

export function getVisiblePanelWorkflows(): WorkflowConfig[] {
  return WORKFLOW_CONFIGS.filter((workflow) => workflow.showInPanel !== false);
}

export function getWorkflowRoute(id: WorkflowId): string {
  if (id === "audit-log") return "/workflows/audit-log";
  if (id === "qr-measure") return "/workflows/qr-measure";
  if (id === "field-patrol") return "/mobile";
  if (id === "search-rbac") return "/admin";
  return `/workflows/${id}`;
}
