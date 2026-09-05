import { NIL_AI_EXPORTS, type NilAiAttachment } from "../lib/nilAiExport";
import {
  TREE_SURVEY_RECORDS,
  type TreeHealthStatus,
  type TreeRecord,
} from "./treeSurveyData";

export type { NilAiAttachment };

export type NilAiTreeCard = {
  id: string;
  label: string;
  species: string;
  commonName: string;
  health: TreeHealthStatus;
  heightM: number;
  canopyDiameterM: number;
  photoUrl: string;
  notes?: string;
};

export type NilAiFollowUp = {
  id: string;
  label: string;
  prompt: string;
};

export type NilAiResult = {
  reply: string;
  treeIds: string[];
  trees?: NilAiTreeCard[];
  attachments?: NilAiAttachment[];
  highlightMode?: "health" | "default";
  followUps: NilAiFollowUp[];
};

/** Suggested chips / example prompts shown on the Tree AI page. */
export const NIL_AI_SUGGESTIONS: NilAiFollowUp[] = [
  {
    id: "health-alerts",
    label: "Health-flagged · Haveli",
    prompt: "List health-flagged trees in Haveli Range",
  },
  {
    id: "encroachment",
    label: "Encroachment pending",
    prompt: "Show encroachment reports pending action",
  },
  {
    id: "watering-due",
    label: "Watering due this week",
    prompt: "Which trees or stretches have watering due this week",
  },
  {
    id: "patrol-gap",
    label: "Beats not patrolled",
    prompt: "Which beats were not patrolled in the last cycle",
  },
  {
    id: "analysis-report",
    label: "Download patrol report",
    prompt: "Generate a downloadable patrol and survey report",
  },
];

function toCard(tree: TreeRecord): NilAiTreeCard {
  return {
    id: tree.id,
    label: tree.label,
    species: tree.species,
    commonName: tree.commonName,
    health: tree.health,
    heightM: tree.heightM,
    canopyDiameterM: tree.canopyDiameterM,
    photoUrl: tree.photoUrl,
    notes: tree.notes,
  };
}

function dist2(a: TreeRecord, b: TreeRecord) {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return dLat * dLat + dLng * dLng;
}

/** Pick a geographic cluster so the map pans to one survey sector. */
function pickCluster(pool: TreeRecord[], limit = 5): TreeRecord[] {
  if (!pool.length) return [];
  if (pool.length <= limit) return pool;
  const seed = [...pool].sort((a, b) => b.lat + b.lng - (a.lat + a.lng))[0];
  return [...pool].sort((a, b) => dist2(a, seed) - dist2(b, seed)).slice(0, limit);
}

function followUpsExcluding(...ids: string[]): NilAiFollowUp[] {
  const hide = new Set(ids);
  return NIL_AI_SUGGESTIONS.filter((item) => !hide.has(item.id));
}

function reportAttachments(): NilAiAttachment[] {
  return [
    {
      id: "pdf",
      title: NIL_AI_EXPORTS.pdf.title,
      subtitle: NIL_AI_EXPORTS.pdf.subtitle,
      url: NIL_AI_EXPORTS.pdf.url,
      filename: NIL_AI_EXPORTS.pdf.filename,
      kind: "pdf",
    },
    {
      id: "xlsx",
      title: NIL_AI_EXPORTS.xlsx.title,
      subtitle: NIL_AI_EXPORTS.xlsx.subtitle,
      url: NIL_AI_EXPORTS.xlsx.url,
      filename: NIL_AI_EXPORTS.xlsx.filename,
      kind: "xlsx",
    },
  ];
}

type ScenarioId = "health-alerts" | "species-canopy" | "water-stress" | "report" | "fallback";

export const NIL_AI_HEALTH_KEYWORDS = [
  "diseased trees",
  "stressed trees",
  "health alerts",
  "health alert",
  "diseased",
  "stressed",
  "disease",
  "deadwood",
  "dying",
  "unhealthy",
  "at-risk",
  "at risk",
  "green belt",
  "health",
] as const;

export const NIL_AI_WATER_KEYWORDS = [
  "water stress",
  "drought",
  "waterlogged",
  "soil moisture",
  "moisture",
  "dry trees",
  "drought indicators",
] as const;

export const NIL_AI_SPECIES_KEYWORDS = [
  "species diversity",
  "species inventory",
  "height detection",
  "crown spread",
  "urban forest",
  "canopy health",
  "canopy density",
  "tree height",
  "species",
  "canopy",
  "diversity",
  "inventory",
  "forest",
  "height",
  "crown",
  "dbh",
  "grove",
  "riverside",
] as const;

export const NIL_AI_REPORT_KEYWORDS = [
  "tree survey analysis",
  "generate report",
  "analysis report",
  "attribute table",
  "inventory map",
  "spreadsheet",
  "dashboard",
  "download",
  "generate",
  "summary",
  "analysis",
  "export",
  "report",
  "excel",
  "pdf",
] as const;

/** @deprecated Prefer NIL_AI_HEALTH_KEYWORDS — kept for any external imports. */
export const NIL_AI_MUTATION_KEYWORDS = NIL_AI_HEALTH_KEYWORDS;
/** @deprecated Prefer NIL_AI_SPECIES_KEYWORDS — kept for any external imports. */
export const NIL_AI_VARIANCE_KEYWORDS = NIL_AI_SPECIES_KEYWORDS;

const SCENARIO_KEYWORDS: Record<Exclude<ScenarioId, "fallback">, readonly string[]> = {
  "health-alerts": NIL_AI_HEALTH_KEYWORDS,
  "water-stress": NIL_AI_WATER_KEYWORDS,
  "species-canopy": NIL_AI_SPECIES_KEYWORDS,
  report: NIL_AI_REPORT_KEYWORDS,
};

const SCENARIO_PRIORITY: Record<Exclude<ScenarioId, "fallback">, number> = {
  "water-stress": 4,
  "health-alerts": 3,
  "species-canopy": 2,
  report: 1,
};

function normalizeNilAiPrompt(prompt: string): string {
  return prompt.toLowerCase().trim().replace(/\s+/g, " ");
}

function detectScenario(text: string): ScenarioId {
  const normalized = normalizeNilAiPrompt(text);
  if (!normalized) return "fallback";

  type Match = { scenario: Exclude<ScenarioId, "fallback">; keyword: string };
  const matches: Match[] = [];

  for (const scenario of Object.keys(SCENARIO_KEYWORDS) as Exclude<ScenarioId, "fallback">[]) {
    for (const keyword of SCENARIO_KEYWORDS[scenario]) {
      if (normalized.includes(keyword)) {
        matches.push({ scenario, keyword });
      }
    }
  }

  if (!matches.length) return "fallback";

  matches.sort((a, b) => {
    const lengthDiff = b.keyword.length - a.keyword.length;
    if (lengthDiff !== 0) return lengthDiff;
    return SCENARIO_PRIORITY[b.scenario] - SCENARIO_PRIORITY[a.scenario];
  });

  return matches[0].scenario;
}

function formatTreeReply(
  trees: TreeRecord[],
  intro: string,
  outro: string,
  followUps: NilAiFollowUp[],
  highlightMode: NilAiResult["highlightMode"] = "health",
): NilAiResult {
  return {
    reply: [intro, "", outro].join("\n"),
    treeIds: trees.map((tree) => tree.id),
    trees: trees.map(toCard),
    highlightMode,
    followUps,
  };
}

export function resolveNilAiPrompt(prompt: string): NilAiResult {
  const text = normalizeNilAiPrompt(prompt);
  if (!text) {
    return {
      reply: [
        "Ask Tree AI to query the map or generate a tree survey analysis report.",
        "",
        "Tap an action below — health alerts, species inventory, height detection, water stress, or a downloadable report.",
      ].join("\n"),
      treeIds: [],
      followUps: NIL_AI_SUGGESTIONS,
    };
  }

  const scenario = detectScenario(text);

  if (scenario === "report") {
    return {
      reply: [
        "I've compiled the **tree survey analysis report** from the current Green Belt inventory.",
        "",
        "The PDF includes tree point locations over a street basemap, a structured attribute table, and health summary metadata.",
        "",
        "Open the files below — PDF for presentation and spreadsheet for desk review.",
      ].join("\n"),
      treeIds: [],
      attachments: reportAttachments(),
      followUps: followUpsExcluding("analysis-report"),
    };
  }

  if (scenario === "health-alerts") {
    const trees = pickCluster(
      TREE_SURVEY_RECORDS.filter((tree) => tree.health === "stressed" || tree.health === "diseased"),
      5,
    );
    return formatTreeReply(
      trees,
      `**${trees.length} tree${trees.length === 1 ? "" : "s"}** flagged for **health review** in the **Green Belt survey zone** (stressed / diseased cluster).`,
      "Panning to the flagged sector. Healthy, stressed, and diseased trees are colour-coded on the map. Tap a follow-up below or open a tree card.",
      followUpsExcluding("health-alerts"),
    );
  }

  if (scenario === "water-stress") {
    const trees = pickCluster(
      TREE_SURVEY_RECORDS.filter(
        (tree) => tree.waterStatus === "dry" || tree.waterStatus === "waterlogged",
      ),
      5,
    );
    return formatTreeReply(
      trees,
      `**${trees.length} tree${trees.length === 1 ? "" : "s"}** showing **water / soil stress** (dry or waterlogged) in the survey block.`,
      "Map highlights the moisture-stress cluster. Use the chips below to check health, species mix, or export a report.",
      followUpsExcluding("water-stress"),
    );
  }

  if (scenario === "species-canopy") {
    const tall = [...TREE_SURVEY_RECORDS].sort((a, b) => b.heightM - a.heightM);
    const seen = new Set<string>();
    const diverse: TreeRecord[] = [];
    for (const tree of tall) {
      if (seen.has(tree.species)) continue;
      seen.add(tree.species);
      diverse.push(tree);
      if (diverse.length >= 5) break;
    }
    const trees = diverse.length ? diverse : tall.slice(0, 5);
    const isHeight = /height|crown|dbh|grove|riverside/.test(text);
    return formatTreeReply(
      trees,
      isHeight
        ? `**Height & crown spread** for **${trees.length} sample tree${trees.length === 1 ? "" : "s"}** in the riverside / urban grove.`
        : `**Species & canopy summary** for **${trees.length} sample tree${trees.length === 1 ? "" : "s"}** across the **urban forest block**.`,
      "Each card shows the field photo for that species. Map highlights the sample set — use a chip below for the next action.",
      followUpsExcluding("species-inventory", "height-detection"),
    );
  }

  return {
    reply: [
      "I'm **Tree AI**, your urban forestry intelligence assistant.",
      "",
      "Tap an action below to query the inventory — no typing needed.",
    ].join("\n"),
    treeIds: [],
    followUps: NIL_AI_SUGGESTIONS,
  };
}
