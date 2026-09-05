import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronLeft, ChevronRight, Settings, TreeDeciduous, User } from "lucide-react";
import { useMemo, useState } from "react";
import { getMobileTreeStats, SURVEYOR_PHOTO_URL } from "../../../data/mobileApp";
import {
  formatMonthLabel,
  getDefaultDprMonth,
  getDprMonthSummaries,
  type DprDaySummary,
} from "../../../data/mobileDprData";
import { useMobileApp } from "../MobileAppContext";
import MobileChatBackButton from "../MobileChatBackButton";

const tableTransition = { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

/** Viewport height for ~10 DPR rows (py-1.5 + ~11px text ≈ 28px each). */
const DPR_TABLE_BODY_HEIGHT = "min-h-[280px] max-h-[280px]";

function MonthPicker({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}) {
  function shift(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    onChange(d.getFullYear(), d.getMonth() + 1);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => shift(-1)}
        className="rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[72px] text-center text-[10px] font-semibold text-[#1A1A1A]">
        {formatMonthLabel(year, month)}
      </span>
      <button
        type="button"
        onClick={() => shift(1)}
        className="rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label="Next month"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function PointsChart({ rows, year, month }: { rows: DprDaySummary[]; year: number; month: number }) {
  const maxPoints = Math.max(...rows.map((r) => r.pointsCollected), 1);
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;

  return (
    <div className="space-y-1.5">
      {rows.map((row) => {
        const isToday =
          isCurrentMonth &&
          row.day === now.getDate() &&
          year === now.getFullYear() &&
          month === now.getMonth() + 1;
        const barColor = isToday
          ? "bg-rose-300"
          : row.completed
            ? "bg-emerald-500"
            : "bg-rose-300";
        const widthPct = Math.max(8, (row.pointsCollected / maxPoints) * 100);

        return (
          <motion.div
            key={row.date}
            layout
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={tableTransition}
            className="flex items-center gap-2"
          >
            <span className="w-4 shrink-0 text-right text-[9px] tabular-nums text-slate-500">{row.day}</span>
            <div className="relative h-4 min-w-0 flex-1 rounded-md bg-slate-100">
              <motion.div
                className={`h-full rounded-md ${barColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={tableTransition}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-[9px] tabular-nums text-slate-500">
              {row.pointsCollected}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function MobileHomeScreen() {
  const { officer, openOverlay, openDprDate, setTab } = useMobileApp();
  const defaultMonth = getDefaultDprMonth();
  const [year, setYear] = useState(defaultMonth.year);
  const [month, setMonth] = useState(defaultMonth.month);
  const [photoError, setPhotoError] = useState(false);

  const rows = useMemo(() => getDprMonthSummaries(year, month), [year, month]);
  const treeStats = useMemo(() => getMobileTreeStats(), []);

  if (!officer) return null;

  function handleMonthChange(y: number, m: number) {
    setYear(y);
    setMonth(m);
  }

  return (
    <div className="h-full overflow-y-auto px-4 pb-4 pt-1">
      <MobileChatBackButton showLabel className="mb-2 -ml-1" />
      <div className="mb-4 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => openOverlay("profile")}
          className="shrink-0 rounded-full ring-2 ring-slate-200 transition active:scale-95"
          aria-label="Open profile"
        >
          {photoError ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <User className="h-4 w-4 text-slate-400" />
            </div>
          ) : (
            <img
              src={SURVEYOR_PHOTO_URL}
              alt={officer.name}
              className="h-9 w-9 rounded-full object-cover"
              onError={() => setPhotoError(true)}
            />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold leading-9 tracking-tight text-[#1A1A1A]">{officer.name}</h2>
        </div>
        <button
          type="button"
          onClick={() => openOverlay("settings")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white transition hover:bg-slate-50 active:scale-95"
          title="Settings"
          aria-label="Open settings"
        >
          <Settings className="h-3.5 w-3.5 text-slate-500" strokeWidth={2} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setTab("capture")}
        className="mb-4 w-full rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2.5 text-left"
      >
        <p className="text-[12px] font-semibold text-emerald-950">Today&apos;s patrol</p>
        <p className="text-[10px] text-emerald-800/80">PTL-2026-081 · Haveli Beat 2 · NH-48 · QR check-in required</p>
      </button>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5">
          <div className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
            <TreeDeciduous className="h-3 w-3" /> Surveyed today
          </div>
          <p className="text-xl font-semibold tabular-nums text-[#1A1A1A]">{treeStats.surveyedToday}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-2.5">
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">Watering due</p>
          <p className="text-xl font-semibold tabular-nums text-[#1A1A1A]">{treeStats.wateringDue}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-2.5">
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">Total inventory</p>
          <p className="text-xl font-semibold tabular-nums text-[#1A1A1A]">{treeStats.total}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-2.5">
          <div className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-amber-800">
            <AlertTriangle className="h-3 w-3" /> Health alerts
          </div>
          <p className="text-xl font-semibold tabular-nums text-[#1A1A1A]">{treeStats.healthAlerts}</p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Daily progress</p>
          <MonthPicker year={year} month={month} onChange={handleMonthChange} />
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-100">
          <div className="grid grid-cols-[24px_1fr_36px_36px] gap-1 border-b border-slate-100 bg-slate-50 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Day</span>
            <span className="truncate">Block</span>
            <span className="text-right">Trees</span>
            <span className="text-right">Pts</span>
          </div>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`${year}-${month}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={tableTransition}
              className={`${DPR_TABLE_BODY_HEIGHT} overflow-y-auto`}
            >
              {rows.map((row) => (
                <button
                  key={row.date}
                  type="button"
                  onClick={() => openDprDate(row.date)}
                  className="grid w-full grid-cols-[24px_1fr_36px_36px] gap-1 border-b border-slate-50 px-2 py-1.5 text-left text-[11px] transition last:border-0 hover:bg-slate-50 active:bg-slate-100"
                >
                  <span className="font-medium tabular-nums text-[#1A1A1A]">{row.day}</span>
                  <span className="whitespace-normal break-words leading-snug text-slate-600">{row.location}</span>
                  <span className="text-right tabular-nums text-slate-600">{row.parcelsCollected}</span>
                  <span className="text-right tabular-nums text-slate-600">{row.pointsCollected}</span>
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Trees surveyed</p>
          <div className="flex items-center gap-2 text-[9px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" />
              Done
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-rose-300" />
              Pending
            </span>
          </div>
        </div>
        <PointsChart rows={rows} year={year} month={month} />
      </div>
    </div>
  );
}
