/** Tree AI Survey workflow demo — multi-photo upload, staged analysis, comprehensive attributes. */

export type TreeSurveyPhotoSlot = {
  id: string;
  filename: string;
  label: string;
  purpose: string;
  source: string;
};

export const TREE_AI_SURVEY_PHOTOS: TreeSurveyPhotoSlot[] = [
  {
    id: "canopy",
    filename: "01-canopy.jpg",
    label: "Canopy",
    purpose: "Height & crown spread",
    source: "Wikimedia Commons — tree canopy looking up",
  },
  {
    id: "full-tree",
    filename: "02-full-tree.jpg",
    label: "Full tree",
    purpose: "Structural profile & lean",
    source: "Wikimedia Commons — Azadirachta indica (Neem)",
  },
  {
    id: "bark",
    filename: "03-bark.jpg",
    label: "Bark",
    purpose: "Health & decay indicators",
    source: "Wikimedia Commons — oak bark texture",
  },
  {
    id: "leaf",
    filename: "04-leaf.jpg",
    label: "Leaf",
    purpose: "Species ID morphology",
    source: "Wikimedia Commons — Mangifera indica leaf",
  },
  {
    id: "trunk",
    filename: "08-trunk.jpg",
    label: "Trunk",
    purpose: "DBH estimate & cavity scan",
    source: "Wikimedia Commons — large tree trunk (Kyabobo forest)",
  },
];

export const TREE_AI_SURVEY_WORKFLOW_STEPS = [
  "Upload photos",
  "AI analysis",
  "Review attributes",
  "Accept & save",
];

export type TreeAiAnalysisStep = {
  id: string;
  label: string;
  detail: string;
  photoId?: string;
  durationMs: number;
};

/** Analysis dwell per photo before advancing to the next. */
export const TREE_AI_SURVEY_STEP_GAP_MS = 1_000;

export const TREE_AI_SURVEY_ANALYSIS_STEPS: TreeAiAnalysisStep[] = [
  {
    id: "height",
    label: "Analyzing height from canopy photo…",
    detail: "Monocular depth · crown apex triangulation",
    photoId: "canopy",
    durationMs: TREE_AI_SURVEY_STEP_GAP_MS,
  },
  {
    id: "structure",
    label: "Measuring structural profile from full-tree image…",
    detail: "Trunk axis · lean angle · branch architecture",
    photoId: "full-tree",
    durationMs: TREE_AI_SURVEY_STEP_GAP_MS,
  },
  {
    id: "bark",
    label: "Assessing bark health & decay indicators…",
    detail: "Texture CNN · fungal lesion detection",
    photoId: "bark",
    durationMs: TREE_AI_SURVEY_STEP_GAP_MS,
  },
  {
    id: "species",
    label: "Detecting species from leaf morphology…",
    detail: "ResNet-50 · 847 urban tree classes",
    photoId: "leaf",
    durationMs: TREE_AI_SURVEY_STEP_GAP_MS,
  },
  {
    id: "dbh",
    label: "Estimating DBH from trunk image…",
    detail: "Reference scale · elliptical fit",
    photoId: "trunk",
    durationMs: TREE_AI_SURVEY_STEP_GAP_MS,
  },
];

export type TreeAiSurveyResult = {
  treeId: string;
  estimatedHeightM: number;
  heightConfidence: number;
  speciesCommon: string;
  speciesScientific: string;
  speciesConfidence: number;
  healthScore: number;
  healthStatus: "healthy" | "stressed" | "at-risk";
  damagePercent: number;
  damageNotes: string;
  waterStressLevel: "low" | "moderate" | "high";
  waterStressScore: number;
  dbhEstimateCm: number;
  dbhConfidence: number;
  crownSpreadM: number;
  leanAngleDeg: number;
  floweringStatus: string;
  fruitingStatus: string;
  pestIndicators: string[];
  pestRiskLevel: "low" | "moderate" | "high";
  pestRiskSummary: string;
  rootFlareStatus: string;
  canopyDensityPct: number;
  canopyClosureClass: string;
  groveContext: string;
  ageClass: string;
  carbonStorageKg: number;
  soilTypeAtBase: string;
  sunExposure: string;
  branchStructureClass: string;
  biomassEstimateKg: number;
  habitatValueNote: string;
  gpsAccuracyM: number;
  surveyQuality: "excellent" | "good" | "fair";
  lastTreatmentDate: string;
  recommendedAction: string;
  surveyTimestamp: string;
  surveyor: string;
};

export function generateTreeAiSurveyResult(): TreeAiSurveyResult {
  return {
    treeId: `TREE-AI-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    estimatedHeightM: 14.2,
    heightConfidence: 0.91,
    speciesCommon: "Neem",
    speciesScientific: "Azadirachta indica",
    speciesConfidence: 0.94,
    healthScore: 78,
    healthStatus: "stressed",
    damagePercent: 12,
    damageNotes: "Minor bark fissuring on south face; one dead secondary branch (12 cm dia.)",
    waterStressLevel: "moderate",
    waterStressScore: 58,
    dbhEstimateCm: 42,
    dbhConfidence: 0.88,
    crownSpreadM: 8.6,
    leanAngleDeg: 2.4,
    floweringStatus: "Not in bloom — off-season (survey: Aug 2026)",
    fruitingStatus: "Immature drupes detected — early fruit set",
    pestIndicators: ["Leaf hopper activity (low)", "No scale insects detected"],
    pestRiskLevel: "low",
    pestRiskSummary: "Leaf hopper activity only — no scale or borer detected",
    rootFlareStatus: "Normal flare — no girdling roots visible",
    canopyDensityPct: 72,
    canopyClosureClass: "Moderately dense — 60–75% closure",
    groveContext: "Urban green belt · Riverside walk margin",
    ageClass: "Mature · estimated 18–25 years",
    carbonStorageKg: 186,
    soilTypeAtBase: "Alluvial loam · moderate compaction",
    sunExposure: "South-west aspect · full sun (6–8 h/day)",
    branchStructureClass: "Balanced scaffold · 14 primary limbs",
    biomassEstimateKg: 412,
    habitatValueNote: "Moderate — bird perches & shade corridor for understory",
    gpsAccuracyM: 1.2,
    surveyQuality: "excellent",
    lastTreatmentDate: "2026-03-14 · structural prune (deadwood removal)",
    recommendedAction:
      "Schedule deep-root watering within 7 days; prune dead branch at next maintenance window; re-survey in 90 days.",
    surveyTimestamp: new Date().toISOString(),
    surveyor: "R. Priya · TS-1042",
  };
}

export function getTreeAiSurveyPhotoUrl(filename: string): string {
  return `/assets/trees/ai-survey/${filename}`;
}
