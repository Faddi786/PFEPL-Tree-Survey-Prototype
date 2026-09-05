import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Filter, RotateCcw, Search } from "lucide-react";
import {
  type TreeDatabaseFilterOptions,
  type TreeDatabaseFilterState,
  type TreeWorkflowBucket,
} from "../../data/treeDatabase";

export const TREE_WORKFLOW_OPTIONS: Array<{ value: TreeWorkflowBucket; label: string }> = [
  { value: "all", label: "All records" },
  { value: "health_alert", label: "Health alerts" },
  { value: "encroachment_alert", label: "Encroachment alerts" },
  { value: "watering_due", label: "Watering due" },
  { value: "patrol_overdue", label: "Patrol overdue" },
  { value: "surveyed_recent", label: "Surveyed recently" },
];

export function hasActiveTreeFilters(filters: TreeDatabaseFilterState): boolean {
  return (
    filters.range !== "" ||
    filters.beat !== "" ||
    filters.compartment !== "" ||
    filters.health !== "" ||
    filters.wateringStatus !== "" ||
    filters.encroachmentStatus !== "" ||
    filters.species !== "" ||
    filters.syncStatus !== "" ||
    filters.workflow !== "all" ||
    filters.search.trim() !== ""
  );
}

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function TreeDatabaseSearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-[220px] max-w-[280px] shrink-0">
      <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        placeholder="Tree ID, QR tag, species, range, beat..."
        className="w-full rounded-md border border-slate-200 bg-white py-1 pl-7 pr-2 text-xs text-slate-800 outline-none transition focus:border-slate-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

type WorkflowFilterProps = {
  value: TreeWorkflowBucket;
  onChange: (value: TreeWorkflowBucket) => void;
};

export function TreeWorkflowFilterDropdown({ value, onChange }: WorkflowFilterProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const active = value !== "all";
  const label = TREE_WORKFLOW_OPTIONS.find((opt) => opt.value === value)?.label ?? "Workflow";

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + 8 && rect.top > spaceBelow;
    setMenuStyle({
      position: "fixed",
      right: window.innerWidth - rect.right,
      minWidth: Math.max(rect.width, 180),
      top: openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    function onDocClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [open, updatePosition]);

  const menu = open ? (
    <div
      ref={menuRef}
      style={menuStyle}
      className="max-h-[280px] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
    >
      {TREE_WORKFLOW_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            onChange(option.value);
            setOpen(false);
          }}
          className={`flex w-full items-center px-2.5 py-1.5 text-left text-xs transition ${
            value === option.value ? "bg-[#1A1A1A] text-white" : "text-slate-700 hover:bg-slate-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Workflow filter"
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition hover:border-slate-300 ${
          active ? "border-slate-400 bg-slate-50 text-slate-800" : "border-slate-200 bg-white text-slate-600"
        }`}
      >
        <Filter className="h-3 w-3" />
        <span className="max-w-[100px] truncate">{active ? label : "Workflow"}</span>
        {active ? <span className="h-1.5 w-1.5 rounded-full bg-[#1A1A1A]" /> : null}
        <ChevronDown className={`h-3 w-3 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {menu ? createPortal(menu, document.body) : null}
    </div>
  );
}

export function ClearTreeFiltersButton({
  filters,
  onClear,
}: {
  filters: TreeDatabaseFilterState;
  onClear: () => void;
}) {
  if (!hasActiveTreeFilters(filters)) return null;
  return (
    <button
      type="button"
      onClick={onClear}
      title="Clear all filters"
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <RotateCcw className="h-3 w-3" />
      Clear
    </button>
  );
}

export { HeaderColumnFilter } from "./DatabaseFilters";

export type { TreeDatabaseFilterOptions, TreeDatabaseFilterState };
