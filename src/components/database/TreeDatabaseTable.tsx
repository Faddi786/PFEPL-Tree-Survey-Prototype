import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { TreeHealthStatus } from "../../data/treeSurveyData";
import {
  formatSyncStatus,
  formatTreeHealth,
  HEALTH_COLORS,
  type DatabaseTree,
  type TreeDatabaseFilterOptions,
  type TreeDatabaseFilterState,
} from "../../data/treeDatabase";
import { HeaderColumnFilter } from "./TreeDatabaseFilters";
import TreeMapPreviewModal from "./TreeMapPreviewModal";

type SortKey =
  | "id"
  | "qrTagId"
  | "species"
  | "range"
  | "beat"
  | "compartment"
  | "health"
  | "encroachmentStatus"
  | "wateringStatus"
  | "heightM"
  | "crownSpreadM"
  | "surveyor"
  | "syncStatus"
  | "lastSurveyDate";

type FilterKey = keyof Pick<
  TreeDatabaseFilterState,
  "range" | "beat" | "compartment" | "health" | "wateringStatus" | "encroachmentStatus" | "species" | "syncStatus"
>;

type Column = {
  key: SortKey;
  label: string;
  align?: "left" | "right";
  filterKey?: FilterKey;
  render?: (tree: DatabaseTree) => React.ReactNode;
};

const COLUMNS: Column[] = [
  { key: "id", label: "Tree ID" },
  { key: "qrTagId", label: "QR tag" },
  { key: "species", label: "Species", filterKey: "species" },
  { key: "range", label: "Range", filterKey: "range" },
  { key: "beat", label: "Beat", filterKey: "beat" },
  { key: "compartment", label: "Block", filterKey: "compartment" },
  {
    key: "health",
    label: "Health",
    filterKey: "health",
    render: (tree) => <HealthBadge health={tree.health} />,
  },
  {
    key: "encroachmentStatus",
    label: "Encroachment",
    filterKey: "encroachmentStatus",
    render: (tree) => <span className="capitalize">{tree.encroachmentStatus}</span>,
  },
  {
    key: "wateringStatus",
    label: "Watering",
    filterKey: "wateringStatus",
    render: (tree) => <span className="capitalize">{tree.wateringStatus}</span>,
  },
  {
    key: "heightM",
    label: "Height (m)",
    align: "right",
    render: (tree) => tree.heightM.toFixed(1),
  },
  {
    key: "crownSpreadM",
    label: "Crown (m)",
    align: "right",
    render: (tree) => tree.crownSpreadM.toFixed(1),
  },
  { key: "surveyor", label: "Field officer" },
  {
    key: "syncStatus",
    label: "Sync",
    filterKey: "syncStatus",
    render: (tree) => <SyncBadge status={tree.syncStatus} />,
  },
  { key: "lastSurveyDate", label: "Last survey" },
];

function HealthBadge({ health }: { health: TreeHealthStatus }) {
  const color = HEALTH_COLORS[health];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-medium capitalize text-slate-800">{formatTreeHealth(health)}</span>
    </span>
  );
}

function SyncBadge({ status }: { status: DatabaseTree["syncStatus"] }) {
  const tone =
    status === "synced"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : status === "pending"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {formatSyncStatus(status)}
    </span>
  );
}

function compareValues(a: DatabaseTree, b: DatabaseTree, key: SortKey): number {
  const av = a[key];
  const bv = b[key];
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
}

function getFilterOptions(
  filterKey: FilterKey,
  options: TreeDatabaseFilterOptions,
): Array<{ value: string; label: string }> {
  switch (filterKey) {
    case "range":
      return options.ranges.map((z) => ({ value: z, label: z }));
    case "beat":
      return options.beats.map((s) => ({ value: s, label: s }));
    case "compartment":
      return options.compartments.map((p) => ({ value: p, label: p }));
    case "health":
      return options.healthStatuses.map((h) => ({ value: h, label: formatTreeHealth(h) }));
    case "wateringStatus":
      return options.wateringStatuses.map((w) => ({
        value: w,
        label: w.charAt(0).toUpperCase() + w.slice(1),
      }));
    case "encroachmentStatus":
      return options.encroachmentStatuses.map((e) => ({
        value: e,
        label: e.charAt(0).toUpperCase() + e.slice(1),
      }));
    case "species":
      return options.species.map((s) => ({ value: s, label: s }));
    case "syncStatus":
      return options.syncStatuses.map((s) => ({ value: s, label: formatSyncStatus(s) }));
    default:
      return [];
  }
}

function getFilterValue(filters: TreeDatabaseFilterState, filterKey: FilterKey): string {
  return filters[filterKey];
}

function SortableHeader({
  label,
  align,
  active,
  sortDir,
  onSort,
}: {
  label: string;
  align?: "left" | "right";
  active: boolean;
  sortDir: "asc" | "desc";
  onSort: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSort}
      className={`inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition hover:bg-slate-100 hover:text-slate-800 ${
        active ? "text-slate-800" : "text-slate-500"
      } ${align === "right" ? "ml-auto" : ""}`}
    >
      {label}
      {active ? (
        sortDir === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )
      ) : (
        <ChevronDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

type Props = {
  trees: DatabaseTree[];
  filters: TreeDatabaseFilterState;
  filterOptions: TreeDatabaseFilterOptions;
  onFiltersChange: (filters: TreeDatabaseFilterState) => void;
};

export default function TreeDatabaseTable({ trees, filters, filterOptions, onFiltersChange }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [mapPreview, setMapPreview] = useState<DatabaseTree | null>(null);

  const sorted = useMemo(() => {
    const copy = [...trees];
    copy.sort((a, b) => {
      const cmp = compareValues(a, b, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [trees, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function patchFilter(partial: Partial<TreeDatabaseFilterState>) {
    onFiltersChange({ ...filters, ...partial });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[1280px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgb(226,232,240)]">
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className={`whitespace-nowrap px-2 py-1.5 ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {column.filterKey ? (
                    <HeaderColumnFilter
                      label={column.label}
                      value={getFilterValue(filters, column.filterKey)}
                      options={getFilterOptions(column.filterKey, filterOptions)}
                      onChange={(next) => patchFilter({ [column.filterKey!]: next })}
                      align={column.align}
                      sortActive={sortKey === column.key}
                      sortDir={sortDir}
                      onSort={() => toggleSort(column.key)}
                    />
                  ) : (
                    <SortableHeader
                      label={column.label}
                      align={column.align}
                      active={sortKey === column.key}
                      sortDir={sortDir}
                      onSort={() => toggleSort(column.key)}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-12 text-center text-sm text-slate-500">
                  No trees match the current filters.
                </td>
              </tr>
            ) : (
              sorted.map((tree) => (
                <tr
                  key={tree.id}
                  className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50/80"
                  onDoubleClick={() => setMapPreview(tree)}
                  title="Double-click to preview tree on map"
                >
                  {COLUMNS.map((column) => (
                    <td
                      key={column.key}
                      className={`whitespace-nowrap px-2 py-1.5 text-slate-800 ${
                        column.align === "right" ? "text-right tabular-nums" : ""
                      }`}
                    >
                      {column.render ? column.render(tree) : String(tree[column.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {mapPreview ? <TreeMapPreviewModal tree={mapPreview} onClose={() => setMapPreview(null)} /> : null}
    </div>
  );
}
