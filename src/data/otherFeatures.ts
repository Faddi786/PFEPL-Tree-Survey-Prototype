/** Combined PCMC civic workflows for Other Features. */

export type OtherFeatureId =
  | "tree-permissions"
  | "illegal-cutting"
  | "compliance-plantation"
  | "tree-insights"
  | "garden-ops";

export type StepTone = "ok" | "warn" | "bad" | "info" | "neutral";

export type DecisionOption = {
  label: string;
  tone: StepTone;
  note?: string;
  /** Extra panels shown when this option is selected */
  detailPanels?: StepPanel[];
};

export type StepPanel =
  | {
      type: "form";
      title: string;
      fields: { label: string; value: string }[];
    }
  | {
      type: "kv";
      title: string;
      rows: { label: string; value: string }[];
    }
  | {
      type: "table";
      title: string;
      headers: string[];
      rows: string[][];
    }
  | {
      type: "map";
      title: string;
      location: string;
      pins: { label: string; meta: string }[];
    }
  | {
      type: "status";
      tone: StepTone;
      title: string;
      items: string[];
    }
  | {
      type: "photos";
      title: string;
      items: { label: string; caption: string; src: string }[];
    }
  | {
      type: "stats";
      title: string;
      items: { label: string; value: string }[];
    }
  | {
      type: "decision";
      title: string;
      options: DecisionOption[];
      selected: string;
    }
  | {
      type: "list";
      title: string;
      items: { title: string; meta: string; badge?: string; tone?: StepTone }[];
    };

export type OtherFeatureStep = {
  title: string;
  actor: string;
  purpose: string;
  panels: StepPanel[];
};

export type OtherFeatureDemo = {
  id: OtherFeatureId;
  title: string;
  shortLabel: string;
  caseId: string;
  caseStatus: string;
  steps: OtherFeatureStep[];
};

export const OTHER_FEATURES: OtherFeatureDemo[] = [
  {
    id: "tree-permissions",
    title: "Tree Permissions",
    shortLabel: "Permissions",
    caseId: "PERM-2024-04821",
    caseStatus: "In progress",
    steps: [
      {
        title: "Request type",
        actor: "Applicant",
        purpose: "Choose the permission type — content below changes with your choice.",
        panels: [
          {
            type: "decision",
            title: "Permission type",
            selected: "Tree cutting",
            options: [
              {
                label: "Tree cutting",
                tone: "ok",
                note: "Full or partial cut of a surveyed tree",
                detailPanels: [
                  {
                    type: "kv",
                    title: "Tree cutting request",
                    rows: [
                      { label: "Case", value: "PERM-2024-04821" },
                      { label: "Tree ID", value: "Z-B / W-12 / T-04821" },
                      { label: "Species", value: "Neem (Azadirachta indica)" },
                      { label: "Cut type", value: "Full cut" },
                      { label: "Reason", value: "Road widening — Sector 12" },
                      { label: "Applicant", value: "PWD Road Division" },
                    ],
                  },
                  {
                    type: "status",
                    tone: "info",
                    title: "Next: submit documents, then field inspection",
                    items: ["Compensatory plantation usually required after approval"],
                  },
                ],
              },
              {
                label: "Building plan",
                tone: "info",
                note: "Cut / trim for construction + fee / refund",
                detailPanels: [
                  {
                    type: "kv",
                    title: "Building plan request",
                    rows: [
                      { label: "Building file", value: "BP/2024/PCMC/1187" },
                      { label: "Plot", value: "CTS 214 · Wakad" },
                      { label: "Architect", value: "M. Deshmukh & Associates" },
                      { label: "Fee estimate", value: "₹ 45,000" },
                      { label: "Refund rule", value: "If tree not cut — verify & refund" },
                    ],
                  },
                  {
                    type: "table",
                    title: "Trees in plan",
                    headers: ["Tree ID", "Species", "Action", "Girth"],
                    rows: [
                      ["T-22011", "Mango", "Full cut", "0.55 m"],
                      ["T-22012", "Ashoka", "Full cut", "0.32 m"],
                      ["T-22013", "Neem", "Trim only", "0.41 m"],
                    ],
                  },
                  {
                    type: "status",
                    tone: "info",
                    title: "Fee collected after approve · refund step at end if unused",
                    items: ["Link revised plan PDF when claiming refund"],
                  },
                ],
              },
              {
                label: "Hoarding / flex",
                tone: "warn",
                note: "Prune or cut for advertisement structures",
                detailPanels: [
                  {
                    type: "kv",
                    title: "Hoarding / flex request",
                    rows: [
                      { label: "Case", value: "HF-2024-077" },
                      { label: "Agency", value: "Skyline Outdoor Media" },
                      { label: "Structure", value: "Flex board · NH stretch" },
                      { label: "Work type", value: "Canopy prune only" },
                      { label: "Clearance", value: "4.5 m above road" },
                    ],
                  },
                  {
                    type: "table",
                    title: "Affected trees",
                    headers: ["Tree ID", "Species", "Requested"],
                    rows: [
                      ["T-30102", "Rain tree", "Prune"],
                      ["T-30105", "Copperpod", "Prune"],
                    ],
                  },
                  {
                    type: "status",
                    tone: "warn",
                    title: "Full cut usually not allowed — prune preferred",
                    items: ["Post-work photos required for compliance"],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        title: "Submit",
        actor: "Applicant",
        purpose: "Fill request details and attach documents.",
        panels: [
          {
            type: "form",
            title: "Request form",
            fields: [
              { label: "Tree / file ID", value: "T-04821 / linked case" },
              { label: "Applicant", value: "PWD Road Division" },
              { label: "Contact", value: "pwd.roads@pcmc.gov.in" },
              { label: "Reason", value: "Road widening — Sector 12" },
              { label: "Documents", value: "site_plan.pdf · NOC_draft.pdf" },
              { label: "Preferred date", value: "Within 30 days" },
            ],
          },
          {
            type: "status",
            tone: "ok",
            title: "Draft saved · ready for map review",
            items: ["Garden admin will locate the tree on geoportal"],
          },
        ],
      },
      {
        title: "Map",
        actor: "Garden Admin",
        purpose: "Find the tree on the ward map before inspection.",
        panels: [
          {
            type: "map",
            title: "Geoportal · Ward 12",
            location: "18.6298° N, 73.7997° E · near NH-48 spur",
            pins: [
              { label: "T-04821 Neem", meta: "Requested cut" },
              { label: "T-04819 Peepal", meta: "10 m east · not in request" },
            ],
          },
          {
            type: "kv",
            title: "Queue",
            rows: [
              { label: "Priority", value: "Normal" },
              { label: "Heritage flag", value: "None" },
              { label: "Next", value: "Assign field officer" },
            ],
          },
        ],
      },
      {
        title: "Inspect",
        actor: "Garden Officer",
        purpose: "Site visit — measure, photograph, recommend.",
        panels: [
          {
            type: "form",
            title: "Inspection",
            fields: [
              { label: "Identity match", value: "Yes · tag T-04821" },
              { label: "Girth", value: "0.49 m" },
              { label: "Condition", value: "Healthy" },
              { label: "Site risk", value: "Low" },
              { label: "Officer", value: "S. Patil · GO-221" },
              { label: "Date", value: "12 Aug 2024" },
            ],
          },
          {
            type: "photos",
            title: "Site photos",
            items: [
              {
                label: "Full tree",
                caption: "Before · north face",
                src: "/assets/trees/ai-survey/02-full-tree.jpg",
              },
              {
                label: "Trunk / tag",
                caption: "Census tag visible",
                src: "/assets/trees/ai-survey/08-trunk.jpg",
              },
              {
                label: "Surroundings",
                caption: "Road edge",
                src: "/assets/trees/ai-survey/10-soil-base.jpg",
              },
            ],
          },
        ],
      },
      {
        title: "Decide",
        actor: "Garden Admin",
        purpose: "Approve, allow prune only, or deny.",
        panels: [
          {
            type: "decision",
            title: "Decision",
            selected: "Approve",
            options: [
              { label: "Approve", tone: "ok", note: "Letter PERM-1182" },
              { label: "Prune only", tone: "warn", note: "Keep trunk" },
              { label: "Deny", tone: "bad", note: "No permission" },
            ],
          },
          {
            type: "kv",
            title: "Permission letter",
            rows: [
              { label: "Letter no.", value: "PERM-1182" },
              { label: "Valid till", value: "12 Nov 2024" },
              { label: "Fee", value: "₹ 12,000 (cutting) / as per type" },
              { label: "Condition", value: "4 compensatory plants in 60 days" },
            ],
          },
        ],
      },
      {
        title: "Proof",
        actor: "Garden Officer",
        purpose: "Upload after-work photos and update inventory.",
        panels: [
          {
            type: "photos",
            title: "After work",
            items: [
              {
                label: "Stump",
                caption: "Uploaded 28 Aug 2024",
                src: "/assets/other-features/stump-fresh.jpg",
              },
              {
                label: "Cleared site",
                caption: "Road work started",
                src: "/assets/other-features/cleared-road-site.jpg",
              },
              {
                label: "Prune example",
                caption: "If hoarding type",
                src: "/assets/other-features/tree-pruned-clearance.jpg",
              },
            ],
          },
          {
            type: "status",
            tone: "ok",
            title: "Inventory updated · Tree Exist = No (if full cut)",
            items: ["Case moves to compliance for plantation check"],
          },
        ],
      },
      {
        title: "Refund",
        actor: "Accounts",
        purpose: "Building plan only — refund if permitted tree was not cut.",
        panels: [
          {
            type: "form",
            title: "Refund request",
            fields: [
              { label: "Building file", value: "BP/2024/PCMC/1187" },
              { label: "Tree not cut", value: "T-22012 Ashoka" },
              { label: "Claim amount", value: "₹ 15,000" },
              { label: "Reason", value: "Plan revised — tree retained" },
            ],
          },
          {
            type: "photos",
            title: "Standing tree proof",
            items: [
              {
                label: "Standing tree",
                caption: "Tagged · alive",
                src: "/assets/trees/species/ashoka.jpg",
              },
              {
                label: "Foundation edge",
                caption: "Outside excavation",
                src: "/assets/other-features/foundation-tree-edge.jpg",
              },
            ],
          },
          {
            type: "decision",
            title: "Refund decision",
            selected: "Approve refund",
            options: [
              { label: "Approve refund", tone: "ok", note: "₹ 15,000" },
              { label: "Reject", tone: "bad" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "illegal-cutting",
    title: "Illegal Cutting",
    shortLabel: "Illegal Cutting",
    caseId: "GRV-2024-0902",
    caseStatus: "Under inspection",
    steps: [
      {
        title: "Report",
        actor: "Citizen",
        purpose: "Report illegal cutting with location and photo.",
        panels: [
          {
            type: "form",
            title: "Grievance",
            fields: [
              { label: "Reporter", value: "A. Kulkarni" },
              { label: "Location", value: "Ward 18 · Sumantha Sarovar" },
              { label: "Issue", value: "Large peepal cut overnight" },
              { label: "Photo", value: "grievance_0902.jpg" },
              { label: "Priority", value: "High" },
            ],
          },
        ],
      },
      {
        title: "Assign",
        actor: "System",
        purpose: "Create ticket and match census record.",
        panels: [
          {
            type: "kv",
            title: "Ticket GRV-2024-0902",
            rows: [
              { label: "Assigned to", value: "R. Jadhav · GO-118" },
              { label: "SLA", value: "Inspect within 48 hrs" },
              { label: "Census match", value: "T-11902 · Ficus religiosa" },
              { label: "Permission found", value: "None — likely illegal" },
            ],
          },
          {
            type: "status",
            tone: "warn",
            title: "No cutting permission on this tree",
            items: ["Officer notified on mobile"],
          },
        ],
      },
      {
        title: "Inspect",
        actor: "Garden Officer",
        purpose: "Collect evidence and compare with census.",
        panels: [
          {
            type: "photos",
            title: "Evidence",
            items: [
              {
                label: "Stump",
                caption: "Fresh cut · sap visible",
                src: "/assets/other-features/stump-fresh.jpg",
              },
              {
                label: "Debris",
                caption: "Branches stacked",
                src: "/assets/other-features/branch-debris.jpg",
              },
              {
                label: "Context",
                caption: "Temple boundary",
                src: "/assets/other-features/temple-boundary-peepal.jpg",
              },
            ],
          },
          {
            type: "table",
            title: "Census vs site",
            headers: ["Field", "Census", "Now"],
            rows: [
              ["Tree ID", "T-11902", "Stump only"],
              ["Species", "Peepal", "Matches debris"],
              ["Permission", "None", "Illegal"],
            ],
          },
        ],
      },
      {
        title: "Action",
        actor: "Garden Admin",
        purpose: "Take action and close the case.",
        panels: [
          {
            type: "decision",
            title: "Action",
            selected: "Issue notice",
            options: [
              { label: "Issue notice", tone: "bad", note: "GARDEN/ILL/331" },
              { label: "Warning", tone: "warn" },
              { label: "Close — no offence", tone: "ok" },
            ],
          },
          {
            type: "status",
            tone: "info",
            title: "Case closed · plot flagged for plantation order",
            items: ["T-11902 marked Cut / Illegal"],
          },
        ],
      },
    ],
  },
  {
    id: "compliance-plantation",
    title: "Compliance & Plantation",
    shortLabel: "Compliance",
    caseId: "CMP-W12-FY24",
    caseStatus: "14 overdue",
    steps: [
      {
        title: "Permissions",
        actor: "Garden Admin",
        purpose: "Review granted permissions for the ward / period.",
        panels: [
          {
            type: "form",
            title: "Filters",
            fields: [
              { label: "Period", value: "Apr 2024 – Mar 2025" },
              { label: "Ward", value: "Ward 12" },
              { label: "Types", value: "Cutting · Building · Hoarding" },
            ],
          },
          {
            type: "stats",
            title: "Ward 12",
            items: [
              { label: "Granted", value: "128" },
              { label: "Verified", value: "101" },
              { label: "Overdue", value: "14" },
              { label: "Over-cut", value: "2" },
            ],
          },
        ],
      },
      {
        title: "Match proof",
        actor: "Garden Admin",
        purpose: "Match each permission to photo and Tree Exist flag.",
        panels: [
          {
            type: "table",
            title: "Permission vs proof",
            headers: ["Permission", "Tree", "Photo", "Exist"],
            rows: [
              ["PERM-441", "T-04801", "Yes", "No"],
              ["PERM-452", "T-04888", "Missing", "Yes"],
              ["BP-1187", "T-22011", "Yes", "No"],
              ["HF-077", "T-30102", "Yes", "Yes (prune)"],
            ],
          },
        ],
      },
      {
        title: "Exceptions",
        actor: "System",
        purpose: "Focus on missing photos and over-cutting.",
        panels: [
          {
            type: "list",
            title: "Open exceptions",
            items: [
              {
                title: "PERM-452 — photo missing",
                meta: "Overdue 21 days",
                badge: "Remind",
                tone: "warn",
              },
              {
                title: "PERM-460 — extra stump found",
                meta: "Permission for 1 · found 2",
                badge: "Over-cut",
                tone: "bad",
              },
            ],
          },
        ],
      },
      {
        title: "Plant",
        actor: "Garden Officer",
        purpose: "Record compensatory plantation linked to a permission.",
        panels: [
          {
            type: "form",
            title: "Plantation batch",
            fields: [
              { label: "Batch", value: "PL-W12-044" },
              { label: "Species", value: "Pongamia pinnata · 40" },
              { label: "Against", value: "PERM-04821 (need 4 min.)" },
              { label: "Site", value: "Roadside strip · Ward 12" },
              { label: "Date", value: "20 Aug 2024" },
            ],
          },
          {
            type: "photos",
            title: "Field photos",
            items: [
              {
                label: "Row view",
                caption: "40 pits prepared",
                src: "/assets/other-features/plantation-row.jpg",
              },
              {
                label: "Sapling",
                caption: "Pongamia · 1.2 m",
                src: "/assets/trees/species/pongam.jpg",
              },
            ],
          },
        ],
      },
      {
        title: "Survival",
        actor: "Garden Officer",
        purpose: "90-day survival check and replant if needed.",
        panels: [
          {
            type: "stats",
            title: "90-day check",
            items: [
              { label: "Alive", value: "37" },
              { label: "Dead", value: "3" },
              { label: "Survival", value: "92%" },
              { label: "Replant", value: "3" },
            ],
          },
          {
            type: "status",
            tone: "ok",
            title: "Obligation met · replant ordered for 3 pits",
            items: ["Linked back to PERM-04821 compliance"],
          },
        ],
      },
    ],
  },
  {
    id: "tree-insights",
    title: "Tree Insights",
    shortLabel: "Insights",
    caseId: "ZONE-B",
    caseStatus: "Ready",
    steps: [
      {
        title: "Species",
        actor: "User",
        purpose: "Search digital library — used in survey & carbon.",
        panels: [
          {
            type: "form",
            title: "Search",
            fields: [
              { label: "Query", value: "neem" },
              { label: "Scientific", value: "Azadirachta indica" },
              { label: "Marathi", value: "Kaduneem" },
              { label: "IUCN / Origin", value: "LC · Native" },
              { label: "Wood density", value: "0.73" },
            ],
          },
          {
            type: "photos",
            title: "Species card",
            items: [
              {
                label: "Tree",
                caption: "Full canopy",
                src: "/assets/trees/species/neem.jpg",
              },
              {
                label: "Flower",
                caption: "Mar – May",
                src: "/assets/trees/ai-survey/05-flower.jpg",
              },
              {
                label: "Fruit",
                caption: "Drupes",
                src: "/assets/trees/ai-survey/06-fruit.jpg",
              },
            ],
          },
        ],
      },
      {
        title: "Heritage",
        actor: "Garden Admin",
        purpose: "Protected trees — cutting needs extra approval.",
        panels: [
          {
            type: "table",
            title: "Heritage sample",
            headers: ["Tree", "Species", "Ward", "Why"],
            rows: [
              ["T-09112", "Peepal", "7", "Age + temple"],
              ["T-08801", "Banyan", "9", "Landmark"],
              ["T-07044", "Sandal", "4", "RET / Native"],
            ],
          },
          {
            type: "status",
            tone: "warn",
            title: "Normal cutting path blocked for heritage trees",
            items: ["Routes to Tree Authority for review"],
          },
        ],
      },
      {
        title: "Census",
        actor: "Planner",
        purpose: "Zone counts — girth / height style bins.",
        panels: [
          {
            type: "stats",
            title: "Zone B",
            items: [
              { label: "Trees", value: "4.62L" },
              { label: "Area", value: "29.5 km²" },
              { label: "Heritage", value: "31k" },
            ],
          },
          {
            type: "table",
            title: "Top species",
            headers: ["Species", "Count"],
            rows: [
              ["Subabhul", "52,432"],
              ["Gliricidia", "33,330"],
              ["Babhul", "21,861"],
              ["Neem", "7,189"],
            ],
          },
          {
            type: "table",
            title: "Girth classes",
            headers: ["Class", "Share"],
            rows: [
              ["≤ 0.30 m", "61%"],
              ["0.31 – 0.50 m", "24%"],
              ["≥ 0.51 m", "15%"],
            ],
          },
        ],
      },
      {
        title: "Cover + carbon",
        actor: "Environment",
        purpose: "Green cover % and carbon stock by zone.",
        panels: [
          {
            type: "stats",
            title: "City",
            items: [
              { label: "Canopy", value: "18.4%" },
              { label: "Carbon", value: "1.28 Mt" },
              { label: "Per ha", value: "70.7 t" },
            ],
          },
          {
            type: "table",
            title: "By zone",
            headers: ["Zone", "Cover", "Carbon", "Action"],
            rows: [
              ["B", "19%", "0.19 Mt", "Maintain"],
              ["C", "14%", "0.11 Mt", "Plant drive"],
              ["E", "22%", "0.34 Mt", "Protect"],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "garden-ops",
    title: "Garden Operations",
    shortLabel: "Garden Ops",
    caseId: "OPS-LIVE",
    caseStatus: "12 online",
    steps: [
      {
        title: "Roles",
        actor: "Admin",
        purpose: "Who can request, inspect, and approve.",
        panels: [
          {
            type: "table",
            title: "Role matrix",
            headers: ["Role", "Request", "Inspect", "Approve"],
            rows: [
              ["Applicant", "Yes", "No", "No"],
              ["Surveyor", "No", "Field", "No"],
              ["Garden Officer", "Limited", "Yes", "Recommend"],
              ["Garden Admin", "Yes", "Yes", "Yes"],
            ],
          },
          {
            type: "list",
            title: "Sample users",
            items: [
              { title: "S. Patil", meta: "Officer · Wards 12, 14", badge: "Officer", tone: "info" },
              { title: "K. Mehta", meta: "Admin · All zones", badge: "Admin", tone: "ok" },
            ],
          },
        ],
      },
      {
        title: "Tracking",
        actor: "Garden Admin",
        purpose: "See live field officers on the map.",
        panels: [
          {
            type: "map",
            title: "Live map",
            location: "PCMC · census / inspection crews",
            pins: [
              { label: "TS-1042 Priya", meta: "Ward 22 · moving" },
              { label: "TS-1088 Karthik", meta: "Ward 18 · inspect" },
              { label: "TS-1103 Anitha", meta: "Ward 12 · moving" },
            ],
          },
          {
            type: "stats",
            title: "Today",
            items: [
              { label: "Online", value: "12" },
              { label: "Jobs open", value: "7" },
              { label: "Thin wards", value: "2" },
            ],
          },
        ],
      },
      {
        title: "Dispatch",
        actor: "Garden Admin",
        purpose: "Assign nearest officer to a permission or grievance job.",
        panels: [
          {
            type: "form",
            title: "Dispatch",
            fields: [
              { label: "Job", value: "Inspect PERM-04901" },
              { label: "Nearest", value: "R. Priya · 1.2 km" },
              { label: "ETA", value: "18 min" },
              { label: "Status", value: "Assigned" },
            ],
          },
          {
            type: "status",
            tone: "ok",
            title: "Push + SMS sent to officer",
            items: ["Job appears in field queue"],
          },
        ],
      },
    ],
  },
];

export const DEFAULT_OTHER_FEATURE_ID: OtherFeatureId = "tree-permissions";
