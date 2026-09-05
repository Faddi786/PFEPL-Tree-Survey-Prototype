import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import {
  ClearTreeFiltersButton,
  TreeDatabaseSearchBar,
  TreeWorkflowFilterDropdown,
} from "../components/database/TreeDatabaseFilters";
import TreeDatabaseTable from "../components/database/TreeDatabaseTable";
import {
  buildTreeFilterOptions,
  computeTreeDatabaseStats,
  DEFAULT_TREE_DATABASE_FILTERS,
  filterTreeRecords,
  loadTreeDatabaseRecords,
  type DatabaseTree,
  type TreeDatabaseFilterState,
} from "../data/treeDatabase";

function InlineStatsBar({ trees }: { trees: DatabaseTree[] }) {
  const stats = useMemo(() => computeTreeDatabaseStats(trees), [trees]);
  const items = [
    { label: "Total trees tagged", value: stats.total },
    { label: "Health alerts", value: stats.healthAlerts },
    { label: "Encroachment alerts", value: stats.encroachmentAlerts },
    { label: "Watering due", value: stats.wateringDue },
    { label: "Patrol overdue", value: stats.patrolOverdue },
    { label: "Avg height (m)", value: stats.avgHeightM },
    { label: "Synced", value: stats.synced },
  ];

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-xs text-slate-600">
      {items.map((item, index) => (
        <span key={item.label} className="inline-flex items-center gap-1">
          {index > 0 ? <span className="text-slate-300">|</span> : null}
          <span>
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-400"> — </span>
            <span className="font-semibold text-[#1A1A1A]">{item.value.toLocaleString()}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

export default function DatabaseExplorerPage() {
  const [trees] = useState<DatabaseTree[]>(() => loadTreeDatabaseRecords());
  const [filters, setFilters] = useState<TreeDatabaseFilterState>({ ...DEFAULT_TREE_DATABASE_FILTERS });

  const filterOptions = useMemo(() => buildTreeFilterOptions(trees), [trees]);
  const filteredTrees = useMemo(() => filterTreeRecords(trees, filters), [trees, filters]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F7F7F5] p-2 lg:p-3">
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/85 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)] lg:p-3">
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
          <Link
            to="/app"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to map workbench
          </Link>

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <TreeWorkflowFilterDropdown
              value={filters.workflow}
              onChange={(workflow) => setFilters({ ...filters, workflow })}
            />
            <TreeDatabaseSearchBar
              value={filters.search}
              onChange={(search) => setFilters({ ...filters, search })}
            />
            <ClearTreeFiltersButton
              filters={filters}
              onClear={() => setFilters({ ...DEFAULT_TREE_DATABASE_FILTERS })}
            />
          </div>
        </div>

        <div className="mb-2 shrink-0">
          <InlineStatsBar trees={filteredTrees} />
        </div>

        <TreeDatabaseTable
          trees={filteredTrees}
          filters={filters}
          filterOptions={filterOptions}
          onFiltersChange={setFilters}
        />
      </main>
    </div>
  );
}
