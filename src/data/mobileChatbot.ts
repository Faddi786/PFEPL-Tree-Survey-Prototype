/** Offline Field Chatbot — intent matching over demo survey / DPR data. */

import type { FieldPacket, MobileTab } from "./mobileApp";
import {
  formatMonthLabel,
  getDefaultDprMonth,
  getDprMonthSummaries,
} from "./mobileDprData";
import {
  TREE_SURVEY_RECORDS,
  getTreeStats,
  type TreeRecord,
} from "./treeSurveyData";

export type ChatAction =
  | { type: "openTab"; tab: MobileTab; label: string }
  | { type: "openDprDate"; date: string; label: string }
  | { type: "navigateTree"; treeId: string; label: string };

/** One row in the chat DPR table — tap opens the day detail overlay. */
export type DprTableRow = {
  date: string;
  day: number;
  location: string;
  trees: number;
  points: number;
  surveyor?: string;
  highlight?: boolean;
};

/** Structured DPR block — day table first, detail on row tap. */
export type DprChatBlock = {
  title: string;
  tableRows: DprTableRow[];
};

/** Structured tree detail — rendered as a 2-column attribute card. */
export type TreeChatField = {
  label: string;
  value: string;
};

export type TreeChatBlock = {
  title: string;
  subtitle?: string;
  fields: TreeChatField[];
  note?: string;
};

/** Generic label/value or multi-column table for sync / health / stats. */
export type InfoTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

export type InfoTableBlock = {
  title: string;
  subtitle?: string;
  summary?: string;
  /** 2-column attribute grid (optional). */
  fields?: TreeChatField[];
  columns?: InfoTableColumn[];
  rows?: Array<Record<string, string | number>>;
};

export type ChatReply = {
  text?: string;
  dpr?: DprChatBlock;
  tree?: TreeChatBlock;
  info?: InfoTableBlock;
  actions?: ChatAction[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  dpr?: DprChatBlock;
  tree?: TreeChatBlock;
  info?: InfoTableBlock;
  actions?: ChatAction[];
};

export type ChatContext = {
  packets: FieldPacket[];
  pendingGnssCount: number;
};

export const SUGGESTED_CHIPS = [
  "DPR this month",
  "DPR for today",
  "Tell me about T-327",
  "Health alerts",
  "Pending sync?",
  "Navigate to T-327",
] as const;

/** Demo field crew shown on today's DPR. */
export const TODAY_DPR_CREW = ["R. Priya", "M. Anitha"] as const;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function normalize(query: string) {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function findTree(query: string): TreeRecord | undefined {
  const treeId = query.match(/tree[-\s]?0*(\d+)/i);
  if (treeId) {
    const id = `TREE-${treeId[1].padStart(4, "0")}`;
    const byId = TREE_SURVEY_RECORDS.find((t) => t.id === id);
    if (byId) return byId;
  }
  const tag = query.match(/\bt[-\s]?(\d{1,4})\b/i);
  if (tag) {
    const label = `T-${tag[1].padStart(3, "0")}`;
    const byLabel = TREE_SURVEY_RECORDS.find((t) => t.label.toLowerCase() === label.toLowerCase());
    if (byLabel) return byLabel;
    return TREE_SURVEY_RECORDS.find(
      (t) => t.label.replace(/^T-0*/, "T-") === `T-${Number(tag[1])}`,
    );
  }
  return undefined;
}

function toTreeBlock(tree: TreeRecord): TreeChatBlock {
  return {
    title: `${tree.label} · ${tree.id}`,
    subtitle: `${tree.commonName} · ${tree.species}`,
    fields: [
      { label: "Height", value: `${tree.heightM.toFixed(1)} m` },
      { label: "DBH", value: `${tree.dbhCm.toFixed(0)} cm` },
      { label: "Health", value: `${tree.health} · ${tree.healthScore}/100` },
      { label: "Water", value: tree.waterStatus },
      { label: "Survey", value: tree.lastSurveyDate },
      { label: "Surveyor", value: tree.surveyor },
    ],
    note: tree.notes,
  };
}

function toTableRow(
  row: { date: string; day: number; location: string; parcelsCollected: number; pointsCollected: number },
  opts?: { highlight?: boolean; surveyor?: string; trees?: number; points?: number },
): DprTableRow {
  return {
    date: row.date,
    day: row.day,
    location: row.location,
    trees: opts?.trees ?? row.parcelsCollected,
    points: opts?.points ?? row.pointsCollected,
    surveyor: opts?.surveyor,
    highlight: opts?.highlight,
  };
}

function replyDprMonth(): ChatReply {
  const { year, month } = getDefaultDprMonth();
  const rows = getDprMonthSummaries(year, month);
  if (!rows.length) {
    return { text: `No DPR days logged for ${formatMonthLabel(year, month)} yet.` };
  }
  return {
    dpr: {
      title: `DPR · ${formatMonthLabel(year, month)}`,
      tableRows: rows.map((row) => toTableRow(row)),
    },
  };
}

export function replyDprToday(): ChatReply {
  const date = todayIso();
  const { year, month } = getDefaultDprMonth();
  const rows = getDprMonthSummaries(year, month);
  const todayRow = rows.find((r) => r.date === date);
  if (!todayRow) {
    return { text: "No DPR entry for today yet." };
  }
  const crew = [...TODAY_DPR_CREW];
  const treesEach = Math.max(1, Math.floor(todayRow.parcelsCollected / crew.length));
  const ptsEach = Math.max(1, Math.floor(todayRow.pointsCollected / crew.length));
  const treeRem = todayRow.parcelsCollected - treesEach * (crew.length - 1);
  const ptsRem = todayRow.pointsCollected - ptsEach * (crew.length - 1);

  return {
    dpr: {
      title: `DPR · Today · Day ${todayRow.day}`,
      tableRows: crew.map((surveyor, i) =>
        toTableRow(todayRow, {
          highlight: true,
          surveyor,
          trees: i === crew.length - 1 ? treeRem : treesEach,
          points: i === crew.length - 1 ? ptsRem : ptsEach,
        }),
      ),
    },
  };
}

function replyDprDay(dayNum: number): ChatReply {
  const { year, month } = getDefaultDprMonth();
  const days = new Date(year, month, 0).getDate();
  if (dayNum < 1 || dayNum > days) {
    return { text: `Day ${dayNum} is outside ${formatMonthLabel(year, month)} (1–${days}).` };
  }
  const rows = getDprMonthSummaries(year, month);
  const row = rows.find((r) => r.day === dayNum);
  if (!row) {
    return {
      text: `Day ${dayNum} is not available yet in ${formatMonthLabel(year, month)}.`,
    };
  }
  return {
    dpr: {
      title: `DPR · Day ${dayNum}`,
      tableRows: [toTableRow(row, { highlight: true })],
    },
  };
}

function replyStats(): ChatReply {
  const stats = getTreeStats();
  return {
    info: {
      title: "Tree survey snapshot",
      subtitle: "Live inventory summary",
      fields: [
        { label: "Inventory", value: String(stats.total) },
        { label: "Species", value: String(stats.speciesCount) },
        { label: "Surveyed", value: String(stats.surveyedToday) },
        { label: "Alerts", value: String(stats.healthAlerts) },
        { label: "Avg height", value: `${stats.avgHeightM.toFixed(1)} m` },
        { label: "Block", value: "Sector A" },
      ],
    },
    actions: [{ type: "openTab", tab: "home", label: "Open Home" }],
  };
}

function replyHealth(): ChatReply {
  const alerts = TREE_SURVEY_RECORDS.filter((t) => t.health !== "healthy").slice(0, 5);
  if (!alerts.length) {
    return { text: "No stressed or diseased trees in the current inventory." };
  }
  return {
    info: {
      title: "Health alerts",
      subtitle: `${alerts.length} trees need attention`,
      columns: [
        { key: "tree", label: "Tree" },
        { key: "species", label: "Species" },
        { key: "health", label: "Health", align: "right" },
      ],
      rows: alerts.map((t) => ({
        tree: t.label,
        species: t.commonName,
        health: t.health,
      })),
    },
    actions: [
      {
        type: "navigateTree",
        treeId: alerts[0].id,
        label: `Navigate to ${alerts[0].label}`,
      },
    ],
  };
}

function replySync(ctx: ChatContext): ChatReply {
  return {
    info: {
      title: "Sync queue",
      columns: [
        { key: "village", label: "Packet" },
        { key: "status", label: "Status" },
        { key: "progress", label: "%", align: "right" },
      ],
      rows: ctx.packets.map((p) => ({
        village: p.village,
        status: p.status.replace(/-/g, " "),
        progress: p.progressPct,
      })),
    },
    actions: [{ type: "openTab", tab: "sync", label: "Open Sync" }],
  };
}

function replyCapture(): ChatReply {
  return {
    info: {
      title: "Photo + AI capture",
      subtitle: "5 survey angles · ~1s each",
      fields: [
        { label: "Step 1", value: "Open Capture" },
        { label: "Step 2", value: "Shoot 5 angles" },
        { label: "Step 3", value: "Run AI analysis" },
        { label: "Step 4", value: "Review attributes" },
        { label: "Step 5", value: "Queue for sync" },
        { label: "Offline", value: "Supported" },
      ],
    },
    actions: [{ type: "openTab", tab: "capture", label: "Open Capture" }],
  };
}

function replyFaq(): ChatReply {
  return {
    info: {
      title: "Green Belt Sector A",
      subtitle: "Demo survey block · Karaikal",
      fields: [
        { label: "Ask", value: "DPR this month" },
        { label: "Tree", value: "T-327 details" },
        { label: "Sync", value: "Pending queue" },
        { label: "Health", value: "Alert list" },
      ],
    },
  };
}

function replyEmergency(): ChatReply {
  return {
    info: {
      title: "Station alert",
      subtitle: "For genuine field emergencies",
      fields: [
        { label: "Action", value: "Open Alert" },
        { label: "Notify", value: "All stations" },
        { label: "Channels", value: "Mail · Phone" },
        { label: "Map", value: "Live location" },
      ],
    },
    actions: [{ type: "openTab", tab: "emergency", label: "Open Alert" }],
  };
}

function replyHelp(): ChatReply {
  return {
    info: {
      title: "What I can help with",
      fields: [
        { label: "DPR", value: "Today · month · day" },
        { label: "Trees", value: "T-327 lookup" },
        { label: "Navigate", value: "Map route" },
        { label: "Health", value: "Alert list" },
        { label: "Sync", value: "Upload queue" },
        { label: "Capture", value: "Photo + AI" },
      ],
    },
  };
}

function replyNavigate(tree: TreeRecord): ChatReply {
  return {
    info: {
      title: `Route to ${tree.label}`,
      subtitle: tree.commonName,
      fields: [
        { label: "Tree ID", value: tree.id },
        { label: "Health", value: tree.health },
        { label: "Lat", value: tree.lat.toFixed(5) },
        { label: "Lng", value: tree.lng.toFixed(5) },
      ],
    },
    actions: [
      { type: "navigateTree", treeId: tree.id, label: `Navigate to ${tree.label}` },
    ],
  };
}

/** Opening messages when Chatbot tab is selected — DPR pops in after mount. */
export function buildWelcomeMessages(): ChatMessage[] {
  const today = replyDprToday();
  return [
    {
      id: `welcome-dpr-${Date.now()}`,
      role: "assistant",
      dpr: today.dpr,
      text: today.text,
    },
  ];
}

export function answerChat(query: string, ctx: ChatContext): ChatReply {
  const q = normalize(query);
  if (!q) return replyHelp();

  const wantsNavigate = /\b(navigate|route|path|directions?|go to)\b/.test(q);
  const tree = findTree(q);

  if (wantsNavigate && tree) {
    return replyNavigate(tree);
  }

  if (tree && !/\bdpr\b/.test(q)) {
    return {
      tree: toTreeBlock(tree),
      actions: [
        { type: "navigateTree", treeId: tree.id, label: `Navigate to ${tree.label}` },
      ],
    };
  }

  if (/\b(sos|emergency|alert station|station alert)\b/.test(q)) {
    return replyEmergency();
  }

  if (/\b(sync|upload|pending sync|queue)\b/.test(q)) {
    return replySync(ctx);
  }

  if (/\b(capture|photo|how do i capture)\b/.test(q)) {
    return replyCapture();
  }

  if (/\b(health alert|need attention|stressed|diseased)\b/.test(q) || q === "health alerts") {
    return replyHealth();
  }

  if (/\b(stat|inventory|surveyed today|how many trees)\b/.test(q)) {
    return replyStats();
  }

  if (/\b(green belt|sector a|what is|faq|help|what can you)\b/.test(q)) {
    if (/\bgreen belt|sector a\b/.test(q)) return replyFaq();
    return replyHelp();
  }

  if (/\bdpr\b|\bdaily progress\b|\breport\b/.test(q)) {
    if (/\btoday\b/.test(q)) return replyDprToday();
    const dayMatch = q.match(/\bday\s*(\d{1,2})\b/);
    if (dayMatch) return replyDprDay(Number(dayMatch[1]));
    return replyDprMonth();
  }

  if (/\btoday\b/.test(q) && /\b(parcel|point|progress)\b/.test(q)) {
    return replyDprToday();
  }

  return {
    text: "Try: DPR this month · T-327 · Pending sync · Health alerts",
    actions: [{ type: "openTab", tab: "home", label: "Open Home" }],
  };
}
