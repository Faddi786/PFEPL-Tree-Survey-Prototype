import {
  HEALTH_COLORS,
  TREE_SURVEY_RECORDS,
  type TreeHealthStatus,
  type TreeRecord,
} from "./treeSurveyData";
import type { EncroachmentStatus, WateringCycleStatus } from "./greenwatch";

export type TreeSyncStatus = "synced" | "pending" | "draft";

export type DatabaseTree = TreeRecord & {
  officerId: string;
  surveyPacket: string;
  syncStatus: TreeSyncStatus;
};

export type TreeWorkflowBucket =
  | "all"
  | "health_alert"
  | "encroachment_alert"
  | "watering_due"
  | "patrol_overdue"
  | "surveyed_recent";

export type TreeDatabaseFilterState = {
  range: string;
  beat: string;
  compartment: string;
  health: string;
  wateringStatus: string;
  encroachmentStatus: string;
  species: string;
  syncStatus: string;
  workflow: TreeWorkflowBucket;
  search: string;
};

export const DEFAULT_TREE_DATABASE_FILTERS: TreeDatabaseFilterState = {
  range: "",
  beat: "",
  compartment: "",
  health: "",
  wateringStatus: "",
  encroachmentStatus: "",
  species: "",
  syncStatus: "",
  workflow: "all",
  search: "",
};

export type TreeDatabaseFilterOptions = {
  ranges: string[];
  beats: string[];
  compartments: string[];
  healthStatuses: TreeHealthStatus[];
  wateringStatuses: WateringCycleStatus[];
  encroachmentStatuses: EncroachmentStatus[];
  species: string[];
  syncStatuses: TreeSyncStatus[];
};

const PACKETS = ["PKT-HAVELI-02", "PKT-MAVAL-01", "PKT-KHED-03", "PKT-BARAMATI-04"];

function syncStatusForIndex(index: number): TreeSyncStatus {
  const mod = index % 10;
  if (mod === 0) return "draft";
  if (mod === 1 || mod === 2) return "pending";
  return "synced";
}

function enrichTreeRecord(tree: TreeRecord, index: number): DatabaseTree {
  return {
    ...tree,
    officerId: tree.surveyor,
    surveyPacket: PACKETS[index % PACKETS.length],
    syncStatus: syncStatusForIndex(index),
  };
}

export function treeHasHealthAlert(tree: DatabaseTree): boolean {
  return tree.health === "stressed" || tree.health === "diseased";
}

export function loadTreeDatabaseRecords(): DatabaseTree[] {
  return TREE_SURVEY_RECORDS.map((tree, index) => enrichTreeRecord(tree, index));
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function buildTreeFilterOptions(trees: DatabaseTree[]): TreeDatabaseFilterOptions {
  return {
    ranges: uniqueSorted(trees.map((t) => t.range)),
    beats: uniqueSorted(trees.map((t) => t.beat)),
    compartments: uniqueSorted(trees.map((t) => t.compartment)),
    healthStatuses: uniqueSorted(trees.map((t) => t.health)) as TreeHealthStatus[],
    wateringStatuses: uniqueSorted(trees.map((t) => t.wateringStatus)) as WateringCycleStatus[],
    encroachmentStatuses: uniqueSorted(trees.map((t) => t.encroachmentStatus)) as EncroachmentStatus[],
    species: uniqueSorted(trees.map((t) => t.species)),
    syncStatuses: uniqueSorted(trees.map((t) => t.syncStatus)) as TreeSyncStatus[],
  };
}

function matchesSearch(tree: DatabaseTree, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    tree.id,
    tree.label,
    tree.qrTagId,
    tree.species,
    tree.commonName,
    tree.surveyor,
    tree.officerId,
    tree.surveyPacket,
    tree.range,
    tree.beat,
    tree.compartment,
    tree.plantationScheme,
  ].some((value) => String(value).toLowerCase().includes(q));
}

function matchesWorkflow(tree: DatabaseTree, workflow: TreeWorkflowBucket): boolean {
  switch (workflow) {
    case "all":
      return true;
    case "health_alert":
      return treeHasHealthAlert(tree);
    case "encroachment_alert":
      return tree.encroachmentStatus === "flagged";
    case "watering_due":
      return tree.wateringStatus !== "ok";
    case "patrol_overdue":
      return tree.patrolOverdue;
    case "surveyed_recent":
      return tree.lastSurveyDate.startsWith("2026-08") || tree.lastSurveyDate.startsWith("2026-09");
    default:
      return true;
  }
}

export function filterTreeRecords(
  trees: DatabaseTree[],
  filters: TreeDatabaseFilterState,
): DatabaseTree[] {
  return trees.filter((tree) => {
    if (filters.range && tree.range !== filters.range) return false;
    if (filters.beat && tree.beat !== filters.beat) return false;
    if (filters.compartment && tree.compartment !== filters.compartment) return false;
    if (filters.health && tree.health !== filters.health) return false;
    if (filters.wateringStatus && tree.wateringStatus !== filters.wateringStatus) return false;
    if (filters.encroachmentStatus && tree.encroachmentStatus !== filters.encroachmentStatus) return false;
    if (filters.species && tree.species !== filters.species) return false;
    if (filters.syncStatus && tree.syncStatus !== filters.syncStatus) return false;
    if (!matchesWorkflow(tree, filters.workflow)) return false;
    if (!matchesSearch(tree, filters.search)) return false;
    return true;
  });
}

export type TreeDatabaseStats = {
  total: number;
  healthAlerts: number;
  encroachmentAlerts: number;
  wateringDue: number;
  patrolOverdue: number;
  avgHeightM: number;
  synced: number;
};

export function computeTreeDatabaseStats(trees: DatabaseTree[]): TreeDatabaseStats {
  const avgHeight =
    trees.length > 0 ? trees.reduce((sum, t) => sum + t.heightM, 0) / trees.length : 0;

  return {
    total: trees.length,
    healthAlerts: trees.filter((t) => treeHasHealthAlert(t)).length,
    encroachmentAlerts: trees.filter((t) => t.encroachmentStatus === "flagged").length,
    wateringDue: trees.filter((t) => t.wateringStatus !== "ok").length,
    patrolOverdue: trees.filter((t) => t.patrolOverdue).length,
    avgHeightM: Math.round(avgHeight * 10) / 10,
    synced: trees.filter((t) => t.syncStatus === "synced").length,
  };
}

export function formatTreeHealth(status: TreeHealthStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatSyncStatus(status: TreeSyncStatus): string {
  if (status === "pending") return "Pending sync";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export { HEALTH_COLORS };
