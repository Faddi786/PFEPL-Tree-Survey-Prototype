type LegendItem = {
  key: string;
  label: string;
  color: string;
  count: number;
};

type Props = {
  title: string;
  items: LegendItem[];
  activeKey: string | null;
  onSelect: (key: string | null) => void;
};

export default function TreeThematicLegend({ title, items, activeKey, onSelect }: Props) {
  return (
    <div className="absolute bottom-4 left-4 z-20 max-w-[min(13.5rem,calc(100%-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-2.5 py-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        {activeKey ? (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-[10px] font-medium text-emerald-700 transition hover:text-emerald-900"
          >
            Show all
          </button>
        ) : null}
      </div>
      <div className="max-h-[min(14rem,40vh)] overflow-y-auto py-1">
        {items.map((item) => {
          const active = activeKey === item.key;
          const dimmed = activeKey !== null && !active;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(active ? null : item.key)}
              aria-pressed={active}
              className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition hover:bg-slate-50 ${
                active ? "bg-emerald-50/80" : ""
              } ${dimmed ? "opacity-45" : ""}`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm border border-black/10"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700">
                {item.label}
              </span>
              <span className="tabular-nums text-[10px] font-semibold text-slate-500">{item.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
